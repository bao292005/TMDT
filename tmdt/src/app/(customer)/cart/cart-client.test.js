import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { GET as getCart } from "../../api/cart/route.js";
import { __resetCartStoreForTests, __setCartForUserForTests } from "../../../modules/cart/cart-store.js";
import { createSession } from "../../../modules/identity/session-store.js";
import { USER_ROLES } from "../../../modules/identity/user-store.js";

test("cart client giữ keyboard/focus semantics cho tương tác chính", async () => {
  const source = await readFile(new URL("./cart-client.tsx", import.meta.url), "utf8");

  assert.match(source, /focus-visible:ring-2/);
  assert.match(source, /event\.key === "Enter"/);
  assert.match(source, /event\.currentTarget\.blur\(\)/);
  assert.match(source, /aria-label="Danh sách sản phẩm trong giỏ"/);
  assert.match(source, /Giỏ hàng chưa hợp lệ\. Vui lòng xử lý các sản phẩm lỗi trước khi checkout\./);
});

test("checkout validate trả snapshot invalid để UI chặn checkout", { concurrency: false }, async () => {
  await __resetCartStoreForTests();

  const userId = `customer-${Date.now()}-ui-invalid`;
  await __setCartForUserForTests(userId, {
    items: [{ productSlug: "ao-thun-basic-den", variantId: "l-den", quantity: 1, addedAt: Date.now() }],
  });

  const token = await createSession(userId, USER_ROLES.CUSTOMER);
  const response = await getCart(
    new Request("http://localhost/api/cart?mode=checkout", {
      headers: {
        cookie: `session_token=${token}`,
      },
    }),
  );

  assert.equal(response.status, 409);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.state, "error");
  assert.equal(payload.error, "CART_INVALID");
  assert.equal(Boolean(payload.data), true);
  assert.equal(payload.data.isValid, false);
  assert.equal(payload.data.invalidItems.length > 0, true);
});
