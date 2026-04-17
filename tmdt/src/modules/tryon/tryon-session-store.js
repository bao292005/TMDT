const TRYON_SESSION_TTL_MS = 30 * 60 * 1000;

const sessionTryOnResults = new Map();

function normalizeSessionKey(sessionKey) {
  if (typeof sessionKey !== "string") return "";
  return sessionKey.trim().slice(0, 160);
}

function normalizeProductSlug(productSlug) {
  if (typeof productSlug !== "string") return "";
  return productSlug.trim().slice(0, 120);
}

function toStoreKey(sessionKey, productSlug) {
  const normalizedSessionKey = normalizeSessionKey(sessionKey);
  const normalizedProductSlug = normalizeProductSlug(productSlug);

  if (!normalizedSessionKey || !normalizedProductSlug) {
    return "";
  }

  return `${normalizedSessionKey}::${normalizedProductSlug}`;
}

function isExpired(snapshot) {
  if (!snapshot?.updatedAt) return true;
  return Date.now() - snapshot.updatedAt > TRYON_SESSION_TTL_MS;
}

export function saveTryOnResultForSession({ sessionKey, productSlug, variantContext, tryOnImageUrl, confidence }) {
  const key = toStoreKey(sessionKey, productSlug);
  if (!key) {
    return null;
  }

  const snapshot = {
    productSlug: normalizeProductSlug(productSlug),
    variantContext: variantContext ?? null,
    tryOnImageUrl,
    confidence,
    updatedAt: Date.now(),
  };

  sessionTryOnResults.set(key, snapshot);
  return snapshot;
}

export function getTryOnResultForSession({ sessionKey, productSlug }) {
  const key = toStoreKey(sessionKey, productSlug);
  if (!key) {
    return null;
  }

  const snapshot = sessionTryOnResults.get(key) ?? null;
  if (!snapshot) {
    return null;
  }

  if (isExpired(snapshot)) {
    sessionTryOnResults.delete(key);
    return null;
  }

  return snapshot;
}

export function __resetTryOnSessionStoreForTests() {
  sessionTryOnResults.clear();
}
