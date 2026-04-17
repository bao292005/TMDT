import { randomUUID } from "node:crypto";

import {
  createAdminCatalogProduct,
  listAdminCatalogProducts,
} from "../../../../modules/catalog/catalog-service.js";
import { requireApiRole } from "../../../../modules/identity/authorization.js";
import { USER_ROLES } from "../../../../modules/identity/user-store.js";
import { validateAdminCatalogProductPayload } from "../../../../shared/validation/catalog.js";

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
  if (code === "CATALOG_DUPLICATE_SLUG") return 409;
  return 500;
}

export async function GET(request) {
  const access = await requireApiRole(request, [USER_ROLES.ADMIN]);
  if (!access.ok) {
    return access.response;
  }

  const correlationId = randomUUID();
  const result = await listAdminCatalogProducts();
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

export async function POST(request) {
  const access = await requireApiRole(request, [USER_ROLES.ADMIN]);
  if (!access.ok) {
    return access.response;
  }

  const correlationId = randomUUID();
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

  const validation = validateAdminCatalogProductPayload(payload);
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

  const result = await createAdminCatalogProduct(validation.data);
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
    201,
    correlationId,
  );
}
