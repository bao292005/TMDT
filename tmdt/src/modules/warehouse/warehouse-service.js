import { randomUUID } from "node:crypto";

import { appendAuditLog } from "../identity/audit-log-store.js";
import { findOrderById, listOrders, updateOrderById } from "../order/order-store.js";

export const WAREHOUSE_ACTIONS = {
  PICK: "pick",
  PACK: "pack",
  CREATE_SHIPMENT: "create_shipment",
};

const orderQueue = new Map();

function runOrderQueue(orderId, task) {
  const current = orderQueue.get(orderId) ?? Promise.resolve();
  const next = current.then(task, task);
  orderQueue.set(
    orderId,
    next.finally(() => {
      if (orderQueue.get(orderId) === next) {
        orderQueue.delete(orderId);
      }
    }),
  );
  return next;
}

function toIsoNow() {
  return new Date().toISOString();
}

function normalizeTrackingNumber(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getNextWarehouseAction(order) {
  const trackingNumber = normalizeTrackingNumber(order.trackingNumber);
  if (order.status === "processing" && order.packedAt && !trackingNumber) {
    return WAREHOUSE_ACTIONS.CREATE_SHIPMENT;
  }

  if (order.status === "processing" && order.pickedAt && !order.packedAt) {
    return WAREHOUSE_ACTIONS.PACK;
  }

  if ((order.status === "paid" || order.status === "confirmed_cod") && !order.pickedAt) {
    return WAREHOUSE_ACTIONS.PICK;
  }

  return null;
}

function getQueuePriority(action) {
  if (action === WAREHOUSE_ACTIONS.CREATE_SHIPMENT) return 1;
  if (action === WAREHOUSE_ACTIONS.PACK) return 2;
  if (action === WAREHOUSE_ACTIONS.PICK) return 3;
  return 99;
}

function sortQueueItems(left, right) {
  if (left.priority !== right.priority) {
    return left.priority - right.priority;
  }

  const leftTime = left.createdAt ?? "";
  const rightTime = right.createdAt ?? "";
  return leftTime.localeCompare(rightTime);
}

function toQueueItem(order) {
  const nextAction = getNextWarehouseAction(order);
  if (!nextAction) {
    return null;
  }

  const trackingNumber = normalizeTrackingNumber(order.trackingNumber);

  return {
    orderId: order.id,
    status: order.status,
    createdAt: order.createdAt ?? null,
    updatedAt: order.updatedAt ?? null,
    nextAction,
    priority: getQueuePriority(nextAction),
    trackingNumber,
    itemCount: Array.isArray(order.items) ? order.items.length : 0,
  };
}

export async function listWarehouseQueue() {
  const orders = await listOrders();
  const queue = orders.map(toQueueItem).filter(Boolean).sort(sortQueueItems);

  return {
    success: true,
    data: {
      queue,
    },
  };
}

function resolveActionTransition(action, order) {
  const trackingNumber = normalizeTrackingNumber(order.trackingNumber);

  if (action === WAREHOUSE_ACTIONS.PICK) {
    if (order.status === "processing" && order.pickedAt) {
      return { idempotent: true, updates: null };
    }

    if (order.status !== "paid" && order.status !== "confirmed_cod") {
      return {
        error: {
          success: false,
          code: "ORDER_INVALID_STATE",
          message: "Đơn hàng không ở trạng thái hợp lệ để lấy hàng.",
          data: { from: order.status, action },
        },
      };
    }

    return {
      idempotent: false,
      updates: {
        status: "processing",
        pickedAt: toIsoNow(),
        updatedAt: toIsoNow(),
      },
    };
  }

  if (action === WAREHOUSE_ACTIONS.PACK) {
    if (order.status === "processing" && order.packedAt) {
      return { idempotent: true, updates: null };
    }

    if (order.status !== "processing" || !order.pickedAt) {
      return {
        error: {
          success: false,
          code: "ORDER_INVALID_STATE",
          message: "Đơn hàng không ở trạng thái hợp lệ để đóng gói.",
          data: { from: order.status, action },
        },
      };
    }

    return {
      idempotent: false,
      updates: {
        packedAt: toIsoNow(),
        updatedAt: toIsoNow(),
      },
    };
  }

  if (action === WAREHOUSE_ACTIONS.CREATE_SHIPMENT) {
    if (order.status === "shipped" && trackingNumber) {
      return { idempotent: true, updates: null };
    }

    if (order.status !== "processing" || !order.pickedAt || !order.packedAt) {
      return {
        error: {
          success: false,
          code: "ORDER_INVALID_STATE",
          message: "Đơn hàng không ở trạng thái hợp lệ để tạo vận đơn.",
          data: { from: order.status, action },
        },
      };
    }

    return {
      idempotent: false,
      updates: {
        status: "shipped",
        trackingNumber: `TRK-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`,
        shippedAt: toIsoNow(),
        updatedAt: toIsoNow(),
      },
    };
  }

  return {
    error: {
      success: false,
      code: "WAREHOUSE_ACTION_INVALID",
      message: "Thao tác kho không hợp lệ.",
    },
  };
}

async function appendWarehouseAuditLog({ actorId, orderId, action, beforeStatus, afterStatus, correlationId }) {
  await appendAuditLog({
    actorId,
    orderId,
    action,
    beforeStatus,
    afterStatus,
    timestamp: toIsoNow(),
    correlationId,
  });
}

export async function performWarehouseAction({ orderId, action, actorId, correlationId }) {
  if (!orderId || typeof orderId !== "string") {
    return {
      success: false,
      code: "ORDER_INVALID_INPUT",
      message: "orderId không hợp lệ.",
    };
  }

  if (!Object.values(WAREHOUSE_ACTIONS).includes(action)) {
    return {
      success: false,
      code: "WAREHOUSE_ACTION_INVALID",
      message: "Thao tác kho không hợp lệ.",
    };
  }

  return runOrderQueue(orderId, async () => {
    const order = await findOrderById(orderId);
    if (!order) {
      return {
        success: false,
        code: "ORDER_NOT_FOUND",
        message: "Không tìm thấy đơn hàng.",
      };
    }

    const transition = resolveActionTransition(action, order);
    if (transition.error) {
      return transition.error;
    }

    if (transition.idempotent) {
      return {
        success: true,
        data: {
          order,
          idempotent: true,
        },
      };
    }

    const updatedOrder = await updateOrderById(orderId, transition.updates);
    if (!updatedOrder) {
      return {
        success: false,
        code: "ORDER_NOT_FOUND",
        message: "Không tìm thấy đơn hàng để cập nhật.",
      };
    }

    try {
      await appendWarehouseAuditLog({
        actorId,
        orderId,
        action,
        beforeStatus: order.status,
        afterStatus: updatedOrder.status,
        correlationId: correlationId ?? null,
      });
    } catch {
      await updateOrderById(orderId, order);
      return {
        success: false,
        code: "ORDER_AUDIT_LOG_FAILED",
        message: "Không thể ghi audit log cho thao tác kho.",
      };
    }

    return {
      success: true,
      data: {
        order: updatedOrder,
        idempotent: false,
      },
    };
  });
}
