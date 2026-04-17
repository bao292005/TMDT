import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const baseDataDirectory = path.join(process.cwd(), ".data");
const dataDirectory =
  process.env.NODE_ENV === "test"
    ? path.join(baseDataDirectory, `test-${process.pid}`)
    : baseDataDirectory;
const auditLogsFile = path.join(dataDirectory, "audit-logs.json");
let appendAuditLogQueue = Promise.resolve();

async function ensureStore() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(auditLogsFile, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      await writeFile(auditLogsFile, "[]", "utf8");
      return;
    }

    throw error;
  }
}

async function readAuditLogs() {
  await ensureStore();
  const text = await readFile(auditLogsFile, "utf8");
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error("AUDIT_LOG_STORE_INVALID_DATA");
  }
  return parsed;
}

async function writeAuditLogs(logs) {
  await ensureStore();
  await writeFile(auditLogsFile, JSON.stringify(logs, null, 2), "utf8");
}

export async function appendAuditLog(entry) {
  const operation = appendAuditLogQueue.then(async () => {
    const logs = await readAuditLogs();
    logs.push(entry);
    await writeAuditLogs(logs);
  });

  appendAuditLogQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

function resolveCorrelationId(correlationId) {
  return typeof correlationId === "string" && correlationId.trim() ? correlationId.trim() : randomUUID();
}

export async function appendFallbackAuditEvent({
  actorId = "system-fallback",
  orderId = null,
  correlationId = null,
  source,
  reason,
  actionTaken,
  status,
  retryable = null,
  metadata = {},
}) {
  const normalizedStatus = status === "recovered" ? "recovered" : "activated";
  const timestamp = new Date().toISOString();

  return appendAuditLog({
    actorId,
    orderId,
    action: normalizedStatus === "recovered" ? "FALLBACK_RECOVERED" : "FALLBACK_ACTIVATED",
    beforeStatus: null,
    afterStatus: null,
    reason: reason ?? null,
    timestamp,
    correlationId: resolveCorrelationId(correlationId),
    metadata: {
      source: source ?? "unknown",
      reason: reason ?? null,
      actionTaken: actionTaken ?? null,
      retryable: typeof retryable === "boolean" ? retryable : null,
      status: normalizedStatus,
      ...metadata,
    },
  });
}

function resolveEventTimestamp(entry) {
  if (typeof entry?.timestamp === "string" && entry.timestamp) {
    return entry.timestamp;
  }

  return "";
}

function resolveFallbackEventSource(entry) {
  return typeof entry?.metadata?.source === "string" && entry.metadata.source
    ? entry.metadata.source
    : "unknown";
}

function resolveFallbackEntityId(entry) {
  if (typeof entry?.orderId === "string" && entry.orderId) {
    return entry.orderId;
  }

  if (typeof entry?.metadata?.productSlug === "string" && entry.metadata.productSlug) {
    return entry.metadata.productSlug;
  }

  return "none";
}

function resolveFallbackLane(entry) {
  return typeof entry?.metadata?.lane === "string" && entry.metadata.lane
    ? entry.metadata.lane
    : "unknown";
}

function resolveEventKey(entry) {
  return `${resolveFallbackEventSource(entry)}:${resolveFallbackLane(entry)}:${resolveFallbackEntityId(entry)}`;
}

function sortByTimestampAsc(a, b) {
  return resolveEventTimestamp(a).localeCompare(resolveEventTimestamp(b));
}

export async function getFallbackSummary({ limit = 50 } = {}) {
  const logs = await readAuditLogs();
  const fallbackEvents = logs
    .filter((entry) => entry?.action === "FALLBACK_ACTIVATED" || entry?.action === "FALLBACK_RECOVERED")
    .sort(sortByTimestampAsc);

  const openByKey = new Map();
  const sourceCounts = new Map();

  for (const event of fallbackEvents) {
    const source = resolveFallbackEventSource(event);
    if (!sourceCounts.has(source)) {
      sourceCounts.set(source, {
        source,
        activated: 0,
        recovered: 0,
        unresolved: 0,
      });
    }

    const summary = sourceCounts.get(source);
    const key = resolveEventKey(event);

    if (event.action === "FALLBACK_ACTIVATED") {
      summary.activated += 1;
      openByKey.set(key, event);
      continue;
    }

    summary.recovered += 1;
    openByKey.delete(key);
  }

  for (const event of openByKey.values()) {
    const source = resolveFallbackEventSource(event);
    const summary = sourceCounts.get(source);
    if (summary) {
      summary.unresolved += 1;
    }
  }

  const safeLimit = Math.max(1, Math.min(200, Number.isFinite(limit) ? Math.trunc(limit) : 50));
  const latestEvents = [...fallbackEvents].sort((a, b) => resolveEventTimestamp(b).localeCompare(resolveEventTimestamp(a))).slice(0, safeLimit);

  return {
    totals: {
      activated: fallbackEvents.filter((entry) => entry.action === "FALLBACK_ACTIVATED").length,
      recovered: fallbackEvents.filter((entry) => entry.action === "FALLBACK_RECOVERED").length,
      unresolved: openByKey.size,
    },
    bySource: [...sourceCounts.values()].sort((a, b) => a.source.localeCompare(b.source)),
    unresolvedEvents: [...openByKey.values()].sort((a, b) => resolveEventTimestamp(b).localeCompare(resolveEventTimestamp(a))),
    latestEvents,
  };
}

export async function listAuditLogs() {
  return readAuditLogs();
}

export async function __resetAuditLogStoreForTests() {
  await writeAuditLogs([]);
}
