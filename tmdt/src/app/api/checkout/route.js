import { randomUUID } from "node:crypto";

import { buildCheckoutDraft } from "../../../modules/checkout/checkout-service.js";
import { requireApiRole } from "../../../modules/identity/authorization.js";
import { placeOrder } from "../../../modules/order/order-service.js";
import { USER_ROLES } from "../../../modules/identity/user-store.js";
import { validateCheckoutDraftPayload } from "../../../shared/validation/checkout.js";
import { validatePlaceOrderPayload } from "../../../shared/validation/order.js";
import { resolveIntegrationStatusCode, withIntegrationErrorCorrelation } from "../../../shared/config/integration-error.js";

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

function resolveCheckoutErrorStatus(code, result) {
  if (code === "CHECKOUT_INVALID_INPUT") return 400;
  if (code === "CHECKOUT_ADDRESS_REQUIRED" || code === "CHECKOUT_ADDRESS_NOT_FOUND") return 400;
  if (code === "CHECKOUT_SHIPPING_METHOD_INVALID") return 400;
  if (code === "CHECKOUT_PROFILE_NOT_FOUND") return 404;
  if (code === "CHECKOUT_CART_EMPTY" || code === "CHECKOUT_CART_INVALID") return 409;

  if (code === "ORDER_INVALID_INPUT") return 400;
  if (code === "PAYMENT_METHOD_INVALID") return 400;
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

function toErrorResponse(correlationId, result) {
  const integrationError = withIntegrationErrorCorrelation(result?.data?.integrationError, correlationId);
  const data = integrationError ? { ...result.data, integrationError, retryable: integrationError.retryable } : result.data;

  return jsonError(
    result.code,
    result.message,
    correlationId,
    resolveCheckoutErrorStatus(result.code, result),
    withPaymentFallbackNextAction(result.code, data),
  );
}

async function parsePayload(request, correlationId) {
  try {
    return await request.json();
  } catch {
    return jsonError("CHECKOUT_INVALID_INPUT", "Dữ liệu gửi lên không hợp lệ.", correlationId, 400);
  }
}

export async function GET(request) {
  const correlationId = randomUUID();
  const access = await requireApiRole(request, [USER_ROLES.CUSTOMER]);
  if (!access.ok) {
    return access.response;
  }

  const result = await buildCheckoutDraft({
    userId: access.session.userId,
    address: "",
    shippingMethod: "",
    note: "",
  });

  if (!result.success) {
    return toErrorResponse(correlationId, result);
  }

  return jsonSuccess(result.data, correlationId);
}

export async function PATCH(request) {
  const correlationId = randomUUID();
  const access = await requireApiRole(request, [USER_ROLES.CUSTOMER]);
  if (!access.ok) {
    return access.response;
  }

  const parsed = await parsePayload(request, correlationId);
  if (parsed instanceof Response) {
    return parsed;
  }

  const validation = validateCheckoutDraftPayload(parsed);
  if (!validation.success) {
    return jsonError(validation.code, validation.error, correlationId, 400);
  }

  const result = await buildCheckoutDraft({
    userId: access.session.userId,
    address: validation.data.address,
    shippingMethod: validation.data.shippingMethod,
    note: validation.data.note,
  });

  if (!result.success) {
    return toErrorResponse(correlationId, result);
  }

  return jsonSuccess(result.data, correlationId);
}

export async function POST(request) {
  const correlationId = randomUUID();
  const access = await requireApiRole(request, [USER_ROLES.CUSTOMER]);
  if (!access.ok) {
    return access.response;
  }

  const parsed = await parsePayload(request, correlationId);
  if (parsed instanceof Response) {
    return parsed;
  }

  const validation = validatePlaceOrderPayload(parsed);
  if (!validation.success) {
    return jsonError(validation.code, validation.error, correlationId, 400);
  }

  const result = await placeOrder({
    userId: access.session.userId,
    address: validation.data.address,
    shippingMethod: validation.data.shippingMethod,
    note: validation.data.note,
    paymentMethod: validation.data.paymentMethod,
    correlationId,
  });

  if (!result.success) {
    return toErrorResponse(correlationId, result);
  }

  return jsonSuccess(result.data, correlationId, 201);
}
