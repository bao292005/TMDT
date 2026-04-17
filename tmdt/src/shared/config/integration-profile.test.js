import assert from "node:assert/strict";
import test from "node:test";

import {
  assertIntegrationProfiles,
  getIntegrationAdapterConfig,
  getIntegrationHealthSnapshot,
} from "./integration-profile.js";

test("integration profile fallback an toàn khi chưa bật production", () => {
  const payment = getIntegrationAdapterConfig("payment", {
    env: {
      PAYMENT_INTEGRATION_PROFILE: "production",
      INTEGRATION_ALLOW_PRODUCTION: "false",
    },
  });

  const shipping = getIntegrationAdapterConfig("shipping", {
    env: {
      SHIPPING_INTEGRATION_PROFILE: "production",
    },
  });

  assert.equal(payment.profile, "sandbox");
  assert.equal(payment.provider, "sandbox-gateway");
  assert.equal(shipping.profile, "sandbox");
  assert.equal(shipping.provider, "shipping-sandbox");
});

test("integration profile cho phép production khi có guard flag", () => {
  const ai = getIntegrationAdapterConfig("ai", {
    env: {
      AI_INTEGRATION_PROFILE: "production",
      INTEGRATION_ALLOW_PRODUCTION: "true",
    },
  });

  assert.equal(ai.profile, "production");
  assert.equal(ai.provider, "ai-live");
  assert.equal(ai.endpointAlias, "production");
});

test("integration profile fail-fast với profile không hợp lệ", () => {
  assert.throws(() => {
    assertIntegrationProfiles({
      env: {
        AI_INTEGRATION_PROFILE: "invalid-profile",
      },
    });
  }, /INTEGRATION_PROFILE_INVALID/);
});

test("integration health snapshot chỉ trả metadata an toàn", () => {
  const snapshot = getIntegrationHealthSnapshot({
    env: {
      INTEGRATION_PROFILE: "sandbox",
    },
  });

  assert.equal(snapshot.ai.profile, "sandbox");
  assert.equal(snapshot.payment.profile, "sandbox");
  assert.equal(snapshot.shipping.profile, "sandbox");

  assert.equal(typeof snapshot.ai.endpointHostMasked, "string");
  assert.equal(snapshot.ai.endpointHostMasked.includes("***."), true);
  assert.equal(snapshot.ai.endpointHostMasked.includes("https://"), false);
  assert.equal("policy" in snapshot.ai, false);
  assert.equal("policy" in snapshot.payment, false);
  assert.equal("policy" in snapshot.shipping, false);
});
