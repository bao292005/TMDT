import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthenticatedSession } from "@/modules/identity/auth-service.js";
import { readRoleFromCookieValue } from "@/modules/identity/session-context.js";
import { USER_ROLES } from "@/modules/identity/user-store.js";

import { OperatorQueueBoard } from "./operator-queue-board";

const SESSION_COOKIE = "session_token";
const SESSION_ROLE_COOKIE = "session_role";

export default async function WarehouseQueuePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const roleValue = cookieStore.get(SESSION_ROLE_COOKIE)?.value;
  const role = readRoleFromCookieValue(roleValue);
  const session = await getAuthenticatedSession(token);

  if (!session) {
    redirect("/login");
  }

  if (role !== USER_ROLES.WAREHOUSE || session.role !== USER_ROLES.WAREHOUSE) {
    redirect("/forbidden");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold">Warehouse Queue</h1>
      <OperatorQueueBoard />
    </main>
  );
}
