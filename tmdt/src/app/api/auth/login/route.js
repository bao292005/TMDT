import { randomUUID } from "node:crypto";

import { login } from "@/modules/identity/auth-service.js";
import { createRoleCookieValue } from "@/modules/identity/session-context.js";
import { validateAuthPayload } from "@/shared/validation/auth.js";

function jsonWithCorrelation(body, status) {
  return Response.json(body, {
    status,
    headers: {
      "X-Correlation-Id": randomUUID(),
    },
  });
}

const SESSION_COOKIE = "session_token";
const SESSION_ROLE_COOKIE = "session_role";
const SESSION_TTL = 60 * 60 * 24 * 7;

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return jsonWithCorrelation(
      { success: false, error: "INVALID_INPUT", message: "Dữ liệu gửi lên không hợp lệ." },
      400,
    );
  }

  const validation = validateAuthPayload(payload);
  if (!validation.success) {
    return jsonWithCorrelation(
      { success: false, error: "INVALID_INPUT", message: validation.error },
      400,
    );
  }

  let result;
  try {
    result = await login(validation.data.email, validation.data.password);
  } catch {
    return jsonWithCorrelation(
      { success: false, error: "AUTH_FAILED", message: "Đăng nhập thất bại." },
      500,
    );
  }

  if (!result.success && result.error === "INVALID_CREDENTIALS") {
    return jsonWithCorrelation(
      {
        success: false,
        error: "INVALID_CREDENTIALS",
        message: "Email hoặc mật khẩu không đúng.",
      },
      401,
    );
  }

  if (!result.success && result.error === "ACCOUNT_LOCKED") {
    return jsonWithCorrelation(
      {
        success: false,
        error: "AUTH_FORBIDDEN",
        message: "Tài khoản đã bị khóa bởi quản trị viên.",
      },
      403,
    );
  }

  if (!result.success) {
    return jsonWithCorrelation(
      { success: false, error: "AUTH_FAILED", message: "Đăng nhập thất bại." },
      500,
    );
  }

  const response = jsonWithCorrelation(
    {
      success: true,
      user: result.user,
    },
    200,
  );

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${result.sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL}${secure}`,
  );
  response.headers.append(
    "Set-Cookie",
    `${SESSION_ROLE_COOKIE}=${createRoleCookieValue(result.user.role)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL}${secure}`,
  );

  return response;
}
