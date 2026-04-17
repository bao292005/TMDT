import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

function getPrismaClient() {
  if (!globalForPrisma.__tmdtPrismaClient) {
    globalForPrisma.__tmdtPrismaClient = new PrismaClient();
  }

  return globalForPrisma.__tmdtPrismaClient;
}

export const USER_ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  WAREHOUSE: "warehouse",
};

export const USER_ACCOUNT_STATUS = {
  ACTIVE: "active",
  LOCKED: "locked",
};

export const MAX_USER_ADDRESSES = 3;

const VALID_ROLES = new Set(Object.values(USER_ROLES));
const VALID_ACCOUNT_STATUS = new Set(Object.values(USER_ACCOUNT_STATUS));

function normalizeProfile(profile) {
  const source = profile && typeof profile === "object" ? profile : {};
  const fullName = typeof source.fullName === "string" ? source.fullName : "";
  const phone = typeof source.phone === "string" ? source.phone : "";
  const addresses = Array.isArray(source.addresses)
    ? source.addresses
        .filter((address) => typeof address === "string")
        .map((address) => address.trim())
        .filter(Boolean)
        .slice(0, MAX_USER_ADDRESSES)
    : [];

  return { fullName, phone, addresses };
}

function normalizeRole(role) {
  return VALID_ROLES.has(role) ? role : USER_ROLES.CUSTOMER;
}

function normalizeAccountStatus(accountStatus) {
  return VALID_ACCOUNT_STATUS.has(accountStatus) ? accountStatus : USER_ACCOUNT_STATUS.ACTIVE;
}

function toRuntimeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    passwordHash: user.password_hash,
    role: normalizeRole(user.role),
    accountStatus: normalizeAccountStatus(user.account_status),
    profile: {
      fullName: user.full_name ?? "",
      phone: user.phone ?? "",
      addresses: Array.isArray(user.addresses)
        ? user.addresses
            .slice()
            .sort((left, right) => left.position - right.position)
            .map((address) => address.address_line)
        : [],
    },
    createdAt: user.created_at?.toISOString(),
    updatedAt: user.updated_at?.toISOString(),
  };
}

function isEmailUniqueConstraintError(error) {
  if (!error || error.code !== "P2002") {
    return false;
  }

  const targets = Array.isArray(error.meta?.target)
    ? error.meta.target
    : typeof error.meta?.target === "string"
      ? [error.meta.target]
      : [];

  return targets.some((target) => String(target).includes("email"));
}

export async function findUserByEmail(email) {
  const prisma = getPrismaClient();
  const user = await prisma.users.findUnique({
    where: { email },
    include: {
      addresses: {
        orderBy: { position: "asc" },
      },
    },
  });

  return toRuntimeUser(user);
}

export async function findUserById(userId) {
  const prisma = getPrismaClient();
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      addresses: {
        orderBy: { position: "asc" },
      },
    },
  });

  return toRuntimeUser(user);
}

export async function createUser({ email, passwordHash, role = USER_ROLES.CUSTOMER }) {
  const prisma = getPrismaClient();
  const normalizedRole = normalizeRole(role);

  try {
    const created = await prisma.users.create({
      data: {
        email,
        password_hash: passwordHash,
        role: normalizedRole,
        account_status: USER_ACCOUNT_STATUS.ACTIVE,
        full_name: "",
        phone: "",
      },
      include: {
        addresses: {
          orderBy: { position: "asc" },
        },
      },
    });

    return { success: true, user: toRuntimeUser(created) };
  } catch (error) {
    if (isEmailUniqueConstraintError(error)) {
      return { success: false, error: "EMAIL_ALREADY_EXISTS" };
    }

    throw error;
  }
}

export async function updateUserProfile(userId, profile) {
  const prisma = getPrismaClient();
  const normalizedProfile = normalizeProfile(profile);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.users.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "USER_NOT_FOUND" };
    }

    await tx.users.update({
      where: { id: userId },
      data: {
        full_name: normalizedProfile.fullName,
        phone: normalizedProfile.phone,
      },
    });

    await tx.user_addresses.deleteMany({
      where: { user_id: userId },
    });

    if (normalizedProfile.addresses.length > 0) {
      await tx.user_addresses.createMany({
        data: normalizedProfile.addresses.map((address, index) => ({
          user_id: userId,
          address_line: address,
          position: index,
        })),
      });
    }

    const updated = await tx.users.findUnique({
      where: { id: userId },
      include: {
        addresses: {
          orderBy: { position: "asc" },
        },
      },
    });

    return { success: true, user: toRuntimeUser(updated) };
  });
}

export async function updateUserAccountStatus(userId, accountStatus) {
  if (!VALID_ACCOUNT_STATUS.has(accountStatus)) {
    return { success: false, error: "INVALID_ACCOUNT_STATUS" };
  }

  const prisma = getPrismaClient();

  try {
    const updated = await prisma.users.update({
      where: { id: userId },
      data: { account_status: accountStatus },
      include: {
        addresses: {
          orderBy: { position: "asc" },
        },
      },
    });

    return { success: true, user: toRuntimeUser(updated) };
  } catch (error) {
    if (error?.code === "P2025") {
      return { success: false, error: "USER_NOT_FOUND" };
    }

    throw error;
  }
}

export async function __resetUserStoreForTests() {
  const prisma = getPrismaClient();

  await prisma.payment_callbacks.deleteMany();
  await prisma.payment_transactions.deleteMany();
  await prisma.order_items.deleteMany();
  await prisma.shipments.deleteMany();
  await prisma.orders.deleteMany();
  await prisma.sessions.deleteMany();
  await prisma.user_addresses.deleteMany();
  await prisma.carts.deleteMany();
  await prisma.users.deleteMany();
}
