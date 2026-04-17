import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildWarehouseActionSuccessMessage,
  resolveWarehouseActionLabel,
  resolveWarehouseErrorMessage,
  shouldRedirectWarehouseAuth,
} from "./operator-queue-board-logic.js";

test("operator queue board wiring có endpoint warehouse", async () => {
  const source = await readFile(new URL("./operator-queue-board.tsx", import.meta.url), "utf8");

  assert.match(source, /\/api\/warehouse\/queue/);
  assert.match(source, /\/api\/warehouse\/actions/);
});

test("operator queue logic mapping action label và success message", () => {
  assert.equal(resolveWarehouseActionLabel("pick"), "Pick hàng");
  assert.equal(resolveWarehouseActionLabel("pack"), "Đóng gói");
  assert.equal(resolveWarehouseActionLabel("create_shipment"), "Tạo vận đơn");

  const message = buildWarehouseActionSuccessMessage("create_shipment", {
    id: "order-1",
    trackingNumber: "TRK-ABC",
  });
  assert.match(message, /TRK-ABC/);
});

test("operator queue logic xử lý redirect auth theo status/error", () => {
  assert.equal(shouldRedirectWarehouseAuth(401, undefined), true);
  assert.equal(shouldRedirectWarehouseAuth(403, undefined), true);
  assert.equal(shouldRedirectWarehouseAuth(200, "AUTH_UNAUTHORIZED"), true);
  assert.equal(shouldRedirectWarehouseAuth(200, "AUTH_FORBIDDEN"), true);
  assert.equal(shouldRedirectWarehouseAuth(200, undefined), false);
});

test("operator queue logic resolve error message ưu tiên payload message", () => {
  assert.equal(resolveWarehouseErrorMessage({ message: "Lỗi tùy chỉnh" }, "fallback"), "Lỗi tùy chỉnh");
  assert.equal(resolveWarehouseErrorMessage({ message: "   " }, "fallback"), "fallback");
  assert.equal(resolveWarehouseErrorMessage({}, "fallback"), "fallback");
});
