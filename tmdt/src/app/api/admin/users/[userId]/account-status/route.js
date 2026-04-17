import { randomUUID } from "node:crypto";

import { getUserById, setUserAccountStatus } from "../../../../../../modules/identity/auth-service.js";
import { requireApiRole } from "../../../../../../modules/identity/authorization.js";
import { appendAuditLog } from "../../../../../../modules/identity/audit-log-store.js";
import {
  USER_ACCOUNT_STATUS,
  USER_ROLES,
} from "../../../../../../modules/identity/user-store.js";
import { validateAccountStatusPayload } from "../../../../../../shared/validation/profile.js";

function jsonWithCorrelation(body, status, correlationId) {
  return Response.json(body, {
    status,
    headers: {
      "X-Correlation-Id": correlationId,
    },
  });
}

export async function PUT(request, { params }) {
  const correlationId = randomUUID();
  const access = await requireApiRole(request, [USER_ROLES.ADMIN]);
  if (!access.ok) {
    return access.response;
  }

  const resolvedParams = await params;
  const targetUserId = resolvedParams?.userId;
  if (!targetUserId) {
    return jsonWithCorrelation(
      { success: false, error: "INVALID_INPUT", message: "Thiếu userId mục tiêu." },
      400,
      correlationId,
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonWithCorrelation(
      { success: false, error: "INVALID_INPUT", message: "Dữ liệu gửi lên không hợp lệ." },
      400,
      correlationId,
    );
  }

  const validation = validateAccountStatusPayload(payload);
  if (!validation.success) {
    return jsonWithCorrelation(
      { success: false, error: "INVALID_INPUT", message: validation.error },
      400,
      correlationId,
    );
  }

  if (
    targetUserId === access.session.userId &&
    validation.data.status === USER_ACCOUNT_STATUS.LOCKED
  ) {
    return jsonWithCorrelation(
      {
        success: false,
        error: "AUTH_FORBIDDEN",
        message: "Bạn không thể tự khóa tài khoản của chính mình.",
      },
      403,
      correlationId,
    );
  }

  const targetUser = await getUserById(targetUserId);
  if (!targetUser) {
    return jsonWithCorrelation(
      { success: false, error: "USER_NOT_FOUND", message: "Không tìm thấy người dùng mục tiêu." },
      404,
      correlationId,
    );
  }

  const result = await setUserAccountStatus(targetUserId, validation.data.status);
  if (!result.success) {
    return jsonWithCorrelation(
      { success: false, error: "USER_NOT_FOUND", message: "Không tìm thấy người dùng mục tiêu." },
      404,
      correlationId,
    );
  }

  let auditLogged = true;

  try {
    await appendAuditLog({
      actorId: access.session.userId,
      targetUserId,
      action:
        validation.data.status === USER_ACCOUNT_STATUS.LOCKED
          ? "ADMIN_LOCK_ACCOUNT"
          : "ADMIN_UNLOCK_ACCOUNT",
      reason: validation.data.reason,
      timestamp: new Date().toISOString(),
      correlationId,
    });
  } catch {
    auditLogged = false;
  }

  return jsonWithCorrelation(
    {
      success: true,
      data: {
        userId: result.user.id,
        accountStatus: result.user.accountStatus,
        auditLogged,
      },
    },
    200,
    correlationId,
  );
}
