import { randomUUID } from "node:crypto";

import { getCatalogProductDetail } from "../../../../../modules/catalog/catalog-service.js";
import { validateCatalogDetailQuery } from "../../../../../shared/validation/catalog.js";

function jsonWithCorrelation(body, status, correlationId) {
  return Response.json(body, {
    status,
    headers: {
      "X-Correlation-Id": correlationId,
    },
  });
}

export async function GET(request, { params }) {
  const correlationId = randomUUID();

  try {
    const slug = (params?.slug ?? "").trim();
    if (!slug) {
      return jsonWithCorrelation(
        {
          success: false,
          error: "CATALOG_INVALID_QUERY",
          message: "Slug sản phẩm không hợp lệ.",
        },
        400,
        correlationId,
      );
    }

    const url = new URL(request.url);
    const validation = validateCatalogDetailQuery(url.searchParams);
    if (!validation.success) {
      return jsonWithCorrelation(
        {
          success: false,
          error: validation.code,
          message: validation.error,
        },
        400,
        correlationId,
      );
    }

    const result = await getCatalogProductDetail({ slug, ...validation.data });
    if (!result.success) {
      const status = result.code === "CATALOG_NOT_FOUND" ? 404 : 400;
      return jsonWithCorrelation(
        {
          success: false,
          error: result.code,
          message: result.message,
        },
        status,
        correlationId,
      );
    }

    return jsonWithCorrelation(
      {
        success: true,
        data: result.data,
      },
      200,
      correlationId,
    );
  } catch {
    return jsonWithCorrelation(
      {
        success: false,
        error: "CATALOG_INTERNAL_ERROR",
        message: "Không thể xử lý yêu cầu chi tiết sản phẩm.",
      },
      500,
      correlationId,
    );
  }
}
