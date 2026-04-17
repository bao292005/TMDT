import assert from "node:assert/strict";
import test from "node:test";

import { saveProfile } from "../../../../modules/identity/auth-service.js";
import { createSession } from "../../../../modules/identity/session-store.js";
import { createUser, USER_ROLES, __resetUserStoreForTests } from "../../../../modules/identity/user-store.js";
import { __resetCartStoreForTests, __setCartForUserForTests } from "../../../../modules/cart/cart-store.js";
import { __resetOrderStoreForTests } from "../../../../modules/order/order-store.js";
import { placeOrder } from "../../../../modules/order/order-service.js";
import { __resetPaymentStoreForTests } from "../../../../modules/payment/payment-store.js";
import { GET as getAdminOrders } from "./route.js";

function createRequest(path, { token } = {}) {
  const headers = new Headers();
  if (token) {
    headers.set("cookie", `session_token=${token}`);
  }

  return new Request(`http://localhost${path}`, {
    method: "GET",
    headers,
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
  const customer = await seedUser(USER_ROLES.CUSTOMER, "admin-orders-customer");
  await saveProfile(customer.id, {
    fullName: "Admin Orders Customer",
    phone: "+84902223333",
    addresses: ["18 Tran Quang Khai"],
  });

  await __setCartForUserForTests(customer.id, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const placed = await placeOrder({
    userId: customer.id,
    address: "18 Tran Quang Khai",
    shippingMethod: "standard",
    note: "",
    paymentMethod: "cod",
  });

  assert.equal(placed.success, true);
  return placed.data.order.id;
}

test("admin orders GET chặn request chưa đăng nhập", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const response = await getAdminOrders(createRequest("/api/admin/orders"));
  assert.equal(response.status, 401);

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_UNAUTHORIZED");
});

test("admin orders GET chặn role không phải admin", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const customer = await seedUser(USER_ROLES.CUSTOMER, "admin-orders-forbidden");
  const customerToken = await createSession(customer.id, USER_ROLES.CUSTOMER);

  const response = await getAdminOrders(createRequest("/api/admin/orders", { token: customerToken }));
  assert.equal(response.status, 403);

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_FORBIDDEN");
});

test("admin orders GET trả danh sách đơn hàng", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const admin = await seedUser(USER_ROLES.ADMIN, "admin-orders-ok");
  const adminToken = await createSession(admin.id, USER_ROLES.ADMIN);
  const orderId = await seedOrderForCustomer();

  const response = await getAdminOrders(createRequest("/api/admin/orders", { token: adminToken }));
  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(Array.isArray(payload.data.orders), true);
  assert.equal(payload.data.orders.some((item) => item.id === orderId), true);
});
