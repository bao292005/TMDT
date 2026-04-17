import { randomUUID } from "node:crypto";

import { runReconciliationJob } from "../../modules/order/reconciliation-service.js";

export const RECONCILIATION_INTERVAL_MS = 15 * 60 * 1000;

export async function executeReconciliationCycle({
  correlationId = randomUUID(),
  idempotencyKey,
} = {}) {
  const key =
    typeof idempotencyKey === "string" && idempotencyKey.trim()
      ? idempotencyKey.trim()
      : `${correlationId}:scheduled`;

  return runReconciliationJob({
    correlationId,
    idempotencyKey: key,
  });
}

export function getReconciliationSchedulerGuidance() {
  return {
    intervalMinutes: 15,
    cron: "*/15 * * * *",
    recommendation:
      "Chạy script executeReconciliationCycle mỗi 15 phút bằng scheduler ngoài (cron/CI runner) nếu ứng dụng chưa có worker nền.",
  };
}
