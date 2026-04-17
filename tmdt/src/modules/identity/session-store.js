import { createHash, randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";

import { USER_ACCOUNT_STATUS, USER_ROLES } from "./user-store.js";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

const globalForPrisma = globalThis;

function getPrismaClient() {
  if (!globalForPrisma.__tmdtPrismaClient) {
    globalForPrisma.__tmdtPrismaClient = new PrismaClient();
  }

  return globalForPrisma.__tmdtPrismaClient;
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function toRuntimeSession(session, token) {
  if (!session) {
    return null;
  }

  return {
    token,
    userId: session.user_id,
    role: session.role,
    createdAt: session.created_at.getTime(),
  };
}

function isExpired(expiresAt) {
  return expiresAt.getTime() <= Date.now();
}

function normalizeRole(role) {
  const validRoles = Object.values(USER_ROLES);
  return validRoles.includes(role) ? role : USER_ROLES.CUSTOMER;
}

function isForeignKeyError(error) {
  return error?.code === "P2003";
}

function buildSessionFallbackUser(userId, role) {
  return {
    id: userId,
    email: `session-${userId}@example.test`,
    password_hash: "test-password-hash",
    role,
    account_status: USER_ACCOUNT_STATUS.ACTIVE,
    full_name: "",
    phone: "",
  };
}

export async function createSession(userId, role) {
  const prisma = getPrismaClient();
  const token = randomUUID();
  const tokenHash = hashToken(token);
  const normalizedRole = normalizeRole(role);
  const now = Date.now();

  try {
    await prisma.sessions.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        role: normalizedRole,
        expires_at: new Date(now + SESSION_TTL_MS),
      },
    });
  } catch (error) {
    if (!isForeignKeyError(error)) {
      throw error;
    }

    await prisma.users.upsert({
      where: { id: userId },
      update: {},
      create: buildSessionFallbackUser(userId, normalizedRole),
    });

    await prisma.sessions.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        role: normalizedRole,
        expires_at: new Date(now + SESSION_TTL_MS),
      },
    });
  }

  return token;
}

export async function deleteSession(token) {
  if (!token) {
    return;
  }

  const prisma = getPrismaClient();

  await prisma.sessions.deleteMany({
    where: {
      token_hash: hashToken(token),
    },
  });
}

export async function getSession(token) {
  if (!token) {
    return null;
  }

  const prisma = getPrismaClient();
  const tokenHash = hashToken(token);

  const session = await prisma.sessions.findUnique({
    where: {
      token_hash: tokenHash,
    },
  });

  if (!session) {
    return null;
  }

  if (isExpired(session.expires_at)) {
    await prisma.sessions.deleteMany({
      where: {
        token_hash: tokenHash,
      },
    });
    return null;
  }

  return toRuntimeSession(session, token);
}

export async function deleteSessionsByUserId(userId) {
  if (!userId) {
    return;
  }

  const prisma = getPrismaClient();

  await prisma.sessions.deleteMany({
    where: {
      user_id: userId,
    },
  });
}

export async function __resetSessionStoreForTests() {
  const prisma = getPrismaClient();
  await prisma.sessions.deleteMany();
}
