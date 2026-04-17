import assert from "node:assert/strict";
import test from "node:test";

import { generateTryOnResult, getAiAdapterConfig } from "./tryon-adapter.js";

test("ai adapter đổi provider/endpoint theo profile", () => {
  const sandboxConfig = getAiAdapterConfig({
    env: {
      AI_INTEGRATION_PROFILE: "sandbox",
    },
  });

  const mockConfig = getAiAdapterConfig({
    env: {
      AI_INTEGRATION_PROFILE: "mock",
    },
  });

  assert.equal(sandboxConfig.profile, "sandbox");
  assert.equal(sandboxConfig.provider, "ai-sandbox");
  assert.equal(mockConfig.profile, "mock");
  assert.equal(mockConfig.provider, "ai-mock");
});

test("ai adapter giữ nguyên shape response khi đổi profile", async () => {
  const payload = {
    imageBuffer: Buffer.from("demo-image"),
    mimeType: "image/png",
    productSlug: "ao-thun-basic-den",
  };

  const sandboxResult = await generateTryOnResult({
    ...payload,
    env: {
      AI_INTEGRATION_PROFILE: "sandbox",
    },
  });

  const mockResult = await generateTryOnResult({
    ...payload,
    env: {
      AI_INTEGRATION_PROFILE: "mock",
    },
  });

  for (const result of [sandboxResult, mockResult]) {
    assert.equal(typeof result.tryOnImageUrl, "string");
    assert.equal(typeof result.confidence, "number");
    assert.equal(result.productSlug, payload.productSlug);
  }
});
