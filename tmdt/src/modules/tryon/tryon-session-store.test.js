import assert from "node:assert/strict";
import test from "node:test";

import {
  __resetTryOnSessionStoreForTests,
  getTryOnResultForSession,
  saveTryOnResultForSession,
} from "./tryon-session-store.js";

test("try-on session store tạo và đọc snapshot theo phiên", () => {
  __resetTryOnSessionStoreForTests();

  const saved = saveTryOnResultForSession({
    sessionKey: "session-1",
    productSlug: "ao-thun-basic-den",
    tryOnImageUrl: "data:image/png;base64,abc",
    confidence: 0.83,
  });

  assert.ok(saved);

  const snapshot = getTryOnResultForSession({
    sessionKey: "session-1",
    productSlug: "ao-thun-basic-den",
  });

  assert.ok(snapshot);
  assert.equal(snapshot.productSlug, "ao-thun-basic-den");
  assert.equal(snapshot.tryOnImageUrl, "data:image/png;base64,abc");
  assert.equal(snapshot.confidence, 0.83);
  assert.equal(typeof snapshot.updatedAt, "number");
});

test("try-on session store lưu variant context khi được cung cấp", () => {
  __resetTryOnSessionStoreForTests();

  saveTryOnResultForSession({
    sessionKey: "session-1",
    productSlug: "ao-thun-basic-den",
    variantContext: { variantId: "den-l" },
    tryOnImageUrl: "data:image/png;base64,abc",
    confidence: 0.8,
  });

  const snapshot = getTryOnResultForSession({
    sessionKey: "session-1",
    productSlug: "ao-thun-basic-den",
  });

  assert.deepEqual(snapshot?.variantContext, { variantId: "den-l" });
});

test("try-on session store cập nhật kết quả mới nhất theo phiên", () => {
  __resetTryOnSessionStoreForTests();

  saveTryOnResultForSession({
    sessionKey: "session-1",
    productSlug: "ao-thun-basic-den",
    tryOnImageUrl: "data:image/png;base64,first",
    confidence: 0.71,
  });

  saveTryOnResultForSession({
    sessionKey: "session-1",
    productSlug: "ao-thun-basic-den",
    tryOnImageUrl: "data:image/png;base64,second",
    confidence: 0.91,
  });

  const snapshot = getTryOnResultForSession({
    sessionKey: "session-1",
    productSlug: "ao-thun-basic-den",
  });

  assert.ok(snapshot);
  assert.equal(snapshot.tryOnImageUrl, "data:image/png;base64,second");
  assert.equal(snapshot.confidence, 0.91);
});

test("try-on session store không rò rỉ dữ liệu giữa các phiên", () => {
  __resetTryOnSessionStoreForTests();

  saveTryOnResultForSession({
    sessionKey: "session-1",
    productSlug: "ao-thun-basic-den",
    tryOnImageUrl: "data:image/png;base64,abc",
    confidence: 0.8,
  });

  const snapshot = getTryOnResultForSession({
    sessionKey: "session-2",
    productSlug: "ao-thun-basic-den",
  });

  assert.equal(snapshot, null);
});
