import assert from "node:assert/strict";
import test from "node:test";

import { PUT as putAccountStatus } from "./admin/users/[userId]/account-status/route.js";
import { PUT as putProfile } from "./profile/route.js";
import { login, getUserById } from "../../modules/identity/auth-service.js";
import { listAuditLogs } from "../../modules/identity/audit-log-store.js";
import { hashPassword } from "../../modules/identity/password.js";
import { createSession } from "../../modules/identity/session-store.js";
import {
  createUser,
  USER_ACCOUNT_STATUS,
  USER_ROLES,
} from "../../modules/identity/user-store.js";

function createJsonRequest(path, token, body) {
  return new Request(`http://localhost${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      cookie: `session_token=${token}`,
    },
    body: JSON.stringify(body),
  });
}

test("profile API cập nhật hồ sơ hợp lệ", async () => {
  const customer = await createUser({
    email: `profile-ok-${Date.now()}@example.com`,
    passwordHash: hashPassword("Password123"),
    role: USER_ROLES.CUSTOMER,
  });
  assert.equal(customer.success, true);

  const token = await createSession(customer.user.id, USER_ROLES.CUSTOMER);
  const response = await putProfile(
    createJsonRequest("/api/profile", token, {
      fullName: "Nguyen Van A",
      phone: "+84901234567",
      addresses: ["1 Nguyen Trai", "2 Le Loi"],
    }),
  );

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.profile.fullName, "Nguyen Van A");
  assert.equal(payload.data.profile.addresses.length, 2);
});

test("profile API chặn payload vượt quá 3 địa chỉ", async () => {
  const customer = await createUser({
    email: `profile-invalid-${Date.now()}@example.com`,
    passwordHash: hashPassword("Password123"),
    role: USER_ROLES.CUSTOMER,
  });
  assert.equal(customer.success, true);

  const token = await createSession(customer.user.id, USER_ROLES.CUSTOMER);
  const response = await putProfile(
    createJsonRequest("/api/profile", token, {
      fullName: "Nguyen Van B",
      phone: "+84901111222",
      addresses: ["A", "B", "C", "D"],
    }),
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "INVALID_INPUT");
});

test("lock/unlock API: đúng quyền, sai quyền và audit log", async () => {
  const admin = await createUser({
    email: `admin-${Date.now()}@example.com`,
    passwordHash: hashPassword("Password123"),
    role: USER_ROLES.ADMIN,
  });
  assert.equal(admin.success, true);

  const customer = await createUser({
    email: `lock-target-${Date.now()}@example.com`,
    passwordHash: hashPassword("Password123"),
    role: USER_ROLES.CUSTOMER,
  });
  assert.equal(customer.success, true);

  const adminToken = await createSession(admin.user.id, USER_ROLES.ADMIN);
  const customerToken = await createSession(customer.user.id, USER_ROLES.CUSTOMER);

  const forbiddenResponse = await putAccountStatus(
    createJsonRequest(`/api/admin/users/${customer.user.id}/account-status`, customerToken, {
      status: USER_ACCOUNT_STATUS.LOCKED,
      reason: "customer should not lock",
    }),
    { params: Promise.resolve({ userId: customer.user.id }) },
  );
  assert.equal(forbiddenResponse.status, 403);
  const forbiddenPayload = await forbiddenResponse.json();
  assert.equal(forbiddenPayload.error, "AUTH_FORBIDDEN");

  const lockResponse = await putAccountStatus(
    createJsonRequest(`/api/admin/users/${customer.user.id}/account-status`, adminToken, {
      status: USER_ACCOUNT_STATUS.LOCKED,
      reason: "fraud investigation",
    }),
    { params: Promise.resolve({ userId: customer.user.id }) },
  );
  assert.equal(lockResponse.status, 200);

  const lockedUser = await getUserById(customer.user.id);
  assert.equal(lockedUser.accountStatus, USER_ACCOUNT_STATUS.LOCKED);

  const lockedLogin = await login(customer.user.email, "Password123");
  assert.equal(lockedLogin.success, false);
  assert.equal(lockedLogin.error, "ACCOUNT_LOCKED");

  const unlockResponse = await putAccountStatus(
    createJsonRequest(`/api/admin/users/${customer.user.id}/account-status`, adminToken, {
      status: USER_ACCOUNT_STATUS.ACTIVE,
      reason: "investigation done",
    }),
    { params: Promise.resolve({ userId: customer.user.id }) },
  );
  assert.equal(unlockResponse.status, 200);

  const unlockedUser = await getUserById(customer.user.id);
  assert.equal(unlockedUser.accountStatus, USER_ACCOUNT_STATUS.ACTIVE);

  const auditLogs = await listAuditLogs();
  const lockLog = auditLogs.find(
    (entry) =>
      entry.actorId === admin.user.id &&
      entry.targetUserId === customer.user.id &&
      entry.action === "ADMIN_LOCK_ACCOUNT" &&
      entry.reason === "fraud investigation",
  );

  assert.ok(lockLog);
  assert.ok(lockLog.timestamp);
  assert.ok(lockLog.correlationId);
  assert.equal(Object.hasOwn(lockLog, "password"), false);
  assert.equal(Object.hasOwn(lockLog, "sessionToken"), false);
});

test("admin không được tự lock chính mình", async () => {
  const admin = await createUser({
    email: `self-lock-${Date.now()}@example.com`,
    passwordHash: hashPassword("Password123"),
    role: USER_ROLES.ADMIN,
  });
  assert.equal(admin.success, true);

  const adminToken = await createSession(admin.user.id, USER_ROLES.ADMIN);
  const response = await putAccountStatus(
    createJsonRequest(`/api/admin/users/${admin.user.id}/account-status`, adminToken, {
      status: USER_ACCOUNT_STATUS.LOCKED,
      reason: "self lock",
    }),
    { params: Promise.resolve({ userId: admin.user.id }) },
  );

  assert.equal(response.status, 403);
  const payload = await response.json();
  assert.equal(payload.error, "AUTH_FORBIDDEN");
});
