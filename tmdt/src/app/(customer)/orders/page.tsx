import { getAuthenticatedSession } from "@/modules/identity/auth-service.js";
import { readRoleFromCookieValue } from "@/modules/identity/session-context.js";
import { USER_ROLES } from "@/modules/identity/user-store.js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { OrdersClient } from "./orders-client";

const SESSION_COOKIE = "session_token";
const SESSION_ROLE_COOKIE = "session_role";

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const roleValue = cookieStore.get(SESSION_ROLE_COOKIE)?.value;
  const role = readRoleFromCookieValue(roleValue);
  const session = await getAuthenticatedSession(token);

  if (!session) {
    redirect("/login");
  }

  if (role !== USER_ROLES.CUSTOMER || session.role !== USER_ROLES.CUSTOMER) {
    redirect("/forbidden");
  }

  return <OrdersClient />;
}
