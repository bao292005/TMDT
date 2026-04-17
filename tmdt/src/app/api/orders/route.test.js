import assert from "node:assert/strict";
import test from "node:test";

import { __resetCartStoreForTests, __setCartForUserForTests } from "../../../modules/cart/cart-store.js";
import { saveProfile } from "../../../modules/identity/auth-service.js";
import { createSession } from "../../../modules/identity/session-store.js";
import { createUser, USER_ROLES } from "../../../modules/identity/user-store.js";
import { __resetOrderStoreForTests, updateOrderById } from "../../../modules/order/order-store.js";
import { __resetPaymentStoreForTests } from "../../../modules/payment/payment-store.js";
import { POST as postCheckout } from "../checkout/route.js";
import { GET as getOrders } from "./route.js";
import { GET as getOrderDetail } from "./[orderId]/route.js";

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

async function seedCustomerWithOrder() {
  const created = await createUser({
    email: `orders-api-${Date.now()}-${Math.random()}@example.com`,
    passwordHash: "hash",
    role: USER_ROLES.CUSTOMER,
  });
  assert.equal(created.success, true);

  await saveProfile(created.user.id, {
    fullName: "Orders API User",
    phone: "+84908887777",
    addresses: ["1 Nguyen Trai"],
  });

  await __setCartForUserForTests(created.user.id, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const token = await createSession(created.user.id, USER_ROLES.CUSTOMER);
  const checkoutResponse = await postCheckout(
    createRequest("/api/checkout", {
      method: "POST",
      token,
      body: { address: "1 Nguyen Trai", shippingMethod: "standard", paymentMethod: "cod", note: "" },
    }),
  );
  assert.equal(checkoutResponse.status, 201);
  const checkoutPayload = await checkoutResponse.json();

  return {
    user: created.user,
    token,
    orderId: checkoutPayload.data.order.id,
  };
}

test("orders route chặn request chưa đăng nhập", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const response = await getOrders(createRequest("/api/orders"));
  assert.equal(response.status, 401);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_UNAUTHORIZED");
});

test("orders route trả danh sách đơn hàng của customer", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const seeded = await seedCustomerWithOrder();

  const response = await getOrders(createRequest("/api/orders", { token: seeded.token }));
  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(Array.isArray(payload.data.orders), true);
  assert.equal(payload.data.orders.length, 1);
  assert.equal(payload.data.orders[0].id, seeded.orderId);
});

test("order detail route chặn request chưa đăng nhập", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const response = await getOrderDetail(createRequest("/api/orders/abc"), {
    params: Promise.resolve({ orderId: "abc" }),
  });

  assert.equal(response.status, 401);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_UNAUTHORIZED");
});

test("order detail route trả ORDER_NOT_FOUND", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const seeded = await seedCustomerWithOrder();

  const response = await getOrderDetail(createRequest("/api/orders/missing", { token: seeded.token }), {
    params: Promise.resolve({ orderId: "missing" }),
  });

  assert.equal(response.status, 404);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "ORDER_NOT_FOUND");
});

test("order detail route chặn truy cập cross-user", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const owner = await seedCustomerWithOrder();

  const anotherUser = await createUser({
    email: `orders-api-foreign-${Date.now()}@example.com`,
    passwordHash: "hash",
    role: USER_ROLES.CUSTOMER,
  });
  assert.equal(anotherUser.success, true);

  const anotherToken = await createSession(anotherUser.user.id, USER_ROLES.CUSTOMER);

  const response = await getOrderDetail(createRequest(`/api/orders/${owner.orderId}`, { token: anotherToken }), {
    params: Promise.resolve({ orderId: owner.orderId }),
  });

  assert.equal(response.status, 403);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "ORDER_FORBIDDEN");
});

test("order detail route trả chi tiết đơn hàng hợp lệ", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const seeded = await seedCustomerWithOrder();

  const response = await getOrderDetail(createRequest(`/api/orders/${seeded.orderId}`, { token: seeded.token }), {
    params: Promise.resolve({ orderId: seeded.orderId }),
  });

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.id, seeded.orderId);
  assert.equal(Array.isArray(payload.data.items), true);
  assert.equal(typeof payload.data.pricing.total, "number");
  assert.equal(typeof payload.data.tracking.status, "string");
  assert.equal(typeof payload.data.tracking.statusLabel, "string");
  assert.equal(Array.isArray(payload.data.tracking.timeline), true);
  assert.equal(payload.data.tracking.timeline.length > 0, true);
  assert.equal(typeof payload.data.tracking.timeline[0].nextAction, "string");
  assert.equal(payload.data.tracking.trackingNumber, null);
  assert.equal(payload.data.tracking.isDegraded, false);
});

test("order detail route trả degraded tracking contract khi shipping provider timeout", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const seeded = await seedCustomerWithOrder();
  await updateOrderById(seeded.orderId, {
    status: "shipped",
    trackingNumber: "TRK-TIMEOUT-API",
    shippedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const response = await getOrderDetail(createRequest(`/api/orders/${seeded.orderId}`, { token: seeded.token }), {
    params: Promise.resolve({ orderId: seeded.orderId }),
  });

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.tracking.isDegraded, true);
  assert.equal(payload.data.tracking.degradedReason, "SHIPPING_TIMEOUT");
  assert.equal(payload.data.tracking.retryable, true);
  assert.equal(payload.data.tracking.nextAction, "refresh_status");
  assert.equal(typeof payload.data.tracking.lastSyncedAt, "string");
});
