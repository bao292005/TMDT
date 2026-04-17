import { getAuthenticatedSession } from "@/modules/identity/auth-service.js";
import { USER_ROLES } from "@/modules/identity/user-store.js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CartClient } from "./cart-client";

const SESSION_COOKIE = "session_token";

export default async function CartPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await getAuthenticatedSession(token);

  if (!session) {
    redirect("/login");
  }

  if (session.role !== USER_ROLES.CUSTOMER) {
    redirect("/forbidden");
  }

  return <CartClient />;
}
