import { randomUUID } from "node:crypto";

import { requireApiRole } from "@/modules/identity/authorization.js";
import { USER_ROLES } from "@/modules/identity/user-store.js";

export async function GET(request) {
  const access = await requireApiRole(request, [USER_ROLES.ADMIN]);
  if (!access.ok) {
    return access.response;
  }

  return Response.json(
    {
      success: true,
      data: {
        area: "admin",
        userId: access.session.userId,
        role: access.session.role,
      },
    },
    {
      status: 200,
      headers: {
        "X-Correlation-Id": randomUUID(),
      },
    },
  );
}
