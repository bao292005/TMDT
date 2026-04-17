import assert from "node:assert/strict";
import test from "node:test";

import { __seedCatalogProductsForTests } from "../../../modules/catalog/product-store.js";
import { __resetTryOnSessionStoreForTests } from "../../../modules/tryon/tryon-session-store.js";
import { POST as postTryOn } from "../try-on/route.js";
import { GET as getRecommendations } from "./route.js";

function createImageFile() {
  const bytes = new Uint8Array(2048);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  return new File([bytes], "demo.png", { type: "image/png" });
}

function createTryOnRequest({ cookie = "", productSlug = "ao-thun-basic-den" } = {}) {
  const formData = new FormData();
  formData.set("image", createImageFile());
  formData.set("productSlug", productSlug);

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

function createRecommendationRequest({ productSlug, limit, viewed = [], cookie = "" }) {
  const params = new URLSearchParams();
  if (productSlug !== undefined) params.set("productSlug", productSlug);
  if (limit !== undefined) params.set("limit", String(limit));
  for (const slug of viewed) {
    params.append("viewed", slug);
  }

  const headers = new Headers();
  if (cookie) {
    headers.set("cookie", cookie);
  }

  return new Request(`http://localhost/api/recommendations?${params.toString()}`, {
    method: "GET",
    headers,
  });
}

function extractSessionCookie(response) {
  const raw = response.headers.get("Set-Cookie") ?? "";
  return raw.split(";")[0];
}

test.beforeEach(async () => {
  await __seedCatalogProductsForTests();
});

test("recommendations route trả success và correlation id", async () => {
  __resetTryOnSessionStoreForTests();
  const response = await getRecommendations(
    createRecommendationRequest({
      productSlug: "ao-thun-basic-den",
      viewed: ["quan-jean-slim-xanh"],
      limit: 5,
    }),
  );

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));
  assert.match(response.headers.get("Set-Cookie") ?? "", /^tryon_session=/);

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.state, "success");
  assert.equal(payload.data.items.length, 3);
});

test("recommendations route trả fallback khi thiếu personalization signal", async () => {
  __resetTryOnSessionStoreForTests();
  const response = await getRecommendations(
    createRecommendationRequest({
      productSlug: "ao-thun-basic-den",
      limit: 5,
    }),
  );

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.state, "fallback");
  assert.deepEqual(payload.data.signalsUsed, []);
});

test("recommendations route trả lỗi input không hợp lệ", async () => {
  __resetTryOnSessionStoreForTests();
  const response = await getRecommendations(createRecommendationRequest({ productSlug: "", limit: 100 }));

  assert.equal(response.status, 400);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.state, "error");
  assert.equal(payload.error, "RECOMMENDATION_INVALID_INPUT");
});

test("recommendations route trả lỗi khi limit nhỏ hơn ngưỡng tối thiểu", async () => {
  __resetTryOnSessionStoreForTests();
  const response = await getRecommendations(
    createRecommendationRequest({ productSlug: "ao-thun-basic-den", limit: 3 }),
  );

  assert.equal(response.status, 400);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.state, "error");
  assert.equal(payload.error, "RECOMMENDATION_INVALID_INPUT");
});


test("recommendations route dùng try-on snapshot theo đúng session", async () => {
  __resetTryOnSessionStoreForTests();

  const tryOnResponse = await postTryOn(createTryOnRequest({ productSlug: "ao-thun-basic-den" }));
  const sessionCookie = extractSessionCookie(tryOnResponse);

  const sameSessionResponse = await getRecommendations(
    createRecommendationRequest({ productSlug: "ao-thun-basic-den", cookie: sessionCookie, limit: 5 }),
  );
  const samePayload = await sameSessionResponse.json();

  assert.equal(sameSessionResponse.status, 200);
  assert.equal(samePayload.success, true);
  assert.equal(samePayload.state, "success");
  assert.ok(samePayload.data.signalsUsed.includes("try-on-session"));

  const otherSessionResponse = await getRecommendations(
    createRecommendationRequest({ productSlug: "ao-thun-basic-den", limit: 5 }),
  );
  const otherPayload = await otherSessionResponse.json();

  assert.equal(otherSessionResponse.status, 200);
  assert.equal(otherPayload.success, true);
  assert.equal(otherPayload.state, "fallback");
  assert.ok(!otherPayload.data.signalsUsed.includes("try-on-session"));
});

test("recommendations route trả 404 khi productSlug không tồn tại", async () => {
  __resetTryOnSessionStoreForTests();
  const response = await getRecommendations(
    createRecommendationRequest({ productSlug: "khong-ton-tai", limit: 5 }),
  );

  assert.equal(response.status, 404);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.state, "error");
  assert.equal(payload.error, "RECOMMENDATION_NOT_FOUND");
});
