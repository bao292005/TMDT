import assert from "node:assert/strict";
import test from "node:test";

import { AiTryOnError } from "../integrations/ai/tryon-adapter.js";
import { __resetAuditLogStoreForTests, listAuditLogs } from "../identity/audit-log-store.js";
import { processTryOn } from "./tryon-service.js";

const BASE_INPUT = {
  imageBuffer: Buffer.from("demo-image"),
  mimeType: "image/png",
  fileName: "demo.png",
  productSlug: "ao-thun-basic-den",
};

test("try-on service trả success khi adapter xử lý thành công", async () => {
  await __resetAuditLogStoreForTests();

  const result = await processTryOn(BASE_INPUT, {
    adapter: async () => ({ tryOnImageUrl: "data:image/png;base64,abc", confidence: 0.88 }),
    timeoutMs: 50,
    correlationId: "corr-tryon-success",
  });

  assert.equal(result.success, true);
  assert.equal(result.state, "success");
  assert.equal(result.data.confidence, 0.88);

  const logs = await listAuditLogs();
  const fallbackEvent = logs.find((entry) => entry.action === "FALLBACK_RECOVERED" && entry.metadata?.source === "ai");
  assert.ok(fallbackEvent);
  assert.equal(fallbackEvent.correlationId, "corr-tryon-success");
  assert.equal(fallbackEvent.metadata?.reason, "AI_TRYON_OK");
});

test("try-on service trả timeout khi adapter vượt ngưỡng", async () => {
  await __resetAuditLogStoreForTests();

  const result = await processTryOn(BASE_INPUT, {
    adapter: async () => new Promise(() => {}),
    timeoutMs: 10,
    correlationId: "corr-tryon-timeout",
  });

  assert.equal(result.success, false);
  assert.equal(result.state, "timeout");
  assert.equal(result.code, "TRYON_TIMEOUT");

  const logs = await listAuditLogs();
  const fallbackEvent = logs.find((entry) => entry.action === "FALLBACK_ACTIVATED" && entry.metadata?.source === "ai");
  assert.ok(fallbackEvent);
  assert.equal(fallbackEvent.correlationId, "corr-tryon-timeout");
  assert.equal(fallbackEvent.metadata?.reason, "AI_TIMEOUT");
});

test("try-on service abort adapter khi timeout", async () => {
  let receivedSignal = null;
  let aborted = false;

  const result = await processTryOn(BASE_INPUT, {
    adapter: async ({ signal }) => {
      receivedSignal = signal;

      return new Promise((_, reject) => {
        signal.addEventListener(
          "abort",
          () => {
            aborted = true;
            reject(new Error("TRYON_ABORTED"));
          },
          { once: true },
        );
      });
    },
    timeoutMs: 10,
  });

  assert.ok(receivedSignal);
  assert.equal(receivedSignal.aborted, true);
  assert.equal(aborted, true);
  assert.equal(result.success, false);
  assert.equal(result.state, "timeout");
  assert.equal(result.code, "TRYON_TIMEOUT");
});

test("try-on service auto-retry lỗi retryable theo policy", async () => {
  let callCount = 0;

  const result = await processTryOn(BASE_INPUT, {
    adapter: async () => {
      callCount += 1;
      if (callCount === 1) {
        throw new AiTryOnError("Lỗi tạm thời", { retryable: true });
      }

      return { tryOnImageUrl: "data:image/png;base64,retry-ok", confidence: 0.86 };
    },
    timeoutMs: 50,
  });

  assert.equal(callCount, 2);
  assert.equal(result.success, true);
  assert.equal(result.state, "success");
});

test("try-on service retry thành công khi có cờ retry cho lỗi retryable", async () => {
  let callCount = 0;

  const result = await processTryOn(
    { ...BASE_INPUT, retry: true },
    {
      adapter: async () => {
        callCount += 1;
        if (callCount === 1) {
          throw new AiTryOnError("Lỗi tạm thời", { retryable: true });
        }

        return { tryOnImageUrl: "data:image/png;base64,retry-ok", confidence: 0.86 };
      },
      timeoutMs: 50,
    },
  );

  assert.equal(callCount, 2);
  assert.equal(result.success, true);
  assert.equal(result.state, "success");
  assert.equal(result.data.tryOnImageUrl, "data:image/png;base64,retry-ok");
});

test("try-on service map lỗi retryable khi retry=true nhưng vẫn thất bại", async () => {
  let callCount = 0;

  const result = await processTryOn(
    { ...BASE_INPUT, retry: true },
    {
      adapter: async () => {
        callCount += 1;
        throw new AiTryOnError("Lỗi tạm thời", { retryable: true });
      },
      timeoutMs: 50,
    },
  );

  assert.equal(callCount, 2);
  assert.equal(result.success, false);
  assert.equal(result.state, "error");
  assert.equal(result.code, "TRYON_UPSTREAM_RETRYABLE");
});

test("try-on service map lỗi non-retryable từ adapter", async () => {
  const result = await processTryOn(BASE_INPUT, {
    adapter: async () => {
      throw new AiTryOnError("Lỗi xử lý", { retryable: false });
    },
    timeoutMs: 50,
  });

  assert.equal(result.success, false);
  assert.equal(result.state, "error");
  assert.equal(result.code, "TRYON_UPSTREAM_FAILED");
});
