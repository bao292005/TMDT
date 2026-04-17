import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const baseDataDirectory = path.join(process.cwd(), ".data");
const dataDirectory =
  process.env.NODE_ENV === "test"
    ? path.join(baseDataDirectory, `test-${process.pid}`)
    : baseDataDirectory;
const transactionsFile = path.join(dataDirectory, "payment-transactions.json");

let writeQueue = Promise.resolve();

async function ensureStore() {
  await mkdir(dataDirectory, { recursive: true });
  try {
    await readFile(transactionsFile, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      await writeFile(transactionsFile, "[]", "utf8");
      return;
    }
    throw error;
  }
}

async function readTransactions() {
  await ensureStore();

  const text = await readFile(transactionsFile, "utf8");
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error("PAYMENT_STORE_INVALID_DATA");
  }
  return parsed;
}

async function writeTransactions(transactions) {
  await ensureStore();
  await writeFile(transactionsFile, JSON.stringify(transactions, null, 2), "utf8");
}

function runWrite(task) {
  const nextTask = writeQueue.then(task, task);
  writeQueue = nextTask.then(
    () => undefined,
    () => undefined,
  );
  return nextTask;
}

export async function createPaymentTransaction(transaction) {
  return runWrite(async () => {
    const transactions = await readTransactions();
    transactions.push(transaction);
    await writeTransactions(transactions);
    return transaction;
  });
}

export async function listPaymentTransactionsByOrderId(orderId) {
  const transactions = await readTransactions();
  return transactions
    .filter((transaction) => transaction.orderId === orderId)
    .sort((a, b) => (a.createdAt === b.createdAt ? 0 : a.createdAt < b.createdAt ? -1 : 1));
}

export async function findLatestPaymentTransactionByOrderId(orderId) {
  const list = await listPaymentTransactionsByOrderId(orderId);
  return list.at(-1) ?? null;
}

export async function findPaymentTransactionByProviderReference(providerReference) {
  if (!providerReference) return null;
  const transactions = await readTransactions();
  return transactions.find((transaction) => transaction.providerReference === providerReference) ?? null;
}

export async function findPaymentTransactionById(transactionId) {
  if (!transactionId) return null;
  const transactions = await readTransactions();
  return transactions.find((transaction) => transaction.id === transactionId) ?? null;
}

export async function findPaymentTransactionByIdempotencyKey(idempotencyKey) {
  if (!idempotencyKey) return null;
  const transactions = await readTransactions();
  return (
    transactions.find((transaction) =>
      Array.isArray(transaction.processedIdempotencyKeys)
        ? transaction.processedIdempotencyKeys.includes(idempotencyKey)
        : transaction.lastIdempotencyKey === idempotencyKey,
    ) ?? null
  );
}

export async function updatePaymentTransactionById(transactionId, updates) {
  return runWrite(async () => {
    const transactions = await readTransactions();
    const index = transactions.findIndex((transaction) => transaction.id === transactionId);
    if (index < 0) {
      return null;
    }

    const next = {
      ...transactions[index],
      ...updates,
    };

    transactions[index] = next;
    await writeTransactions(transactions);
    return next;
  });
}

export async function __resetPaymentStoreForTests() {
  await writeTransactions([]);
}
