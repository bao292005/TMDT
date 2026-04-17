import { getIntegrationAdapterConfig } from "../../../shared/config/integration-profile.js";
import { IntegrationError } from "../../../shared/config/integration-error.js";
export class AiTryOnError extends IntegrationError {
  constructor(message, { code = "AI_PROVIDER_ERROR", retryable = false, details = null } = {}) {
    super({
      code,
      source: "ai",
      message,
      retryable,
      details,
    });
    this.name = "AiTryOnError";
  }
}

export function getAiAdapterConfig({ env = process.env } = {}) {
  return getIntegrationAdapterConfig("ai", { env });
}

function toSlugFragment(value) {
  return (value ?? "").trim().toLowerCase();
}

function createAbortError() {
  return new Error("TRYON_ABORTED");
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timerId = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timerId);
      signal?.removeEventListener("abort", onAbort);
      reject(createAbortError());
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function generateTryOnResult({ imageBuffer, mimeType, productSlug, signal, env = process.env }) {
  const config = getAiAdapterConfig({ env });
  const slug = toSlugFragment(productSlug);

  throwIfAborted(signal);

  if (slug.includes("ai-fail")) {
    throw new AiTryOnError("Dịch vụ AI tạm thời không khả dụng.", {
      code: "AI_PROVIDER_UNAVAILABLE",
      retryable: true,
    });
  }

  if (slug.includes("ai-error")) {
    throw new AiTryOnError("Không thể xử lý ảnh thử đồ.", {
      code: "AI_PROCESSING_FAILED",
      retryable: false,
    });
  }

  if (slug.includes("ai-timeout")) {
    await sleep(config.policy.timeoutMs + 50, signal);
  }

  await sleep(Math.min(config.policy.timeoutMs, 180), signal);

  throwIfAborted(signal);

  const confidence = Number((0.75 + Math.random() * 0.2).toFixed(2));

  return {
    tryOnImageUrl: `data:${mimeType};base64,${imageBuffer.toString("base64")}`,
    confidence,
    productSlug: (productSlug ?? "").trim(),
  };
}
