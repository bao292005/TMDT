import { randomUUID } from "node:crypto";

import { createIntegrationErrorPayload, IntegrationError } from "../../shared/config/integration-error.js";
import { appendAuditLog } from "../identity/audit-log-store.js";
import { listPaymentTransactionsByOrderId } from "../payment/payment-store.js";
import { listOrders, updateOrderById } from "./order-store.js";
import {
  createReconciliationRunIfNotExistsUnsafe,
  listReconciliationRuns,
  runReconciliationWrite,
} from "./reconciliation-store.js";
const ORDER_RANK = {
  pending_payment: 1,
  pending_verification: 2,
  payment_failed: 2,
  confirmed_cod: 3,
  paid: 4,
  processing: 5,
  shipped: 6,
  delivered: 7,
  cancelled: 99,
};

const RISKY_STATUSES = new Set([
  "pending_payment",
  "pending_verification",
  "payment_failed",
  "paid",
  "confirmed_cod",
  "processing",
  "shipped",
]);

const PAYMENT_TO_ORDER_STATUS = {
  paid: "paid",
  pending_verification: "pending_verification",
  pending_gateway: "pending_verification",
  failed: "payment_failed",
};

const RECON_ALLOWED_TRANSITIONS = {
  pending_payment: new Set(["pending_verification", "payment_failed", "paid", "processing", "shipped"]),
  pending_verification: new Set(["payment_failed", "paid", "processing", "shipped"]),
  payment_failed: new Set(["pending_payment", "pending_verification", "paid"]),
  confirmed_cod: new Set(["processing", "shipped"]),
  paid: new Set(["processing", "shipped"]),
  processing: new Set(["shipped"]),
  shipped: new Set(["delivered"]),
  delivered: new Set(),
  cancelled: new Set(),
};

function sortByCreatedAtAsc(a, b) {
  const left = a.createdAt ?? "";
  const right = b.createdAt ?? "";
  return left.localeCompare(right);
}

function isRiskyOrder(order) {
  if (RISKY_STATUSES.has(order.status)) {
    return true;
  }

  return Boolean(order.pickedAt || order.packedAt || order.trackingNumber);
}

function normalizeTrackingNumber(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function getLatestPaymentStatus(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return null;
  }

  const sorted = [...transactions].sort(sortByCreatedAtAsc);
  return sorted.at(-1)?.status ?? null;
}

function deriveWarehouseTargetStatus(order) {
  const hasTracking = Boolean(normalizeTrackingNumber(order.trackingNumber));

  if ((order.status === "shipped" || order.status === "delivered") && hasTracking) {
    return "shipped";
  }

  if (order.status === "processing" && order.packedAt && hasTracking) {
    return "shipped";
  }

  if ((order.status === "paid" || order.status === "confirmed_cod" || order.status === "pending_verification") && order.pickedAt) {
    return "processing";
  }

  return null;
}

function getRank(status) {
  return ORDER_RANK[status] ?? 0;
}

function pickTargetStatus(order, paymentStatus) {
  const paymentTarget = PAYMENT_TO_ORDER_STATUS[paymentStatus] ?? null;
  const warehouseTarget = deriveWarehouseTargetStatus(order);

  const candidates = [order.status, paymentTarget, warehouseTarget].filter(Boolean);
  let chosen = order.status;

  for (const candidate of candidates) {
    if (getRank(candidate) > getRank(chosen)) {
      chosen = candidate;
    }
  }

  return {
    targetStatus: chosen,
    policySource:
      chosen === paymentTarget
        ? "payment"
        : chosen === warehouseTarget
          ? "warehouse"
          : "order",
    paymentTarget,
    warehouseTarget,
  };
}

function canTransition(fromStatus, toStatus) {
  if (fromStatus === toStatus) return true;
  return RECON_ALLOWED_TRANSITIONS[fromStatus]?.has(toStatus) ?? false;
}

function buildMismatch({ runId, order, paymentStatus, targetStatus, source, resolved, reason, retryable, afterOrder = order }) {
  return {
    orderId: order.id,
    type: "ORDER_STATE_DRIFT",
    source,
    before: {
      orderStatus: order.status,
      paymentStatus,
      trackingNumber: normalizeTrackingNumber(order.trackingNumber),
    },
    after: {
      orderStatus: targetStatus,
      paymentStatus,
      trackingNumber: normalizeTrackingNumber(afterOrder?.trackingNumber ?? order.trackingNumber),
    },
    resolved,
    reason,
    retryable,
    detectedAt: new Date().toISOString(),
    runId,
  };
}

export async function runReconciliationJob({
  idempotencyKey,
  correlationId = randomUUID(),
  runId = randomUUID(),
} = {}) {
  return runReconciliationWrite(async () => {
    const startedAt = new Date().toISOString();
    const orders = await listOrders();
    const targetOrders = orders.filter(isRiskyOrder);

    const mismatches = [];
    const errors = [];

    for (const order of targetOrders) {
      try {
        const transactions = await listPaymentTransactionsByOrderId(order.id);
        const paymentStatus = getLatestPaymentStatus(transactions);

        const { targetStatus, policySource } = pickTargetStatus(order, paymentStatus);
        if (targetStatus === order.status) {
          continue;
        }

        if (!canTransition(order.status, targetStatus)) {
          mismatches.push(
            buildMismatch({
              runId,
              order,
              paymentStatus,
              targetStatus,
              source: policySource,
              resolved: false,
              reason: "RECONCILIATION_TRANSITION_BLOCKED",
              retryable: false,
            }),
          );
          continue;
        }

        const updatedOrder = await updateOrderById(order.id, {
          status: targetStatus,
          updatedAt: new Date().toISOString(),
        });

        if (!updatedOrder) {
          mismatches.push(
            buildMismatch({
              runId,
              order,
              paymentStatus,
              targetStatus,
              source: policySource,
              resolved: false,
              reason: "RECONCILIATION_ORDER_NOT_FOUND",
              retryable: true,
            }),
          );
          continue;
        }

        mismatches.push(
          buildMismatch({
            runId,
            order,
            paymentStatus,
            targetStatus: updatedOrder.status,
            source: policySource,
            resolved: true,
            reason: "RECONCILIATION_APPLIED",
            retryable: false,
            afterOrder: updatedOrder,
          }),
        );

        await appendAuditLog({
          actorId: "system-reconciliation",
          orderId: order.id,
          action: "RECONCILIATION_SYNC_ORDER_STATUS",
          beforeStatus: order.status,
          afterStatus: updatedOrder.status,
          timestamp: new Date().toISOString(),
          correlationId,
          metadata: {
            runId,
            paymentStatus,
            source: policySource,
          },
        });
      } catch (error) {
        errors.push(
          createIntegrationErrorPayload(
            new IntegrationError({
              code: "INTEGRATION_RECONCILIATION_ORDER_FAILED",
              source: "integration",
              message: error instanceof Error ? error.message : "Lỗi đối soát đơn hàng.",
              retryable: true,
              details: {
                orderId: order.id,
              },
            }),
            { correlationId },
          ),
        );
      }
    }

    const completedAt = new Date().toISOString();
    const run = {
      runId,
      idempotencyKey: idempotencyKey ?? null,
      correlationId,
      startedAt,
      completedAt,
      scannedCount: targetOrders.length,
      mismatchCount: mismatches.length,
      resolvedCount: mismatches.filter((item) => item.resolved).length,
      unresolvedCount: mismatches.filter((item) => !item.resolved).length,
      mismatches,
      errors,
    };

    const persisted = await createReconciliationRunIfNotExistsUnsafe(idempotencyKey, async () => run);

    return {
      success: true,
      data: {
        ...persisted.run,
        idempotent: !persisted.created,
      },
    };
  });
}

export async function getReconciliationSummary({ limit = 10 } = {}) {
  const runs = await listReconciliationRuns({ limit });
  const latestRun = runs[0] ?? null;

  return {
    success: true,
    data: {
      latestRun,
      runs,
      openMismatches: latestRun ? latestRun.mismatches.filter((item) => !item.resolved) : [],
      resolvedMismatches: latestRun ? latestRun.mismatches.filter((item) => item.resolved) : [],
    },
  };
}
