import assert from "node:assert/strict";
import test from "node:test";

import { createSession } from "../../../../modules/identity/session-store.js";
import { createUser, USER_ROLES, __resetUserStoreForTests } from "../../../../modules/identity/user-store.js";
import { GET as getAdminConfig } from "./route.js";

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

test("admin config GET chặn request chưa đăng nhập", { concurrency: false }, async () => {
  await __resetUserStoreForTests();

  const response = await getAdminConfig(createRequest("/api/admin/config"));
  assert.equal(response.status, 401);

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_UNAUTHORIZED");
});

test("admin config GET trả integration profile an toàn", { concurrency: false }, async () => {
  await __resetUserStoreForTests();

  const admin = await seedUser(USER_ROLES.ADMIN, "admin-config-ok");
  const adminToken = await createSession(admin.id, USER_ROLES.ADMIN);

  const response = await getAdminConfig(createRequest("/api/admin/config", { token: adminToken }));
  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.state, "success");

  assert.equal(typeof payload.data.integrations.ai.profile, "string");
  assert.equal(typeof payload.data.integrations.payment.provider, "string");
  assert.equal(typeof payload.data.integrations.shipping.endpointAlias, "string");

  const hosts = [
    payload.data.integrations.ai.endpointHostMasked,
    payload.data.integrations.payment.endpointHostMasked,
    payload.data.integrations.shipping.endpointHostMasked,
  ];

  for (const host of hosts) {
    assert.equal(typeof host, "string");
    assert.equal(host.includes("***."), true);
    assert.equal(host.includes("https://"), false);
    assert.equal(host.includes("token"), false);
    assert.equal(host.includes("secret"), false);
  }
});
