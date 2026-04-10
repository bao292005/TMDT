import { register } from "@/modules/identity/auth-service.js";
import { validateAuthPayload } from "@/shared/validation/auth.js";

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "INVALID_INPUT", message: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  const validation = validateAuthPayload(payload);
  if (!validation.success) {
    return Response.json(
      { success: false, error: "INVALID_INPUT", message: validation.error },
      { status: 400 },
    );
  }

  const result = await register(validation.data.email, validation.data.password);

  if (!result.success && result.error === "EMAIL_ALREADY_EXISTS") {
    return Response.json(
      {
        success: false,
        error: "EMAIL_ALREADY_EXISTS",
        message: "Email đã được sử dụng.",
      },
      { status: 409 },
    );
  }

  if (!result.success) {
    return Response.json(
      { success: false, error: "AUTH_FAILED", message: "Đăng ký thất bại." },
      { status: 500 },
    );
  }

  return Response.json(
    {
      success: true,
      user: result.user,
    },
    { status: 201 },
  );
}
