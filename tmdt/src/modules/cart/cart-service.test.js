import assert from "node:assert/strict";
import test from "node:test";

import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
  validateCartBeforeCheckout,
} from "./cart-service.js";
import { __seedCatalogProductsForTests } from "../catalog/product-store.js";
import { __resetCartStoreForTests, __setCartForUserForTests } from "./cart-store.js";

test.beforeEach(async () => {
  await __seedCatalogProductsForTests();
});

test("cart service thêm sản phẩm thành công", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  const userId = `cart-user-${Date.now()}-1`;

  const result = await addCartItem({
    userId,
    productSlug: "ao-thun-basic-den",
    variantId: "m-den",
    quantity: 2,
  });

  assert.equal(result.success, true);
  assert.equal(result.data?.items.length, 1);
  assert.equal(result.data?.items[0].variantId, "m-den");
  assert.equal(result.data?.items[0].quantity, 2);
  assert.equal(result.data?.isValid, true);
});

test("cart service chặn thêm biến thể hết hàng", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  const userId = `cart-user-${Date.now()}-2`;

  const result = await addCartItem({
    userId,
    productSlug: "ao-thun-basic-den",
    variantId: "l-den",
    quantity: 1,
  });

  assert.equal(result.success, false);
  assert.equal(result.code, "CART_OUT_OF_STOCK");
});

test("cart service chặn cộng dồn vượt tồn kho", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  const userId = `cart-user-${Date.now()}-3`;

  const first = await addCartItem({
    userId,
    productSlug: "ao-thun-basic-den",
    variantId: "m-den",
    quantity: 10,
  });
  assert.equal(first.success, true);

  const second = await addCartItem({
    userId,
    productSlug: "ao-thun-basic-den",
    variantId: "m-den",
    quantity: 9,
  });

  assert.equal(second.success, false);
  assert.equal(second.code, "CART_QUANTITY_EXCEEDS_STOCK");
});

test("cart service cập nhật số lượng và xóa item", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  const userId = `cart-user-${Date.now()}-4`;

  await addCartItem({
    userId,
    productSlug: "ao-thun-basic-trang",
    variantId: "m-trang",
    quantity: 1,
  });

  const updated = await updateCartItem({
    userId,
    productSlug: "ao-thun-basic-trang",
    variantId: "m-trang",
    quantity: 3,
  });

  assert.equal(updated.success, true);
  assert.equal(updated.data?.items[0].quantity, 3);

  const removed = await removeCartItem({
    userId,
    productSlug: "ao-thun-basic-trang",
    variantId: "m-trang",
  });

  assert.equal(removed.success, true);
  assert.equal(removed.data?.items.length, 0);
});

test("cart service validate checkout: empty và invalid", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  const emptyUserId = `cart-user-${Date.now()}-5`;

  const emptyValidation = await validateCartBeforeCheckout(emptyUserId);
  assert.equal(emptyValidation.success, false);
  assert.equal(emptyValidation.code, "CART_EMPTY");

  const invalidUserId = `cart-user-${Date.now()}-6`;
  await __setCartForUserForTests(invalidUserId, {
    items: [{ productSlug: "ao-thun-basic-den", variantId: "l-den", quantity: 1, addedAt: Date.now() }],
  });

  const invalidValidation = await validateCartBeforeCheckout(invalidUserId);
  assert.equal(invalidValidation.success, false);
  assert.equal(invalidValidation.code, "CART_INVALID");

  const snapshot = await getCart(invalidUserId);
  assert.equal(snapshot.isValid, false);
  assert.equal(snapshot.invalidItems.length, 1);
});
