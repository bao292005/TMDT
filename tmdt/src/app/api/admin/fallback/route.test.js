import assert from "node:assert/strict";
import test from "node:test";

import { createSession } from "../../../../modules/identity/session-store.js";
import {
  __resetAuditLogStoreForTests,
  appendFallbackAuditEvent,
} from "../../../../modules/identity/audit-log-store.js";
import { createUser, USER_ROLES, __resetUserStoreForTests } from "../../../../modules/identity/user-store.js";
import { __resetReconciliationStoreForTests } from "../../../../modules/order/reconciliation-store.js";
import { GET as getFallbackSummary } from "./route.js";

function createRequest(path, { token } = {}) {
  const headers = new Headers();
  if (token) {
    headers.set("cookie", `session_token=${token}`);
  }

  return new Request(`http://localhost${path}`, {
    method: "GET",
    headers,
  });
}

async function seedUser(role, emailPrefix) {
  const created = await createUser({
    email: `${emailPrefix}-${Date.now()}-${Math.random()}@example.com`,
    passwordHash: "hash",
    role,
  });
  assert.equal(created.success, true);
  return created.user;
}

test("admin fallback GET chặn request chưa đăng nhập", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetAuditLogStoreForTests();
  await __resetReconciliationStoreForTests();

  const response = await getFallbackSummary(createRequest("/api/admin/fallback"));
  assert.equal(response.status, 401);

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_UNAUTHORIZED");
});

test("admin fallback GET chặn role không phải admin", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetAuditLogStoreForTests();
  await __resetReconciliationStoreForTests();

  const customer = await seedUser(USER_ROLES.CUSTOMER, "admin-fallback-forbidden");
  const token = await createSession(customer.id, USER_ROLES.CUSTOMER);

  const response = await getFallbackSummary(createRequest("/api/admin/fallback", { token }));
  assert.equal(response.status, 403);

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_FORBIDDEN");
});

test("admin fallback GET trả fallback summary + reconciliation link", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetAuditLogStoreForTests();
  await __resetReconciliationStoreForTests();

  const admin = await seedUser(USER_ROLES.ADMIN, "admin-fallback-ok");
  const token = await createSession(admin.id, USER_ROLES.ADMIN);

  await appendFallbackAuditEvent({
    actorId: "system-tryon",
    orderId: "order-1",
    correlationId: "corr-1",
    source: "ai",
    reason: "AI_TIMEOUT",
    actionTaken: "fallback_retry_tryon",
    status: "activated",
    retryable: true,
  });

  await appendFallbackAuditEvent({
    actorId: "system-tryon",
    orderId: "order-1",
    correlationId: "corr-2",
    source: "ai",
    reason: "AI_TIMEOUT",
    actionTaken: "fallback_resolved_tryon_success",
    status: "recovered",
    retryable: false,
  });

  await appendFallbackAuditEvent({
    actorId: "system-payment",
    orderId: "order-2",
    correlationId: "corr-3",
    source: "payment",
    reason: "PAYMENT_PROVIDER_UNAVAILABLE",
    actionTaken: "fallback_retry_payment_init",
    status: "activated",
    retryable: true,
  });

  const response = await getFallbackSummary(
    createRequest("/api/admin/fallback?limit=20&reconciliationLimit=5", { token }),
  );

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.state, "success");

  assert.equal(payload.data.fallback.totals.activated, 2);
  assert.equal(payload.data.fallback.totals.recovered, 1);
  assert.equal(payload.data.fallback.totals.unresolved, 1);

  const aiSummary = payload.data.fallback.bySource.find((item) => item.source === "ai");
  assert.ok(aiSummary);
  assert.equal(aiSummary.activated, 1);
  assert.equal(aiSummary.recovered, 1);
  assert.equal(aiSummary.unresolved, 0);

  const paymentSummary = payload.data.fallback.bySource.find((item) => item.source === "payment");
  assert.ok(paymentSummary);
  assert.equal(paymentSummary.activated, 1);
  assert.equal(paymentSummary.recovered, 0);
  assert.equal(paymentSummary.unresolved, 1);

  assert.equal(Array.isArray(payload.data.reconciliation.openMismatches), true);
  assert.equal(Array.isArray(payload.data.reconciliation.resolvedMismatches), true);
}
);
