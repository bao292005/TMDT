import { randomUUID } from "node:crypto";

import { requireApiRole } from "../../../../../modules/identity/authorization.js";
import { USER_ROLES } from "../../../../../modules/identity/user-store.js";
import { getAdminOrderExceptions } from "../../../../../modules/order/order-service.js";

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

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const correlationId = randomUUID();
  const access = await requireApiRole(request, [USER_ROLES.ADMIN]);
  if (!access.ok) {
    return access.response;
  }

  const result = await getAdminOrderExceptions();
  if (!result.success) {
    return jsonError(result.code, result.message, correlationId, 500, result.data);
  }

  return jsonSuccess(result.data, correlationId);
}
