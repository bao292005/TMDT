import { randomUUID } from "node:crypto";

import { requireApiRole } from "../../../../modules/identity/authorization.js";
import { USER_ROLES } from "../../../../modules/identity/user-store.js";
import { getReconciliationSummary, runReconciliationJob } from "../../../../modules/order/reconciliation-service.js";

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

function parseLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 10;
  return Math.max(1, Math.min(100, Math.trunc(parsed)));
}

export const dynamic = "force-dynamic";

export async function GET(request) {
  const correlationId = request.headers.get("x-correlation-id") || randomUUID();
  const access = await requireApiRole(request, [USER_ROLES.ADMIN]);
  if (!access.ok) {
    return access.response;
  }

  try {
    const url = new URL(request.url);
    const limit = parseLimit(url.searchParams.get("limit"));
    const result = await getReconciliationSummary({ limit });

    if (!result.success) {
      return jsonError(result.code, result.message, correlationId, 500, result.data);
    }

    return jsonSuccess(result.data, correlationId);
  } catch {
    return jsonError("RECONCILIATION_INTERNAL_ERROR", "Không thể đọc summary đối soát.", correlationId, 500);
  }
}

export async function POST(request) {
  const correlationId = request.headers.get("x-correlation-id") || randomUUID();
  const access = await requireApiRole(request, [USER_ROLES.ADMIN]);
  if (!access.ok) {
    return access.response;
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return jsonError("RECONCILIATION_INVALID_INPUT", "Payload JSON không hợp lệ.", correlationId, 400);
  }

  const idempotencyKey =
    typeof body?.idempotencyKey === "string" && body.idempotencyKey.trim()
      ? body.idempotencyKey.trim()
      : `${correlationId}:manual`;

  try {
    const result = await runReconciliationJob({
      correlationId,
      idempotencyKey,
    });

    if (!result.success) {
      return jsonError(result.code, result.message, correlationId, 500, result.data);
    }

    return jsonSuccess(result.data, correlationId, 200);
  } catch {
    return jsonError("RECONCILIATION_INTERNAL_ERROR", "Không thể chạy đối soát.", correlationId, 500);
  }
}
