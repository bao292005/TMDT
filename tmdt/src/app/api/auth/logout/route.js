import { logout } from "@/modules/identity/auth-service.js";

const SESSION_COOKIE = "session_token";

function extractSessionToken(request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const pair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));

  if (!pair) {
    return undefined;
  }

  return pair.slice(`${SESSION_COOKIE}=`.length);
}

export async function POST(request) {
  const token = extractSessionToken(request);
  logout(token);

  const response = Response.json({ success: true }, { status: 200 });
  response.headers.set(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );

  return response;
}
