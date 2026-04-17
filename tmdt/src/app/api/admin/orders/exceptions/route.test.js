import assert from "node:assert/strict";
import test from "node:test";

import { createSession } from "../../../../../modules/identity/session-store.js";
import { createUser, USER_ROLES, __resetUserStoreForTests } from "../../../../../modules/identity/user-store.js";
import { __resetCartStoreForTests } from "../../../../../modules/cart/cart-store.js";
import { __resetOrderStoreForTests } from "../../../../../modules/order/order-store.js";
import { __resetPaymentStoreForTests } from "../../../../../modules/payment/payment-store.js";
import { GET as getAdminExceptions } from "./route.js";

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

test("admin exceptions GET chặn request chưa đăng nhập", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const response = await getAdminExceptions(createRequest("/api/admin/orders/exceptions"));
  assert.equal(response.status, 401);
});

test("admin exceptions GET trả danh sách exceptions", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const admin = await seedUser(USER_ROLES.ADMIN, "admin-exceptions-ok");
  const adminToken = await createSession(admin.id, USER_ROLES.ADMIN);

  const response = await getAdminExceptions(createRequest("/api/admin/orders/exceptions", { token: adminToken }));
  assert.equal(response.status, 200);

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(Array.isArray(payload.data.orders), true);
});
