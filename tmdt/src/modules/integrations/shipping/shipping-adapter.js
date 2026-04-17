import { getIntegrationAdapterConfig } from "../../../shared/config/integration-profile.js";
import { IntegrationError, resolveBackoffDelay } from "../../../shared/config/integration-error.js";
export class ShippingTrackingError extends IntegrationError {
  constructor(message, { code = "SHIPPING_PROVIDER_UNAVAILABLE", retryable = false, details = null } = {}) {
    super({
      code,
      source: "shipping",
      message,
      retryable,
      details,
    });
    this.name = "ShippingTrackingError";
  }
}

export function getShippingAdapterConfig({ env = process.env } = {}) {
  return getIntegrationAdapterConfig("shipping", { env });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeTrackingNumber(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function normalizeTimeoutMs(value) {
  const fallback = 1_200;
  if (!Number.isFinite(value)) return fallback;
  const bounded = Math.trunc(value);
  return Math.min(5_000, Math.max(50, bounded));
}

async function simulateShippingProviderCall({ trackingNumber, timeoutMs, provider }) {
  const normalized = normalizeTrackingNumber(trackingNumber);

  if (!normalized) {
    throw new ShippingTrackingError("Thiếu tracking number để đồng bộ vận chuyển.", {
      code: "SHIPPING_INVALID_TRACKING",
      retryable: false,
    });
  }

  if (normalized.includes("INVALID")) {
    throw new ShippingTrackingError("Tracking number không hợp lệ.", {
      code: "SHIPPING_INVALID_TRACKING",
      retryable: false,
    });
  }

  if (normalized.includes("TIMEOUT")) {
    await sleep(timeoutMs + 20);
    throw new ShippingTrackingError("Shipping provider timeout.", {
      code: "SHIPPING_TIMEOUT",
      retryable: true,
    });
  }

  if (normalized.includes("UNAVAILABLE") || normalized.includes("DOWN")) {
    throw new ShippingTrackingError("Shipping provider tạm thời không khả dụng.", {
      code: "SHIPPING_PROVIDER_UNAVAILABLE",
      retryable: true,
    });
  }

  await sleep(20);

  const delivered = normalized.includes("DELIVERED") || normalized.includes("DELV");
  return {
    success: true,
    status: delivered ? "delivered" : "shipped",
    timestamp: new Date().toISOString(),
    provider,
    syncedAt: new Date().toISOString(),
  };
}

export async function fetchShippingTrackingStatus({ orderId, trackingNumber, timeoutMs, maxAttempts, onAttempt, env = process.env }) {
  const config = getShippingAdapterConfig({ env });

  if (typeof orderId !== "string" || !orderId.trim()) {
    throw new ShippingTrackingError("orderId không hợp lệ.", {
      code: "SHIPPING_INVALID_INPUT",
      retryable: false,
    });
  }

  const attempts = Math.min(
    3,
    Math.max(1, Number.isFinite(maxAttempts) ? Math.trunc(maxAttempts) : config.policy.maxAttempts),
  );
  const safeTimeoutMs = normalizeTimeoutMs(timeoutMs ?? config.policy.timeoutMs);

  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (typeof onAttempt === "function") {
      onAttempt(attempt);
    }

    try {
      return await simulateShippingProviderCall({
        trackingNumber,
        timeoutMs: safeTimeoutMs,
        provider: config.provider,
      });
    } catch (error) {
      const wrapped =
        error instanceof ShippingTrackingError
          ? error
          : new ShippingTrackingError("Không thể đồng bộ trạng thái vận chuyển.", {
              code: "SHIPPING_PROVIDER_UNAVAILABLE",
              retryable: true,
            });

      lastError = wrapped;
      if (!wrapped.retryable || attempt === attempts) {
        throw wrapped;
      }

      const backoffDelay = resolveBackoffDelay(config.policy.backoffMs, attempt - 1);
      if (backoffDelay > 0) {
        await sleep(backoffDelay);
      }
    }
  }

  throw (
    lastError ??
    new ShippingTrackingError("Không thể đồng bộ trạng thái vận chuyển.", {
      code: "SHIPPING_PROVIDER_UNAVAILABLE",
      retryable: true,
    })
  );
}
