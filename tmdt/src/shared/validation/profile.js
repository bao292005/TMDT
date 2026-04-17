import { MAX_USER_ADDRESSES, USER_ACCOUNT_STATUS } from "../../modules/identity/user-store.js";

const PHONE_REGEX = /^\+?[0-9]{9,15}$/;

export function validateProfilePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { success: false, error: "Dữ liệu không hợp lệ." };
  }

  const rawFullName = payload.fullName;
  const rawPhone = payload.phone;
  const rawAddresses = payload.addresses;

  if (typeof rawFullName !== "string" || !rawFullName.trim()) {
    return { success: false, error: "Họ tên là bắt buộc." };
  }

  if (typeof rawPhone !== "string" || !PHONE_REGEX.test(rawPhone.trim())) {
    return { success: false, error: "Số điện thoại không hợp lệ." };
  }

  if (!Array.isArray(rawAddresses)) {
    return { success: false, error: "Danh sách địa chỉ không hợp lệ." };
  }

  if (rawAddresses.length > MAX_USER_ADDRESSES) {
    return { success: false, error: `Tối đa ${MAX_USER_ADDRESSES} địa chỉ.` };
  }

  const addresses = [];
  for (const address of rawAddresses) {
    if (typeof address !== "string" || !address.trim()) {
      return { success: false, error: "Địa chỉ không hợp lệ." };
    }
    addresses.push(address.trim());
  }

  return {
    success: true,
    data: {
      fullName: rawFullName.trim(),
      phone: rawPhone.trim(),
      addresses,
    },
  };
}

export function validateAccountStatusPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { success: false, error: "Dữ liệu không hợp lệ." };
  }

  const status = typeof payload.status === "string" ? payload.status : "";
  const reason = typeof payload.reason === "string" ? payload.reason.trim() : "";

  if (!Object.values(USER_ACCOUNT_STATUS).includes(status)) {
    return { success: false, error: "Trạng thái tài khoản không hợp lệ." };
  }

  if (!reason) {
    return { success: false, error: "Lý do thao tác là bắt buộc." };
  }

  return {
    success: true,
    data: {
      status,
      reason,
    },
  };
}
