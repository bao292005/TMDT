import { getIntegrationAdapterConfig } from "../../../shared/config/integration-profile.js";
import { IntegrationError, resolveBackoffDelay } from "../../../shared/config/integration-error.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getPaymentAdapterConfig({ env = process.env } = {}) {
  return getIntegrationAdapterConfig("payment", { env });
}

async function simulatePaymentProviderCall({ orderId, amount, config }) {
  const normalizedOrderId = typeof orderId === "string" ? orderId.trim().toUpperCase() : "";
  const normalizedAmount = Number.isFinite(amount) ? amount : Number.NaN;

  if (!normalizedOrderId) {
    throw new IntegrationError({
      code: "PAYMENT_INVALID_INPUT",
      source: "payment",
      message: "orderId không hợp lệ cho khởi tạo thanh toán.",
      retryable: false,
    });
  }

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new IntegrationError({
      code: "PAYMENT_INVALID_INPUT",
      source: "payment",
      message: "amount không hợp lệ cho khởi tạo thanh toán.",
      retryable: false,
      details: { amount },
    });
  }

  if (normalizedOrderId.includes("INVALID")) {
    throw new IntegrationError({
      code: "PAYMENT_INVALID_REQUEST",
      source: "payment",
      message: "Yêu cầu khởi tạo thanh toán không hợp lệ.",
      retryable: false,
      details: { orderId },
    });
  }

  if (normalizedOrderId.includes("TIMEOUT")) {
    await sleep(config.policy.timeoutMs + 20);
    throw new IntegrationError({
      code: "PAYMENT_TIMEOUT",
      source: "payment",
      message: "Cổng thanh toán phản hồi quá thời gian.",
      retryable: true,
    });
  }

  if (normalizedOrderId.includes("UNAVAILABLE") || normalizedOrderId.includes("DOWN")) {
    throw new IntegrationError({
      code: "PAYMENT_PROVIDER_UNAVAILABLE",
      source: "payment",
      message: "Cổng thanh toán tạm thời không khả dụng.",
      retryable: true,
    });
  }

  await sleep(Math.min(config.policy.timeoutMs, 60));

  const encodedOrderId = encodeURIComponent(normalizedOrderId);

  return {
    success: true,
    provider: config.provider,
    providerReference: `${config.endpointAlias}-${normalizedOrderId}`,
    checkoutUrl: `/payment/${config.endpointAlias}/${encodedOrderId}`,
    amount: normalizedAmount,
  };
}

export async function initializeOnlinePayment({ orderId, amount }, { env = process.env, onAttempt } = {}) {
  const config = getPaymentAdapterConfig({ env });
  const maxAttempts = config.policy.maxAttempts;

  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (typeof onAttempt === "function") {
      onAttempt(attempt);
    }

    try {
      return await simulatePaymentProviderCall({ orderId, amount, config });
    } catch (error) {
      const wrapped =
        error instanceof IntegrationError
          ? error
          : new IntegrationError({
              code: "PAYMENT_PROVIDER_UNAVAILABLE",
              source: "payment",
              message: "Không thể kết nối cổng thanh toán.",
              retryable: true,
            });

      lastError = wrapped;
      if (!wrapped.retryable || attempt === maxAttempts) {
        return {
          success: false,
          code: wrapped.code,
          source: wrapped.source,
          message: wrapped.message,
          retryable: wrapped.retryable,
          details: wrapped.details,
        };
      }

      const backoffDelay = resolveBackoffDelay(config.policy.backoffMs, attempt - 1);
      if (backoffDelay > 0) {
        await sleep(backoffDelay);
      }
    }
  }

  return {
    success: false,
    code: lastError?.code ?? "PAYMENT_PROVIDER_UNAVAILABLE",
    source: lastError?.source ?? "payment",
    message: lastError?.message ?? "Không thể khởi tạo thanh toán online.",
    retryable: lastError?.retryable ?? true,
    details: lastError?.details ?? null,
  };
}
