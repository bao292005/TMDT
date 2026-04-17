import assert from "node:assert/strict";
import test from "node:test";

import { __resetAuditLogStoreForTests, listAuditLogs } from "../identity/audit-log-store.js";
import { __resetOrderStoreForTests, createOrder, findOrderById } from "../order/order-store.js";
import { WAREHOUSE_ACTIONS, listWarehouseQueue, performWarehouseAction } from "./warehouse-service.js";

function baseOrder(overrides = {}) {
  const id = overrides.id ?? `order-${Date.now()}-${Math.random()}`;
  return {
    id,
    userId: "customer-1",
    status: "paid",
    pricing: { total: 100000 },
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1 }],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

test("listWarehouseQueue trả queue task-first", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();

  await createOrder(
    baseOrder({
      id: "order-pick",
      status: "paid",
      createdAt: "2026-04-14T08:00:00.000Z",
    }),
  );
  await createOrder(
    baseOrder({
      id: "order-pack",
      status: "processing",
      pickedAt: "2026-04-14T08:10:00.000Z",
      createdAt: "2026-04-14T08:01:00.000Z",
    }),
  );
  await createOrder(
    baseOrder({
      id: "order-shipment",
      status: "processing",
      pickedAt: "2026-04-14T08:05:00.000Z",
      packedAt: "2026-04-14T08:20:00.000Z",
      createdAt: "2026-04-14T08:02:00.000Z",
    }),
  );

  const result = await listWarehouseQueue();
  assert.equal(result.success, true);
  assert.equal(result.data.queue.length, 3);
  assert.equal(result.data.queue[0].orderId, "order-shipment");
  assert.equal(result.data.queue[0].nextAction, WAREHOUSE_ACTIONS.CREATE_SHIPMENT);
  assert.equal(result.data.queue[1].orderId, "order-pack");
  assert.equal(result.data.queue[1].nextAction, WAREHOUSE_ACTIONS.PACK);
  assert.equal(result.data.queue[2].orderId, "order-pick");
  assert.equal(result.data.queue[2].nextAction, WAREHOUSE_ACTIONS.PICK);
});

test("performWarehouseAction chặn transition sai", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();
  await createOrder(baseOrder({ id: "order-invalid", status: "pending_payment" }));

  const result = await performWarehouseAction({
    orderId: "order-invalid",
    action: WAREHOUSE_ACTIONS.PACK,
    actorId: "warehouse-1",
    correlationId: "corr-invalid",
  });

  assert.equal(result.success, false);
  assert.equal(result.code, "ORDER_INVALID_STATE");
});

test("performWarehouseAction create shipment chặn đơn thiếu pickedAt", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();

  await createOrder(
    baseOrder({
      id: "order-shipment-missing-picked",
      status: "processing",
      packedAt: "2026-04-14T08:20:00.000Z",
    }),
  );

  const result = await performWarehouseAction({
    orderId: "order-shipment-missing-picked",
    action: WAREHOUSE_ACTIONS.CREATE_SHIPMENT,
    actorId: "warehouse-1",
    correlationId: "corr-missing-picked",
  });

  assert.equal(result.success, false);
  assert.equal(result.code, "ORDER_INVALID_STATE");
});

test("performWarehouseAction create shipment persist tracking + audit", { concurrency: false }, async () => {
  await __resetOrderStoreForTests();
  await __resetAuditLogStoreForTests();

  await createOrder(
    baseOrder({
      id: "order-ready-shipment",
      status: "processing",
      pickedAt: "2026-04-14T08:05:00.000Z",
      packedAt: "2026-04-14T08:20:00.000Z",
    }),
  );

  const result = await performWarehouseAction({
    orderId: "order-ready-shipment",
    action: WAREHOUSE_ACTIONS.CREATE_SHIPMENT,
    actorId: "warehouse-1",
    correlationId: "corr-shipment",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.order.status, "shipped");
  assert.equal(typeof result.data.order.trackingNumber, "string");
  assert.equal(result.data.order.trackingNumber.startsWith("TRK-"), true);

  const persisted = await findOrderById("order-ready-shipment");
  assert.equal(persisted.status, "shipped");
  assert.equal(persisted.trackingNumber, result.data.order.trackingNumber);

  const logs = await listAuditLogs();
  assert.equal(logs.length, 1);
  assert.equal(logs[0].actorId, "warehouse-1");
  assert.equal(logs[0].orderId, "order-ready-shipment");
  assert.equal(logs[0].action, WAREHOUSE_ACTIONS.CREATE_SHIPMENT);
  assert.equal(logs[0].beforeStatus, "processing");
  assert.equal(logs[0].afterStatus, "shipped");
});
