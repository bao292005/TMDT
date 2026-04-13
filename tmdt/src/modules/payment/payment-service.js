import { randomUUID } from "node:crypto";

import { initializeOnlinePayment } from "../integrations/payment/payment-adapter.js";
import {
  createPaymentTransaction,
  findLatestPaymentTransactionByOrderId,
  findPaymentTransactionByProviderReference,
  updatePaymentTransactionById,
} from "./payment-store.js";

export const PAYMENT_METHODS = {
  ONLINE: "online",
  COD: "cod",
};

const CALLBACK_STATUS_TO_PAYMENT_STATUS = {
  success: "paid",
  pending: "pending_verification",
  failed: "failed",
};

function normalizeCallbackStatus(status) {
  const normalized = typeof status === "string" ? status.trim().toLowerCase() : "";
  return CALLBACK_STATUS_TO_PAYMENT_STATUS[normalized] ?? null;
}

function getProcessedIdempotencyKeys(transaction) {
  if (Array.isArray(transaction.processedIdempotencyKeys)) {
    return transaction.processedIdempotencyKeys;
  }
  if (transaction.lastIdempotencyKey) {
    return [transaction.lastIdempotencyKey];
  }
  return [];
}

function hasProcessedIdempotencyKey(transaction, idempotencyKey) {
  if (!idempotencyKey) return false;
  return getProcessedIdempotencyKeys(transaction).includes(idempotencyKey);
}

function withIdempotencyKey(transaction, idempotencyKey) {
  const existing = getProcessedIdempotencyKeys(transaction);

  if (!idempotencyKey || existing.includes(idempotencyKey)) {
    return {
      processedIdempotencyKeys: existing,
      lastIdempotencyKey: idempotencyKey ?? transaction.lastIdempotencyKey ?? null,
    };
  }

  return {
    processedIdempotencyKeys: [...existing, idempotencyKey],
    lastIdempotencyKey: idempotencyKey,
  };
}

function buildOnlineTransaction({ orderId, amount, initialized, retryOfTransactionId = null }) {
  return {
    id: randomUUID(),
    orderId,
    method: PAYMENT_METHODS.ONLINE,
    status: "pending_gateway",
    amount,
    provider: initialized.provider,
    providerReference: initialized.providerReference,
    checkoutUrl: initialized.checkoutUrl,
    retryOfTransactionId,
    processedIdempotencyKeys: [],
    lastIdempotencyKey: null,
    createdAt: new Date().toISOString(),
  };
}

export async function initializePaymentForOrder({ orderId, amount, paymentMethod }) {
  if (paymentMethod === PAYMENT_METHODS.COD) {
    const transaction = {
      id: randomUUID(),
      orderId,
      method: PAYMENT_METHODS.COD,
      status: "pending_cod_confirmation",
      amount,
      provider: "cod",
      providerReference: null,
      checkoutUrl: null,
      retryOfTransactionId: null,
      processedIdempotencyKeys: [],
      lastIdempotencyKey: null,
      createdAt: new Date().toISOString(),
    };

    await createPaymentTransaction(transaction);
    return {
      success: true,
      data: transaction,
    };
  }

  if (paymentMethod === PAYMENT_METHODS.ONLINE) {
    const initialized = await initializeOnlinePayment({ orderId, amount });
    if (!initialized.success) {
      return {
        success: false,
        code: "PAYMENT_INITIALIZATION_FAILED",
        message: "Không thể khởi tạo giao dịch thanh toán online.",
      };
    }

    const transaction = buildOnlineTransaction({ orderId, amount, initialized });
    await createPaymentTransaction(transaction);
    return {
      success: true,
      data: transaction,
    };
  }

  return {
    success: false,
    code: "PAYMENT_METHOD_INVALID",
    message: "Phương thức thanh toán không hợp lệ.",
  };
}

export async function processPaymentCallback({
  orderId,
  providerReference,
  status,
  eventTime,
  idempotencyKey,
}) {
  const paymentStatus = normalizeCallbackStatus(status);
  if (!paymentStatus) {
    return {
      success: false,
      code: "PAYMENT_CALLBACK_INVALID_STATUS",
      message: "Trạng thái callback payment không hợp lệ.",
    };
  }

  const target = await findPaymentTransactionByProviderReference(providerReference);

  if (!target || target.orderId !== orderId) {
    return {
      success: false,
      code: "PAYMENT_TRANSACTION_NOT_FOUND",
      message: "Không tìm thấy giao dịch thanh toán cho callback.",
    };
  }

  if (hasProcessedIdempotencyKey(target, idempotencyKey)) {
    return {
      success: true,
      data: {
        transaction: target,
        idempotent: true,
      },
    };
  }

  const idempotency = withIdempotencyKey(target, idempotencyKey);
  const updated = await updatePaymentTransactionById(target.id, {
    status: paymentStatus,
    callbackEventTime: typeof eventTime === "string" ? eventTime : null,
    callbackReceivedAt: new Date().toISOString(),
    ...idempotency,
    updatedAt: new Date().toISOString(),
  });

  return {
    success: true,
    data: {
      transaction: updated,
      idempotent: false,
    },
  };
}

export async function getPaymentStatusForOrder(orderId) {
  const transaction = await findLatestPaymentTransactionByOrderId(orderId);
  if (!transaction) {
    return {
      success: false,
      code: "PAYMENT_TRANSACTION_NOT_FOUND",
      message: "Không tìm thấy giao dịch thanh toán cho đơn hàng.",
    };
  }

  return {
    success: true,
    data: transaction,
  };
}

export async function retryPaymentForOrder(order) {
  const latest = await findLatestPaymentTransactionByOrderId(order.id);
  if (!latest) {
    return {
      success: false,
      code: "PAYMENT_TRANSACTION_NOT_FOUND",
      message: "Không tìm thấy giao dịch để thực hiện retry.",
    };
  }

  if (latest.method !== PAYMENT_METHODS.ONLINE || latest.status !== "failed") {
    return {
      success: false,
      code: "PAYMENT_RETRY_NOT_ALLOWED",
      message: "Giao dịch hiện tại không hỗ trợ thanh toán lại.",
    };
  }

  const initialized = await initializeOnlinePayment({
    orderId: order.id,
    amount: order.pricing.total,
  });

  if (!initialized.success) {
    return {
      success: false,
      code: "PAYMENT_INITIALIZATION_FAILED",
      message: "Không thể khởi tạo giao dịch retry.",
    };
  }

  const transaction = buildOnlineTransaction({
    orderId: order.id,
    amount: order.pricing.total,
    initialized,
    retryOfTransactionId: latest.id,
  });

  await createPaymentTransaction(transaction);

  return {
    success: true,
    data: transaction,
  };
}
