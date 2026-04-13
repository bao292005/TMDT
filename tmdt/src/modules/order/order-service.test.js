import assert from "node:assert/strict";
import test from "node:test";

import { __resetCartStoreForTests, __setCartForUserForTests } from "../cart/cart-store.js";
import { saveProfile } from "../identity/auth-service.js";
import { createUser, USER_ROLES } from "../identity/user-store.js";
import { __resetOrderStoreForTests, listOrdersByUserId } from "./order-store.js";
import {
  getOrderPaymentStatus,
  placeOrder,
  reconcilePaymentCallback,
  retryOrderPayment,
} from "./order-service.js";
import {
  __resetPaymentStoreForTests,
  listPaymentTransactionsByOrderId,
} from "../payment/payment-store.js";

async function seedCustomer(profile) {
  const created = await createUser({
    email: `order-${Date.now()}-${Math.random()}@example.com`,
    passwordHash: "hash",
    role: USER_ROLES.CUSTOMER,
  });

  assert.equal(created.success, true);
  await saveProfile(created.user.id, profile);
  return created.user.id;
}

test("placeOrder tạo đơn + transaction online", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const userId = await seedCustomer({
    fullName: "Order Online",
    phone: "+84901111111",
    addresses: ["1 Nguyen Trai"],
  });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 2, addedAt: Date.now() }],
  });

  const result = await placeOrder({
    userId,
    address: "1 Nguyen Trai",
    shippingMethod: "express",
    note: "giao nhanh",
    paymentMethod: "online",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.order.status, "pending_payment");
  assert.equal(result.data.payment.method, "online");
  assert.equal(result.data.payment.status, "pending_gateway");
  assert.equal(typeof result.data.payment.checkoutUrl, "string");

  const orders = await listOrdersByUserId(userId);
  assert.equal(orders.length, 1);
  assert.equal(orders[0].id, result.data.order.id);

  const tx = await listPaymentTransactionsByOrderId(result.data.order.id);
  assert.equal(tx.length, 1);
  assert.equal(tx[0].orderId, result.data.order.id);
  assert.equal(tx[0].method, "online");
});

test("placeOrder tạo đơn + transaction COD", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const userId = await seedCustomer({
    fullName: "Order COD",
    phone: "+84902222222",
    addresses: ["2 Le Loi"],
  });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const result = await placeOrder({
    userId,
    address: "2 Le Loi",
    shippingMethod: "standard",
    note: "",
    paymentMethod: "cod",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.order.status, "confirmed_cod");
  assert.equal(result.data.payment.method, "cod");
  assert.equal(result.data.payment.status, "pending_cod_confirmation");
  assert.equal(result.data.payment.checkoutUrl, null);

  const tx = await listPaymentTransactionsByOrderId(result.data.order.id);
  assert.equal(tx.length, 1);
  assert.equal(tx[0].method, "cod");
});

test("placeOrder chặn cart invalid", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const userId = await seedCustomer({
    fullName: "Order Invalid",
    phone: "+84903333333",
    addresses: ["3 Tran Hung Dao"],
  });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-den", variantId: "l-den", quantity: 1, addedAt: Date.now() }],
  });

  const result = await placeOrder({
    userId,
    address: "3 Tran Hung Dao",
    shippingMethod: "standard",
    note: "",
    paymentMethod: "online",
  });

  assert.equal(result.success, false);
  assert.equal(result.code, "CHECKOUT_CART_INVALID");
});

test("reconcilePaymentCallback cập nhật order sang paid", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const userId = await seedCustomer({
    fullName: "Order Callback",
    phone: "+84904444444",
    addresses: ["4 Le Lai"],
  });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const placed = await placeOrder({
    userId,
    address: "4 Le Lai",
    shippingMethod: "express",
    note: "",
    paymentMethod: "online",
  });

  const reconciled = await reconcilePaymentCallback({
    orderId: placed.data.order.id,
    providerReference: placed.data.payment.providerReference,
    status: "success",
    eventTime: new Date().toISOString(),
    idempotencyKey: "order-reconcile-success-1",
  });

  assert.equal(reconciled.success, true);
  assert.equal(reconciled.data.order.status, "paid");
  assert.equal(reconciled.data.payment.status, "paid");
});

test("reconcilePaymentCallback xử lý pending trước rồi success sau", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const userId = await seedCustomer({
    fullName: "Order Pending To Success",
    phone: "+84907777777",
    addresses: ["7 Hai Ba Trung"],
  });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const placed = await placeOrder({
    userId,
    address: "7 Hai Ba Trung",
    shippingMethod: "standard",
    note: "",
    paymentMethod: "online",
  });

  const pendingResult = await reconcilePaymentCallback({
    orderId: placed.data.order.id,
    providerReference: placed.data.payment.providerReference,
    status: "pending",
    eventTime: new Date(Date.now() - 1000).toISOString(),
    idempotencyKey: "order-reconcile-pending-1",
  });

  assert.equal(pendingResult.success, true);
  assert.equal(pendingResult.data.order.status, "pending_verification");
  assert.equal(pendingResult.data.payment.status, "pending_verification");

  const successResult = await reconcilePaymentCallback({
    orderId: placed.data.order.id,
    providerReference: placed.data.payment.providerReference,
    status: "success",
    eventTime: new Date().toISOString(),
    idempotencyKey: "order-reconcile-success-2",
  });

  assert.equal(successResult.success, true);
  assert.equal(successResult.data.order.status, "paid");
  assert.equal(successResult.data.payment.status, "paid");
});

test("getOrderPaymentStatus trả nextAction retry khi failed", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const userId = await seedCustomer({
    fullName: "Order Status",
    phone: "+84905555555",
    addresses: ["5 Nguyen Hue"],
  });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const placed = await placeOrder({
    userId,
    address: "5 Nguyen Hue",
    shippingMethod: "standard",
    note: "",
    paymentMethod: "online",
  });

  await reconcilePaymentCallback({
    orderId: placed.data.order.id,
    providerReference: placed.data.payment.providerReference,
    status: "failed",
    eventTime: new Date().toISOString(),
    idempotencyKey: "order-reconcile-failed-1",
  });

  const status = await getOrderPaymentStatus({
    orderId: placed.data.order.id,
    userId,
  });

  assert.equal(status.success, true);
  assert.equal(status.data.orderStatus, "payment_failed");
  assert.equal(status.data.nextAction, "retry_payment");
});

test("retryOrderPayment tạo transaction mới", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const userId = await seedCustomer({
    fullName: "Order Retry",
    phone: "+84906666666",
    addresses: ["6 Ly Tu Trong"],
  });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const placed = await placeOrder({
    userId,
    address: "6 Ly Tu Trong",
    shippingMethod: "express",
    note: "",
    paymentMethod: "online",
  });

  await reconcilePaymentCallback({
    orderId: placed.data.order.id,
    providerReference: placed.data.payment.providerReference,
    status: "failed",
    eventTime: new Date().toISOString(),
    idempotencyKey: "order-retry-failed-1",
  });

  const retried = await retryOrderPayment({
    orderId: placed.data.order.id,
    userId,
  });

  assert.equal(retried.success, true);
  assert.equal(retried.data.order.status, "pending_payment");
  assert.equal(retried.data.payment.status, "pending_gateway");

  const transactions = await listPaymentTransactionsByOrderId(placed.data.order.id);
  assert.equal(transactions.length, 2);
});
