const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthPayload = {
  email: string;
  password: string;
};

export function validateAuthPayload(payload: unknown):
  | { success: true; data: AuthPayload }
  | { success: false; error: string } {
  if (!payload || typeof payload !== "object") {
    return { success: false, error: "Dữ liệu không hợp lệ." };
  }

  const rawEmail = (payload as { email?: unknown }).email;
  const rawPassword = (payload as { password?: unknown }).password;

  if (typeof rawEmail !== "string" || typeof rawPassword !== "string") {
    return { success: false, error: "Email hoặc mật khẩu không hợp lệ." };
  }

  const email = rawEmail.trim().toLowerCase();
  const password = rawPassword.trim();

  if (!EMAIL_REGEX.test(email)) {
    return { success: false, error: "Email không hợp lệ." };
  }

  if (password.length < 8) {
    return { success: false, error: "Mật khẩu phải có ít nhất 8 ký tự." };
  }

  return { success: true, data: { email, password } };
}
