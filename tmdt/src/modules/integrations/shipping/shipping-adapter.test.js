import assert from "node:assert/strict";
import test from "node:test";

import { fetchShippingTrackingStatus, ShippingTrackingError } from "./shipping-adapter.js";

test("fetchShippingTrackingStatus trả delivered khi tracking có DELV", async () => {
  const result = await fetchShippingTrackingStatus({
    orderId: "order-1",
    trackingNumber: "TRK-DELV-001",
    timeoutMs: 50,
  });

  assert.equal(result.success, true);
  assert.equal(result.status, "delivered");
  assert.equal(typeof result.syncedAt, "string");
});

test("fetchShippingTrackingStatus đổi provider theo profile nhưng giữ contract", async () => {
  const sandboxResult = await fetchShippingTrackingStatus({
    orderId: "order-sandbox-1",
    trackingNumber: "TRK-SHIP-001",
    timeoutMs: 50,
    env: {
      SHIPPING_INTEGRATION_PROFILE: "sandbox",
    },
  });

  const mockResult = await fetchShippingTrackingStatus({
    orderId: "order-mock-1",
    trackingNumber: "TRK-SHIP-002",
    timeoutMs: 50,
    env: {
      SHIPPING_INTEGRATION_PROFILE: "mock",
    },
  });

  assert.equal(sandboxResult.provider, "shipping-sandbox");
  assert.equal(mockResult.provider, "shipping-mock");

  assert.equal(typeof sandboxResult.status, "string");
  assert.equal(typeof sandboxResult.timestamp, "string");
  assert.equal(typeof sandboxResult.syncedAt, "string");
  assert.equal(typeof mockResult.status, "string");
  assert.equal(typeof mockResult.timestamp, "string");
  assert.equal(typeof mockResult.syncedAt, "string");
});

test("fetchShippingTrackingStatus retry và ném lỗi timeout retryable", async () => {
  let attempts = 0;

  await assert.rejects(
    () =>
      fetchShippingTrackingStatus({
        orderId: "order-2",
        trackingNumber: "TRK-TIMEOUT-001",
        timeoutMs: 20,
        maxAttempts: 2,
        onAttempt: () => {
          attempts += 1;
        },
      }),
    (error) => {
      assert.equal(error instanceof ShippingTrackingError, true);
      assert.equal(error.code, "SHIPPING_TIMEOUT");
      assert.equal(error.retryable, true);
      return true;
    },
  );

  assert.equal(attempts, 2);
});

test("fetchShippingTrackingStatus không retry với tracking invalid", async () => {
  await assert.rejects(
    () =>
      fetchShippingTrackingStatus({
        orderId: "order-3",
        trackingNumber: "INVALID-001",
        timeoutMs: 20,
        maxAttempts: 3,
      }),
    (error) => {
      assert.equal(error instanceof ShippingTrackingError, true);
      assert.equal(error.code, "SHIPPING_INVALID_TRACKING");
      assert.equal(error.retryable, false);
      return true;
    },
  );
});
