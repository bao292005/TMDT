import assert from "node:assert/strict";
import test from "node:test";

import { createSession } from "../../../modules/identity/session-store.js";
import { createUser, USER_ROLES } from "../../../modules/identity/user-store.js";
import { __resetOrderStoreForTests, createOrder, findOrderById } from "../../../modules/order/order-store.js";
import { __resetAuditLogStoreForTests, listAuditLogs } from "../../../modules/identity/audit-log-store.js";
import { GET as getWarehouseQueue } from "./queue/route.js";
import { POST as postWarehouseAction } from "./actions/route.js";

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

async function createTokenByRole(role) {
  const created = await createUser({
    email: `warehouse-${role}-${Date.now()}-${Math.random()}@example.com`,
    passwordHash: "hash",
    role,
  });
  assert.equal(created.success, true);
  return createSession(created.user.id, role);
}

function baseOrder(overrides = {}) {
  return {
    id: overrides.id ?? `order-${Date.now()}-${Math.random()}`,
    userId: "customer-1",
    status: "paid",
    checkout: {},
    pricing: { total: 100000 },
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1 }],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

test("warehouse queue route chặn request chưa đăng nhập", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();

  const response = await getWarehouseQueue(createRequest("/api/warehouse/queue"));
  assert.equal(response.status, 401);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_UNAUTHORIZED");
});

test("warehouse queue route chặn role không phải warehouse", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();
  const customerToken = await createTokenByRole(USER_ROLES.CUSTOMER);

  const response = await getWarehouseQueue(createRequest("/api/warehouse/queue", { token: customerToken }));
  assert.equal(response.status, 403);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_FORBIDDEN");
});

test("warehouse queue route trả danh sách queue", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();
  const warehouseToken = await createTokenByRole(USER_ROLES.WAREHOUSE);

  await createOrder(
    baseOrder({
      id: "warehouse-order-1",
      status: "processing",
      pickedAt: "2026-04-14T08:10:00.000Z",
      packedAt: "2026-04-14T08:20:00.000Z",
    }),
  );

  const response = await getWarehouseQueue(createRequest("/api/warehouse/queue", { token: warehouseToken }));
  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(Array.isArray(payload.data.queue), true);
  assert.equal(payload.data.queue.length > 0, true);
});

test("warehouse actions route chặn request chưa đăng nhập", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();

  const response = await postWarehouseAction(
    createRequest("/api/warehouse/actions", { method: "POST", body: { orderId: "x", action: "pick" } }),
  );

  assert.equal(response.status, 401);
  assert.ok(response.headers.get("X-Correlation-Id"));
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_UNAUTHORIZED");
});

test("warehouse actions route chặn role không phải warehouse", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();
  const customerToken = await createTokenByRole(USER_ROLES.CUSTOMER);

  const response = await postWarehouseAction(
    createRequest("/api/warehouse/actions", {
      method: "POST",
      token: customerToken,
      body: { orderId: "warehouse-order-shipment", action: "pick" },
    }),
  );

  assert.equal(response.status, 403);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_FORBIDDEN");
});

test("warehouse actions route tạo shipment thành công", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();
  await __resetAuditLogStoreForTests();
  const warehouseToken = await createTokenByRole(USER_ROLES.WAREHOUSE);

  await createOrder(
    baseOrder({
      id: "warehouse-order-shipment",
      status: "processing",
      pickedAt: "2026-04-14T08:10:00.000Z",
      packedAt: "2026-04-14T08:20:00.000Z",
    }),
  );

  const response = await postWarehouseAction(
    createRequest("/api/warehouse/actions", {
      method: "POST",
      token: warehouseToken,
      body: { orderId: "warehouse-order-shipment", action: "create_shipment" },
    }),
  );

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.order.status, "shipped");
  assert.equal(typeof payload.data.order.trackingNumber, "string");

  const persisted = await findOrderById("warehouse-order-shipment");
  assert.equal(persisted.status, "shipped");
  assert.equal(typeof persisted.trackingNumber, "string");

  const logs = await listAuditLogs();
  assert.equal(logs.length, 1);
  assert.equal(logs[0].action, "create_shipment");
});
