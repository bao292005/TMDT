import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const baseDataDirectory = path.join(process.cwd(), ".data");
const dataDirectory =
  process.env.NODE_ENV === "test"
    ? path.join(baseDataDirectory, `test-${process.pid}`)
    : baseDataDirectory;
const reconciliationRunsFile = path.join(dataDirectory, "reconciliation-runs.json");

let writeQueue = Promise.resolve();

async function ensureStore() {
  await mkdir(dataDirectory, { recursive: true });
  try {
    await readFile(reconciliationRunsFile, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      await writeFile(reconciliationRunsFile, "[]", "utf8");
      return;
    }

    throw error;
  }
}

async function readRuns() {
  await ensureStore();
  const text = await readFile(reconciliationRunsFile, "utf8");

  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

async function writeRuns(runs) {
  await ensureStore();
  await writeFile(reconciliationRunsFile, JSON.stringify(runs, null, 2), "utf8");
}

function runWrite(task) {
  const nextTask = writeQueue.then(task, task);
  writeQueue = nextTask.then(
    () => undefined,
    () => undefined,
  );

  return nextTask;
}

export async function runReconciliationWrite(task) {
  return runWrite(task);
}

async function createReconciliationRunIfNotExistsInWriteContext(idempotencyKey, createRun) {
  const runs = await readRuns();

  if (idempotencyKey) {
    const existing = runs.find((run) => run.idempotencyKey === idempotencyKey);
    if (existing) {
      return {
        created: false,
        run: existing,
      };
    }
  }

  const run = await createRun();
  runs.push(run);
  await writeRuns(runs);

  return {
    created: true,
    run,
  };
}

export async function createReconciliationRunIfNotExists(idempotencyKey, createRun) {
  return runWrite(async () => createReconciliationRunIfNotExistsInWriteContext(idempotencyKey, createRun));
}

export async function createReconciliationRunIfNotExistsUnsafe(idempotencyKey, createRun) {
  return createReconciliationRunIfNotExistsInWriteContext(idempotencyKey, createRun);
}

export async function createReconciliationRun(run) {
  return runWrite(async () => {
    const runs = await readRuns();
    runs.push(run);
    await writeRuns(runs);
    return run;
  });
}

export async function findReconciliationRunByIdempotencyKey(idempotencyKey) {
  if (!idempotencyKey) return null;
  const runs = await readRuns();
  return runs.find((run) => run.idempotencyKey === idempotencyKey) ?? null;
}

export async function listReconciliationRuns({ limit = 20 } = {}) {
  const runs = await readRuns();
  const safeLimit = Math.max(1, Math.min(100, Number.isFinite(limit) ? Math.trunc(limit) : 20));

  return [...runs]
    .sort((a, b) => {
      const left = a.startedAt ?? "";
      const right = b.startedAt ?? "";
      return right.localeCompare(left);
    })
    .slice(0, safeLimit);
}

export async function __resetReconciliationStoreForTests() {
  await writeRuns([]);
}
