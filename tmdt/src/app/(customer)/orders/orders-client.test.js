import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("orders client có loading/empty/error states", async () => {
  const source = await readFile(new URL("./orders-client.tsx", import.meta.url), "utf8");

  assert.match(source, /Đang tải đơn hàng/);
  assert.match(source, /Bạn chưa có đơn hàng nào/);
  assert.match(source, /Không thể tải danh sách đơn hàng/);
});

test("orders client render semantic list và link detail", async () => {
  const source = await readFile(new URL("./orders-client.tsx", import.meta.url), "utf8");

  assert.match(source, /aria-label="Danh sách đơn hàng"/);
  assert.match(source, /<ul className="space-y-3"/);
  assert.match(source, /href=\{`\/orders\/\$\{order\.id\}`\}/);
});
