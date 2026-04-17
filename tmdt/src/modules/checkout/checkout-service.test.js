import assert from "node:assert/strict";
import test from "node:test";

import { __resetCartStoreForTests, __setCartForUserForTests } from "../cart/cart-store.js";
import { saveProfile } from "../identity/auth-service.js";
import { createUser, USER_ROLES } from "../identity/user-store.js";
import { buildCheckoutDraft } from "./checkout-service.js";

async function seedCustomer(profile) {
  const created = await createUser({
    email: `checkout-${Date.now()}-${Math.random()}@example.com`,
    passwordHash: "hash",
    role: USER_ROLES.CUSTOMER,
  });

  assert.equal(created.success, true);
  await saveProfile(created.user.id, profile);
  return created.user.id;
}

test("checkout service tính tổng tiền với địa chỉ + shipping hợp lệ", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  const userId = await seedCustomer({
    fullName: "Nguyen Van A",
    phone: "+84901234567",
    addresses: ["1 Nguyen Trai", "2 Le Loi"],
  });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 2, addedAt: Date.now() }],
  });

  const result = await buildCheckoutDraft({
    userId,
    address: "2 Le Loi",
    shippingMethod: "express",
    note: "Giao giờ hành chính",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.selectedAddress, "2 Le Loi");
  assert.equal(result.data.selectedShippingMethod, "express");
  assert.equal(result.data.pricing.subtotal, 398000);
  assert.equal(result.data.pricing.shippingFee, 45000);
  assert.equal(result.data.pricing.discount, 0);
  assert.equal(result.data.pricing.total, 443000);
});

test("checkout service chặn shipping không hợp lệ", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  const userId = await seedCustomer({
    fullName: "Nguyen Van B",
    phone: "+84902223333",
    addresses: ["3 Tran Hung Dao"],
  });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const result = await buildCheckoutDraft({
    userId,
    address: "3 Tran Hung Dao",
    shippingMethod: "overnight",
    note: "",
  });

  assert.equal(result.success, false);
  assert.equal(result.code, "CHECKOUT_SHIPPING_METHOD_INVALID");
});

test("checkout service chặn địa chỉ sai định dạng khi không thuộc profile", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  const userId = await seedCustomer({
    fullName: "Nguyen Van C",
    phone: "+84903334444",
    addresses: ["5 Hai Ba Trung"],
  });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const result = await buildCheckoutDraft({
    userId,
    address: "abc",
    shippingMethod: "standard",
    note: "",
  });

  assert.equal(result.success, false);
  assert.equal(result.code, "CHECKOUT_ADDRESS_NOT_FOUND");
});

test("checkout service cho phép địa chỉ mới nếu đạt định dạng tối thiểu", { concurrency: false }, async () => {
  await __resetCartStoreForTests();
  const userId = await seedCustomer({
    fullName: "Nguyen Van D",
    phone: "+84904445555",
    addresses: ["7 Nguyen Du"],
  });

  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-trang", variantId: "m-trang", quantity: 1, addedAt: Date.now() }],
  });

  const result = await buildCheckoutDraft({
    userId,
    address: "9 Cach Mang Thang 8",
    shippingMethod: "standard",
    note: "",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.selectedAddress, "9 Cach Mang Thang 8");
});
