import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  formatTimelineTimestamp,
  resolveCheckoutFieldError,
  shouldRedirectToLogin,
} from "./checkout-client-logic.js";

test("checkout logic: redirect khi unauthorized hoặc forbidden", () => {
  assert.equal(shouldRedirectToLogin(401), true);
  assert.equal(shouldRedirectToLogin(403), true);
  assert.equal(shouldRedirectToLogin(200, "AUTH_UNAUTHORIZED"), true);
  assert.equal(shouldRedirectToLogin(200, "AUTH_FORBIDDEN"), true);
  assert.equal(shouldRedirectToLogin(200), false);
});

test("checkout logic: resolve field error theo address/shipping/payment", () => {
  assert.equal(resolveCheckoutFieldError("", "express", "online"), "address");
  assert.equal(resolveCheckoutFieldError("so 1", "express", "online"), "addressFormat");
  assert.equal(resolveCheckoutFieldError("1 Nguyen Trai", "", "online"), "shippingMethod");
  assert.equal(resolveCheckoutFieldError("1 Nguyen Trai", "express", ""), "paymentMethod");
  assert.equal(resolveCheckoutFieldError("1 Nguyen Trai", "express", "online"), null);
});

test("checkout logic: format timeline timestamp có fallback", () => {
  assert.equal(formatTimelineTimestamp(null), "Chưa có mốc thời gian");
  assert.equal(formatTimelineTimestamp(""), "Chưa có mốc thời gian");
  assert.equal(formatTimelineTimestamp("invalid-date"), "Chưa có mốc thời gian");
  assert.match(formatTimelineTimestamp("2026-04-13T10:00:00.000Z"), /\d{1,2}/);
});

test("checkout client giữ accessibility semantics", async () => {
  const source = await readFile(new URL("./checkout-client.tsx", import.meta.url), "utf8");

  assert.match(source, /focusFirstErrorField/);
  assert.match(source, /addressRef\.current\?\.focus\(\)/);
  assert.match(source, /customAddressRef\.current\?\.focus\(\)/);
  assert.match(source, /shippingRef\.current\?\.focus\(\)/);
  assert.match(source, /paymentRef\.current\?\.focus\(\)/);
  assert.match(source, /aria-invalid=\{fieldError === "address"\}/);
  assert.match(source, /aria-invalid=\{fieldError === "shippingMethod"\}/);
  assert.match(source, /aria-invalid=\{fieldError === "paymentMethod"\}/);
  assert.match(source, /retryPaymentRef\.current\?\.focus\(\)/);
  assert.match(source, /ref=\{retryPaymentRef\}/);
  assert.match(source, /focus-visible:ring-2/);
  assert.match(source, /<ol className="space-y-2 rounded border border-zinc-200 bg-zinc-50 px-4 py-3" aria-label="Timeline trạng thái thanh toán">/);
  assert.match(source, /<li className="text-sm text-zinc-800">/);
  assert.match(source, /Mốc thời gian:/);
  assert.match(source, /Hành động tiếp theo:/);
});
