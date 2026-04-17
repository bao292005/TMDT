import assert from "node:assert/strict";
import test from "node:test";

import { createSession } from "../../../modules/identity/session-store.js";
import { USER_ROLES } from "../../../modules/identity/user-store.js";
import { __resetCartStoreForTests, __setCartForUserForTests } from "../../../modules/cart/cart-store.js";

import { DELETE as deleteCartItem, GET as getCart, PATCH as patchCartItem, POST as postCartItem } from "./route.js";

function createRequest(path, { method = "GET", token, body } = {}) {
  const headers = new Headers();
  if (token) {
    headers.set("cookie", `session_token=${token}`);
  }
  if (body !== undefined) {
    headers.set("content-type", "application/json");
  }

  return new Request(`http://localhost${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

test("cart route chặn request chưa đăng nhập", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const response = await getCart(createRequest("/api/cart"));
  assert.equal(response.status, 401);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.state, "error");
  assert.equal(payload.error, "AUTH_UNAUTHORIZED");
});

test("cart route chặn role không phải customer", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const adminToken = await createSession(`admin-${Date.now()}`, USER_ROLES.ADMIN);
  const response = await getCart(createRequest("/api/cart", { token: adminToken }));

  assert.equal(response.status, 403);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.state, "error");
  assert.equal(payload.error, "AUTH_FORBIDDEN");
});

test("cart route GET trả snapshot giỏ hàng", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const userId = `customer-${Date.now()}-get`;
  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 2, addedAt: Date.now() }],
  });

  const token = await createSession(userId, USER_ROLES.CUSTOMER);
  const response = await getCart(createRequest("/api/cart", { token }));

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.state, "success");
  assert.equal(payload.data.items.length, 1);
  assert.equal(payload.data.items[0].variantId, "m-trang");
});

test("cart route POST validate payload", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const token = await createSession(`customer-${Date.now()}-invalid`, USER_ROLES.CUSTOMER);
  const response = await postCartItem(
    createRequest("/api/cart", {
      method: "POST",
      token,
      body: { productSlug: "", variantId: "m-trang", quantity: 1 },
    }),
  );

  assert.equal(response.status, 400);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.state, "error");
  assert.equal(payload.error, "CART_INVALID_INPUT");
});

test("cart route POST map lỗi tồn kho", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const token = await createSession(`customer-${Date.now()}-stock`, USER_ROLES.CUSTOMER);
  const response = await postCartItem(
    createRequest("/api/cart", {
      method: "POST",
      token,
      body: { productSlug: "ao-thun-basic-den", variantId: "l-den", quantity: 1 },
    }),
  );

  assert.equal(response.status, 409);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "CART_OUT_OF_STOCK");
});

test("cart route PATCH trả item not found", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const token = await createSession(`customer-${Date.now()}-patch`, USER_ROLES.CUSTOMER);
  const response = await patchCartItem(
    createRequest("/api/cart", {
      method: "PATCH",
      token,
      body: { productSlug: "ao-thun-basic-den", variantId: "m-den", quantity: 2 },
    }),
  );

  assert.equal(response.status, 404);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "CART_ITEM_NOT_FOUND");
});

test("cart route DELETE xóa item thành công", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const userId = `customer-${Date.now()}-delete`;
  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const token = await createSession(userId, USER_ROLES.CUSTOMER);
  const response = await deleteCartItem(
    createRequest("/api/cart", {
      method: "DELETE",
      token,
      body: { productSlug: "ao-thun-basic-trang", variantId: "m-trang" },
    }),
  );

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.state, "success");
  assert.equal(payload.data.items.length, 0);
});

test("cart route GET mode checkout chặn cart empty", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const token = await createSession(`customer-${Date.now()}-checkout-empty`, USER_ROLES.CUSTOMER);
  const response = await getCart(createRequest("/api/cart?mode=checkout", { token }));

  assert.equal(response.status, 409);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "CART_EMPTY");
});

test("cart route GET mode checkout chặn cart invalid", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const userId = `customer-${Date.now()}-checkout-invalid`;
  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-den", variantId: "l-den", quantity: 1, addedAt: Date.now() }],
  });

  const token = await createSession(userId, USER_ROLES.CUSTOMER);
  const response = await getCart(createRequest("/api/cart?mode=checkout", { token }));

  assert.equal(response.status, 409);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "CART_INVALID");
});
