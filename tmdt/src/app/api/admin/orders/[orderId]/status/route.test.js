import assert from "node:assert/strict";
import test from "node:test";

import { saveProfile } from "../../../../../../modules/identity/auth-service.js";
import { createSession } from "../../../../../../modules/identity/session-store.js";
import { createUser, USER_ROLES, __resetUserStoreForTests } from "../../../../../../modules/identity/user-store.js";
import { __resetCartStoreForTests, __setCartForUserForTests } from "../../../../../../modules/cart/cart-store.js";
import { __resetOrderStoreForTests } from "../../../../../../modules/order/order-store.js";
import { placeOrder } from "../../../../../../modules/order/order-service.js";
import { __resetPaymentStoreForTests } from "../../../../../../modules/payment/payment-store.js";
import { PATCH as patchAdminOrderStatus } from "./route.js";

function createRequest(path, { method = "PATCH", token, body } = {}) {
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

async function seedUser(role, emailPrefix) {
  const created = await createUser({
    email: `${emailPrefix}-${Date.now()}-${Math.random()}@example.com`,
    passwordHash: "hash",
    role,
  });
  assert.equal(created.success, true);
  return created.user;
}

async function seedOrderForCustomer() {
  const customer = await seedUser(USER_ROLES.CUSTOMER, "admin-order-customer");
  await saveProfile(customer.id, {
    fullName: "Admin Order Customer",
    phone: "+84909990000",
    addresses: ["17 Nguyen Binh Khiem"],
  });

  await __setCartForUserForTests(customer.id, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const placed = await placeOrder({
    userId: customer.id,
    address: "17 Nguyen Binh Khiem",
    shippingMethod: "standard",
    note: "",
    paymentMethod: "cod",
  });

  assert.equal(placed.success, true);
  return placed.data.order.id;
}

test("admin order status PATCH chặn request chưa đăng nhập", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const response = await patchAdminOrderStatus(createRequest("/api/admin/orders/order-1/status", { body: { status: "processing" } }), {
    params: Promise.resolve({ orderId: "order-1" }),
  });

  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_UNAUTHORIZED");
});

test("admin order status PATCH chặn role không phải admin", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const customer = await seedUser(USER_ROLES.CUSTOMER, "admin-order-forbidden");
  const customerToken = await createSession(customer.id, USER_ROLES.CUSTOMER);

  const response = await patchAdminOrderStatus(
    createRequest("/api/admin/orders/order-1/status", {
      token: customerToken,
      body: { status: "processing" },
    }),
    { params: Promise.resolve({ orderId: "order-1" }) },
  );

  assert.equal(response.status, 403);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_FORBIDDEN");
});

test("admin order status PATCH cập nhật trạng thái thành công", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const admin = await seedUser(USER_ROLES.ADMIN, "admin-order-ok");
  const adminToken = await createSession(admin.id, USER_ROLES.ADMIN);
  const orderId = await seedOrderForCustomer();

  const response = await patchAdminOrderStatus(
    createRequest(`/api/admin/orders/${orderId}/status`, {
      token: adminToken,
      body: { status: "processing", reason: "duyệt xử lý" },
    }),
    { params: Promise.resolve({ orderId }) },
  );

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.order.status, "processing");
  assert.equal(payload.data.idempotent, false);
});

test("admin order status PATCH trả lỗi transition không hợp lệ", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const admin = await seedUser(USER_ROLES.ADMIN, "admin-order-invalid-transition");
  const adminToken = await createSession(admin.id, USER_ROLES.ADMIN);
  const orderId = await seedOrderForCustomer();

  const response = await patchAdminOrderStatus(
    createRequest(`/api/admin/orders/${orderId}/status`, {
      token: adminToken,
      body: { status: "delivered" },
    }),
    { params: Promise.resolve({ orderId }) },
  );

  assert.equal(response.status, 409);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "ORDER_INVALID_STATE_TRANSITION");
});

test("admin order status PATCH trả lỗi khi payload không hợp lệ", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const admin = await seedUser(USER_ROLES.ADMIN, "admin-order-invalid-payload");
  const adminToken = await createSession(admin.id, USER_ROLES.ADMIN);
  const orderId = await seedOrderForCustomer();

  const response = await patchAdminOrderStatus(
    createRequest(`/api/admin/orders/${orderId}/status`, {
      token: adminToken,
      body: { status: "unknown_state" },
    }),
    { params: Promise.resolve({ orderId }) },
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "ORDER_INVALID_INPUT");
});
