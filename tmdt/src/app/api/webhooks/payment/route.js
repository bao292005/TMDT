import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { reconcilePaymentCallback } from "../../../../modules/order/order-service.js";

function jsonWithCorrelation(body, status, correlationId) {
  return Response.json(body, {
    status,
    headers: {
      "X-Correlation-Id": correlationId,
    },
  });
}

function jsonSuccess(data, correlationId, status = 200) {
  return jsonWithCorrelation({ success: true, state: "success", data }, status, correlationId);
}

function jsonError(error, message, correlationId, status, data) {
  return jsonWithCorrelation(
    {
      success: false,
      state: "error",
      error,
      message,
      ...(data ? { data } : {}),
    },
    status,
    correlationId,
  );
}

function secureEquals(value, expected) {
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

function buildExpectedSignature(payloadText, secret) {
  return createHmac("sha256", secret).update(payloadText, "utf8").digest("hex");
}

function verifyWebhookSignature(signatureHeader, payloadText) {
  const provided = typeof signatureHeader === "string" ? signatureHeader.trim() : "";
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;

  if (!secret || !provided) {
    return false;
  }

  const expected = buildExpectedSignature(payloadText, secret);
  const normalizedProvided = provided.startsWith("sha256=") ? provided.slice("sha256=".length) : provided;
  return secureEquals(normalizedProvided, expected);
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { success: false, code: "PAYMENT_CALLBACK_INVALID_INPUT", message: "Payload callback không hợp lệ." };
  }

  const orderId = typeof payload.orderId === "string" ? payload.orderId.trim() : "";
  const providerReference = typeof payload.providerReference === "string" ? payload.providerReference.trim() : "";
  const status = typeof payload.status === "string" ? payload.status.trim() : "";
  const eventTime = typeof payload.eventTime === "string" ? payload.eventTime.trim() : "";
  const idempotencyKey =
    typeof payload.idempotencyKey === "string"
      ? payload.idempotencyKey.trim()
      : typeof payload.signature === "string"
        ? payload.signature.trim()
        : "";

  if (!orderId || !providerReference || !status || !eventTime || !idempotencyKey) {
    return {
      success: false,
      code: "PAYMENT_CALLBACK_INVALID_INPUT",
      message: "Thiếu trường bắt buộc trong callback payment.",
    };
  }

  return {
    success: true,
    data: {
      orderId,
      providerReference,
      status,
      eventTime,
      idempotencyKey,
    },
  };
}

function resolveErrorStatus(code) {
  if (code === "PAYMENT_CALLBACK_INVALID_INPUT" || code === "PAYMENT_CALLBACK_INVALID_STATUS") return 400;
  if (code === "AUTH_FORBIDDEN") return 403;
  if (code === "PAYMENT_TRANSACTION_NOT_FOUND" || code === "ORDER_NOT_FOUND") return 404;
  return 500;
}

export async function POST(request) {
  const correlationId = randomUUID();

  let payloadText;
  try {
    payloadText = await request.text();
  } catch {
    return jsonError("PAYMENT_CALLBACK_INVALID_INPUT", "Payload callback không hợp lệ.", correlationId, 400);
  }

  if (!verifyWebhookSignature(request.headers.get("x-payment-signature"), payloadText)) {
    return jsonError("AUTH_FORBIDDEN", "Webhook signature không hợp lệ.", correlationId, 403);
  }

  let payload;
  try {
    payload = JSON.parse(payloadText);
  } catch {
    return jsonError("PAYMENT_CALLBACK_INVALID_INPUT", "Payload callback không hợp lệ.", correlationId, 400);
  }

  const validation = validatePayload(payload);
  if (!validation.success) {
    return jsonError(validation.code, validation.message, correlationId, 400);
  }

  const result = await reconcilePaymentCallback({
    ...validation.data,
    correlationId,
  });
  if (!result.success) {
    return jsonError(result.code, result.message, correlationId, resolveErrorStatus(result.code), result.data);
  }

  return jsonSuccess(result.data, correlationId);
}
