export class IntegrationError extends Error {
  constructor({ code, source, message, retryable = false, details = null } = {}) {
    super(message || "Lỗi tích hợp ngoài.");
    this.name = "IntegrationError";
    this.code = code || "INTEGRATION_UNKNOWN_ERROR";
    this.source = source || "integration";
    this.retryable = Boolean(retryable);
    this.details = details ?? null;
  }
}

export function createIntegrationErrorPayload(error, { correlationId = null } = {}) {
  const normalized =
    error instanceof IntegrationError
      ? error
      : new IntegrationError({
          code: "INTEGRATION_UNKNOWN_ERROR",
          source: "integration",
          message: error instanceof Error ? error.message : "Lỗi tích hợp ngoài.",
          retryable: true,
        });

  return {
    code: normalized.code,
    source: normalized.source,
    message: normalized.message,
    correlationId,
    retryable: normalized.retryable,
    details: normalized.details,
  };
}

export function withIntegrationErrorCorrelation(integrationError, correlationId) {
  if (!integrationError || typeof integrationError !== "object") {
    return null;
  }

  return {
    ...integrationError,
    correlationId,
  };
}

export function resolveIntegrationStatusCode(code, retryable) {
  if (typeof code === "string" && code.endsWith("_TIMEOUT")) return 504;
  if (retryable) return 503;
  return 502;
}

export function resolveBackoffDelay(backoffMs, attemptIndex) {
  if (!Array.isArray(backoffMs) || backoffMs.length === 0) {
    return 0;
  }

  const index = Math.min(Math.max(0, attemptIndex), backoffMs.length - 1);
  const value = Number(backoffMs[index]);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.trunc(value);
}
