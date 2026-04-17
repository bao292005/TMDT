import assert from "node:assert/strict";
import test from "node:test";

import { __resetPaymentStoreForTests, listPaymentTransactionsByOrderId } from "./payment-store.js";
import {
  getPaymentStatusForOrder,
  initializePaymentForOrder,
  processPaymentCallback,
  retryPaymentForOrder,
} from "./payment-service.js";
import { __resetAuditLogStoreForTests, listAuditLogs } from "../identity/audit-log-store.js";

test("initializePaymentForOrder tạo giao dịch online", { concurrency: false }, async () => {
  await __resetPaymentStoreForTests();
  await __resetAuditLogStoreForTests();

  const result = await initializePaymentForOrder({
    orderId: "order-online-1",
    amount: 500000,
    paymentMethod: "online",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.orderId, "order-online-1");
  assert.equal(result.data.method, "online");
  assert.equal(result.data.status, "pending_gateway");
  assert.equal(typeof result.data.checkoutUrl, "string");

  const transactions = await listPaymentTransactionsByOrderId("order-online-1");
  assert.equal(transactions.length, 1);
});

test("initializePaymentForOrder tạo giao dịch cod", { concurrency: false }, async () => {
  await __resetPaymentStoreForTests();

  const result = await initializePaymentForOrder({
    orderId: "order-cod-1",
    amount: 250000,
    paymentMethod: "cod",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.orderId, "order-cod-1");
  assert.equal(result.data.method, "cod");
  assert.equal(result.data.status, "pending_cod_confirmation");
  assert.equal(result.data.checkoutUrl, null);

  const transactions = await listPaymentTransactionsByOrderId("order-cod-1");
  assert.equal(transactions.length, 1);
});

test("initializePaymentForOrder reject payment method không hợp lệ", { concurrency: false }, async () => {
  await __resetPaymentStoreForTests();

  const result = await initializePaymentForOrder({
    orderId: "order-invalid-1",
    amount: 100000,
    paymentMethod: "wallet",
  });

  assert.equal(result.success, false);
  assert.equal(result.code, "PAYMENT_METHOD_INVALID");
});

test("initializePaymentForOrder trả integration error khi timeout", { concurrency: false }, async () => {
  await __resetPaymentStoreForTests();
  await __resetAuditLogStoreForTests();

  const result = await initializePaymentForOrder({
    orderId: "order-timeout-1",
    amount: 100000,
    paymentMethod: "online",
    correlationId: "corr-payment-timeout",
  });

  assert.equal(result.success, false);
  assert.equal(result.code, "PAYMENT_INITIALIZATION_FAILED");
  assert.equal(result.retryable, true);
  assert.equal(result.data.integrationError.code, "PAYMENT_TIMEOUT");
  assert.equal(result.data.integrationError.source, "payment");
  assert.equal(result.data.integrationError.retryable, true);

  const logs = await listAuditLogs();
  const fallbackEvent = logs.find((entry) => entry.action === "FALLBACK_ACTIVATED" && entry.metadata?.source === "payment");
  assert.ok(fallbackEvent);
  assert.equal(fallbackEvent.correlationId, "corr-payment-timeout");
  assert.equal(fallbackEvent.metadata?.reason, "PAYMENT_TIMEOUT");
});

test("processPaymentCallback cập nhật trạng thái success", { concurrency: false }, async () => {
  await __resetPaymentStoreForTests();
  await __resetAuditLogStoreForTests();

  const initialized = await initializePaymentForOrder({
    orderId: "order-callback-success-1",
    amount: 300000,
    paymentMethod: "online",
  });

  const result = await processPaymentCallback({
    orderId: "order-callback-success-1",
    providerReference: initialized.data.providerReference,
    status: "success",
    eventTime: new Date().toISOString(),
    idempotencyKey: "cb-success-1",
    correlationId: "corr-payment-callback-success",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.idempotent, false);
  assert.equal(result.data.transaction.status, "paid");

  const transactions = await listPaymentTransactionsByOrderId("order-callback-success-1");
  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].status, "paid");

  const logs = await listAuditLogs();
  const fallbackEvent = logs.find((entry) => entry.action === "FALLBACK_RECOVERED" && entry.metadata?.reason === "PAYMENT_CALLBACK_PAID");
  assert.ok(fallbackEvent);
  assert.equal(fallbackEvent.correlationId, "corr-payment-callback-success");
});

test("processPaymentCallback chặn duplicate idempotency", { concurrency: false }, async () => {
  await __resetPaymentStoreForTests();

  const initialized = await initializePaymentForOrder({
    orderId: "order-callback-dup-1",
    amount: 200000,
    paymentMethod: "online",
  });

  const payload = {
    orderId: "order-callback-dup-1",
    providerReference: initialized.data.providerReference,
    status: "failed",
    eventTime: new Date().toISOString(),
    idempotencyKey: "cb-dup-1",
  };

  const first = await processPaymentCallback(payload);
  const second = await processPaymentCallback(payload);

  assert.equal(first.success, true);
  assert.equal(first.data.idempotent, false);
  assert.equal(second.success, true);
  assert.equal(second.data.idempotent, true);
  assert.equal(second.data.transaction.status, "failed");

  const transactions = await listPaymentTransactionsByOrderId("order-callback-dup-1");
  assert.equal(transactions.length, 1);
});

test("retryPaymentForOrder tạo giao dịch mới khi failed", { concurrency: false }, async () => {
  await __resetPaymentStoreForTests();

  const initialized = await initializePaymentForOrder({
    orderId: "order-retry-1",
    amount: 450000,
    paymentMethod: "online",
  });

  await processPaymentCallback({
    orderId: "order-retry-1",
    providerReference: initialized.data.providerReference,
    status: "failed",
    eventTime: new Date().toISOString(),
    idempotencyKey: "cb-retry-1",
  });

  const retried = await retryPaymentForOrder({
    id: "order-retry-1",
    pricing: { total: 450000 },
  });

  assert.equal(retried.success, true);
  assert.equal(retried.data.status, "pending_gateway");
  assert.equal(typeof retried.data.retryOfTransactionId, "string");

  const transactions = await listPaymentTransactionsByOrderId("order-retry-1");
  assert.equal(transactions.length, 2);
  assert.equal(transactions[0].status, "failed");
  assert.equal(transactions[1].retryOfTransactionId, transactions[0].id);
});

test("retryPaymentForOrder từ trạng thái pending bị từ chối", { concurrency: false }, async () => {
  await __resetPaymentStoreForTests();

  await initializePaymentForOrder({
    orderId: "order-retry-blocked-1",
    amount: 350000,
    paymentMethod: "online",
  });

  const retried = await retryPaymentForOrder({
    id: "order-retry-blocked-1",
    pricing: { total: 350000 },
  });

  assert.equal(retried.success, false);
  assert.equal(retried.code, "PAYMENT_RETRY_NOT_ALLOWED");
});

test("getPaymentStatusForOrder trả metadata timeline theo callback", { concurrency: false }, async () => {
  await __resetPaymentStoreForTests();

  const initialized = await initializePaymentForOrder({
    orderId: "order-status-timeline-1",
    amount: 300000,
    paymentMethod: "online",
  });

  const callbackTime = new Date().toISOString();
  await processPaymentCallback({
    orderId: "order-status-timeline-1",
    providerReference: initialized.data.providerReference,
    status: "pending",
    eventTime: callbackTime,
    idempotencyKey: "cb-status-timeline-1",
  });

  const result = await getPaymentStatusForOrder("order-status-timeline-1");
  assert.equal(result.success, true);
  assert.equal(result.data.stateLabel, "Đang chờ xác nhận thanh toán");
  assert.equal(result.data.stateTimestamp, callbackTime);
  assert.equal(result.data.stateSource, "callback_event_time");
});

test("getPaymentStatusForOrder fallback timeline từ createdAt", { concurrency: false }, async () => {
  await __resetPaymentStoreForTests();

  await initializePaymentForOrder({
    orderId: "order-status-timeline-2",
    amount: 300000,
    paymentMethod: "online",
  });

  const result = await getPaymentStatusForOrder("order-status-timeline-2");
  assert.equal(result.success, true);
  assert.equal(result.data.stateLabel, "Đang chờ cổng thanh toán phản hồi");
  assert.equal(typeof result.data.stateTimestamp, "string");
  assert.equal(result.data.stateSource, "created_at");
});

test("getPaymentStatusForOrder trả lỗi khi không tìm thấy giao dịch", { concurrency: false }, async () => {
  await __resetPaymentStoreForTests();

  const result = await getPaymentStatusForOrder("missing-order");
  assert.equal(result.success, false);
  assert.equal(result.code, "PAYMENT_TRANSACTION_NOT_FOUND");
});
