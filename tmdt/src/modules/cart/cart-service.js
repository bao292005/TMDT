import { getCatalogProductDetail } from "../catalog/catalog-service.js";
import { getCartByUserId, saveCartByUserId } from "./cart-store.js";

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function parseVariantId(variantId) {
  const normalized = String(variantId ?? "").trim().toLowerCase();
  const separatorIndex = normalized.indexOf("-");
  if (separatorIndex <= 0 || separatorIndex >= normalized.length - 1) {
    return null;
  }

  const size = normalized.slice(0, separatorIndex).trim();
  const color = normalized.slice(separatorIndex + 1).trim();
  if (!size || !color) {
    return null;
  }

  return { size, color, variantId: `${size}-${color}` };
}

async function hydrateCartItem(item) {
  const parsedVariant = parseVariantId(item.variantId);
  if (!parsedVariant) {
    return {
      ...item,
      title: item.productSlug,
      price: 0,
      stock: 0,
      inStock: false,
      isValid: false,
      reason: "Biến thể không hợp lệ.",
    };
  }

  const detail = await getCatalogProductDetail({
    slug: item.productSlug,
    size: parsedVariant.size,
    color: parsedVariant.color,
  });

  if (!detail.success || !detail.data) {
    return {
      ...item,
      title: item.productSlug,
      price: 0,
      stock: 0,
      inStock: false,
      isValid: false,
      reason: "Sản phẩm hoặc biến thể không còn khả dụng.",
    };
  }

  const variant = detail.data.selectedVariant;
  const stock = Number.isSafeInteger(variant.stock) ? variant.stock : 0;
  const inStock = Boolean(variant.inStock) && stock > 0;
  const quantityValid = item.quantity > 0 && item.quantity <= stock;

  return {
    ...item,
    title: detail.data.name,
    price: detail.data.price,
    stock,
    inStock,
    isValid: inStock && quantityValid,
    reason: !inStock
      ? "Biến thể đã hết hàng."
      : !quantityValid
        ? `Số lượng vượt tồn kho (${stock}).`
        : "",
  };
}

function mergeItem(cart, nextItem) {
  const index = cart.items.findIndex(
    (item) =>
      normalizeText(item.productSlug) === normalizeText(nextItem.productSlug) &&
      normalizeText(item.variantId) === normalizeText(nextItem.variantId),
  );

  if (index < 0) {
    cart.items.push(nextItem);
    return;
  }

  cart.items[index] = {
    ...cart.items[index],
    quantity: cart.items[index].quantity + nextItem.quantity,
  };
}

export async function getCart(userId) {
  const cart = await getCartByUserId(userId);
  const items = await Promise.all(cart.items.map((item) => hydrateCartItem(item)));
  const invalidItems = items.filter((item) => !item.isValid);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    items,
    subtotal,
    isValid: invalidItems.length === 0,
    invalidItems,
  };
}

export async function addCartItem({ userId, productSlug, variantId, quantity }) {
  const parsedVariant = parseVariantId(variantId);
  if (!parsedVariant) {
    return {
      success: false,
      code: "CART_INVALID_INPUT",
      message: "Biến thể không hợp lệ.",
    };
  }

  const detail = await getCatalogProductDetail({
    slug: productSlug,
    size: parsedVariant.size,
    color: parsedVariant.color,
  });

  if (!detail.success || !detail.data) {
    return {
      success: false,
      code: "CART_PRODUCT_NOT_FOUND",
      message: "Sản phẩm hoặc biến thể không tồn tại.",
    };
  }

  const variant = detail.data.selectedVariant;
  if (!variant.inStock || variant.stock <= 0) {
    return {
      success: false,
      code: "CART_OUT_OF_STOCK",
      message: "Biến thể đã hết hàng.",
    };
  }

  const cart = await getCartByUserId(userId);
  mergeItem(cart, {
    productSlug: detail.data.slug,
    variantId: parsedVariant.variantId,
    quantity,
    addedAt: Date.now(),
  });

  const next = cart.items.find(
    (item) =>
      normalizeText(item.productSlug) === normalizeText(detail.data.slug) &&
      normalizeText(item.variantId) === normalizeText(parsedVariant.variantId),
  );

  if (!next || next.quantity > variant.stock) {
    return {
      success: false,
      code: "CART_QUANTITY_EXCEEDS_STOCK",
      message: `Số lượng vượt tồn kho (${variant.stock}).`,
    };
  }

  await saveCartByUserId(userId, cart);
  const snapshot = await getCart(userId);

  return {
    success: true,
    data: snapshot,
  };
}

export async function updateCartItem({ userId, productSlug, variantId, quantity }) {
  const cart = await getCartByUserId(userId);
  const index = cart.items.findIndex(
    (item) =>
      normalizeText(item.productSlug) === normalizeText(productSlug) &&
      normalizeText(item.variantId) === normalizeText(variantId),
  );

  if (index < 0) {
    return {
      success: false,
      code: "CART_ITEM_NOT_FOUND",
      message: "Không tìm thấy sản phẩm trong giỏ hàng.",
    };
  }

  const parsedVariant = parseVariantId(variantId);
  if (!parsedVariant) {
    return {
      success: false,
      code: "CART_INVALID_INPUT",
      message: "Biến thể không hợp lệ.",
    };
  }

  const detail = await getCatalogProductDetail({
    slug: productSlug,
    size: parsedVariant.size,
    color: parsedVariant.color,
  });

  if (!detail.success || !detail.data) {
    return {
      success: false,
      code: "CART_PRODUCT_NOT_FOUND",
      message: "Sản phẩm hoặc biến thể không tồn tại.",
    };
  }

  const stock = detail.data.selectedVariant.stock;
  if (!detail.data.selectedVariant.inStock || stock <= 0) {
    return {
      success: false,
      code: "CART_OUT_OF_STOCK",
      message: "Biến thể đã hết hàng.",
    };
  }

  if (quantity > stock) {
    return {
      success: false,
      code: "CART_QUANTITY_EXCEEDS_STOCK",
      message: `Số lượng vượt tồn kho (${stock}).`,
    };
  }

  cart.items[index] = {
    ...cart.items[index],
    quantity,
  };

  await saveCartByUserId(userId, cart);
  const snapshot = await getCart(userId);

  return {
    success: true,
    data: snapshot,
  };
}

export async function removeCartItem({ userId, productSlug, variantId }) {
  const cart = await getCartByUserId(userId);
  const nextItems = cart.items.filter(
    (item) =>
      !(
        normalizeText(item.productSlug) === normalizeText(productSlug) &&
        normalizeText(item.variantId) === normalizeText(variantId)
      ),
  );

  await saveCartByUserId(userId, { items: nextItems });
  const snapshot = await getCart(userId);

  return {
    success: true,
    data: snapshot,
  };
}

export async function validateCartBeforeCheckout(userId) {
  const snapshot = await getCart(userId);
  if (snapshot.items.length === 0) {
    return {
      success: false,
      code: "CART_EMPTY",
      message: "Giỏ hàng đang trống, chưa thể checkout.",
      data: snapshot,
    };
  }

  if (!snapshot.isValid) {
    return {
      success: false,
      code: "CART_INVALID",
      message: "Giỏ hàng không hợp lệ. Vui lòng cập nhật lại sản phẩm trước khi checkout.",
      data: snapshot,
    };
  }

  return {
    success: true,
    data: snapshot,
  };
}
