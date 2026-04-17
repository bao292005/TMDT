import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import { __resetCartStoreForTests, __setCartForUserForTests } from "../../../modules/cart/cart-store.js";
import { saveProfile } from "../../../modules/identity/auth-service.js";
import { createSession } from "../../../modules/identity/session-store.js";
import { createUser, USER_ROLES } from "../../../modules/identity/user-store.js";
import { __resetOrderStoreForTests } from "../../../modules/order/order-store.js";
import { __resetPaymentStoreForTests } from "../../../modules/payment/payment-store.js";
import { GET as getPaymentStatus } from "./payment-status/route.js";
import { POST as postRetryPayment } from "./retry-payment/route.js";
import { POST as postPaymentWebhook } from "../webhooks/payment/route.js";
import { GET as getCheckout, PATCH as patchCheckout, POST as postCheckout } from "./route.js";

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

function createWebhookRequest(payload, secret, signature) {
  const payloadText = JSON.stringify(payload);
  const computed = createHmac("sha256", secret).update(payloadText, "utf8").digest("hex");

  return new Request("http://localhost/api/webhooks/payment", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-payment-signature": signature ?? `sha256=${computed}`,
    },
    body: payloadText,
  });
}

async function seedCustomerWithProfile() {
  const created = await createUser({
    email: `checkout-api-${Date.now()}-${Math.random()}@example.com`,
    passwordHash: "hash",
    role: USER_ROLES.CUSTOMER,
  });

  assert.equal(created.success, true);

  await saveProfile(created.user.id, {
    fullName: "Checkout User",
    phone: "+84901122334",
    addresses: ["1 Nguyen Trai", "2 Le Loi"],
  });

  return created.user;
}

test("checkout route chặn request chưa đăng nhập", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const response = await getCheckout(createRequest("/api/checkout"));

  assert.equal(response.status, 401);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.state, "error");
  assert.equal(payload.error, "AUTH_UNAUTHORIZED");
});

test("checkout route chặn role không phải customer", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const admin = await createUser({
    email: `checkout-admin-${Date.now()}@example.com`,
    passwordHash: "hash",
    role: USER_ROLES.ADMIN,
  });
  assert.equal(admin.success, true);

  const token = await createSession(admin.user.id, USER_ROLES.ADMIN);
  const response = await getCheckout(createRequest("/api/checkout", { token }));

  assert.equal(response.status, 403);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.state, "error");
  assert.equal(payload.error, "AUTH_FORBIDDEN");
});

test("checkout route POST chặn request chưa đăng nhập", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const response = await postCheckout(
    createRequest("/api/checkout", {
      method: "POST",
      body: { address: "1 Nguyen Trai", shippingMethod: "standard", paymentMethod: "cod", note: "" },
    }),
  );

  assert.equal(response.status, 401);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.state, "error");
  assert.equal(payload.error, "AUTH_UNAUTHORIZED");
});

test("checkout route POST chặn role không phải customer", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const admin = await createUser({
    email: `checkout-admin-post-${Date.now()}@example.com`,
    passwordHash: "hash",
    role: USER_ROLES.ADMIN,
  });
  assert.equal(admin.success, true);

  const token = await createSession(admin.user.id, USER_ROLES.ADMIN);
  const response = await postCheckout(
    createRequest("/api/checkout", {
      method: "POST",
      token,
      body: { address: "1 Nguyen Trai", shippingMethod: "standard", paymentMethod: "cod", note: "" },
    }),
  );

  assert.equal(response.status, 403);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.state, "error");
  assert.equal(payload.error, "AUTH_FORBIDDEN");
});

test("checkout route GET trả draft hợp lệ", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const user = await seedCustomerWithProfile();
  await __setCartForUserForTests(user.id, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 2, addedAt: Date.now() }],
  });

  const token = await createSession(user.id, USER_ROLES.CUSTOMER);
  const response = await getCheckout(createRequest("/api/checkout", { token }));

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.state, "success");
  assert.equal(payload.data.selectedAddress, "1 Nguyen Trai");
  assert.equal(payload.data.pricing.total, 428000);
});

test("checkout route PATCH validate payload", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const user = await seedCustomerWithProfile();
  await __setCartForUserForTests(user.id, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const token = await createSession(user.id, USER_ROLES.CUSTOMER);
  const response = await patchCheckout(
    createRequest("/api/checkout", {
      method: "PATCH",
      token,
      body: { address: "", shippingMethod: "", note: "" },
    }),
  );

  assert.equal(response.status, 400);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.state, "error");
  assert.equal(payload.error, "CHECKOUT_INVALID_INPUT");
});

test("checkout route POST validate place-order payload", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const user = await seedCustomerWithProfile();
  await __setCartForUserForTests(user.id, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const token = await createSession(user.id, USER_ROLES.CUSTOMER);
  const response = await postCheckout(
    createRequest("/api/checkout", {
      method: "POST",
      token,
      body: { address: "1 Nguyen Trai", shippingMethod: "express", paymentMethod: "bank-transfer", note: "" },
    }),
  );

  assert.equal(response.status, 400);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "ORDER_INVALID_INPUT");
});

test("checkout route POST tạo đơn online thành công", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const user = await seedCustomerWithProfile();
  await __setCartForUserForTests(user.id, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const token = await createSession(user.id, USER_ROLES.CUSTOMER);
  const response = await postCheckout(
    createRequest("/api/checkout", {
      method: "POST",
      token,
      body: { address: "1 Nguyen Trai", shippingMethod: "express", paymentMethod: "online", note: "giao nhanh" },
    }),
  );

  assert.equal(response.status, 201);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.state, "success");
  assert.equal(payload.data.order.status, "pending_payment");
  assert.equal(payload.data.payment.method, "online");
  assert.equal(payload.data.payment.status, "pending_gateway");
  assert.equal(typeof payload.data.payment.checkoutUrl, "string");
});

test("checkout route POST tạo đơn COD thành công", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const user = await seedCustomerWithProfile();
  await __setCartForUserForTests(user.id, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const token = await createSession(user.id, USER_ROLES.CUSTOMER);
  const response = await postCheckout(
    createRequest("/api/checkout", {
      method: "POST",
      token,
      body: { address: "22 Le Loi Quan 1", shippingMethod: "standard", paymentMethod: "cod", note: "" },
    }),
  );

  assert.equal(response.status, 201);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.order.status, "confirmed_cod");
  assert.equal(payload.data.payment.method, "cod");
  assert.equal(payload.data.payment.status, "pending_cod_confirmation");
  assert.equal(payload.data.payment.checkoutUrl, null);
});

test("checkout route POST map cart invalid từ gate", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const user = await seedCustomerWithProfile();
  await __setCartForUserForTests(user.id, {
    items: [{ productSlug: "ao-thun-basic-den", variantId: "l-den", quantity: 1, addedAt: Date.now() }],
  });

  const token = await createSession(user.id, USER_ROLES.CUSTOMER);
  const response = await postCheckout(
    createRequest("/api/checkout", {
      method: "POST",
      token,
      body: { address: "1 Nguyen Trai", shippingMethod: "standard", paymentMethod: "online", note: "" },
    }),
  );

  assert.equal(response.status, 409);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.state, "error");
  assert.equal(payload.error, "CHECKOUT_CART_INVALID");
  assert.equal(Boolean(payload.data), true);
});

test("payment-status route chặn request chưa đăng nhập", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const response = await getPaymentStatus(createRequest("/api/checkout/payment-status?orderId=missing"));

  assert.equal(response.status, 401);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_UNAUTHORIZED");
});

test("payment-status route trả ORDER_INVALID_INPUT khi thiếu orderId", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const user = await seedCustomerWithProfile();
  const token = await createSession(user.id, USER_ROLES.CUSTOMER);
  const response = await getPaymentStatus(createRequest("/api/checkout/payment-status", { token }));

  assert.equal(response.status, 400);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "ORDER_INVALID_INPUT");
});

test("payment-status route trả nextAction refresh_status cho đơn pending", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const user = await seedCustomerWithProfile();
  await __setCartForUserForTests(user.id, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const token = await createSession(user.id, USER_ROLES.CUSTOMER);
  const placeOrderResponse = await postCheckout(
    createRequest("/api/checkout", {
      method: "POST",
      token,
      body: { address: "1 Nguyen Trai", shippingMethod: "standard", paymentMethod: "online", note: "" },
    }),
  );
  const placeOrderPayload = await placeOrderResponse.json();

  const response = await getPaymentStatus(
    createRequest(`/api/checkout/payment-status?orderId=${placeOrderPayload.data.order.id}`, { token }),
  );

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.state, "success");
  assert.equal(payload.data.nextAction, "refresh_status");
  assert.equal(payload.data.stateLabel, "Đang chờ cổng thanh toán phản hồi");
  assert.equal(payload.data.stateSource, "created_at");
  assert.equal(typeof payload.data.stateTimestamp, "string");
  assert.equal(payload.data.nextActionLabel, "Làm mới trạng thái");
  assert.match(payload.data.nextActionGuidance, /làm mới/i);
});

test("retry-payment route chặn role không phải customer", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const admin = await createUser({
    email: `checkout-retry-admin-${Date.now()}@example.com`,
    passwordHash: "hash",
    role: USER_ROLES.ADMIN,
  });
  assert.equal(admin.success, true);

  const token = await createSession(admin.user.id, USER_ROLES.ADMIN);
  const response = await postRetryPayment(
    createRequest("/api/checkout/retry-payment", { method: "POST", token, body: { orderId: "missing" } }),
  );

  assert.equal(response.status, 403);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_FORBIDDEN");
});

test("retry-payment route tạo giao dịch mới khi đơn failed", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const secret = "retry-payment-secret";
  process.env.PAYMENT_WEBHOOK_SECRET = secret;

  const user = await seedCustomerWithProfile();
  await __setCartForUserForTests(user.id, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const token = await createSession(user.id, USER_ROLES.CUSTOMER);
  const placedResponse = await postCheckout(
    createRequest("/api/checkout", {
      method: "POST",
      token,
      body: { address: "1 Nguyen Trai", shippingMethod: "express", paymentMethod: "online", note: "" },
    }),
  );
  const placedPayload = await placedResponse.json();

  const failedCallbackPayload = {
    orderId: placedPayload.data.order.id,
    providerReference: placedPayload.data.payment.providerReference,
    status: "failed",
    eventTime: new Date().toISOString(),
    idempotencyKey: `retry-failed-${Date.now()}`,
  };

  const webhookResponse = await postPaymentWebhook(createWebhookRequest(failedCallbackPayload, secret));
  assert.equal(webhookResponse.status, 200);

  const response = await postRetryPayment(
    createRequest("/api/checkout/retry-payment", {
      method: "POST",
      token,
      body: { orderId: placedPayload.data.order.id },
    }),
  );

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.state, "success");
  assert.equal(payload.data.order.status, "pending_payment");
  assert.equal(payload.data.payment.status, "pending_gateway");
});

test("webhook payment route reject signature sai", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  process.env.PAYMENT_WEBHOOK_SECRET = "webhook-secret-invalid";

  const response = await postPaymentWebhook(
    createWebhookRequest(
      {
        orderId: "order-1",
        providerReference: "provider-1",
        status: "success",
        eventTime: new Date().toISOString(),
        idempotencyKey: "idem-1",
      },
      process.env.PAYMENT_WEBHOOK_SECRET,
      "sha256=invalid-signature",
    ),
  );

  assert.equal(response.status, 403);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_FORBIDDEN");
});

test("webhook payment route idempotent khi callback trùng", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const secret = "webhook-idempotent-secret";
  process.env.PAYMENT_WEBHOOK_SECRET = secret;

  const user = await seedCustomerWithProfile();
  await __setCartForUserForTests(user.id, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const token = await createSession(user.id, USER_ROLES.CUSTOMER);
  const placedResponse = await postCheckout(
    createRequest("/api/checkout", {
      method: "POST",
      token,
      body: { address: "1 Nguyen Trai", shippingMethod: "express", paymentMethod: "online", note: "" },
    }),
  );
  const placedPayload = await placedResponse.json();

  const callbackPayload = {
    orderId: placedPayload.data.order.id,
    providerReference: placedPayload.data.payment.providerReference,
    status: "success",
    eventTime: new Date().toISOString(),
    idempotencyKey: "idem-duplicate-1",
  };

  const first = await postPaymentWebhook(createWebhookRequest(callbackPayload, secret));
  const second = await postPaymentWebhook(createWebhookRequest(callbackPayload, secret));

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);

  const secondPayload = await second.json();
  assert.equal(secondPayload.success, true);
  assert.equal(secondPayload.state, "success");
  assert.equal(secondPayload.data.idempotent, true);
});
