import assert from "node:assert/strict";
import test from "node:test";

import { __resetTryOnSessionStoreForTests } from "../../../modules/tryon/tryon-session-store.js";
import { __resetAuditLogStoreForTests, listAuditLogs } from "../../../modules/identity/audit-log-store.js";
import { GET as getTryOn, POST as postTryOn } from "./route.js";

function createImageFile({
  name = "demo.png",
  type = "image/png",
  content,
} = {}) {
  const binary = content ?? (() => {
    const bytes = new Uint8Array(2048);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    return bytes;
  })();

  return new File([binary], name, { type });
}

function createPostRequest({ file, productSlug = "ao-thun-basic-den", retry = false, cookie = "" } = {}) {
  const formData = new FormData();
  if (file) {
    formData.set("image", file);
  }
  if (productSlug !== null) {
    formData.set("productSlug", productSlug);
  }
  if (retry) {
    formData.set("retry", "true");
  }

  const headers = new Headers();
  if (cookie) {
    headers.set("cookie", cookie);
  }

  return new Request("http://localhost/api/try-on", {
    method: "POST",
    body: formData,
    headers,
  });
}

function createGetRequest({ productSlug, cookie = "" } = {}) {
  const headers = new Headers();
  if (cookie) {
    headers.set("cookie", cookie);
  }

  return new Request(`http://localhost/api/try-on?productSlug=${encodeURIComponent(productSlug ?? "")}`, {
    method: "GET",
    headers,
  });
}

function extractTryOnSessionCookie(response) {
  const raw = response.headers.get("Set-Cookie") ?? "";
  const [cookiePart] = raw.split(";");
  return cookiePart;
}

test("try-on route trả kết quả success với ảnh hợp lệ", async () => {
  __resetTryOnSessionStoreForTests();
  const response = await postTryOn(createPostRequest({ file: createImageFile() }));

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));
  assert.match(response.headers.get("Set-Cookie") ?? "", /^tryon_session=/);

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.state, "success");
  assert.equal(typeof payload.data.confidence, "number");
  assert.match(payload.data.tryOnImageUrl, /^data:image\/png;base64,/);
  assert.equal(typeof payload.data.updatedAt, "number");
});

test("try-on route đọc lại kết quả theo cùng phiên", async () => {
  __resetTryOnSessionStoreForTests();
  const postResponse = await postTryOn(createPostRequest({ file: createImageFile(), productSlug: "ao-thun-basic-den" }));
  const sessionCookie = extractTryOnSessionCookie(postResponse);

  const getResponse = await getTryOn(createGetRequest({ productSlug: "ao-thun-basic-den", cookie: sessionCookie }));
  assert.equal(getResponse.status, 200);
  assert.ok(getResponse.headers.get("X-Correlation-Id"));

  const payload = await getResponse.json();
  assert.equal(payload.success, true);
  assert.equal(payload.state, "success");
  assert.equal(typeof payload.data.updatedAt, "number");
});

test("try-on route không trả dữ liệu khi khác phiên", async () => {
  __resetTryOnSessionStoreForTests();
  await postTryOn(createPostRequest({ file: createImageFile(), productSlug: "ao-thun-basic-den" }));

  const response = await getTryOn(createGetRequest({ productSlug: "ao-thun-basic-den", cookie: "tryon_session=another-session.invalid" }));
  assert.equal(response.status, 404);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "TRYON_SESSION_RESULT_NOT_FOUND");
});

test("try-on route trả lỗi khi thiếu productSlug", async () => {
  __resetTryOnSessionStoreForTests();
  const response = await postTryOn(createPostRequest({ file: createImageFile(), productSlug: null }));

  assert.equal(response.status, 400);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "TRYON_INVALID_INPUT");
});

test("try-on GET trả lỗi khi thiếu productSlug", async () => {
  __resetTryOnSessionStoreForTests();
  const response = await getTryOn(createGetRequest({ productSlug: "" }));

  assert.equal(response.status, 400);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "TRYON_INVALID_INPUT");
});

test("try-on route trả lỗi khi thiếu ảnh", async () => {
  __resetTryOnSessionStoreForTests();
  const response = await postTryOn(createPostRequest({ file: null }));

  assert.equal(response.status, 400);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.state, "error");
  assert.equal(payload.error, "TRYON_INVALID_INPUT");
});

test("try-on route trả lỗi khi định dạng ảnh không hợp lệ", async () => {
  __resetTryOnSessionStoreForTests();
  const response = await postTryOn(
    createPostRequest({ file: createImageFile({ name: "demo.gif", type: "image/gif" }) }),
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.state, "error");
  assert.equal(payload.error, "TRYON_INVALID_INPUT");
});

test("try-on route trả lỗi integration non-retryable", async () => {
  __resetTryOnSessionStoreForTests();
  const response = await postTryOn(
    createPostRequest({ file: createImageFile(), productSlug: "ao-thun-ai-error" }),
  );

  assert.equal(response.status, 502);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.state, "error");
  assert.equal(payload.error, "TRYON_UPSTREAM_FAILED");
  assert.equal(payload.retryable, false);
  assert.equal(payload.integrationError.code, "AI_PROCESSING_FAILED");
  assert.equal(payload.integrationError.source, "ai");
  assert.equal(payload.integrationError.retryable, false);
  assert.equal(payload.integrationError.correlationId, response.headers.get("X-Correlation-Id"));
});

test("try-on route xử lý retry request", async () => {
  __resetTryOnSessionStoreForTests();
  const firstResponse = await postTryOn(
    createPostRequest({ file: createImageFile(), productSlug: "ao-thun-ai-error" }),
  );
  const sessionCookie = extractTryOnSessionCookie(firstResponse);

  const retryResponse = await postTryOn(
    createPostRequest({
      file: createImageFile(),
      productSlug: "ao-thun-basic-den",
      retry: true,
      cookie: sessionCookie,
    }),
  );

  assert.equal(retryResponse.status, 200);
  const payload = await retryResponse.json();
  assert.equal(payload.success, true);
  assert.equal(payload.state, "success");
});

test("try-on route trả trạng thái timeout khi quá thời gian", async () => {
  __resetTryOnSessionStoreForTests();
  await __resetAuditLogStoreForTests();

  const originalTimeout = process.env.TRYON_TIMEOUT_MS;
  process.env.TRYON_TIMEOUT_MS = "1";

  try {
    const response = await postTryOn(createPostRequest({ file: createImageFile() }));

    assert.equal(response.status, 504);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.state, "timeout");
    assert.equal(payload.error, "TRYON_TIMEOUT");
    assert.equal(payload.retryable, true);
    assert.equal(payload.integrationError.code, "AI_TIMEOUT");
    assert.equal(payload.integrationError.source, "ai");
    assert.equal(payload.integrationError.retryable, true);
    assert.equal(payload.integrationError.correlationId, response.headers.get("X-Correlation-Id"));

    const logs = await listAuditLogs();
    const fallbackEvent = logs.find((entry) => entry.action === "FALLBACK_ACTIVATED" && entry.metadata?.source === "ai");
    assert.ok(fallbackEvent);
    assert.equal(fallbackEvent.correlationId, response.headers.get("X-Correlation-Id"));
    assert.equal(fallbackEvent.metadata?.reason, "AI_TIMEOUT");
  } finally {
    if (originalTimeout === undefined) {
      delete process.env.TRYON_TIMEOUT_MS;
    } else {
      process.env.TRYON_TIMEOUT_MS = originalTimeout;
    }
  }
});
