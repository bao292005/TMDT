import { randomUUID } from "node:crypto";

import { clearCartByUserId } from "../cart/cart-store.js";
import { appendAuditLog, appendFallbackAuditEvent } from "../identity/audit-log-store.js";
import { buildCheckoutDraft } from "../checkout/checkout-service.js";
import {
  findOrderById,
  createOrder,
  listOrders,
  listOrdersByUserId,
  updateOrderById,
} from "./order-store.js";
import {
  getPaymentStatusForOrder,
  initializePaymentForOrder,
  processPaymentCallback,
  retryPaymentForOrder,
} from "../payment/payment-service.js";
import { fetchShippingTrackingStatus } from "../integrations/shipping/shipping-adapter.js";

function mapCheckoutError(result) {
  return {
    success: false,
    code: result.code,
    message: result.message,
    data: result.data,
  };
}

function buildOrderStatus(paymentMethod) {
  return paymentMethod === "cod" ? "confirmed_cod" : "pending_payment";
}

function mapPaymentStatusToOrderStatus(paymentStatus) {
  if (paymentStatus === "paid") return "paid";
  if (paymentStatus === "pending_verification" || paymentStatus === "pending_gateway") return "pending_verification";
  if (paymentStatus === "failed") return "payment_failed";
  return "pending_payment";
}

const ADMIN_ORDER_TRANSITIONS = {
  pending_payment: new Set(["pending_verification", "payment_failed", "paid", "cancelled"]),
  pending_verification: new Set(["paid", "payment_failed", "cancelled"]),
  payment_failed: new Set(["pending_payment", "cancelled"]),
  confirmed_cod: new Set(["processing", "cancelled"]),
  paid: new Set(["processing", "cancelled"]),
  processing: new Set(["shipped", "cancelled"]),
  shipped: new Set(["delivered"]),
  delivered: new Set(),
  cancelled: new Set(),
};

function canTransitionOrderByAdmin(fromStatus, toStatus) {
  return ADMIN_ORDER_TRANSITIONS[fromStatus]?.has(toStatus) ?? false;
}

function resolveNextAction(paymentStatus) {
  if (paymentStatus === "failed") {
    return "retry_payment";
  }

  if (paymentStatus === "pending_verification" || paymentStatus === "pending_gateway") {
    return "refresh_status";
  }

  return "none";
}

function resolveNextActionText(nextAction, paymentMethod) {
  if (nextAction === "retry_payment") {
    return {
      nextActionLabel: "Thanh toán lại",
      nextActionGuidance: "Giao dịch trước đó thất bại. Vui lòng tạo giao dịch mới để hoàn tất thanh toán.",
    };
  }

  if (nextAction === "refresh_status") {
    return {
      nextActionLabel: "Làm mới trạng thái",
      nextActionGuidance: "Hệ thống đang chờ xác nhận từ cổng thanh toán. Hãy làm mới để nhận trạng thái mới nhất.",
    };
  }

  if (paymentMethod === "cod") {
    return {
      nextActionLabel: "Không cần thao tác thêm",
      nextActionGuidance: "Đơn hàng COD sẽ thanh toán khi nhận hàng.",
    };
  }

  return {
    nextActionLabel: "Hoàn tất",
    nextActionGuidance: "Trạng thái thanh toán đã ổn định, bạn không cần thao tác thêm.",
  };
}

const placeOrderQueueByUser = new Map();
const orderQueue = new Map();

function runPlaceOrderQueue(userId, task) {
  const current = placeOrderQueueByUser.get(userId) ?? Promise.resolve();
  const next = current.then(task, task);
  placeOrderQueueByUser.set(
    userId,
    next.finally(() => {
      if (placeOrderQueueByUser.get(userId) === next) {
        placeOrderQueueByUser.delete(userId);
      }
    }),
  );
  return next;
}

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

export async function placeOrder({ userId, address, shippingMethod, note, paymentMethod, correlationId = null }) {
  return runPlaceOrderQueue(userId, async () => {
    const checkout = await buildCheckoutDraft({
      userId,
      address,
      shippingMethod,
      note,
    });

    if (!checkout.success) {
      return mapCheckoutError(checkout);
    }

    const order = {
      id: randomUUID(),
      userId,
      status: buildOrderStatus(paymentMethod),
      checkout: {
        selectedAddress: checkout.data.selectedAddress,
        selectedShippingMethod: checkout.data.selectedShippingMethod,
        note: checkout.data.note,
      },
      pricing: checkout.data.pricing,
      items: checkout.data.cart.items.map((item) => ({
        productSlug: item.productSlug,
        variantId: item.variantId,
        quantity: item.quantity,
        title: item.title,
        price: item.price,
      })),
      createdAt: new Date().toISOString(),
    };

    const payment = await initializePaymentForOrder({
      orderId: order.id,
      amount: checkout.data.pricing.total,
      paymentMethod,
      correlationId,
    });

    if (!payment.success) {
      return payment;
    }

    await createOrder(order);
    await clearCartByUserId(userId);

    return {
      success: true,
      data: {
        order,
        payment: payment.data,
      },
    };
  });
}

export async function reconcilePaymentCallback({ correlationId = null, ...payload }) {
  return runOrderQueue(payload.orderId, async () => {
    const callbackResult = await processPaymentCallback({
      ...payload,
      correlationId,
    });
    if (!callbackResult.success) {
      return callbackResult;
    }

    const order = await findOrderById(payload.orderId);
    if (!order) {
      return {
        success: false,
        code: "ORDER_NOT_FOUND",
        message: "Không tìm thấy đơn hàng tương ứng với callback.",
      };
    }

    const nextOrderStatus = mapPaymentStatusToOrderStatus(callbackResult.data.transaction.status);
    const updatedOrder = await updateOrderById(order.id, {
      status: nextOrderStatus,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      data: {
        order: updatedOrder,
        payment: callbackResult.data.transaction,
        idempotent: callbackResult.data.idempotent,
      },
    };
  });
}

export async function getOrderPaymentStatus({ orderId, userId }) {
  const order = await findOrderById(orderId);
  if (!order) {
    return {
      success: false,
      code: "ORDER_NOT_FOUND",
      message: "Không tìm thấy đơn hàng.",
    };
  }

  if (order.userId !== userId) {
    return {
      success: false,
      code: "ORDER_FORBIDDEN",
      message: "Bạn không có quyền truy cập đơn hàng này.",
    };
  }

  const payment = await getPaymentStatusForOrder(order.id);
  if (!payment.success) {
    return payment;
  }

  const orderStatus = mapPaymentStatusToOrderStatus(payment.data.status);
  const nextAction = resolveNextAction(payment.data.status);
  const { nextActionLabel, nextActionGuidance } = resolveNextActionText(nextAction, payment.data.method);

  return {
    success: true,
    data: {
      orderId: order.id,
      orderStatus,
      payment: payment.data,
      stateLabel: payment.data.stateLabel,
      stateTimestamp: payment.data.stateTimestamp,
      stateSource: payment.data.stateSource,
      nextAction,
      nextActionLabel,
      nextActionGuidance,
    },
  };
}

function sortOrdersByCreatedAtDesc(a, b) {
  const left = a.createdAt ?? "";
  const right = b.createdAt ?? "";
  return right.localeCompare(left);
}

async function buildOrderPaymentSummary(orderId) {
  const payment = await getPaymentStatusForOrder(orderId);
  if (!payment.success) {
    return {
      success: false,
      code: payment.code ?? "ORDER_PAYMENT_STATUS_UNAVAILABLE",
      message: payment.message ?? "Không thể tải trạng thái thanh toán của đơn hàng.",
      data: payment.data,
    };
  }

  return {
    success: true,
    data: {
      status: payment.data.status,
      method: payment.data.method,
      stateLabel: payment.data.stateLabel,
      stateTimestamp: payment.data.stateTimestamp,
      stateSource: payment.data.stateSource,
    },
  };
}

export async function listCustomerOrders({ userId }) {
  const orders = await listOrdersByUserId(userId);
  const sorted = [...orders].sort(sortOrdersByCreatedAtDesc);

  const items = [];
  for (const order of sorted) {
    const paymentSummary = await buildOrderPaymentSummary(order.id);
    if (!paymentSummary.success) {
      return paymentSummary;
    }

    items.push({
      id: order.id,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt ?? null,
      itemCount: Array.isArray(order.items) ? order.items.length : 0,
      pricing: order.pricing,
      payment: paymentSummary.data,
    });
  }

  return {
    success: true,
    data: {
      orders: items,
    },
  };
}

export async function listAdminOrders() {
  const orders = await listOrders();
  const sorted = [...orders].sort(sortOrdersByCreatedAtDesc);

  return {
    success: true,
    data: {
      orders: sorted.map((order) => ({
        id: order.id,
        userId: order.userId,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt ?? null,
        itemCount: Array.isArray(order.items) ? order.items.length : 0,
        pricing: order.pricing,
        allowedTransitions: [...(ADMIN_ORDER_TRANSITIONS[order.status] ?? [])],
      })),
    },
  };
}

function resolveTrackingStatusLabel(status) {
  if (status === "pending_payment") return "Chờ thanh toán";
  if (status === "pending_verification") return "Chờ xác nhận thanh toán";
  if (status === "payment_failed") return "Thanh toán thất bại";
  if (status === "confirmed_cod") return "Xác nhận đơn COD";
  if (status === "paid") return "Đã thanh toán";
  if (status === "processing") return "Kho đang xử lý";
  if (status === "shipped") return "Đang giao hàng";
  if (status === "delivered") return "Đã giao thành công";
  if (status === "cancelled" || status === "canceled") return "Đơn đã hủy";
  return `Trạng thái: ${status}`;
}

function resolveTrackingNextAction(status) {
  if (status === "pending_payment" || status === "payment_failed") {
    return "retry_payment";
  }

  if (status === "pending_verification" || status === "processing") {
    return "refresh_status";
  }

  if (status === "shipped") {
    return "track_shipment";
  }

  return "none";
}

function resolveTrackingTimestamp(order, paymentSummary) {
  if (paymentSummary?.stateTimestamp) {
    return paymentSummary.stateTimestamp;
  }

  return order.updatedAt ?? order.createdAt ?? null;
}

function resolveSyncedTrackingStatus(orderStatus, providerStatus) {
  if (providerStatus === "delivered") {
    return "delivered";
  }

  if (orderStatus === "delivered") {
    return "delivered";
  }

  return "shipped";
}

function normalizeTrackingNumber(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function canSyncShippingTracking(order) {
  return (order.status === "shipped" || order.status === "delivered") && Boolean(normalizeTrackingNumber(order.trackingNumber));
}

function resolveDegradedReason(error) {
  if (typeof error?.code === "string" && error.code.trim()) {
    return error.code;
  }

  return "SHIPPING_PROVIDER_UNAVAILABLE";
}

function resolveSafeTracking(order, paymentSummary) {
  const status = order.status;
  const timestamp = resolveTrackingTimestamp(order, paymentSummary);
  const statusLabel = resolveTrackingStatusLabel(status);

  return {
    status,
    statusLabel,
    timestamp,
  };
}

async function appendShippingDegradedAuditLog(orderId, currentStatus, degradedReason, retryable, correlationId) {
  await appendAuditLog({
    actorId: "system-shipping-sync",
    orderId,
    action: "shipping_tracking_degraded",
    beforeStatus: currentStatus,
    afterStatus: currentStatus,
    timestamp: new Date().toISOString(),
    correlationId: correlationId ?? null,
    metadata: {
      degradedReason,
      retryable,
    },
  });

  await appendFallbackAuditEvent({
    actorId: "system-shipping-sync",
    orderId,
    correlationId,
    source: "shipping",
    reason: degradedReason,
    actionTaken: retryable ? "fallback_safe_state_refresh" : "fallback_safe_state_contact_support",
    status: "activated",
    retryable,
    metadata: {
      lane: "tracking",
      safeStatus: currentStatus,
    },
  });
}

async function resolveTrackingData(order, paymentSummary, correlationId) {
  const trackingNumber = normalizeTrackingNumber(order.trackingNumber);
  const safeTracking = resolveSafeTracking(order, paymentSummary);

  if (!canSyncShippingTracking(order)) {
    const nextAction = resolveTrackingNextAction(safeTracking.status);
    return {
      ...safeTracking,
      nextAction,
      trackingNumber,
      isDegraded: false,
      degradedReason: null,
      lastSyncedAt: null,
      retryable: false,
      timeline: [
        {
          status: safeTracking.status,
          statusLabel: safeTracking.statusLabel,
          timestamp: safeTracking.timestamp,
          nextAction,
        },
      ],
    };
  }

  try {
    const provider = await fetchShippingTrackingStatus({
      orderId: order.id,
      trackingNumber,
      timeoutMs: 1_200,
    });

    const status = resolveSyncedTrackingStatus(safeTracking.status, provider.status);
    const timestamp = provider.timestamp ?? safeTracking.timestamp;
    const statusLabel = resolveTrackingStatusLabel(status);
    const nextAction = resolveTrackingNextAction(status);

    await appendFallbackAuditEvent({
      actorId: "system-shipping-sync",
      orderId: order.id,
      correlationId,
      source: "shipping",
      reason: "SHIPPING_SYNC_OK",
      actionTaken: "fallback_resolved_provider_synced",
      status: "recovered",
      retryable: false,
      metadata: {
        lane: "tracking",
        trackingNumber,
        providerStatus: provider.status,
      },
    });

    return {
      status,
      statusLabel,
      timestamp,
      nextAction,
      trackingNumber,
      isDegraded: false,
      degradedReason: null,
      lastSyncedAt: provider.syncedAt ?? new Date().toISOString(),
      retryable: false,
      timeline: [
        {
          status,
          statusLabel,
          timestamp,
          nextAction,
        },
      ],
    };
  } catch (error) {
    const degradedReason = resolveDegradedReason(error);
    const retryable = Boolean(error?.retryable);
    await appendShippingDegradedAuditLog(order.id, safeTracking.status, degradedReason, retryable, correlationId);

    const nextAction = retryable ? "refresh_status" : "contact_support";

    return {
      ...safeTracking,
      nextAction,
      trackingNumber,
      isDegraded: true,
      degradedReason,
      lastSyncedAt: new Date().toISOString(),
      retryable,
      timeline: [
        {
          status: safeTracking.status,
          statusLabel: safeTracking.statusLabel,
          timestamp: safeTracking.timestamp,
          nextAction,
        },
      ],
    };
  }
}

export async function getCustomerOrderDetail({ orderId, userId, correlationId = null }) {
  const order = await findOrderById(orderId);
  if (!order) {
    return {
      success: false,
      code: "ORDER_NOT_FOUND",
      message: "Không tìm thấy đơn hàng.",
    };
  }

  if (order.userId !== userId) {
    return {
      success: false,
      code: "ORDER_FORBIDDEN",
      message: "Bạn không có quyền truy cập đơn hàng này.",
    };
  }

  const paymentSummary = await buildOrderPaymentSummary(order.id);
  if (!paymentSummary.success) {
    return paymentSummary;
  }

  const tracking = await resolveTrackingData(order, paymentSummary.data, correlationId);

  return {
    success: true,
    data: {
      id: order.id,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt ?? null,
      checkout: order.checkout,
      pricing: order.pricing,
      items: order.items,
      payment: paymentSummary.data,
      tracking,
    },
  };
}

export async function retryOrderPayment({ orderId, userId, correlationId = null }) {
  return runOrderQueue(orderId, async () => {
    const order = await findOrderById(orderId);
    if (!order) {
      return {
        success: false,
        code: "ORDER_NOT_FOUND",
        message: "Không tìm thấy đơn hàng.",
      };
    }

    if (order.userId !== userId) {
      return {
        success: false,
        code: "ORDER_FORBIDDEN",
        message: "Bạn không có quyền thao tác với đơn hàng này.",
      };
    }

    const payment = await retryPaymentForOrder(order, { correlationId });
    if (!payment.success) {
      return payment;
    }

    const updatedOrder = await updateOrderById(order.id, {
      status: "pending_payment",
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      data: {
        order: updatedOrder,
        payment: payment.data,
      },
    };
  });
}

export async function updateOrderStatusByAdmin({
  orderId,
  nextStatus,
  actorId,
  correlationId,
  reason = null,
}) {
  if (!orderId || typeof orderId !== "string") {
    return {
      success: false,
      code: "ORDER_INVALID_INPUT",
      message: "orderId không hợp lệ.",
    };
  }

  if (!nextStatus || typeof nextStatus !== "string") {
    return {
      success: false,
      code: "ORDER_INVALID_INPUT",
      message: "Trạng thái đơn hàng không hợp lệ.",
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

    if (order.status === nextStatus) {
      return {
        success: true,
        data: {
          order,
          idempotent: true,
        },
      };
    }

    if (!canTransitionOrderByAdmin(order.status, nextStatus)) {
      return {
        success: false,
        code: "ORDER_INVALID_STATE_TRANSITION",
        message: "Không thể chuyển trạng thái đơn hàng theo yêu cầu.",
        data: {
          from: order.status,
          to: nextStatus,
        },
      };
    }

    const updatedOrder = await updateOrderById(orderId, {
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    });

    if (!updatedOrder) {
      return {
        success: false,
        code: "ORDER_NOT_FOUND",
        message: "Không tìm thấy đơn hàng để cập nhật.",
      };
    }

    try {
      await appendAuditLog({
        actorId,
        orderId,
        action: "ADMIN_UPDATE_ORDER_STATUS",
        beforeStatus: order.status,
        afterStatus: updatedOrder.status,
        reason,
        timestamp: new Date().toISOString(),
        correlationId: correlationId ?? null,
      });
    } catch {
      await updateOrderById(orderId, order);
      return {
        success: false,
        code: "ORDER_AUDIT_LOG_FAILED",
        message: "Không thể ghi audit log cập nhật trạng thái đơn hàng.",
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

export async function getAdminDashboardKpis({ timeRange = "all" }) {
  const orders = await listOrders();
  const now = new Date();
  
  let filteredOrders = orders;
  if (timeRange !== "all") {
    let daysToSubtract = 0;
    if (timeRange === "today") daysToSubtract = 1;
    else if (timeRange === "7days") daysToSubtract = 7;
    else if (timeRange === "30days") daysToSubtract = 30;
    
    if (daysToSubtract > 0) {
      const cutoff = new Date(now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
      filteredOrders = orders.filter(o => new Date(o.createdAt) >= cutoff);
    }
  }

  const totalOrders = filteredOrders.length;
  let totalRevenue = 0;
  let totalValidOrders = 0;
  let totalCancelledOrReturned = 0;
  let totalPaid = 0;

  for (const o of filteredOrders) {
    if (o.status !== "payment_failed" && o.status !== "cancelled") {
      totalRevenue += o.pricing?.total ?? 0;
      totalValidOrders++;
    }
    if (o.status === "cancelled" || o.status === "returned") {
      totalCancelledOrReturned++;
    }
    if (o.status === "paid" || o.status === "shipped" || o.status === "delivered") {
      totalPaid++;
    } else if (o.status === "confirmed_cod" || o.status === "processing") {
      // For success payment rate, should we count COD as successful payment? 
      // In ecommerce COD success payment means it's delivered. Let's just track 'successfulPaymentRate' 
      // essentially orders that are not failed.
    }
  }

  const aov = totalValidOrders > 0 ? Math.round(totalRevenue / totalValidOrders) : 0;
  const returnRate = totalOrders > 0 ? totalCancelledOrReturned / totalOrders : 0;
  // Let successful payment rate mean orders that progressed past pending/failed
  const successfulBase = filteredOrders.filter(o => o.status !== "pending_payment" && o.status !== "pending_verification").length;
  const successfulPaymentRate = successfulBase > 0 ? totalPaid / successfulBase : 0;

  return {
    success: true,
    data: {
      totalOrders,
      totalRevenue,
      aov,
      returnRate,
      successfulPaymentRate
    }
  };
}

export async function getAdminOrderExceptions() {
  const orders = await listOrders();
  const exceptionStatuses = new Set(["payment_failed", "cancelled"]);
  
  const exceptions = orders.filter(o => exceptionStatuses.has(o.status));
  const sorted = [...exceptions].sort(sortOrdersByCreatedAtDesc);

  return {
    success: true,
    data: {
      orders: sorted.map((order) => ({
        id: order.id,
        userId: order.userId,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt ?? null,
        itemCount: Array.isArray(order.items) ? order.items.length : 0,
        pricing: order.pricing,
        // Optional priority mapping based on status
        priority: order.status === "payment_failed" ? "High" : "Medium",
      })),
    },
  };
}
