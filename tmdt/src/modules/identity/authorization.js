import { randomUUID } from "node:crypto";

import { getAuthenticatedSession } from "./auth-service.js";

const SESSION_COOKIE = "session_token";

function extractSessionToken(cookieHeader = "") {
  const pair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));

  if (!pair) {
    return undefined;
  }

  return pair.slice(`${SESSION_COOKIE}=`.length);
}

export async function getRequestSession(request) {
  const token = extractSessionToken(request.headers.get("cookie") ?? "");
  if (!token) {
    return null;
  }

  return getAuthenticatedSession(token);
}

export function authorizeSession(session, allowedRoles) {
  if (!session) {
    return {
      ok: false,
      status: 401,
      error: "AUTH_UNAUTHORIZED",
      message: "Bạn cần đăng nhập để tiếp tục.",
    };
  }

  if (!allowedRoles.includes(session.role)) {
    return {
      ok: false,
      status: 403,
      error: "AUTH_FORBIDDEN",
      message: "Bạn không có quyền truy cập tài nguyên này.",
    };
  }

  return { ok: true };
}

function buildAuthErrorResponse(result) {
  return Response.json(
    {
      success: false,
      state: "error",
      error: result.error,
      message: result.message,
    },
    {
      status: result.status,
      headers: {
        "X-Correlation-Id": randomUUID(),
      },
    },
  );
}

export async function requireApiRole(request, allowedRoles) {
  const session = await getRequestSession(request);
  const authResult = authorizeSession(session, allowedRoles);

  if (!authResult.ok) {
    return { ok: false, response: buildAuthErrorResponse(authResult) };
  }

  return { ok: true, session };
}
