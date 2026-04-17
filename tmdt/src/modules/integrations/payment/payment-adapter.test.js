import assert from "node:assert/strict";
import test from "node:test";

import { getPaymentAdapterConfig, initializeOnlinePayment } from "./payment-adapter.js";

test("payment adapter đổi provider/endpoint theo profile", async () => {
  const sandboxConfig = getPaymentAdapterConfig({
    env: {
      PAYMENT_INTEGRATION_PROFILE: "sandbox",
    },
  });

  const mockConfig = getPaymentAdapterConfig({
    env: {
      PAYMENT_INTEGRATION_PROFILE: "mock",
    },
  });

  assert.equal(sandboxConfig.provider, "sandbox-gateway");
  assert.equal(sandboxConfig.endpointAlias, "sandbox");
  assert.equal(mockConfig.provider, "mock-gateway");
  assert.equal(mockConfig.endpointAlias, "mock");

  const initialized = await initializeOnlinePayment(
    { orderId: "order-1", amount: 100000 },
    {
      env: {
        PAYMENT_INTEGRATION_PROFILE: "mock",
      },
    },
  );

  assert.equal(initialized.success, true);
  assert.equal(initialized.provider, "mock-gateway");
  assert.equal(initialized.providerReference, "mock-ORDER-1");
  assert.equal(initialized.checkoutUrl, "/payment/mock/ORDER-1");
  assert.equal(initialized.amount, 100000);
});

test("payment adapter encode/normalize orderId khi tạo checkoutUrl", async () => {
  const initialized = await initializeOnlinePayment(
    { orderId: " order/1?x=y ", amount: 120000 },
    {
      env: {
        PAYMENT_INTEGRATION_PROFILE: "mock",
      },
    },
  );

  assert.equal(initialized.success, true);
  assert.equal(initialized.providerReference, "mock-ORDER/1?X=Y");
  assert.equal(initialized.checkoutUrl, "/payment/mock/ORDER%2F1%3FX%3DY");
});

test("payment adapter fallback sandbox khi chưa cho phép production", () => {
  const productionRequested = getPaymentAdapterConfig({
    env: {
      PAYMENT_INTEGRATION_PROFILE: "production",
      INTEGRATION_ALLOW_PRODUCTION: "false",
    },
  });

  assert.equal(productionRequested.profile, "sandbox");
  assert.equal(productionRequested.provider, "sandbox-gateway");
});

test("payment adapter retry timeout theo policy và trả lỗi chuẩn", async () => {
  let attempts = 0;

  const result = await initializeOnlinePayment(
    { orderId: "order-timeout-1", amount: 100000 },
    {
      env: {
        PAYMENT_INTEGRATION_PROFILE: "mock",
      },
      onAttempt: () => {
        attempts += 1;
      },
    },
  );

  assert.equal(result.success, false);
  assert.equal(result.code, "PAYMENT_TIMEOUT");
  assert.equal(result.source, "payment");
  assert.equal(result.retryable, true);
  assert.equal(attempts, 2);
});

test("payment adapter fail-fast với invalid request", async () => {
  let attempts = 0;

  const result = await initializeOnlinePayment(
    { orderId: "order-invalid-1", amount: 100000 },
    {
      env: {
        PAYMENT_INTEGRATION_PROFILE: "sandbox",
      },
      onAttempt: () => {
        attempts += 1;
      },
    },
  );

  assert.equal(result.success, false);
  assert.equal(result.code, "PAYMENT_INVALID_REQUEST");
  assert.equal(result.retryable, false);
  assert.equal(attempts, 1);
});
