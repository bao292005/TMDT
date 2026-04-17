import { randomUUID } from "node:crypto";

import { requireApiRole } from "../../../../modules/identity/authorization.js";
import { USER_ROLES } from "../../../../modules/identity/user-store.js";
import { listWarehouseQueue } from "../../../../modules/warehouse/warehouse-service.js";

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

export async function GET(request) {
  const correlationId = randomUUID();
  const access = await requireApiRole(request, [USER_ROLES.WAREHOUSE]);
  if (!access.ok) {
    return access.response;
  }

  const result = await listWarehouseQueue();
  if (!result.success) {
    return jsonError(result.code ?? "WAREHOUSE_QUEUE_FAILED", result.message ?? "Không thể tải hàng đợi kho.", correlationId, 500, result.data);
  }

  return jsonSuccess(result.data, correlationId);
}
