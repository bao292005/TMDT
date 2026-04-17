import { randomUUID } from "node:crypto";

import { getProductRecommendations } from "../../../modules/recommendation/recommendation-service.js";
import {
  appendTryOnSessionCookie,
  getTryOnSnapshotFromSession,
  resolveTryOnSessionContext,
} from "../../../modules/tryon/tryon-session-service.js";
import { validateRecommendationQuery } from "../../../shared/validation/recommendation.js";

function jsonWithCorrelation(body, status, correlationId) {
  return Response.json(body, {
    status,
    headers: {
      "X-Correlation-Id": correlationId,
    },
  });
}

function resolveStatusCode(code) {
  if (code === "RECOMMENDATION_INVALID_INPUT") return 400;
  if (code === "RECOMMENDATION_NOT_FOUND") return 404;
  return 500;
}

export async function GET(request) {
  const correlationId = randomUUID();
  const { sessionKey } = resolveTryOnSessionContext(request);

  try {
    const url = new URL(request.url);
    const validation = validateRecommendationQuery(url.searchParams);

    if (!validation.success) {
      const response = jsonWithCorrelation(
        {
          success: false,
          state: "error",
          error: validation.code,
          message: validation.error,
        },
        400,
        correlationId,
      );
      appendTryOnSessionCookie(response, sessionKey);
      return response;
    }

    const tryOnSnapshot = getTryOnSnapshotFromSession({
      sessionKey,
      productSlug: validation.data.productSlug,
    });

    const result = await getProductRecommendations({
      ...validation.data,
      tryOnSnapshot,
    });

    if (!result.success) {
      const response = jsonWithCorrelation(
        {
          success: false,
          state: "error",
          error: result.code,
          message: result.message,
        },
        resolveStatusCode(result.code),
        correlationId,
      );
      appendTryOnSessionCookie(response, sessionKey);
      return response;
    }

    const response = jsonWithCorrelation(
      {
        success: true,
        state: result.state,
        data: result.data,
      },
      200,
      correlationId,
    );
    appendTryOnSessionCookie(response, sessionKey);
    return response;
  } catch {
    const response = jsonWithCorrelation(
      {
        success: false,
        state: "error",
        error: "RECOMMENDATION_INTERNAL_ERROR",
        message: "Không thể xử lý yêu cầu gợi ý sản phẩm.",
      },
      500,
      correlationId,
    );
    appendTryOnSessionCookie(response, sessionKey);
    return response;
  }
}
