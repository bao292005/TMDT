import { requireApiRole } from "../../../../modules/identity/authorization.js";
import { USER_ROLES } from "../../../../modules/identity/user-store.js";
import { createExportJob, getExportJobs } from "../../../../modules/reporting/report-store.js";
import { logError } from "../../../../shared/utils/logger.js";
import { randomUUID } from "node:crypto";

const REPORT_TYPES = new Set(["Order", "Transaction", "Revenue"]);
const REPORT_FORMATS = new Set(["CSV", "PDF"]);

function jsonSuccess(data, correlationId) {
  return Response.json(
    { success: true, data },
    { headers: { "X-Correlation-Id": correlationId } }
  );
}

function jsonError(message, code, correlationId, status = 400) {
  return Response.json(
    { success: false, error: { code, message } },
    { status, headers: { "X-Correlation-Id": correlationId } }
  );
}

function parseDateInput(value) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request) {
  const correlationId = request.headers.get("x-correlation-id") || randomUUID();
  try {
    const access = await requireApiRole(request, [USER_ROLES.ADMIN]);
    if (!access.ok) {
      return access.response;
    }
    
    const result = await getExportJobs();
    return jsonSuccess({ jobs: result.jobs }, correlationId);
  } catch (error) {
    logError("API_GET_REPORTS_HISTORY_ERROR", error, correlationId);
    return jsonError("System error", "SYSTEM_ERROR", correlationId, 500);
  }
}

export async function POST(request) {
  const correlationId = request.headers.get("x-correlation-id") || randomUUID();
  try {
    const access = await requireApiRole(request, [USER_ROLES.ADMIN]);
    if (!access.ok) {
      return access.response;
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError("Dữ liệu gửi lên không hợp lệ.", "INVALID_PARAMS", correlationId, 400);
    }

    const { type, format, startDate, endDate } = body ?? {};

    if (!type || !format || !startDate || !endDate) {
      return jsonError("Thiếu thông tin yêu cầu", "INVALID_PARAMS", correlationId, 400);
    }

    if (!REPORT_TYPES.has(type) || !REPORT_FORMATS.has(format)) {
      return jsonError("Loại báo cáo hoặc định dạng không hợp lệ.", "INVALID_PARAMS", correlationId, 400);
    }

    const startAt = parseDateInput(startDate);
    const endAt = parseDateInput(endDate);
    if (!startAt || !endAt) {
      return jsonError("Ngày bắt đầu/kết thúc không hợp lệ.", "INVALID_PARAMS", correlationId, 400);
    }

    if (startAt.getTime() > endAt.getTime()) {
      return jsonError("Khoảng thời gian không hợp lệ.", "INVALID_PARAMS", correlationId, 400);
    }

    const { job } = await createExportJob(type, format, startDate, endDate, access.session.userId, correlationId);
    return jsonSuccess({ job }, correlationId);
  } catch (error) {
    logError("API_POST_REPORTS_ERROR", error, correlationId);
    return jsonError("System error", "SYSTEM_ERROR", correlationId, 500);
  }
}
