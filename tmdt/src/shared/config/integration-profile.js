const PRODUCTION_GUARD_FLAG = "INTEGRATION_ALLOW_PRODUCTION";

const INTEGRATION_CONFIG = {
  ai: {
    envKey: "AI_INTEGRATION_PROFILE",
    defaultProfile: "mock",
    profiles: {
      mock: {
        provider: "ai-mock",
        endpointAlias: "mock",
        endpoint: "https://ai.mock.local/try-on",
        policy: {
          timeoutMs: 600,
          maxAttempts: 2,
          backoffMs: [40, 80],
        },
      },
      sandbox: {
        provider: "ai-sandbox",
        endpointAlias: "sandbox",
        endpoint: "https://sandbox-ai.example.com/try-on",
        policy: {
          timeoutMs: 900,
          maxAttempts: 3,
          backoffMs: [80, 160, 320],
        },
      },
      production: {
        provider: "ai-live",
        endpointAlias: "production",
        endpoint: "https://ai.example.com/try-on",
        policy: {
          timeoutMs: 1_200,
          maxAttempts: 3,
          backoffMs: [120, 240, 480],
        },
      },
    },
  },
  payment: {
    envKey: "PAYMENT_INTEGRATION_PROFILE",
    defaultProfile: "sandbox",
    profiles: {
      mock: {
        provider: "mock-gateway",
        endpointAlias: "mock",
        endpoint: "https://mock-pay.example.com/checkout",
        policy: {
          timeoutMs: 800,
          maxAttempts: 2,
          backoffMs: [50, 100],
        },
      },
      sandbox: {
        provider: "sandbox-gateway",
        endpointAlias: "sandbox",
        endpoint: "https://sandbox-pay.example.com/checkout",
        policy: {
          timeoutMs: 1_200,
          maxAttempts: 3,
          backoffMs: [100, 200, 400],
        },
      },
      production: {
        provider: "live-gateway",
        endpointAlias: "production",
        endpoint: "https://pay.example.com/checkout",
        policy: {
          timeoutMs: 1_500,
          maxAttempts: 3,
          backoffMs: [150, 300, 600],
        },
      },
    },
  },
  shipping: {
    envKey: "SHIPPING_INTEGRATION_PROFILE",
    defaultProfile: "sandbox",
    profiles: {
      mock: {
        provider: "shipping-mock",
        endpointAlias: "mock",
        endpoint: "https://mock-shipping.example.com/tracking",
        policy: {
          timeoutMs: 700,
          maxAttempts: 2,
          backoffMs: [40, 80],
        },
      },
      sandbox: {
        provider: "shipping-sandbox",
        endpointAlias: "sandbox",
        endpoint: "https://sandbox-shipping.example.com/tracking",
        policy: {
          timeoutMs: 1_200,
          maxAttempts: 3,
          backoffMs: [100, 200, 400],
        },
      },
      production: {
        provider: "shipping-live",
        endpointAlias: "production",
        endpoint: "https://shipping.example.com/tracking",
        policy: {
          timeoutMs: 1_500,
          maxAttempts: 3,
          backoffMs: [150, 300, 600],
        },
      },
    },
  },
};

function normalizeProfile(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function maskHost(endpoint) {
  if (typeof endpoint !== "string" || !endpoint.trim()) {
    return "unknown";
  }

  try {
    const parsed = new URL(endpoint);
    const hostname = parsed.hostname;
    if (!hostname) {
      return "unknown";
    }

    const parts = hostname.split(".");
    if (parts.length <= 2) {
      return `***.${parts[parts.length - 1]}`;
    }

    return `***.${parts.slice(-2).join(".")}`;
  } catch {
    return "unknown";
  }
}

function isProductionAllowed(env) {
  return String(env[PRODUCTION_GUARD_FLAG]).trim().toLowerCase() === "true";
}

function resolveRequestedProfile(definition, env) {
  const laneProfile = normalizeProfile(env[definition.envKey]);
  const globalProfile = normalizeProfile(env.INTEGRATION_PROFILE);
  return laneProfile || globalProfile || definition.defaultProfile;
}

function normalizeEnv(env) {
  return env && typeof env === "object" ? env : process.env;
}

function normalizePolicy(policy = {}) {
  const timeoutMs = Number.isFinite(policy.timeoutMs) ? Math.max(50, Math.trunc(policy.timeoutMs)) : 1_000;
  const maxAttempts = Number.isFinite(policy.maxAttempts) ? Math.min(3, Math.max(1, Math.trunc(policy.maxAttempts))) : 1;
  const backoffMs = Array.isArray(policy.backoffMs)
    ? policy.backoffMs.map((value) => (Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0)).slice(0, maxAttempts)
    : [];

  return {
    timeoutMs,
    maxAttempts,
    backoffMs,
  };
}

function resolveLaneConfig(lane, env) {
  const definition = INTEGRATION_CONFIG[lane];
  if (!definition) {
    throw new Error(`INTEGRATION_LANE_UNKNOWN: ${lane}`);
  }

  const requestedProfile = resolveRequestedProfile(definition, env);
  if (!Object.prototype.hasOwnProperty.call(definition.profiles, requestedProfile)) {
    throw new Error(
      `INTEGRATION_PROFILE_INVALID: lane=${lane}, profile=${requestedProfile}, allowed=${Object.keys(definition.profiles).join(",")}`,
    );
  }

  const effectiveProfile =
    requestedProfile === "production" && !isProductionAllowed(env) ? definition.defaultProfile : requestedProfile;

  const profileConfig = definition.profiles[effectiveProfile];

  return {
    lane,
    requestedProfile,
    profile: effectiveProfile,
    provider: profileConfig.provider,
    endpointAlias: profileConfig.endpointAlias,
    endpoint: profileConfig.endpoint,
    endpointHostMasked: maskHost(profileConfig.endpoint),
    policy: normalizePolicy(profileConfig.policy),
  };
}

export function getIntegrationAdapterConfig(lane, { env = process.env } = {}) {
  const safeEnv = normalizeEnv(env);
  return resolveLaneConfig(lane, safeEnv);
}

export function getIntegrationHealthSnapshot({ env = process.env } = {}) {
  const safeEnv = normalizeEnv(env);
  const ai = resolveLaneConfig("ai", safeEnv);
  const payment = resolveLaneConfig("payment", safeEnv);
  const shipping = resolveLaneConfig("shipping", safeEnv);

  return {
    ai: {
      profile: ai.profile,
      provider: ai.provider,
      endpointAlias: ai.endpointAlias,
      endpointHostMasked: ai.endpointHostMasked,
    },
    payment: {
      profile: payment.profile,
      provider: payment.provider,
      endpointAlias: payment.endpointAlias,
      endpointHostMasked: payment.endpointHostMasked,
    },
    shipping: {
      profile: shipping.profile,
      provider: shipping.provider,
      endpointAlias: shipping.endpointAlias,
      endpointHostMasked: shipping.endpointHostMasked,
    },
  };
}

export function assertIntegrationProfiles({ env = process.env } = {}) {
  const safeEnv = normalizeEnv(env);
  resolveLaneConfig("ai", safeEnv);
  resolveLaneConfig("payment", safeEnv);
  resolveLaneConfig("shipping", safeEnv);
}

assertIntegrationProfiles();
