import { randomUUID } from "node:crypto";

import { requireApiRole } from "../../../../modules/identity/authorization.js";
import { USER_ROLES } from "../../../../modules/identity/user-store.js";
import { getIntegrationHealthSnapshot } from "../../../../shared/config/integration-profile.js";

function jsonWithCorrelation(body, status, correlationId) {
  return Response.json(body, {
    status,
    headers: {
      "X-Correlation-Id": correlationId,
    },
  });
}

function jsonSuccess(data, correlationId, status = 200) {
  return jsonWithCorrelation({ success: true, state: "success", data }, status, correlationId);
}

export async function GET(request) {
  const correlationId = randomUUID();
  const access = await requireApiRole(request, [USER_ROLES.ADMIN]);
  if (!access.ok) {
    return access.response;
  }

  const integrations = getIntegrationHealthSnapshot();
  return jsonSuccess({ integrations }, correlationId);
}
