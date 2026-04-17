import { randomUUID } from "node:crypto";

import { getCatalogProducts } from "../../../../modules/catalog/catalog-service.js";
import { validateCatalogQuery } from "../../../../shared/validation/catalog.js";

function jsonWithCorrelation(body, status, correlationId) {
  return Response.json(body, {
    status,
    headers: {
      "X-Correlation-Id": correlationId,
    },
  });
}

export async function GET(request) {
  const correlationId = randomUUID();

  try {
    const url = new URL(request.url);
    const validation = validateCatalogQuery(url.searchParams);
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

    const result = await getCatalogProducts(validation.data);

    return jsonWithCorrelation(
      {
        success: true,
        data: {
          items: result.items,
          pagination: result.pagination,
          filters: {
            category: validation.data.category,
            keyword: validation.data.keyword,
            size: validation.data.size,
            color: validation.data.color,
            minPrice: validation.data.minPrice,
            maxPrice: validation.data.maxPrice,
          },
        },
      },
      200,
      correlationId,
    );
  } catch {
    return jsonWithCorrelation(
      {
        success: false,
        error: "CATALOG_INTERNAL_ERROR",
        message: "Không thể xử lý yêu cầu danh mục.",
      },
      500,
      correlationId,
    );
  }
}
