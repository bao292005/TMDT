import { randomUUID } from "node:crypto";

import { getUserById, saveProfile } from "../../../modules/identity/auth-service.js";
import { requireApiRole } from "../../../modules/identity/authorization.js";
import { USER_ROLES } from "../../../modules/identity/user-store.js";
import { validateProfilePayload } from "../../../shared/validation/profile.js";

const ALLOWED_ROLES = [USER_ROLES.CUSTOMER, USER_ROLES.ADMIN, USER_ROLES.WAREHOUSE];

function jsonWithCorrelation(body, status, correlationId) {
  return Response.json(body, {
    status,
    headers: {
      "X-Correlation-Id": correlationId,
    },
  });
}

export async function GET(request) {
  const correlationId = randomUUID();
  const access = await requireApiRole(request, ALLOWED_ROLES);
  if (!access.ok) {
    return access.response;
  }

  const user = await getUserById(access.session.userId);
  if (!user) {
    return jsonWithCorrelation(
      { success: false, error: "USER_NOT_FOUND", message: "Không tìm thấy người dùng." },
      404,
      correlationId,
    );
  }

  return jsonWithCorrelation(
    {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        profile: user.profile,
      },
    },
    200,
    correlationId,
  );
}

export async function PUT(request) {
  const correlationId = randomUUID();
  const access = await requireApiRole(request, ALLOWED_ROLES);
  if (!access.ok) {
    return access.response;
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

  const validation = validateProfilePayload(payload);
  if (!validation.success) {
    return jsonWithCorrelation(
      { success: false, error: "INVALID_INPUT", message: validation.error },
      400,
      correlationId,
    );
  }

  const result = await saveProfile(access.session.userId, validation.data);
  if (!result.success) {
    return jsonWithCorrelation(
      { success: false, error: "USER_NOT_FOUND", message: "Không tìm thấy người dùng." },
      404,
      correlationId,
    );
  }

  return jsonWithCorrelation(
    {
      success: true,
      data: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        accountStatus: result.user.accountStatus,
        profile: result.user.profile,
      },
    },
    200,
    correlationId,
  );
}
