import { login } from "@/modules/identity/auth-service.js";
import { validateAuthPayload } from "@/shared/validation/auth.js";

const SESSION_COOKIE = "session_token";
const SESSION_TTL = 60 * 60 * 24 * 7;

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

  const result = await login(validation.data.email, validation.data.password);

  if (!result.success && result.error === "INVALID_CREDENTIALS") {
    return Response.json(
      {
        success: false,
        error: "INVALID_CREDENTIALS",
        message: "Email hoặc mật khẩu không đúng.",
      },
      { status: 401 },
    );
  }

  if (!result.success) {
    return Response.json(
      { success: false, error: "AUTH_FAILED", message: "Đăng nhập thất bại." },
      { status: 500 },
    );
  }

  const response = Response.json(
    {
      success: true,
      user: result.user,
    },
    { status: 200 },
  );

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.headers.set(
    "Set-Cookie",
    `${SESSION_COOKIE}=${result.sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL}${secure}`,
  );

  return response;
}
