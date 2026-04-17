import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { getTryOnResultForSession, saveTryOnResultForSession } from "./tryon-session-store.js";

const TRYON_SESSION_COOKIE = "tryon_session";
const TRYON_SESSION_TTL_SECONDS = 30 * 60;
const TRYON_SESSION_COOKIE_SECRET = process.env.SESSION_COOKIE_SECRET ?? "dev-session-cookie-secret";

function signTryOnSessionKey(sessionKey) {
  return createHmac("sha256", TRYON_SESSION_COOKIE_SECRET).update(sessionKey).digest("hex");
}

function readSignedSessionKey(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  const [sessionKey, signature] = value.split(".");
  if (!sessionKey || !signature) {
    return "";
  }

  const expectedSignature = signTryOnSessionKey(sessionKey);
  const providedBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (providedBuffer.length !== expectedBuffer.length) {
    return "";
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return "";
  }

  return sessionKey.trim().slice(0, 160);
}

function getTryOnSessionKeyFromRequest(request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const pair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${TRYON_SESSION_COOKIE}=`));

  if (!pair) {
    return "";
  }

  return readSignedSessionKey(pair.slice(`${TRYON_SESSION_COOKIE}=`.length).trim());
}

export function resolveTryOnSessionContext(request) {
  const existingSessionKey = getTryOnSessionKeyFromRequest(request);
  if (existingSessionKey) {
    return {
      sessionKey: existingSessionKey,
      isNewSession: false,
    };
  }

  return {
    sessionKey: randomUUID(),
    isNewSession: true,
  };
}

export function appendTryOnSessionCookie(response, sessionKey) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const signedSessionKey = `${sessionKey}.${signTryOnSessionKey(sessionKey)}`;
  response.headers.append(
    "Set-Cookie",
    `${TRYON_SESSION_COOKIE}=${signedSessionKey}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TRYON_SESSION_TTL_SECONDS}${secure}`,
  );
}

export function getTryOnSnapshotFromSession({ sessionKey, productSlug }) {
  return getTryOnResultForSession({ sessionKey, productSlug });
}

export function saveTryOnSnapshotToSession({
  sessionKey,
  productSlug,
  variantContext,
  tryOnImageUrl,
  confidence,
}) {
  return saveTryOnResultForSession({
    sessionKey,
    productSlug,
    variantContext,
    tryOnImageUrl,
    confidence,
  });
}
