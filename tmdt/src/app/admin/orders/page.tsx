import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthenticatedSession } from "@/modules/identity/auth-service.js";
import { readRoleFromCookieValue } from "@/modules/identity/session-context.js";
import { USER_ROLES } from "@/modules/identity/user-store.js";

import { AdminOrdersClient } from "./admin-orders-client";

const SESSION_COOKIE = "session_token";
const SESSION_ROLE_COOKIE = "session_role";

export default async function AdminOrdersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const roleValue = cookieStore.get(SESSION_ROLE_COOKIE)?.value;
  const role = readRoleFromCookieValue(roleValue);
  const session = await getAuthenticatedSession(token);

  if (!session) {
    redirect("/login");
  }

  if (role !== USER_ROLES.ADMIN || session.role !== USER_ROLES.ADMIN) {
    redirect("/forbidden");
  }

  return <AdminOrdersClient />;
}
