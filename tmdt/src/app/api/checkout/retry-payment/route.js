import { randomUUID } from "node:crypto";

import { requireApiRole } from "../../../../modules/identity/authorization.js";
import { retryOrderPayment } from "../../../../modules/order/order-service.js";
import { USER_ROLES } from "../../../../modules/identity/user-store.js";
import { resolveIntegrationStatusCode, withIntegrationErrorCorrelation } from "../../../../shared/config/integration-error.js";

function jsonWithCorrelation(body, status, correlationId) {
  return Response.json(body, {
    status,
    headers: {
      "X-Correlation-Id": correlationId,
    },
  });
}

function jsonSuccess(data, correlationId, status = 200) {
  return jsonWithCorrelation({ success: true, state: "success", data }, status, correlationId);
}

function jsonError(error, message, correlationId, status, data) {
  return jsonWithCorrelation(
    {
      success: false,
      state: "error",
      error,
      message,
      ...(data ? { data } : {}),
    },
    status,
    correlationId,
  );
}

function resolveErrorStatus(code, result) {
  if (code === "ORDER_INVALID_INPUT" || code === "PAYMENT_RETRY_NOT_ALLOWED") return 400;
  if (code === "ORDER_NOT_FOUND" || code === "PAYMENT_TRANSACTION_NOT_FOUND") return 404;
  if (code === "ORDER_FORBIDDEN") return 403;
  if (code === "PAYMENT_INITIALIZATION_FAILED") {
    const integrationError = result?.data?.integrationError;
    if (integrationError) {
      return resolveIntegrationStatusCode(integrationError.code, integrationError.retryable);
    }
    return 502;
  }
  return 500;
}

function resolvePaymentFallbackNextAction(retryable) {
  if (retryable) {
    return {
      nextAction: "retry_payment",
      nextActionLabel: "Thử lại thanh toán",
      nextActionGuidance: "Cổng thanh toán đang gián đoạn tạm thời. Vui lòng thử lại sau ít phút.",
    };
  }

  return {
    nextAction: "contact_support",
    nextActionLabel: "Liên hệ hỗ trợ",
    nextActionGuidance: "Thanh toán không thể tự phục hồi. Vui lòng liên hệ hỗ trợ để xử lý thủ công.",
  };
}

function withPaymentFallbackNextAction(resultCode, data) {
  if (resultCode !== "PAYMENT_INITIALIZATION_FAILED" || !data || typeof data !== "object") {
    return data;
  }

  if (typeof data.nextAction === "string" && typeof data.nextActionLabel === "string" && typeof data.nextActionGuidance === "string") {
    return data;
  }

  if (typeof data.retryable !== "boolean") {
    return data;
  }

  return {
    ...data,
    ...resolvePaymentFallbackNextAction(data.retryable),
  };
}

export async function POST(request) {
  const correlationId = randomUUID();
  const access = await requireApiRole(request, [USER_ROLES.CUSTOMER]);
  if (!access.ok) {
    return access.response;
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonError("ORDER_INVALID_INPUT", "Dữ liệu gửi lên không hợp lệ.", correlationId, 400);
  }

  const orderId = typeof payload?.orderId === "string" ? payload.orderId.trim() : "";
  if (!orderId) {
    return jsonError("ORDER_INVALID_INPUT", "Thiếu orderId để thực hiện retry thanh toán.", correlationId, 400);
  }

  const result = await retryOrderPayment({
    orderId,
    userId: access.session.userId,
    correlationId,
  });

  if (!result.success) {
    const integrationError = withIntegrationErrorCorrelation(result?.data?.integrationError, correlationId);
    const data = integrationError ? { ...result.data, integrationError, retryable: integrationError.retryable } : result.data;

    return jsonError(
      result.code,
      result.message,
      correlationId,
      resolveErrorStatus(result.code, result),
      withPaymentFallbackNextAction(result.code, data),
    );
  }

  return jsonSuccess(result.data, correlationId);
}
