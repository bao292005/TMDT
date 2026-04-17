import { randomUUID } from "node:crypto";

import { requireApiRole } from "../../../../modules/identity/authorization.js";
import { USER_ROLES } from "../../../../modules/identity/user-store.js";
import { performWarehouseAction } from "../../../../modules/warehouse/warehouse-service.js";

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
  if (code === "ORDER_INVALID_INPUT" || code === "WAREHOUSE_ACTION_INVALID") return 400;
  if (code === "ORDER_NOT_FOUND") return 404;
  if (code === "ORDER_INVALID_STATE") return 409;
  return 500;
}

export async function POST(request) {
  const correlationId = randomUUID();
  const access = await requireApiRole(request, [USER_ROLES.WAREHOUSE]);
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
  const action = typeof payload?.action === "string" ? payload.action.trim().toLowerCase() : "";

  const result = await performWarehouseAction({
    orderId,
    action,
    actorId: access.session.userId,
    correlationId,
  });

  if (!result.success) {
    return jsonError(result.code, result.message, correlationId, resolveErrorStatus(result.code), result.data);
  }

  return jsonSuccess(result.data, correlationId);
}
