import assert from "node:assert/strict";
import test from "node:test";

import { __resetAuditLogStoreForTests } from "../../modules/identity/audit-log-store.js";
import { createOrder, __resetOrderStoreForTests } from "../../modules/order/order-store.js";
import { __resetReconciliationStoreForTests } from "../../modules/order/reconciliation-store.js";
import { __resetPaymentStoreForTests, createPaymentTransaction } from "../../modules/payment/payment-store.js";
import {
  executeReconciliationCycle,
  getReconciliationSchedulerGuidance,
  RECONCILIATION_INTERVAL_MS,
} from "./reconciliation-job.js";

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
    method: "online",
    status: "paid",
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

test("executeReconciliationCycle chạy đối soát với interval chuẩn", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();
  await __resetAuditLogStoreForTests();
  await __resetReconciliationStoreForTests();

  await createOrder(baseOrder({ id: "job-recon-order-1", status: "pending_payment" }));
  await createPaymentTransaction(basePaymentTransaction({ orderId: "job-recon-order-1", status: "paid" }));

  const result = await executeReconciliationCycle({
    correlationId: "job-corr-1",
    idempotencyKey: "job-recon-key-1",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.idempotencyKey, "job-recon-key-1");
  assert.equal(result.data.mismatchCount >= 1, true);
  assert.equal(RECONCILIATION_INTERVAL_MS, 15 * 60 * 1000);
});

test("getReconciliationSchedulerGuidance trả hướng dẫn cron mỗi 15 phút", () => {
  const guidance = getReconciliationSchedulerGuidance();

  assert.equal(guidance.intervalMinutes, 15);
  assert.equal(guidance.cron, "*/15 * * * *");
  assert.equal(typeof guidance.recommendation, "string");
  assert.equal(guidance.recommendation.includes("15 phút"), true);
});
