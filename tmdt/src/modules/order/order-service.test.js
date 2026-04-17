import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { __resetCartStoreForTests, __setCartForUserForTests } from "../cart/cart-store.js";
import { saveProfile } from "../identity/auth-service.js";
import { __resetAuditLogStoreForTests, listAuditLogs } from "../identity/audit-log-store.js";
import { createUser, USER_ROLES } from "../identity/user-store.js";
import { __resetOrderStoreForTests, listOrdersByUserId, updateOrderById } from "./order-store.js";
import {
  getCustomerOrderDetail,
  getOrderPaymentStatus,
  listCustomerOrders,
  placeOrder,
  reconcilePaymentCallback,
  retryOrderPayment,
  updateOrderStatusByAdmin,
  getAdminDashboardKpis,
  getAdminOrderExceptions,
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
  assert.equal(status.data.stateLabel, "Thanh toán thất bại");
  assert.equal(status.data.stateSource, "callback_event_time");
  assert.match(status.data.stateTimestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  assert.equal(status.data.nextActionLabel, "Thanh toán lại");
  assert.equal(
    status.data.nextActionGuidance,
    "Giao dịch trước đó thất bại. Vui lòng tạo giao dịch mới để hoàn tất thanh toán.",
  );
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

test("listCustomerOrders trả danh sách theo user hiện tại", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const userA = await seedCustomer({
    fullName: "List A",
    phone: "+84908888888",
    addresses: ["8 Cach Mang Thang Tam"],
  });
  const userB = await seedCustomer({
    fullName: "List B",
    phone: "+84909999999",
    addresses: ["9 Vo Van Tan"],
  });

  await __setCartForUserForTests(userA, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });
  await placeOrder({
    userId: userA,
    address: "8 Cach Mang Thang Tam",
    shippingMethod: "standard",
    note: "",
    paymentMethod: "cod",
  });

  await __setCartForUserForTests(userB, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });
  await placeOrder({
    userId: userB,
    address: "9 Vo Van Tan",
    shippingMethod: "standard",
    note: "",
    paymentMethod: "cod",
  });

  const listed = await listCustomerOrders({ userId: userA });
  assert.equal(listed.success, true);
  assert.equal(Array.isArray(listed.data.orders), true);
  assert.equal(listed.data.orders.length, 1);
  assert.equal(typeof listed.data.orders[0].id, "string");
  assert.equal(listed.data.orders[0].status, "confirmed_cod");
  assert.equal(listed.data.orders[0].payment?.status, "pending_cod_confirmation");
});

test("getCustomerOrderDetail chặn truy cập cross-user", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const ownerId = await seedCustomer({
    fullName: "Owner",
    phone: "+84901231231",
    addresses: ["10 Nguyen Hue"],
  });
  const attackerId = await seedCustomer({
    fullName: "Attacker",
    phone: "+84904564564",
    addresses: ["11 Le Loi"],
  });

  await __setCartForUserForTests(ownerId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });
  const placed = await placeOrder({
    userId: ownerId,
    address: "10 Nguyen Hue",
    shippingMethod: "express",
    note: "",
    paymentMethod: "online",
  });

  const forbidden = await getCustomerOrderDetail({
    orderId: placed.data.order.id,
    userId: attackerId,
  });

  assert.equal(forbidden.success, false);
  assert.equal(forbidden.code, "ORDER_FORBIDDEN");
});

test("getCustomerOrderDetail giữ safe state và bật degraded khi shipping provider timeout", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const userId = await seedCustomer({
    fullName: "Shipping Degraded",
    phone: "+84901112222",
    addresses: ["12 Nguyen Du"],
  });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const placed = await placeOrder({
    userId,
    address: "12 Nguyen Du",
    shippingMethod: "express",
    note: "",
    paymentMethod: "online",
  });

  await updateOrderById(placed.data.order.id, {
    status: "shipped",
    trackingNumber: "TRK-TIMEOUT-001",
    shippedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await __resetAuditLogStoreForTests();
  const detail = await getCustomerOrderDetail({
    orderId: placed.data.order.id,
    userId,
    correlationId: "corr-shipping-timeout",
  });

  assert.equal(detail.success, true);
  assert.equal(detail.data.tracking.status, "shipped");
  assert.equal(detail.data.tracking.isDegraded, true);
  assert.equal(detail.data.tracking.degradedReason, "SHIPPING_TIMEOUT");
  assert.equal(detail.data.tracking.retryable, true);
  assert.equal(detail.data.tracking.nextAction, "refresh_status");
  assert.equal(typeof detail.data.tracking.lastSyncedAt, "string");

  const logs = await listAuditLogs();
  const fallbackEvent = logs.find((entry) => entry.action === "FALLBACK_ACTIVATED" && entry.metadata?.source === "shipping");
  assert.ok(fallbackEvent);
  assert.equal(fallbackEvent.correlationId, "corr-shipping-timeout");
  assert.equal(fallbackEvent.metadata?.reason, "SHIPPING_TIMEOUT");
});

test("getCustomerOrderDetail trả contact_support khi shipping degraded non-retryable", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const userId = await seedCustomer({
    fullName: "Shipping Non Retryable",
    phone: "+84902223333",
    addresses: ["13bis Le Thanh Ton"],
  });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const placed = await placeOrder({
    userId,
    address: "13bis Le Thanh Ton",
    shippingMethod: "express",
    note: "",
    paymentMethod: "online",
  });

  await updateOrderById(placed.data.order.id, {
    status: "shipped",
    trackingNumber: "TRK-INVALID-002",
    shippedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const detail = await getCustomerOrderDetail({ orderId: placed.data.order.id, userId });

  assert.equal(detail.success, true);
  assert.equal(detail.data.tracking.isDegraded, true);
  assert.equal(detail.data.tracking.degradedReason, "SHIPPING_INVALID_TRACKING");
  assert.equal(detail.data.tracking.retryable, false);
  assert.equal(detail.data.tracking.nextAction, "contact_support");
});

test("getCustomerOrderDetail đồng bộ shipping thành công khi provider phản hồi", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const userId = await seedCustomer({
    fullName: "Shipping Synced",
    phone: "+84903334444",
    addresses: ["13 Le Thanh Ton"],
  });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const placed = await placeOrder({
    userId,
    address: "13 Le Thanh Ton",
    shippingMethod: "express",
    note: "",
    paymentMethod: "online",
  });

  await updateOrderById(placed.data.order.id, {
    status: "shipped",
    trackingNumber: "TRK-DELV-002",
    shippedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const detail = await getCustomerOrderDetail({ orderId: placed.data.order.id, userId });

  assert.equal(detail.success, true);
  assert.equal(detail.data.tracking.isDegraded, false);
  assert.equal(detail.data.tracking.status, "delivered");
  assert.equal(detail.data.tracking.nextAction, "none");
  assert.equal(typeof detail.data.tracking.lastSyncedAt, "string");
});

test("updateOrderStatusByAdmin cập nhật trạng thái hợp lệ và ghi audit", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();
  await __resetAuditLogStoreForTests();

  const userId = await seedCustomer({
    fullName: "Admin Transition",
    phone: "+84906667777",
    addresses: ["14 Le Duan"],
  });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const placed = await placeOrder({
    userId,
    address: "14 Le Duan",
    shippingMethod: "standard",
    note: "",
    paymentMethod: "cod",
  });

  const updated = await updateOrderStatusByAdmin({
    orderId: placed.data.order.id,
    nextStatus: "processing",
    actorId: "admin-1",
    correlationId: "corr-admin-order-1",
    reason: "duyệt xử lý kho",
  });

  assert.equal(updated.success, true);
  assert.equal(updated.data.idempotent, false);
  assert.equal(updated.data.order.status, "processing");

  const logs = await listAuditLogs();
  const targetLog = logs.find((entry) => entry.action === "ADMIN_UPDATE_ORDER_STATUS");
  assert.ok(targetLog);
  assert.equal(targetLog.actorId, "admin-1");
  assert.equal(targetLog.orderId, placed.data.order.id);
  assert.equal(targetLog.beforeStatus, "confirmed_cod");
  assert.equal(targetLog.afterStatus, "processing");
  assert.equal(targetLog.correlationId, "corr-admin-order-1");
});

test("updateOrderStatusByAdmin chặn transition không hợp lệ", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const userId = await seedCustomer({
    fullName: "Admin Invalid Transition",
    phone: "+84908889999",
    addresses: ["15 Pasteur"],
  });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const placed = await placeOrder({
    userId,
    address: "15 Pasteur",
    shippingMethod: "standard",
    note: "",
    paymentMethod: "cod",
  });

  const blocked = await updateOrderStatusByAdmin({
    orderId: placed.data.order.id,
    nextStatus: "delivered",
    actorId: "admin-1",
    correlationId: "corr-admin-order-2",
  });

  assert.equal(blocked.success, false);
  assert.equal(blocked.code, "ORDER_INVALID_STATE_TRANSITION");
  assert.equal(blocked.data.from, "confirmed_cod");
  assert.equal(blocked.data.to, "delivered");
});

test("updateOrderStatusByAdmin idempotent khi trạng thái không đổi", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const userId = await seedCustomer({
    fullName: "Admin Idempotent",
    phone: "+84907778888",
    addresses: ["16 Dien Bien Phu"],
  });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const placed = await placeOrder({
    userId,
    address: "16 Dien Bien Phu",
    shippingMethod: "standard",
    note: "",
    paymentMethod: "cod",
  });

  const same = await updateOrderStatusByAdmin({
    orderId: placed.data.order.id,
    nextStatus: "confirmed_cod",
    actorId: "admin-1",
    correlationId: "corr-admin-order-3",
  });

  assert.equal(same.success, true);
  assert.equal(same.data.idempotent, true);
  assert.equal(same.data.order.status, "confirmed_cod");
});

test("updateOrderStatusByAdmin trả lỗi ORDER_INVALID_INPUT khi input không hợp lệ", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();

  const invalidOrderId = await updateOrderStatusByAdmin({
    orderId: "",
    nextStatus: "processing",
    actorId: "admin-1",
    correlationId: "corr-invalid-input-1",
  });

  const invalidStatus = await updateOrderStatusByAdmin({
    orderId: "order-1",
    nextStatus: "",
    actorId: "admin-1",
    correlationId: "corr-invalid-input-2",
  });

  assert.equal(invalidOrderId.success, false);
  assert.equal(invalidOrderId.code, "ORDER_INVALID_INPUT");
  assert.equal(invalidStatus.success, false);
  assert.equal(invalidStatus.code, "ORDER_INVALID_INPUT");
});

test("updateOrderStatusByAdmin trả lỗi ORDER_NOT_FOUND khi không tìm thấy đơn", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();

  const missing = await updateOrderStatusByAdmin({
    orderId: "missing-order-id",
    nextStatus: "processing",
    actorId: "admin-1",
    correlationId: "corr-not-found",
  });

  assert.equal(missing.success, false);
  assert.equal(missing.code, "ORDER_NOT_FOUND");
});

test("updateOrderStatusByAdmin rollback khi audit log lỗi", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();
  await __resetAuditLogStoreForTests();

  const userId = await seedCustomer({
    fullName: "Admin Audit Failure",
    phone: "+84906661111",
    addresses: ["17 Nguyen Dinh Chieu"],
  });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const placed = await placeOrder({
    userId,
    address: "17 Nguyen Dinh Chieu",
    shippingMethod: "standard",
    note: "",
    paymentMethod: "cod",
  });

  const testDataDirectory =
    process.env.NODE_ENV === "test"
      ? path.join(process.cwd(), ".data", `test-${process.pid}`)
      : path.join(process.cwd(), ".data");
  const auditLogsFile = path.join(testDataDirectory, "audit-logs.json");
  await writeFile(auditLogsFile, "{}", "utf8");

  const updated = await updateOrderStatusByAdmin({
    orderId: placed.data.order.id,
    nextStatus: "processing",
    actorId: "admin-1",
    correlationId: "corr-audit-failed",
  });

  assert.equal(updated.success, false);
  assert.equal(updated.code, "ORDER_AUDIT_LOG_FAILED");

  const orders = await listOrdersByUserId(userId);
  assert.equal(orders[0].status, "confirmed_cod");
});

test("getAdminDashboardKpis calculates full KPI set", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();
  await __resetAuditLogStoreForTests();

  const userId = await seedCustomer({ fullName: "KPI User", phone: "+84901111111", addresses: ["1 Nguyen Trai"] });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 2, addedAt: Date.now() }],
  });

  const placed1 = await placeOrder({ userId, address: "1 Nguyen Trai", shippingMethod: "standard", note: "", paymentMethod: "cod" });
  const toProcessing = await updateOrderStatusByAdmin({
    orderId: placed1.data.order.id,
    nextStatus: "processing",
    actorId: "a",
    correlationId: "c1",
  });
  const toShipped = await updateOrderStatusByAdmin({
    orderId: placed1.data.order.id,
    nextStatus: "shipped",
    actorId: "a",
    correlationId: "c2",
  });
  const toDelivered = await updateOrderStatusByAdmin({
    orderId: placed1.data.order.id,
    nextStatus: "delivered",
    actorId: "a",
    correlationId: "c3",
  });
  assert.equal(toProcessing.success, true);
  assert.equal(toShipped.success, true);
  assert.equal(toDelivered.success, true);

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const placed2 = await placeOrder({ userId, address: "1 Nguyen Trai", shippingMethod: "standard", note: "", paymentMethod: "online" });
  const toCancelled = await updateOrderStatusByAdmin({
    orderId: placed2.data.order.id,
    nextStatus: "cancelled",
    actorId: "a",
    correlationId: "c4",
  });
  assert.equal(toCancelled.success, true);

  const kpis = await getAdminDashboardKpis({ timeRange: "all" });
  assert.equal(kpis.success, true);
  assert.equal(kpis.data.totalOrders, 2);
  assert.equal(kpis.data.totalRevenue, placed1.data.order.pricing.total);
  assert.equal(kpis.data.aov, placed1.data.order.pricing.total);
  assert.equal(kpis.data.returnRate, 0.5);
  assert.equal(kpis.data.successfulPaymentRate, 0.5);
});

test("getAdminDashboardKpis filter theo timeRange today/7days/30days", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const userId = await seedCustomer({ fullName: "KPI Timerange", phone: "+84901112233", addresses: ["18 Tran Cao Van"] });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });
  const todayOrder = await placeOrder({ userId, address: "18 Tran Cao Van", shippingMethod: "standard", note: "", paymentMethod: "cod" });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });
  const withinWeekOrder = await placeOrder({ userId, address: "18 Tran Cao Van", shippingMethod: "standard", note: "", paymentMethod: "cod" });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });
  const olderOrder = await placeOrder({ userId, address: "18 Tran Cao Van", shippingMethod: "standard", note: "", paymentMethod: "cod" });

  const now = Date.now();
  await updateOrderById(todayOrder.data.order.id, {
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  });
  await updateOrderById(withinWeekOrder.data.order.id, {
    createdAt: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
  });
  await updateOrderById(olderOrder.data.order.id, {
    createdAt: new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const todayKpis = await getAdminDashboardKpis({ timeRange: "today" });
  const sevenDaysKpis = await getAdminDashboardKpis({ timeRange: "7days" });
  const thirtyDaysKpis = await getAdminDashboardKpis({ timeRange: "30days" });

  assert.equal(todayKpis.success, true);
  assert.equal(todayKpis.data.totalOrders, 1);
  assert.equal(sevenDaysKpis.success, true);
  assert.equal(sevenDaysKpis.data.totalOrders, 2);
  assert.equal(thirtyDaysKpis.success, true);
  assert.equal(thirtyDaysKpis.data.totalOrders, 2);
});

test("getAdminOrderExceptions lists exceptions", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  await __resetOrderStoreForTests();
  await __resetPaymentStoreForTests();

  const userId = await seedCustomer({ fullName: "Exc User", phone: "+84901111111", addresses: ["1 Nguyen Trai"] });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const placed = await placeOrder({ userId, address: "1 Nguyen Trai", shippingMethod: "standard", note: "", paymentMethod: "online" });
  await reconcilePaymentCallback({
    orderId: placed.data.order.id,
    providerReference: placed.data.payment.providerReference,
    status: "failed",
    eventTime: new Date().toISOString(),
    idempotencyKey: "exceptions-failed-callback-1",
  });

  const exceptions = await getAdminOrderExceptions();
  assert.equal(exceptions.success, true);
  assert.equal(exceptions.data.orders.length, 1);
  assert.equal(exceptions.data.orders[0].id, placed.data.order.id);
});
