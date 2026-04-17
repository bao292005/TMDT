import { AiTryOnError, generateTryOnResult, getAiAdapterConfig } from "../integrations/ai/tryon-adapter.js";
import {
  createIntegrationErrorPayload,
  resolveBackoffDelay,
} from "../../shared/config/integration-error.js";
import { appendFallbackAuditEvent } from "../identity/audit-log-store.js";

const DEFAULT_TIMEOUT_MS = 5_000;

function isValidTryOnResult(result) {
  return (
    result &&
    typeof result === "object" &&
    typeof result.tryOnImageUrl === "string" &&
    result.tryOnImageUrl.length > 0 &&
    typeof result.confidence === "number" &&
    Number.isFinite(result.confidence)
  );
}

async function appendTryOnFallbackEvent({ correlationId, reason, actionTaken, status, retryable, metadata = {} }) {
  await appendFallbackAuditEvent({
    actorId: "system-tryon",
    orderId: null,
    correlationId,
    source: "ai",
    reason,
    actionTaken,
    status,
    retryable,
    metadata: {
      lane: "try_on",
      ...metadata,
    },
  });
}

export async function processTryOn(
  { imageBuffer, mimeType, fileName, productSlug },
  { adapter = generateTryOnResult, timeoutMs, env = process.env, onAttempt, correlationId = null } = {},
) {
  const config = getAiAdapterConfig({ env });
  const normalizedTimeoutMs =
    Number.isFinite(timeoutMs) && timeoutMs > 0
      ? Math.min(timeoutMs, DEFAULT_TIMEOUT_MS)
      : Math.min(config.policy.timeoutMs, DEFAULT_TIMEOUT_MS);
  const maxAttempts = Math.min(3, Math.max(1, config.policy.maxAttempts));
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (typeof onAttempt === "function") {
      onAttempt(attempt);
    }
    let timerId;
    const abortController = new AbortController();

    try {
      const timeoutPromise = new Promise((_, reject) => {
        timerId = setTimeout(() => {
          abortController.abort();
          reject(new Error("TRYON_TIMEOUT"));
        }, normalizedTimeoutMs);
      });

      const result = await Promise.race([
        adapter({ imageBuffer, mimeType, fileName, productSlug, signal: abortController.signal }),
        timeoutPromise,
      ]);

      if (!isValidTryOnResult(result)) {
        return {
          success: false,
          state: "error",
          code: "TRYON_INTERNAL_ERROR",
          message: "Không thể xử lý yêu cầu thử đồ AI.",
        };
      }

      await appendTryOnFallbackEvent({
        correlationId,
        reason: "AI_TRYON_OK",
        actionTaken: "fallback_resolved_tryon_success",
        status: "recovered",
        retryable: false,
        metadata: {
          productSlug,
        },
      });

      return {
        success: true,
        state: "success",
        data: result,
      };
    } catch (error) {
      if (error instanceof Error && (error.message === "TRYON_TIMEOUT" || error.message === "TRYON_ABORTED")) {
        if (attempt < maxAttempts) {
          const backoffDelay = resolveBackoffDelay(config.policy.backoffMs, attempt - 1);
          if (backoffDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          }
          continue;
        }

        await appendTryOnFallbackEvent({
          correlationId,
          reason: "AI_TIMEOUT",
          actionTaken: "fallback_retry_tryon",
          status: "activated",
          retryable: true,
          metadata: {
            productSlug,
          },
        });

        return {
          success: false,
          state: "timeout",
          code: "TRYON_TIMEOUT",
          retryable: true,
          message: "Hết thời gian xử lý thử đồ AI. Vui lòng thử lại.",
          integrationError: createIntegrationErrorPayload(
            new AiTryOnError("Dịch vụ AI phản hồi quá thời gian.", {
              code: "AI_TIMEOUT",
              retryable: true,
            }),
          ),
        };
      }

      if (error instanceof AiTryOnError) {
        if (error.retryable && attempt < maxAttempts) {
          const backoffDelay = resolveBackoffDelay(config.policy.backoffMs, attempt - 1);
          if (backoffDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          }
          continue;
        }

        await appendTryOnFallbackEvent({
          correlationId,
          reason: error.code ?? "AI_PROVIDER_UNAVAILABLE",
          actionTaken: error.retryable ? "fallback_retry_tryon" : "fallback_manual_tryon_guidance",
          status: "activated",
          retryable: error.retryable,
          metadata: {
            productSlug,
          },
        });

        return {
          success: false,
          state: "error",
          code: error.retryable ? "TRYON_UPSTREAM_RETRYABLE" : "TRYON_UPSTREAM_FAILED",
          retryable: error.retryable,
          message: error.message,
          integrationError: createIntegrationErrorPayload(error),
        };
      }

      return {
        success: false,
        state: "error",
        code: "TRYON_INTERNAL_ERROR",
        message: "Không thể xử lý yêu cầu thử đồ AI.",
      };
    } finally {
      if (timerId) {
        clearTimeout(timerId);
      }
    }
  }

  await appendTryOnFallbackEvent({
    correlationId,
    reason: "AI_PROVIDER_UNAVAILABLE",
    actionTaken: "fallback_retry_tryon",
    status: "activated",
    retryable: true,
    metadata: {
      productSlug,
    },
  });

  return {
    success: false,
    state: "error",
    code: "TRYON_UPSTREAM_RETRYABLE",
    retryable: true,
    message: "Dịch vụ AI tạm thời không khả dụng.",
    integrationError: createIntegrationErrorPayload(
      new AiTryOnError("Dịch vụ AI tạm thời không khả dụng.", {
        code: "AI_PROVIDER_UNAVAILABLE",
        retryable: true,
      }),
    ),
  };
}
