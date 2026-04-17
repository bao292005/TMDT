import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const baseDataDirectory = path.join(process.cwd(), ".data");
const dataDirectory =
  process.env.NODE_ENV === "test"
    ? path.join(baseDataDirectory, `test-${process.pid}`)
    : baseDataDirectory;
const ordersFile = path.join(dataDirectory, "orders.json");

let writeQueue = Promise.resolve();

async function ensureStore() {
  await mkdir(dataDirectory, { recursive: true });
  try {
    await readFile(ordersFile, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      await writeFile(ordersFile, "[]", "utf8");
      return;
    }
    throw error;
  }
}

async function readOrders() {
  await ensureStore();

  const text = await readFile(ordersFile, "utf8");
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error("ORDER_STORE_INVALID_DATA");
  }
  return parsed;
}

async function writeOrders(orders) {
  await ensureStore();
  await writeFile(ordersFile, JSON.stringify(orders, null, 2), "utf8");
}

function runWrite(task) {
  const nextTask = writeQueue.then(task, task);
  writeQueue = nextTask.then(
    () => undefined,
    () => undefined,
  );
  return nextTask;
}

export async function createOrder(order) {
  return runWrite(async () => {
    const orders = await readOrders();
    orders.push(order);
    await writeOrders(orders);
    return order;
  });
}

export async function listOrders() {
  return readOrders();
}

export async function listOrdersByUserId(userId) {
  const orders = await readOrders();
  return orders.filter((order) => order.userId === userId);
}

export async function findOrderById(orderId) {
  if (!orderId) return null;
  const orders = await readOrders();
  return orders.find((order) => order.id === orderId) ?? null;
}

export async function updateOrderById(orderId, updates) {
  return runWrite(async () => {
    const orders = await readOrders();
    const index = orders.findIndex((order) => order.id === orderId);
    if (index < 0) {
      return null;
    }

    const next = {
      ...orders[index],
      ...updates,
    };

    orders[index] = next;
    await writeOrders(orders);
    return next;
  });
}

export async function __resetOrderStoreForTests() {
  await writeOrders([]);
}
