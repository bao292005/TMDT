import { randomUUID } from "node:crypto";

import { requireApiRole } from "../../../../modules/identity/authorization.js";
import { getOrderPaymentStatus } from "../../../../modules/order/order-service.js";
import { USER_ROLES } from "../../../../modules/identity/user-store.js";

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

function resolveErrorStatus(code) {
  if (code === "ORDER_INVALID_INPUT") return 400;
  if (code === "ORDER_NOT_FOUND" || code === "PAYMENT_TRANSACTION_NOT_FOUND") return 404;
  if (code === "ORDER_FORBIDDEN") return 403;
  return 500;
}

export async function GET(request) {
  const correlationId = randomUUID();
  const access = await requireApiRole(request, [USER_ROLES.CUSTOMER]);
  if (!access.ok) {
    return access.response;
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId")?.trim() ?? "";

  if (!orderId) {
    return jsonError("ORDER_INVALID_INPUT", "Thiếu orderId để truy vấn trạng thái thanh toán.", correlationId, 400);
  }

  const result = await getOrderPaymentStatus({
    orderId,
    userId: access.session.userId,
  });

  if (!result.success) {
    return jsonError(result.code, result.message, correlationId, resolveErrorStatus(result.code), result.data);
  }

  return jsonSuccess(result.data, correlationId);
}
