import assert from "node:assert/strict";
import test from "node:test";

import { saveProfile } from "../../../../modules/identity/auth-service.js";
import { __seedCatalogProductsForTests } from "../../../../modules/catalog/product-store.js";
import { createSession } from "../../../../modules/identity/session-store.js";
import { createUser, USER_ROLES, __resetUserStoreForTests } from "../../../../modules/identity/user-store.js";
import { __resetCartStoreForTests, __setCartForUserForTests } from "../../../../modules/cart/cart-store.js";
import { __resetOrderStoreForTests } from "../../../../modules/order/order-store.js";
import { __resetReconciliationStoreForTests } from "../../../../modules/order/reconciliation-store.js";
import { placeOrder } from "../../../../modules/order/order-service.js";
import { __resetPaymentStoreForTests, updatePaymentTransactionById, listPaymentTransactionsByOrderId } from "../../../../modules/payment/payment-store.js";
import { GET as getReconciliationSummary, POST as postReconciliation } from "./route.js";

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

async function seedUser(role, emailPrefix) {
  const created = await createUser({
    email: `${emailPrefix}-${Date.now()}-${Math.random()}@example.com`,
    passwordHash: "hash",
    role,
  });
  assert.equal(created.success, true);
  return created.user;
}

test.beforeEach(async () => {
  await __seedCatalogProductsForTests();
});

async function seedOrderWithPaymentDrift() {
  const customer = await seedUser(USER_ROLES.CUSTOMER, "admin-recon-customer");
  await saveProfile(customer.id, {
    fullName: "Recon Customer",
    phone: "+84901110000",
    addresses: ["1 Nguyen Trai"],
  });

  await __setCartForUserForTests(customer.id, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const placed = await placeOrder({
    userId: customer.id,
    address: "1 Nguyen Trai",
    shippingMethod: "standard",
    note: "",
    paymentMethod: "online",
  });

  assert.equal(placed.success, true);

  const transactions = await listPaymentTransactionsByOrderId(placed.data.order.id);
  const latest = transactions.at(-1);
  await updatePaymentTransactionById(latest.id, {
    status: "paid",
    updatedAt: new Date().toISOString(),
  });

  return placed.data.order.id;
}

test("admin reconciliation POST chặn request chưa đăng nhập", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();
  await __resetReconciliationStoreForTests();

  const response = await postReconciliation(createRequest("/api/admin/reconciliation", { method: "POST" }));
  assert.equal(response.status, 401);

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_UNAUTHORIZED");
});

test("admin reconciliation POST chặn role không phải admin", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();
  await __resetReconciliationStoreForTests();

  const customer = await seedUser(USER_ROLES.CUSTOMER, "admin-recon-forbidden");
  const token = await createSession(customer.id, USER_ROLES.CUSTOMER);

  const response = await postReconciliation(
    createRequest("/api/admin/reconciliation", {
      method: "POST",
      token,
      body: { idempotencyKey: "forbidden-key" },
    }),
  );

  assert.equal(response.status, 403);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_FORBIDDEN");
});

test("admin reconciliation POST chạy reconciliation thành công", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();
  await __resetReconciliationStoreForTests();

  const admin = await seedUser(USER_ROLES.ADMIN, "admin-recon-ok");
  const adminToken = await createSession(admin.id, USER_ROLES.ADMIN);
  await seedOrderWithPaymentDrift();

  const response = await postReconciliation(
    createRequest("/api/admin/reconciliation", {
      method: "POST",
      token: adminToken,
      body: { idempotencyKey: "admin-recon-key-1" },
    }),
  );

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.state, "success");
  assert.equal(payload.data.idempotencyKey, "admin-recon-key-1");
  assert.equal(typeof payload.data.runId, "string");
  assert.equal(payload.data.mismatchCount >= 1, true);
});

test("admin reconciliation GET trả summary mismatch", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();
  await __resetReconciliationStoreForTests();

  const admin = await seedUser(USER_ROLES.ADMIN, "admin-recon-summary");
  const adminToken = await createSession(admin.id, USER_ROLES.ADMIN);
  await seedOrderWithPaymentDrift();

  await postReconciliation(
    createRequest("/api/admin/reconciliation", {
      method: "POST",
      token: adminToken,
      body: { idempotencyKey: "admin-recon-key-2" },
    }),
  );

  const response = await getReconciliationSummary(
    createRequest("/api/admin/reconciliation?limit=5", {
      method: "GET",
      token: adminToken,
    }),
  );

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.state, "success");
  assert.equal(Array.isArray(payload.data.runs), true);
  assert.equal(payload.data.runs.length >= 1, true);
  assert.equal(Array.isArray(payload.data.openMismatches), true);
  assert.equal(Array.isArray(payload.data.resolvedMismatches), true);
}
);