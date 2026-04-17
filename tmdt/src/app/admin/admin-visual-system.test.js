import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("admin dashboard dùng shared visual primitives", async () => {
  const source = await readFile(new URL("./dashboard/admin-dashboard-client.tsx", import.meta.url), "utf8");

  assert.match(source, /<PageShell title="Thống Kê Vận Hành"/);
  assert.match(source, /<StatePanel state="loading"/);
  assert.match(source, /<FeedbackMessage tone="error"/);
});

test("admin orders dùng button hierarchy và state panels", async () => {
  const source = await readFile(new URL("./orders/admin-orders-client.tsx", import.meta.url), "utf8");

  assert.match(source, /<PageShell title="Quản lý Đơn hàng"/);
  assert.match(source, /variant="ghost"/);
  assert.match(source, /variant=\{isConfirming \? "destructive" : "primary"\}/);
  assert.match(source, /<StatePanel state="empty"/);
});

test("admin exceptions và reports dùng taxonomy loading\/empty\/error", async () => {
  const exceptionsSource = await readFile(new URL("./orders/exceptions/admin-order-exceptions-client.tsx", import.meta.url), "utf8");
  const reportsSource = await readFile(new URL("./reports/admin-reports-client.tsx", import.meta.url), "utf8");

  assert.match(exceptionsSource, /<StatePanel state="loading"/);
  assert.match(exceptionsSource, /<StatePanel state="empty"/);
  assert.match(exceptionsSource, /<FeedbackMessage tone="error"/);

  assert.match(reportsSource, /<PageShell/);
  assert.match(reportsSource, /<FeedbackMessage tone="success"/);
  assert.match(reportsSource, /<StatePanel\s+state="empty"/);
});
