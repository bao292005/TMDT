import { randomUUID } from "node:crypto";

import { requireApiRole } from "../../../../modules/identity/authorization.js";
import { getFallbackSummary } from "../../../../modules/identity/audit-log-store.js";
import { USER_ROLES } from "../../../../modules/identity/user-store.js";
import { getReconciliationSummary } from "../../../../modules/order/reconciliation-service.js";

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

function parseLimit(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(100, Math.trunc(parsed)));
}

export const dynamic = "force-dynamic";

export async function GET(request) {
  const correlationId = request.headers.get("x-correlation-id") || randomUUID();
  const access = await requireApiRole(request, [USER_ROLES.ADMIN]);
  if (!access.ok) {
    return access.response;
  }

  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"), 50);
  const reconciliationLimit = parseLimit(url.searchParams.get("reconciliationLimit"), 10);

  try {
    const fallback = await getFallbackSummary({ limit });
    const reconciliation = await getReconciliationSummary({ limit: reconciliationLimit });

    const latestRun = reconciliation.success ? reconciliation.data.latestRun : null;

    return jsonSuccess(
      {
        fallback,
        reconciliation: {
          latestRun,
          openMismatches: reconciliation.success ? reconciliation.data.openMismatches : [],
          resolvedMismatches: reconciliation.success ? reconciliation.data.resolvedMismatches : [],
        },
      },
      correlationId,
    );
  } catch (error) {
    return jsonError(
      "FALLBACK_SUMMARY_FAILED",
      "Không thể tải báo cáo fallback summary.",
      correlationId,
      500,
      {
        detail: error instanceof Error ? error.message : "Unknown error",
      },
    );
  }
}
