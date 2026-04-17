import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  isTerminalTrackingStatus,
  resolveNextActionText,
  resolveStatusCue,
  shouldSchedulePollingForOrder,
} from "./order-detail-client-logic.js";

test("order detail client có loading/error states", async () => {
  const source = await readFile(new URL("./order-detail-client.tsx", import.meta.url), "utf8");

  assert.match(source, /Đang tải chi tiết đơn hàng/);
  assert.match(source, /Không thể tải chi tiết đơn hàng/);
  assert.match(source, /Không thể kết nối tới máy chủ/);
});

test("order detail client render summary, timeline và tracking fallback", async () => {
  const source = await readFile(new URL("./order-detail-client.tsx", import.meta.url), "utf8");

  assert.match(source, /Trạng thái đơn:/);
  assert.match(source, /Trạng thái thanh toán:/);
  assert.match(source, /Theo dõi đơn hàng/);
  assert.match(source, /Chưa có mã tracking/);
  assert.match(source, /resolveRecoveryPrimaryAction/);
  assert.match(source, /Đồng bộ vận chuyển đang ở chế độ dự phòng/);
  assert.match(source, /<FeedbackMessage[\s\S]*tone="warning"/);
  assert.match(source, /aria-label="Timeline trạng thái đơn hàng"/);
  assert.match(source, /Hành động tiếp theo:/);
  assert.match(source, /aria-label="Danh sách sản phẩm trong đơn"/);
  assert.match(source, /Tổng cộng:/);
});

test("order detail client có polling 15 giây và stop condition", async () => {
  const source = await readFile(new URL("./order-detail-client.tsx", import.meta.url), "utf8");

  assert.match(source, /15_000/);
  assert.match(source, /clearTimeout/);
  assert.match(source, /inFlightRef/);
  assert.match(source, /latestOrderRef/);
  assert.match(source, /shouldSchedulePollingForOrder/);
  assert.match(source, /schedulePolling\(latestOrderRef\.current\)/);
});

test("tracking logic mapping nhất quán cho action và terminal state", () => {
  assert.equal(resolveNextActionText("retry_payment").includes("Thanh toán lại"), true);
  assert.equal(resolveNextActionText("contact_support").includes("Liên hệ hỗ trợ"), true);
  assert.equal(resolveStatusCue("payment_failed"), "Cần xử lý");
  assert.equal(isTerminalTrackingStatus("payment_failed"), false);
  assert.equal(isTerminalTrackingStatus("delivered"), true);
});

test("polling guard logic xử lý terminal và null order đúng", () => {
  assert.equal(shouldSchedulePollingForOrder(null), true);
  assert.equal(shouldSchedulePollingForOrder({ tracking: { status: "processing" } }), true);
  assert.equal(shouldSchedulePollingForOrder({ tracking: { status: "delivered" } }), false);
  assert.equal(shouldSchedulePollingForOrder({ tracking: { status: "cancelled" } }), false);
});
