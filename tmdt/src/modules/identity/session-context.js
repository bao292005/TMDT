import { createHmac, timingSafeEqual } from "node:crypto";

const CONTEXT_COOKIE_SECRET = process.env.SESSION_COOKIE_SECRET ?? "dev-session-cookie-secret";

function signRole(role) {
  return createHmac("sha256", CONTEXT_COOKIE_SECRET).update(role).digest("hex");
}

export function createRoleCookieValue(role) {
  return `${role}.${signRole(role)}`;
}

export function readRoleFromCookieValue(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const [role, signature] = value.split(".");
  if (!role || !signature) {
    return null;
  }

  const expected = signRole(role);
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");

  if (a.length !== b.length) {
    return null;
  }

  if (!timingSafeEqual(a, b)) {
    return null;
  }

  return role;
}
