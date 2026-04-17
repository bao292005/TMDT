import { randomUUID } from "node:crypto";

import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
  validateCartBeforeCheckout,
} from "../../../modules/cart/cart-service.js";
import { requireApiRole } from "../../../modules/identity/authorization.js";
import { USER_ROLES } from "../../../modules/identity/user-store.js";
import {
  validateAddCartPayload,
  validateRemoveCartPayload,
  validateUpdateCartPayload,
} from "../../../shared/validation/cart.js";

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

function resolveCartErrorStatus(code) {
  if (code === "CART_INVALID_INPUT") return 400;
  if (code === "CART_PRODUCT_NOT_FOUND" || code === "CART_ITEM_NOT_FOUND") return 404;
  if (code === "CART_EMPTY" || code === "CART_INVALID") return 409;
  if (code === "CART_OUT_OF_STOCK" || code === "CART_QUANTITY_EXCEEDS_STOCK") return 409;
  return 500;
}

function buildErrorResponse(correlationId, result) {
  return jsonError(
    result.code,
    result.message,
    correlationId,
    resolveCartErrorStatus(result.code),
    result.data,
  );
}

function parseMode(request) {
  try {
    const mode = new URL(request.url).searchParams.get("mode") ?? "";
    return mode.trim().toLowerCase();
  } catch {
    return "";
  }
}

async function parseJsonPayload(request, correlationId) {
  try {
    return await request.json();
  } catch {
    return jsonError("CART_INVALID_INPUT", "Dữ liệu gửi lên không hợp lệ.", correlationId, 400);
  }
}

export async function GET(request) {
  const correlationId = randomUUID();
  const access = await requireApiRole(request, [USER_ROLES.CUSTOMER]);
  if (!access.ok) {
    return access.response;
  }

  const mode = parseMode(request);

  if (mode === "checkout") {
    const validation = await validateCartBeforeCheckout(access.session.userId);
    if (!validation.success) {
      return buildErrorResponse(correlationId, validation);
    }

    return jsonSuccess(validation.data, correlationId);
  }

  const cart = await getCart(access.session.userId);
  return jsonSuccess(cart, correlationId);
}

export async function POST(request) {
  const correlationId = randomUUID();
  const access = await requireApiRole(request, [USER_ROLES.CUSTOMER]);
  if (!access.ok) {
    return access.response;
  }

  const parsed = await parseJsonPayload(request, correlationId);
  if (parsed instanceof Response) {
    return parsed;
  }

  const validation = validateAddCartPayload(parsed);
  if (!validation.success) {
    return jsonError(validation.code, validation.error, correlationId, 400);
  }

  const result = await addCartItem({ userId: access.session.userId, ...validation.data });
  if (!result.success) {
    return buildErrorResponse(correlationId, result);
  }

  return jsonSuccess(result.data, correlationId);
}

export async function PATCH(request) {
  const correlationId = randomUUID();
  const access = await requireApiRole(request, [USER_ROLES.CUSTOMER]);
  if (!access.ok) {
    return access.response;
  }

  const parsed = await parseJsonPayload(request, correlationId);
  if (parsed instanceof Response) {
    return parsed;
  }

  const validation = validateUpdateCartPayload(parsed);
  if (!validation.success) {
    return jsonError(validation.code, validation.error, correlationId, 400);
  }

  const result = await updateCartItem({ userId: access.session.userId, ...validation.data });
  if (!result.success) {
    return buildErrorResponse(correlationId, result);
  }

  return jsonSuccess(result.data, correlationId);
}

export async function DELETE(request) {
  const correlationId = randomUUID();
  const access = await requireApiRole(request, [USER_ROLES.CUSTOMER]);
  if (!access.ok) {
    return access.response;
  }

  const parsed = await parseJsonPayload(request, correlationId);
  if (parsed instanceof Response) {
    return parsed;
  }

  const validation = validateRemoveCartPayload(parsed);
  if (!validation.success) {
    return jsonError(validation.code, validation.error, correlationId, 400);
  }

  const result = await removeCartItem({ userId: access.session.userId, ...validation.data });
  if (!result.success) {
    return buildErrorResponse(correlationId, result);
  }

  return jsonSuccess(result.data, correlationId);
}
