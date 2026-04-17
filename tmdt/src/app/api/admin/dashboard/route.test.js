import assert from "node:assert/strict";
import test from "node:test";

import { saveProfile } from "../../../../modules/identity/auth-service.js";
import { createSession } from "../../../../modules/identity/session-store.js";
import { createUser, USER_ROLES, __resetUserStoreForTests } from "../../../../modules/identity/user-store.js";
import { __resetCartStoreForTests, __setCartForUserForTests } from "../../../../modules/cart/cart-store.js";
import { __resetOrderStoreForTests } from "../../../../modules/order/order-store.js";
import { placeOrder } from "../../../../modules/order/order-service.js";
import { __resetPaymentStoreForTests } from "../../../../modules/payment/payment-store.js";
import { GET as getAdminDashboard } from "./route.js";

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

test("admin dashboard GET chặn request chưa đăng nhập", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const response = await getAdminDashboard(createRequest("/api/admin/dashboard?timeRange=all"));
  assert.equal(response.status, 401);

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_UNAUTHORIZED");
});

test("admin dashboard GET trả thống kê", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const admin = await seedUser(USER_ROLES.ADMIN, "admin-dashboard-ok");
  const adminToken = await createSession(admin.id, USER_ROLES.ADMIN);
  
  const customer = await seedUser(USER_ROLES.CUSTOMER, "dashboard-customer");
  await saveProfile(customer.id, { addresses: ["123"] });
  await __setCartForUserForTests(customer.id, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });
  await placeOrder({
    userId: customer.id,
    address: "123",
    shippingMethod: "standard",
    note: "",
    paymentMethod: "cod",
  });

  const response = await getAdminDashboard(createRequest("/api/admin/dashboard?timeRange=all", { token: adminToken }));
  assert.equal(response.status, 200);

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.totalOrders, 1);
});
