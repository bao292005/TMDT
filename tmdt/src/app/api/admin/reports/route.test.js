import assert from "node:assert/strict";
import test from "node:test";

import { createSession } from "../../../../modules/identity/session-store.js";
import { createUser, USER_ROLES, __resetUserStoreForTests } from "../../../../modules/identity/user-store.js";
import { __resetAdminReportsForTests } from "../../../../modules/reporting/report-store.js";
import { GET as getReportsHistory, POST as postReport } from "./route.js";

async function setupAdminContext() {
  const created = await createUser({
    email: `admin-report-${Date.now()}@example.com`,
    passwordHash: "hash",
    role: USER_ROLES.ADMIN,
    name: "Admin Report"
  });
  const token = await createSession(created.user.id, USER_ROLES.ADMIN);
  return { user: created.user, token };
}

test("admin reports POST validation and create job", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetAdminReportsForTests();

  const { token } = await setupAdminContext();
  
  // Test missing info
  let req = new Request("http://localhost/api/admin/reports", {
    method: "POST",
    headers: { cookie: `session_token=${token}` },
    body: JSON.stringify({ type: "Order" })
  });
  let res = await postReport(req);
  let payload = await res.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error.code, "INVALID_PARAMS");

  // Test success
  req = new Request("http://localhost/api/admin/reports", {
    method: "POST",
    headers: { cookie: `session_token=${token}` },
    body: JSON.stringify({ type: "Revenue", format: "PDF", startDate: "2023-01-01", endDate: "2023-12-31" })
  });
  res = await postReport(req);
  payload = await res.json();
  assert.equal(payload.success, true);
  assert.ok(payload.data.job.id);
  assert.equal(payload.data.job.type, "Revenue");
});

test("admin reports GET history", { concurrency: false }, async () => {
  await __resetUserStoreForTests();
  await __resetAdminReportsForTests();

  const { token } = await setupAdminContext();
  
  // Ensure we have a job created
  const postReq = new Request("http://localhost/api/admin/reports", {
    method: "POST",
    headers: { cookie: `session_token=${token}` },
    body: JSON.stringify({ type: "Order", format: "CSV", startDate: "2023-01-01", endDate: "2023-12-31" })
  });
  await postReport(postReq);

  const req = new Request("http://localhost/api/admin/reports", {
    headers: { cookie: `session_token=${token}` }
  });
  const res = await getReportsHistory(req);
  const payload = await res.json();
  assert.equal(payload.success, true);
  assert.ok(payload.data.jobs.length >= 1);
  assert.equal(payload.data.jobs[0].type, "Order");
});
