import { randomUUID } from "node:crypto";

import { createProduct, findProductById, listProducts, updateProductById } from "./product-store.js";

function normalizeText(value) {
  return value.trim().toLowerCase();
}

function toCatalogItem(product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    price: product.price,
    size: product.size,
    color: product.color,
    thumbnail: product.thumbnail,
  };
}

function toVariant(variant) {
  return {
    size: variant.size,
    color: variant.color,
    stock: variant.stock,
    inStock: variant.stock > 0,
  };
}

function toAdminProduct(product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    description: product.description,
    price: product.price,
    size: product.size,
    color: product.color,
    thumbnail: product.thumbnail,
    media: [...(product.media ?? [])],
    variants: (product.variants ?? []).map((variant) => ({ ...variant })),
    isActive: Boolean(product.isActive),
    createdAt: product.createdAt ?? null,
    updatedAt: product.updatedAt ?? null,
  };
}

function findProductBySlug(slug) {
  const normalizedSlug = normalizeText(slug);

  return listProducts().find(
    (product) => product.isActive && normalizeText(product.slug) === normalizedSlug,
  );
}

function findAnyProductBySlug(slug) {
  const normalizedSlug = normalizeText(slug);
  return listProducts().find((product) => normalizeText(product.slug) === normalizedSlug);
}

export function getCatalogProducts({
  category,
  keyword,
  size,
  color,
  minPrice,
  maxPrice,
  page,
  pageSize,
}) {
  const normalizedCategory = category ? normalizeText(category) : "";
  const normalizedKeyword = keyword ? normalizeText(keyword) : "";
  const normalizedSize = size ? normalizeText(size) : "";
  const normalizedColor = color ? normalizeText(color) : "";

  let filtered = listProducts().filter((product) => product.isActive);

  if (normalizedCategory) {
    filtered = filtered.filter((product) => normalizeText(product.category) === normalizedCategory);
  }

  if (normalizedSize) {
    filtered = filtered.filter((product) => normalizeText(product.size) === normalizedSize);
  }

  if (normalizedColor) {
    filtered = filtered.filter((product) => normalizeText(product.color) === normalizedColor);
  }

  if (minPrice !== null) {
    filtered = filtered.filter((product) => product.price >= minPrice);
  }

  if (maxPrice !== null) {
    filtered = filtered.filter((product) => product.price <= maxPrice);
  }

  if (normalizedKeyword) {
    filtered = filtered.filter((product) => {
      const haystack = `${product.name} ${product.slug}`.toLowerCase();
      return haystack.includes(normalizedKeyword);
    });
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize).map(toCatalogItem);

  return {
    items,
    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages,
    },
  };
}

export function getCatalogProductDetail({ slug, size, color }) {
  const product = findProductBySlug(slug);
  if (!product) {
    return { success: false, code: "CATALOG_NOT_FOUND", message: "Không tìm thấy sản phẩm." };
  }

  const variants = (product.variants ?? []).map(toVariant);
  if (variants.length === 0) {
    return {
      success: false,
      code: "CATALOG_NOT_FOUND",
      message: "Sản phẩm chưa có biến thể khả dụng.",
    };
  }

  const normalizedSize = size ? normalizeText(size) : "";
  const normalizedColor = color ? normalizeText(color) : "";

  const requestedVariant =
    normalizedSize && normalizedColor
      ? variants.find(
          (variant) =>
            normalizeText(variant.size) === normalizedSize &&
            normalizeText(variant.color) === normalizedColor,
        )
      : undefined;

  if (normalizedSize && normalizedColor && !requestedVariant) {
    return {
      success: false,
      code: "CATALOG_INVALID_QUERY",
      message: "Biến thể sản phẩm không hợp lệ.",
    };
  }

  const selectedVariant = requestedVariant ?? variants.find((variant) => variant.inStock) ?? variants[0];

  return {
    success: true,
    data: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      thumbnail: product.thumbnail,
      media: [...(product.media ?? [])],
      variants,
      selectedVariant,
    },
  };
}

export function listAdminCatalogProducts() {
  const items = listProducts().map(toAdminProduct);
  return {
    success: true,
    data: {
      items,
    },
  };
}

function validateAdminProductPayload(payload, isUpdate = false) {
  if (!isUpdate || payload.slug !== undefined) {
    if (typeof payload.slug !== "string" || !payload.slug.trim()) {
      return "Slug là bắt buộc và phải là chuỗi.";
    }
  }

  if (!isUpdate || payload.name !== undefined) {
    if (typeof payload.name !== "string" || !payload.name.trim()) {
      return "Tên sản phẩm là bắt buộc và phải là chuỗi.";
    }
  }

  if (!isUpdate || payload.price !== undefined) {
    if (typeof payload.price !== "number" || payload.price < 0) {
      return "Giá sản phẩm không hợp lệ.";
    }
  }

  if (!isUpdate || payload.variants !== undefined) {
    if (!Array.isArray(payload.variants)) {
      return "Biến thể sản phẩm phải là mảng.";
    }
    for (const variant of payload.variants) {
      if (typeof variant.size !== "string" || typeof variant.color !== "string" || typeof variant.stock !== "number" || variant.stock < 0) {
        return "Thông tin biến thể không hợp lệ.";
      }
    }
  }

  if (payload.isActive !== undefined) {
    if (typeof payload.isActive !== "boolean") {
      return "Trạng thái isActive phải là boolean.";
    }
  }

  return null;
}

export function createAdminCatalogProduct(payload) {
  const validationError = validateAdminProductPayload(payload, false);
  if (validationError) {
    return {
      success: false,
      code: "CATALOG_INVALID_PAYLOAD",
      message: validationError
    };
  }

  const duplicated = findAnyProductBySlug(payload.slug);
  if (duplicated) {
    return {
      success: false,
      code: "CATALOG_DUPLICATE_SLUG",
      message: "Slug sản phẩm đã tồn tại.",
    };
  }

  const now = new Date().toISOString();
  const created = createProduct({
    id: `p-${randomUUID()}`,
    ...payload,
    createdAt: now,
    updatedAt: now,
  });

  return {
    success: true,
    data: toAdminProduct(created),
  };
}

export function updateAdminCatalogProduct(productId, updates) {
  const validationError = validateAdminProductPayload(updates, true);
  if (validationError) {
    return {
      success: false,
      code: "CATALOG_INVALID_PAYLOAD",
      message: validationError
    };
  }

  const existing = findProductById(productId);
  if (!existing) {
    return {
      success: false,
      code: "CATALOG_NOT_FOUND",
      message: "Không tìm thấy sản phẩm.",
    };
  }

  if (typeof updates.slug === "string" && normalizeText(updates.slug) !== normalizeText(existing.slug)) {
    const duplicated = findAnyProductBySlug(updates.slug);
    if (duplicated && duplicated.id !== existing.id) {
      return {
        success: false,
        code: "CATALOG_DUPLICATE_SLUG",
        message: "Slug sản phẩm đã tồn tại.",
      };
    }
  }

  const updated = updateProductById(productId, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  if (!updated) {
    return {
      success: false,
      code: "CATALOG_NOT_FOUND",
      message: "Không tìm thấy sản phẩm.",
    };
  }

  return {
    success: true,
    data: toAdminProduct(updated),
  };
}

export function deactivateAdminCatalogProduct(productId) {
  const existing = findProductById(productId);
  if (!existing) {
    return {
      success: false,
      code: "CATALOG_NOT_FOUND",
      message: "Không tìm thấy sản phẩm.",
    };
  }

  if (!existing.isActive) {
    return {
      success: true,
      data: {
        ...toAdminProduct(existing),
        idempotent: true,
      },
    };
  }

  const updated = updateProductById(productId, {
    isActive: false,
    updatedAt: new Date().toISOString(),
  });

  return {
    success: true,
    data: {
      ...toAdminProduct(updated),
      idempotent: false,
    },
  };
}
