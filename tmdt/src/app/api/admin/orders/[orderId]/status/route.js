import { randomUUID } from "node:crypto";

import { requireApiRole } from "../../../../../../modules/identity/authorization.js";
import { USER_ROLES } from "../../../../../../modules/identity/user-store.js";
import { updateOrderStatusByAdmin } from "../../../../../../modules/order/order-service.js";
import { validateAdminOrderStatusPayload } from "../../../../../../shared/validation/order.js";

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
  if (code === "ORDER_NOT_FOUND") return 404;
  if (code === "ORDER_INVALID_STATE_TRANSITION") return 409;
  if (code === "ORDER_AUDIT_LOG_FAILED") return 500;
  return 500;
}

export async function PATCH(request, { params }) {
  const correlationId = randomUUID();
  const access = await requireApiRole(request, [USER_ROLES.ADMIN]);
  if (!access.ok) {
    return access.response;
  }

  const resolvedParams = await params;
  const orderId = typeof resolvedParams?.orderId === "string" ? resolvedParams.orderId.trim() : "";
  if (!orderId) {
    return jsonError("ORDER_INVALID_INPUT", "Thiếu orderId.", correlationId, 400);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonError("ORDER_INVALID_INPUT", "Dữ liệu gửi lên không hợp lệ.", correlationId, 400);
  }

  const validation = validateAdminOrderStatusPayload(payload);
  if (!validation.success) {
    return jsonError(validation.code, validation.error, correlationId, 400);
  }

  const result = await updateOrderStatusByAdmin({
    orderId,
    nextStatus: validation.data.status,
    actorId: access.session.userId,
    correlationId,
    reason: validation.data.reason,
  });

  if (!result.success) {
    return jsonError(result.code, result.message, correlationId, resolveErrorStatus(result.code), result.data);
  }

  return jsonSuccess(result.data, correlationId);
}
