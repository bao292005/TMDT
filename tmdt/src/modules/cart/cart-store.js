import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const baseDataDirectory = path.join(process.cwd(), ".data");
const dataDirectory =
  process.env.NODE_ENV === "test"
    ? path.join(baseDataDirectory, `test-${process.pid}`)
    : baseDataDirectory;
const cartsFile = path.join(dataDirectory, "carts.json");

let storeWriteChain = Promise.resolve();

async function ensureStore() {
  await mkdir(dataDirectory, { recursive: true });
  try {
    await readFile(cartsFile, "utf8");
  } catch {
    await writeFile(cartsFile, "{}", "utf8");
  }
}

function runStoreWrite(task) {
  const nextTask = storeWriteChain.then(task, task);
  storeWriteChain = nextTask.then(
    () => undefined,
    () => undefined,
  );
  return nextTask;
}

async function readCarts() {
  await ensureStore();

  try {
    const text = await readFile(cartsFile, "utf8");
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeCarts(carts) {
  await ensureStore();
  await writeFile(cartsFile, JSON.stringify(carts, null, 2), "utf8");
}

function normalizeCart(rawCart) {
  if (!rawCart || typeof rawCart !== "object") {
    return { items: [] };
  }

  const rawItems = Array.isArray(rawCart.items) ? rawCart.items : [];
  const items = rawItems
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      productSlug: typeof item.productSlug === "string" ? item.productSlug : "",
      variantId: typeof item.variantId === "string" ? item.variantId : "",
      quantity: Number.isSafeInteger(item.quantity) ? item.quantity : 1,
      addedAt: Number.isFinite(item.addedAt) ? item.addedAt : Date.now(),
    }))
    .filter((item) => item.productSlug && item.variantId && item.quantity > 0);

  return { items };
}

export async function getCartByUserId(userId) {
  const carts = await readCarts();
  return normalizeCart(carts[userId]);
}

export async function saveCartByUserId(userId, cart) {
  return runStoreWrite(async () => {
    const carts = await readCarts();
    carts[userId] = normalizeCart(cart);
    await writeCarts(carts);
    return carts[userId];
  });
}

export async function clearCartByUserId(userId) {
  return runStoreWrite(async () => {
    const carts = await readCarts();
    delete carts[userId];
    await writeCarts(carts);
  });
}

export async function __setCartForUserForTests(userId, cart) {
  return saveCartByUserId(userId, cart);
}

export async function __resetCartStoreForTests() {
  await writeCarts({});
}
