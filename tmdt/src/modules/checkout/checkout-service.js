import { validateCartBeforeCheckout } from "../cart/cart-service.js";
import { getUserById } from "../identity/auth-service.js";
import { isValidCheckoutAddressFormat } from "../../shared/validation/checkout.js";

const DEFAULT_DISCOUNT = 0;

export const SHIPPING_OPTIONS = [
  {
    id: "standard",
    label: "Giao hàng tiêu chuẩn (3-5 ngày)",
    fee: 30000,
  },
  {
    id: "express",
    label: "Giao hàng nhanh (1-2 ngày)",
    fee: 45000,
  },
  {
    id: "same-day",
    label: "Giao trong ngày (nội thành)",
    fee: 70000,
  },
];

function normalizeText(value, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeAddressList(addresses) {
  if (!Array.isArray(addresses)) {
    return [];
  }

  return addresses
    .filter((address) => typeof address === "string")
    .map((address) => normalizeText(address, 250))
    .filter(Boolean);
}

function mapCartValidationError(result) {
  if (result.code === "CART_EMPTY") {
    return {
      success: false,
      code: "CHECKOUT_CART_EMPTY",
      message: "Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi checkout.",
      data: result.data,
    };
  }

  if (result.code === "CART_INVALID") {
    return {
      success: false,
      code: "CHECKOUT_CART_INVALID",
      message: "Giỏ hàng chưa hợp lệ. Vui lòng xử lý sản phẩm lỗi trước khi checkout.",
      data: result.data,
    };
  }

  return {
    success: false,
    code: "CHECKOUT_CART_INVALID",
    message: "Không thể xác thực giỏ hàng để checkout.",
    data: result.data,
  };
}

function buildPricing(subtotal, shippingFee) {
  const discount = DEFAULT_DISCOUNT;
  const total = subtotal + shippingFee - discount;

  return {
    subtotal,
    shippingFee,
    discount,
    total,
  };
}

function getShippingOptionById(shippingMethod) {
  return SHIPPING_OPTIONS.find((option) => option.id === shippingMethod) ?? null;
}

export async function buildCheckoutDraft({ userId, address, shippingMethod, note = "" }) {
  const cartValidation = await validateCartBeforeCheckout(userId);
  if (!cartValidation.success) {
    return mapCartValidationError(cartValidation);
  }

  const user = await getUserById(userId);
  if (!user) {
    return {
      success: false,
      code: "CHECKOUT_PROFILE_NOT_FOUND",
      message: "Không tìm thấy hồ sơ người dùng để checkout.",
    };
  }

  const availableAddresses = normalizeAddressList(user.profile?.addresses);
  if (availableAddresses.length === 0) {
    return {
      success: false,
      code: "CHECKOUT_ADDRESS_REQUIRED",
      message: "Bạn cần cập nhật ít nhất một địa chỉ giao hàng trước khi checkout.",
    };
  }

  const selectedAddress = normalizeText(address, 250) || availableAddresses[0];
  if (!selectedAddress) {
    return {
      success: false,
      code: "CHECKOUT_ADDRESS_REQUIRED",
      message: "Địa chỉ giao hàng là bắt buộc.",
    };
  }

  if (!availableAddresses.includes(selectedAddress) && !isValidCheckoutAddressFormat(selectedAddress)) {
    return {
      success: false,
      code: "CHECKOUT_ADDRESS_NOT_FOUND",
      message: "Địa chỉ giao hàng không hợp lệ với hồ sơ hiện tại.",
    };
  }

  const selectedShippingMethod = normalizeText(shippingMethod, 50).toLowerCase() || SHIPPING_OPTIONS[0].id;
  const selectedShippingOption = getShippingOptionById(selectedShippingMethod);

  if (!selectedShippingOption) {
    return {
      success: false,
      code: "CHECKOUT_SHIPPING_METHOD_INVALID",
      message: "Phương thức vận chuyển không hợp lệ.",
    };
  }

  const subtotal = cartValidation.data.subtotal;
  const pricing = buildPricing(subtotal, selectedShippingOption.fee);

  return {
    success: true,
    data: {
      cart: {
        items: cartValidation.data.items,
        invalidItems: cartValidation.data.invalidItems,
        itemCount: cartValidation.data.items.reduce((sum, item) => sum + item.quantity, 0),
      },
      availableAddresses,
      shippingOptions: SHIPPING_OPTIONS,
      selectedAddress,
      selectedShippingMethod,
      note: normalizeText(note, 500),
      pricing,
    },
  };
}
