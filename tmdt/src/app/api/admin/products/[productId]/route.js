import { randomUUID } from "node:crypto";

import {
  deactivateAdminCatalogProduct,
  updateAdminCatalogProduct,
} from "../../../../../modules/catalog/catalog-service.js";
import { requireApiRole } from "../../../../../modules/identity/authorization.js";
import { USER_ROLES } from "../../../../../modules/identity/user-store.js";
import { validateAdminCatalogProductPayload } from "../../../../../shared/validation/catalog.js";

function jsonWithCorrelation(body, status, correlationId) {
  return Response.json(body, {
    status,
    headers: {
      "X-Correlation-Id": correlationId,
    },
  });
}

function resolveErrorStatus(code) {
  if (code === "CATALOG_INVALID_INPUT") return 400;
  if (code === "CATALOG_NOT_FOUND") return 404;
  if (code === "CATALOG_DUPLICATE_SLUG") return 409;
  return 500;
}

function resolveProductId(params) {
  const productId = typeof params?.productId === "string" ? params.productId.trim() : "";
  return productId;
}

export async function PATCH(request, { params }) {
  const access = await requireApiRole(request, [USER_ROLES.ADMIN]);
  if (!access.ok) {
    return access.response;
  }

  const correlationId = randomUUID();
  const resolvedParams = await params;
  const productId = resolveProductId(resolvedParams);

  if (!productId) {
    return jsonWithCorrelation(
      { success: false, state: "error", error: "CATALOG_INVALID_INPUT", message: "Thiếu productId." },
      400,
      correlationId,
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonWithCorrelation(
      { success: false, state: "error", error: "CATALOG_INVALID_INPUT", message: "Dữ liệu gửi lên không hợp lệ." },
      400,
      correlationId,
    );
  }

  const validation = validateAdminCatalogProductPayload(payload, { partial: true });
  if (!validation.success) {
    return jsonWithCorrelation(
      {
        success: false,
        state: "error",
        error: validation.code,
        message: validation.error,
      },
      400,
      correlationId,
    );
  }

  const result = await updateAdminCatalogProduct(productId, validation.data);
  if (!result.success) {
    return jsonWithCorrelation(
      {
        success: false,
        state: "error",
        error: result.code,
        message: result.message,
      },
      resolveErrorStatus(result.code),
      correlationId,
    );
  }

  return jsonWithCorrelation(
    {
      success: true,
      state: "success",
      data: result.data,
    },
    200,
    correlationId,
  );
}

export async function DELETE(request, { params }) {
  const access = await requireApiRole(request, [USER_ROLES.ADMIN]);
  if (!access.ok) {
    return access.response;
  }

  const correlationId = randomUUID();
  const resolvedParams = await params;
  const productId = resolveProductId(resolvedParams);

  if (!productId) {
    return jsonWithCorrelation(
      { success: false, state: "error", error: "CATALOG_INVALID_INPUT", message: "Thiếu productId." },
      400,
      correlationId,
    );
  }

  const result = await deactivateAdminCatalogProduct(productId);
  if (!result.success) {
    return jsonWithCorrelation(
      {
        success: false,
        state: "error",
        error: result.code,
        message: result.message,
      },
      resolveErrorStatus(result.code),
      correlationId,
    );
  }

  return jsonWithCorrelation(
    {
      success: true,
      state: "success",
      data: result.data,
    },
    200,
    correlationId,
  );
}
