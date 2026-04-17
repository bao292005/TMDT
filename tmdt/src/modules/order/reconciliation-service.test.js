import assert from "node:assert/strict";
import test from "node:test";

import { __resetAuditLogStoreForTests } from "../identity/audit-log-store.js";
import { createPaymentTransaction, __resetPaymentStoreForTests } from "../payment/payment-store.js";
import { createOrder, findOrderById, __resetOrderStoreForTests } from "./order-store.js";
import { __resetReconciliationStoreForTests } from "./reconciliation-store.js";
import { getReconciliationSummary, runReconciliationJob } from "./reconciliation-service.js";

function baseOrder(overrides = {}) {
  return {
    id: overrides.id ?? `order-${Date.now()}-${Math.random()}`,
    userId: "customer-1",
    status: "pending_payment",
    pricing: { total: 100000 },
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1 }],
    checkout: {
      selectedAddress: "1 Nguyen Trai",
      selectedShippingMethod: "standard",
      note: "",
    },
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function basePaymentTransaction(overrides = {}) {
  return {
    id: overrides.id ?? `payment-${Date.now()}-${Math.random()}`,
    orderId: overrides.orderId,
    method: overrides.method ?? "online",
    status: overrides.status ?? "pending_gateway",
    amount: 100000,
    provider: "sandbox-gateway",
    providerReference: overrides.providerReference ?? `ref-${Date.now()}-${Math.random()}`,
    checkoutUrl: null,
    retryOfTransactionId: null,
    processedIdempotencyKeys: [],
    lastIdempotencyKey: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

test("runReconciliationJob đồng bộ mismatch payment->order", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();
  await __resetAuditLogStoreForTests();
  await __resetReconciliationStoreForTests();

  await createOrder(baseOrder({ id: "order-recon-resolve-1", status: "pending_payment" }));
  await createPaymentTransaction(
    basePaymentTransaction({
      orderId: "order-recon-resolve-1",
      status: "paid",
      createdAt: "2026-04-15T10:00:00.000Z",
    }),
  );

  const result = await runReconciliationJob({
    correlationId: "corr-recon-1",
    idempotencyKey: "recon-key-1",
    runId: "run-recon-1",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.idempotent, false);
  assert.equal(result.data.scannedCount, 1);
  assert.equal(result.data.mismatchCount, 1);
  assert.equal(result.data.resolvedCount, 1);
  assert.equal(result.data.unresolvedCount, 0);
  assert.equal(result.data.mismatches[0].resolved, true);
  assert.equal(result.data.mismatches[0].before.orderStatus, "pending_payment");
  assert.equal(result.data.mismatches[0].after.orderStatus, "paid");

  const persistedOrder = await findOrderById("order-recon-resolve-1");
  assert.equal(persistedOrder.status, "paid");
});

test("runReconciliationJob giữ mismatch unresolved khi transition bị chặn", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();
  await __resetAuditLogStoreForTests();
  await __resetReconciliationStoreForTests();

  await createOrder(baseOrder({ id: "order-recon-blocked-1", status: "confirmed_cod" }));
  await createPaymentTransaction(
    basePaymentTransaction({
      orderId: "order-recon-blocked-1",
      method: "cod",
      status: "paid",
      createdAt: "2026-04-15T11:00:00.000Z",
    }),
  );

  const result = await runReconciliationJob({
    correlationId: "corr-recon-2",
    idempotencyKey: "recon-key-2",
    runId: "run-recon-2",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.mismatchCount, 1);
  assert.equal(result.data.resolvedCount, 0);
  assert.equal(result.data.unresolvedCount, 1);
  assert.equal(result.data.mismatches[0].resolved, false);
  assert.equal(result.data.mismatches[0].reason, "RECONCILIATION_TRANSITION_BLOCKED");

  const persistedOrder = await findOrderById("order-recon-blocked-1");
  assert.equal(persistedOrder.status, "confirmed_cod");
});

test("runReconciliationJob idempotent theo idempotencyKey", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();
  await __resetAuditLogStoreForTests();
  await __resetReconciliationStoreForTests();

  await createOrder(baseOrder({ id: "order-recon-idempotent-1", status: "pending_payment" }));
  await createPaymentTransaction(
    basePaymentTransaction({
      orderId: "order-recon-idempotent-1",
      status: "paid",
      createdAt: "2026-04-15T12:00:00.000Z",
    }),
  );

  const first = await runReconciliationJob({
    correlationId: "corr-recon-3",
    idempotencyKey: "recon-key-idempotent",
    runId: "run-recon-3",
  });
  const second = await runReconciliationJob({
    correlationId: "corr-recon-3",
    idempotencyKey: "recon-key-idempotent",
    runId: "run-recon-4",
  });

  assert.equal(first.success, true);
  assert.equal(first.data.idempotent, false);
  assert.equal(second.success, true);
  assert.equal(second.data.idempotent, true);
  assert.equal(second.data.runId, "run-recon-3");

  const summary = await getReconciliationSummary({ limit: 10 });
  assert.equal(summary.success, true);
  assert.equal(summary.data.runs.length, 1);
});
