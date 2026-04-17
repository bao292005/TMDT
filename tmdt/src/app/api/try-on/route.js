import { randomUUID } from "node:crypto";

import {
  appendTryOnSessionCookie,
  getTryOnSnapshotFromSession,
  resolveTryOnSessionContext,
  saveTryOnSnapshotToSession,
} from "../../../modules/tryon/tryon-session-service.js";
import { processTryOn } from "../../../modules/tryon/tryon-service.js";
import { resolveIntegrationStatusCode, withIntegrationErrorCorrelation } from "../../../shared/config/integration-error.js";
import { validateTryOnPayload } from "../../../shared/validation/tryon.js";

function jsonWithCorrelation(body, status, correlationId) {
  return Response.json(body, {
    status,
    headers: {
      "X-Correlation-Id": correlationId,
    },
  });
}

function resolveStatusCode(code) {
  if (code === "TRYON_INVALID_INPUT") return 400;
  if (code === "TRYON_SESSION_RESULT_NOT_FOUND") return 404;
  if (code === "TRYON_TIMEOUT") return 504;
  if (code === "TRYON_UPSTREAM_RETRYABLE") return 503;
  if (code === "TRYON_UPSTREAM_FAILED") return 502;
  return 500;
}

function parseProductSlugFromUrl(url) {
  try {
    const productSlug = new URL(url).searchParams.get("productSlug");
    return typeof productSlug === "string" ? productSlug.trim().slice(0, 120) : "";
  } catch {
    return "";
  }
}

export async function GET(request) {
  const correlationId = randomUUID();
  const { sessionKey } = resolveTryOnSessionContext(request);
  const productSlug = parseProductSlugFromUrl(request.url);

  if (!productSlug) {
    const response = jsonWithCorrelation(
      {
        success: false,
        state: "error",
        error: "TRYON_INVALID_INPUT",
        message: "Thiếu productSlug hợp lệ để truy vấn kết quả try-on theo phiên.",
      },
      400,
      correlationId,
    );
    appendTryOnSessionCookie(response, sessionKey);
    return response;
  }

  const snapshot = getTryOnSnapshotFromSession({ sessionKey, productSlug });

  if (!snapshot) {
    const response = jsonWithCorrelation(
      {
        success: false,
        state: "error",
        error: "TRYON_SESSION_RESULT_NOT_FOUND",
        message: "Chưa có kết quả try-on trong phiên hiện tại cho sản phẩm này.",
      },
      404,
      correlationId,
    );
    appendTryOnSessionCookie(response, sessionKey);
    return response;
  }

  const response = jsonWithCorrelation(
    {
      success: true,
      state: "success",
      data: snapshot,
    },
    200,
    correlationId,
  );
  appendTryOnSessionCookie(response, sessionKey);
  return response;
}

export async function POST(request) {
  const correlationId = randomUUID();
  const { sessionKey } = resolveTryOnSessionContext(request);

  try {
    const formData = await request.formData();
    const validation = await validateTryOnPayload(formData);

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

    const timeoutFromEnv = Number(process.env.TRYON_TIMEOUT_MS ?? "30000");
    const timeoutMs =
      Number.isFinite(timeoutFromEnv) && timeoutFromEnv > 0 ? Math.min(timeoutFromEnv, 30_000) : 30_000;

    const result = await processTryOn(validation.data, {
      timeoutMs,
      correlationId,
    });

    if (!result.success) {
      const integrationError = withIntegrationErrorCorrelation(result.integrationError, correlationId);
      const statusCode = integrationError
        ? resolveIntegrationStatusCode(integrationError.code, integrationError.retryable)
        : resolveStatusCode(result.code);

      const response = jsonWithCorrelation(
        {
          success: false,
          state: result.state,
          error: result.code,
          message: result.message,
          ...(typeof result.retryable === "boolean" ? { retryable: result.retryable } : {}),
          ...(integrationError ? { integrationError } : {}),
        },
        statusCode,
        correlationId,
      );
      appendTryOnSessionCookie(response, sessionKey);
      return response;
    }

    const snapshot = saveTryOnSnapshotToSession({
      sessionKey,
      productSlug: validation.data.productSlug,
      variantContext: validation.data.variantContext,
      tryOnImageUrl: result.data.tryOnImageUrl,
      confidence: result.data.confidence,
    });

    const response = jsonWithCorrelation(
      {
        success: true,
        state: result.state,
        data: {
          ...result.data,
          updatedAt: snapshot?.updatedAt ?? Date.now(),
        },
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
        error: "TRYON_INTERNAL_ERROR",
        message: "Không thể xử lý yêu cầu thử đồ AI.",
      },
      500,
      correlationId,
    );
    appendTryOnSessionCookie(response, sessionKey);
    return response;
  }
}
