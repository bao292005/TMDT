import { createSession, deleteSession, deleteSessionsByUserId, getSession } from "./session-store.js";
import { hashPassword, verifyPassword } from "./password.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserAccountStatus,
  updateUserProfile,
  USER_ACCOUNT_STATUS,
  USER_ROLES,
} from "./user-store.js";

export async function register(email, password) {
  const passwordHash = hashPassword(password);
  const result = await createUser({ email, passwordHash });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role ?? USER_ROLES.CUSTOMER,
      accountStatus: result.user.accountStatus ?? USER_ACCOUNT_STATUS.ACTIVE,
      profile: result.user.profile,
    },
  };
}

export async function login(email, password) {
  const user = await findUserByEmail(email);
  if (!user) {
    return { success: false, error: "INVALID_CREDENTIALS" };
  }

  if (user.accountStatus === USER_ACCOUNT_STATUS.LOCKED) {
    return { success: false, error: "ACCOUNT_LOCKED" };
  }

  const matched = verifyPassword(password, user.passwordHash);
  if (!matched) {
    return { success: false, error: "INVALID_CREDENTIALS" };
  }

  const role = user.role ?? USER_ROLES.CUSTOMER;
  const sessionToken = await createSession(user.id, role);

  return {
    success: true,
    sessionToken,
    user: {
      id: user.id,
      email: user.email,
      role,
      accountStatus: user.accountStatus ?? USER_ACCOUNT_STATUS.ACTIVE,
      profile: user.profile,
    },
  };
}

export async function logout(sessionToken) {
  await deleteSession(sessionToken);
  return { success: true };
}

export async function getAuthenticatedSession(sessionToken) {
  return getSession(sessionToken);
}

export async function getUserById(userId) {
  return findUserById(userId);
}

export async function saveProfile(userId, profile) {
  return updateUserProfile(userId, profile);
}

export async function setUserAccountStatus(userId, accountStatus) {
  const result = await updateUserAccountStatus(userId, accountStatus);

  if (result.success && accountStatus === USER_ACCOUNT_STATUS.LOCKED) {
    await deleteSessionsByUserId(userId);
  }

  return result;
}
