import { randomUUID } from "node:crypto";

import { initializeOnlinePayment } from "../integrations/payment/payment-adapter.js";
import {
  createPaymentTransaction,
  findLatestPaymentTransactionByOrderId,
  findPaymentTransactionByProviderReference,
  updatePaymentTransactionById,
} from "./payment-store.js";
import { appendFallbackAuditEvent } from "../identity/audit-log-store.js";

export const PAYMENT_METHODS = {
  ONLINE: "online",
  COD: "cod",
};

const CALLBACK_STATUS_TO_PAYMENT_STATUS = {
  success: "paid",
  pending: "pending_verification",
  failed: "failed",
};

const PAYMENT_STATUS_LABELS = {
  paid: "Thanh toán thành công",
  pending_verification: "Đang chờ xác nhận thanh toán",
  pending_gateway: "Đang chờ cổng thanh toán phản hồi",
  failed: "Thanh toán thất bại",
  retrying: "Đang khởi tạo giao dịch thanh toán lại",
  pending_cod_confirmation: "Thanh toán khi nhận hàng (COD)",
};

function resolvePaymentStateLabel(status) {
  if (typeof status !== "string") {
    return "Trạng thái thanh toán không xác định";
  }

  return PAYMENT_STATUS_LABELS[status] ?? `Trạng thái thanh toán: ${status}`;
}

function isValidTimestamp(value) {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function resolvePaymentStateTime(transaction) {
  if (isValidTimestamp(transaction?.callbackEventTime)) {
    return {
      stateTimestamp: transaction.callbackEventTime,
      stateSource: "callback_event_time",
    };
  }

  if (transaction?.callbackReceivedAt) {
    return {
      stateTimestamp: transaction.callbackReceivedAt,
      stateSource: "callback_received_at",
    };
  }

  if (transaction?.updatedAt) {
    return {
      stateTimestamp: transaction.updatedAt,
      stateSource: "updated_at",
    };
  }

  if (transaction?.createdAt) {
    return {
      stateTimestamp: transaction.createdAt,
      stateSource: "created_at",
    };
  }

  return {
    stateTimestamp: null,
    stateSource: "unknown",
  };
}

function buildPaymentTimelineState(transaction) {
  const { stateTimestamp, stateSource } = resolvePaymentStateTime(transaction);
  return {
    stateLabel: resolvePaymentStateLabel(transaction?.status),
    stateTimestamp,
    stateSource,
  };
}

function normalizeCallbackStatus(status) {
  const normalized = typeof status === "string" ? status.trim().toLowerCase() : "";
  return CALLBACK_STATUS_TO_PAYMENT_STATUS[normalized] ?? null;
}

function getProcessedIdempotencyKeys(transaction) {
  if (Array.isArray(transaction.processedIdempotencyKeys)) {
    return transaction.processedIdempotencyKeys;
  }
  if (transaction.lastIdempotencyKey) {
    return [transaction.lastIdempotencyKey];
  }
  return [];
}

function hasProcessedIdempotencyKey(transaction, idempotencyKey) {
  if (!idempotencyKey) return false;
  return getProcessedIdempotencyKeys(transaction).includes(idempotencyKey);
}

function withIdempotencyKey(transaction, idempotencyKey) {
  const existing = getProcessedIdempotencyKeys(transaction);

  if (!idempotencyKey || existing.includes(idempotencyKey)) {
    return {
      processedIdempotencyKeys: existing,
      lastIdempotencyKey: idempotencyKey ?? transaction.lastIdempotencyKey ?? null,
    };
  }

  return {
    processedIdempotencyKeys: [...existing, idempotencyKey],
    lastIdempotencyKey: idempotencyKey,
  };
}

function buildOnlineTransaction({ orderId, amount, initialized, retryOfTransactionId = null }) {
  return {
    id: randomUUID(),
    orderId,
    method: PAYMENT_METHODS.ONLINE,
    status: "pending_gateway",
    amount,
    provider: initialized.provider,
    providerReference: initialized.providerReference,
    checkoutUrl: initialized.checkoutUrl,
    retryOfTransactionId,
    processedIdempotencyKeys: [],
    lastIdempotencyKey: null,
    createdAt: new Date().toISOString(),
  };
}

async function appendPaymentFallbackEvent({ orderId, correlationId, reason, actionTaken, status, retryable, metadata }) {
  await appendFallbackAuditEvent({
    actorId: "system-payment",
    orderId,
    correlationId,
    source: "payment",
    reason,
    actionTaken,
    status,
    retryable,
    metadata,
  });
}

function buildFallbackNextAction(retryable) {
  if (retryable) {
    return {
      nextAction: "retry_payment",
      nextActionLabel: "Thử lại thanh toán",
      nextActionGuidance: "Cổng thanh toán đang gián đoạn tạm thời. Vui lòng thử lại sau ít phút.",
    };
  }

  return {
    nextAction: "contact_support",
    nextActionLabel: "Liên hệ hỗ trợ",
    nextActionGuidance: "Thanh toán không thể tự phục hồi. Vui lòng liên hệ hỗ trợ để xử lý thủ công.",
  };
}

function resolveCorrelationId(correlationId) {
  return typeof correlationId === "string" && correlationId.trim() ? correlationId.trim() : randomUUID();
}

export async function initializePaymentForOrder({ orderId, amount, paymentMethod, correlationId = randomUUID() }) {
  const resolvedCorrelationId = resolveCorrelationId(correlationId);
  if (paymentMethod === PAYMENT_METHODS.COD) {
    const transaction = {
      id: randomUUID(),
      orderId,
      method: PAYMENT_METHODS.COD,
      status: "pending_cod_confirmation",
      amount,
      provider: "cod",
      providerReference: null,
      checkoutUrl: null,
      retryOfTransactionId: null,
      processedIdempotencyKeys: [],
      lastIdempotencyKey: null,
      createdAt: new Date().toISOString(),
    };

    await createPaymentTransaction(transaction);
    return {
      success: true,
      data: transaction,
    };
  }

  if (paymentMethod === PAYMENT_METHODS.ONLINE) {
    const initialized = await initializeOnlinePayment({ orderId, amount });
    if (!initialized.success) {
      const retryable = Boolean(initialized.retryable);
      await appendPaymentFallbackEvent({
        orderId,
        correlationId: resolvedCorrelationId,
        reason: initialized.code ?? "PAYMENT_PROVIDER_UNAVAILABLE",
        actionTaken: retryable ? "fallback_retry_payment_init" : "fallback_manual_payment_support",
        status: "activated",
        retryable,
        metadata: {
          lane: "payment_initialization",
        },
      });

      return {
        success: false,
        code: "PAYMENT_INITIALIZATION_FAILED",
        message: "Không thể khởi tạo giao dịch thanh toán online.",
        retryable,
        data: {
          integrationError: {
            code: initialized.code,
            source: initialized.source ?? "payment",
            message: initialized.message,
            correlationId: resolvedCorrelationId,
            retryable,
            details: initialized.details ?? null,
          },
          ...buildFallbackNextAction(retryable),
        },
      };
    }

    await appendPaymentFallbackEvent({
      orderId,
      correlationId: resolvedCorrelationId,
      reason: "PAYMENT_INIT_OK",
      actionTaken: "fallback_resolved_payment_initialized",
      status: "recovered",
      retryable: false,
      metadata: {
        lane: "payment_initialization",
      },
    });

    const transaction = buildOnlineTransaction({ orderId, amount, initialized });
    await createPaymentTransaction(transaction);
    return {
      success: true,
      data: transaction,
    };
  }

  return {
    success: false,
    code: "PAYMENT_METHOD_INVALID",
    message: "Phương thức thanh toán không hợp lệ.",
  };
}

export async function processPaymentCallback({
  orderId,
  providerReference,
  status,
  eventTime,
  idempotencyKey,
  correlationId = randomUUID(),
}) {
  const resolvedCorrelationId = resolveCorrelationId(correlationId);
  const paymentStatus = normalizeCallbackStatus(status);
  if (!paymentStatus) {
    return {
      success: false,
      code: "PAYMENT_CALLBACK_INVALID_STATUS",
      message: "Trạng thái callback payment không hợp lệ.",
    };
  }

  const target = await findPaymentTransactionByProviderReference(providerReference);

  if (!target || target.orderId !== orderId) {
    return {
      success: false,
      code: "PAYMENT_TRANSACTION_NOT_FOUND",
      message: "Không tìm thấy giao dịch thanh toán cho callback.",
    };
  }

  if (hasProcessedIdempotencyKey(target, idempotencyKey)) {
    return {
      success: true,
      data: {
        transaction: target,
        idempotent: true,
      },
    };
  }

  const idempotency = withIdempotencyKey(target, idempotencyKey);
  const updated = await updatePaymentTransactionById(target.id, {
    status: paymentStatus,
    callbackEventTime: typeof eventTime === "string" ? eventTime : null,
    callbackReceivedAt: new Date().toISOString(),
    ...idempotency,
    updatedAt: new Date().toISOString(),
  });

  if (paymentStatus === "paid") {
    await appendPaymentFallbackEvent({
      orderId,
      correlationId: resolvedCorrelationId,
      reason: "PAYMENT_CALLBACK_PAID",
      actionTaken: "fallback_resolved_callback_confirmed",
      status: "recovered",
      retryable: false,
      metadata: {
        lane: "payment_callback",
      },
    });
  }

  if (paymentStatus === "pending_verification") {
    await appendPaymentFallbackEvent({
      orderId,
      correlationId: resolvedCorrelationId,
      reason: "PAYMENT_CALLBACK_PENDING",
      actionTaken: "fallback_refresh_payment_status",
      status: "activated",
      retryable: true,
      metadata: {
        lane: "payment_callback",
      },
    });
  }

  return {
    success: true,
    data: {
      transaction: updated,
      idempotent: false,
    },
  };
}

export async function getPaymentStatusForOrder(orderId) {
  const transaction = await findLatestPaymentTransactionByOrderId(orderId);
  if (!transaction) {
    return {
      success: false,
      code: "PAYMENT_TRANSACTION_NOT_FOUND",
      message: "Không tìm thấy giao dịch thanh toán cho đơn hàng.",
    };
  }

  return {
    success: true,
    data: {
      ...transaction,
      ...buildPaymentTimelineState(transaction),
    },
  };
}

export async function retryPaymentForOrder(order, { correlationId = randomUUID() } = {}) {
  const resolvedCorrelationId = resolveCorrelationId(correlationId);
  const latest = await findLatestPaymentTransactionByOrderId(order.id);
  if (!latest) {
    return {
      success: false,
      code: "PAYMENT_TRANSACTION_NOT_FOUND",
      message: "Không tìm thấy giao dịch để thực hiện retry.",
    };
  }

  if (latest.method !== PAYMENT_METHODS.ONLINE || latest.status !== "failed") {
    return {
      success: false,
      code: "PAYMENT_RETRY_NOT_ALLOWED",
      message: "Giao dịch hiện tại không hỗ trợ thanh toán lại.",
    };
  }

  const initialized = await initializeOnlinePayment({
    orderId: order.id,
    amount: order.pricing.total,
  });

  if (!initialized.success) {
    const retryable = Boolean(initialized.retryable);
    await appendPaymentFallbackEvent({
      orderId: order.id,
      correlationId: resolvedCorrelationId,
      reason: initialized.code ?? "PAYMENT_PROVIDER_UNAVAILABLE",
      actionTaken: retryable ? "fallback_retry_payment_init" : "fallback_manual_payment_support",
      status: "activated",
      retryable,
      metadata: {
        lane: "payment_retry",
      },
    });

    return {
      success: false,
      code: "PAYMENT_INITIALIZATION_FAILED",
      message: "Không thể khởi tạo giao dịch retry.",
      retryable,
      data: {
        integrationError: {
          code: initialized.code,
          source: initialized.source ?? "payment",
          message: initialized.message,
          correlationId: resolvedCorrelationId,
          retryable,
          details: initialized.details ?? null,
        },
        ...buildFallbackNextAction(retryable),
      },
    };
  }

  await appendPaymentFallbackEvent({
    orderId: order.id,
    correlationId: resolvedCorrelationId,
    reason: "PAYMENT_RETRY_INIT_OK",
    actionTaken: "fallback_resolved_retry_initialized",
    status: "recovered",
    retryable: false,
    metadata: {
      lane: "payment_retry",
    },
  });

  const transaction = buildOnlineTransaction({
    orderId: order.id,
    amount: order.pricing.total,
    initialized,
    retryOfTransactionId: latest.id,
  });

  await createPaymentTransaction(transaction);

  return {
    success: true,
    data: transaction,
  };
}
