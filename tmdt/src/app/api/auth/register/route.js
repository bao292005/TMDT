import { randomUUID } from "node:crypto";

import { register } from "@/modules/identity/auth-service.js";
import { validateAuthPayload } from "@/shared/validation/auth.js";

function jsonWithCorrelation(body, status) {
  return Response.json(body, {
    status,
    headers: {
      "X-Correlation-Id": randomUUID(),
    },
  });
}

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
    result = await register(validation.data.email, validation.data.password);
  } catch {
    return jsonWithCorrelation(
      { success: false, error: "AUTH_FAILED", message: "Đăng ký thất bại." },
      500,
    );
  }

  if (!result.success && result.error === "EMAIL_ALREADY_EXISTS") {
    return jsonWithCorrelation(
      {
        success: false,
        error: "EMAIL_ALREADY_EXISTS",
        message: "Email đã được sử dụng.",
      },
      409,
    );
  }

  if (!result.success) {
    return jsonWithCorrelation(
      { success: false, error: "AUTH_FAILED", message: "Đăng ký thất bại." },
      500,
    );
  }

  return jsonWithCorrelation(
    {
      success: true,
      user: result.user,
    },
    201,
  );
}
