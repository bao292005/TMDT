import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

function getPrismaClient() {
  if (!globalForPrisma.__tmdtPrismaClient) {
    globalForPrisma.__tmdtPrismaClient = new PrismaClient();
  }

  return globalForPrisma.__tmdtPrismaClient;
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeSlug(value) {
  return String(value ?? "").trim();
}

function normalizeVariantCodePart(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDateString(value) {
  return value instanceof Date ? value.toISOString() : null;
}

function toRuntimeVariant(variant) {
  return {
    size: variant.size,
    color: variant.color,
    stock: variant.stock,
  };
}

function resolveTopLevelVariant(variants) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return {
      size: "",
      color: "",
    };
  }

  const preferred = variants.find((variant) => variant.stock > 0) ?? variants[0];

  return {
    size: preferred.size,
    color: preferred.color,
  };
}

function toRuntimeProduct(product) {
  const variants = Array.isArray(product.variants) ? product.variants.map(toRuntimeVariant) : [];
  const media = Array.isArray(product.media) ? product.media.map((item) => item.url) : [];
  const topLevel = resolveTopLevelVariant(variants);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    description: product.description,
    price: product.price_minor,
    size: topLevel.size,
    color: topLevel.color,
    thumbnail: typeof product.thumbnail_url === "string" && product.thumbnail_url.trim()
      ? product.thumbnail_url.trim()
      : "",
    media,
    variants,
    isActive: Boolean(product.is_active),
    createdAt: toDateString(product.created_at),
    updatedAt: toDateString(product.updated_at),
  };
}

function normalizeMedia(media) {
  if (!Array.isArray(media)) {
    return [];
  }

  return media
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeVariants(variants) {
  if (!Array.isArray(variants)) {
    return [];
  }

  const deduped = new Map();
  for (const variant of variants) {
    const size = String(variant?.size ?? "").trim();
    const color = String(variant?.color ?? "").trim();
    const stock = Number.isSafeInteger(variant?.stock) ? variant.stock : 0;

    if (!size || !color) {
      continue;
    }

    const key = `${normalizeText(size)}::${normalizeText(color)}`;
    if (!deduped.has(key)) {
      deduped.set(key, { size, color, stock });
    }
  }

  return [...deduped.values()];
}

function buildCreatePayload(product) {
  const normalizedVariants = normalizeVariants(product.variants);
  const normalizedMedia = normalizeMedia(product.media);

  return {
    id: String(product.id ?? "").trim(),
    slug: normalizeSlug(product.slug),
    name: String(product.name ?? "").trim(),
    category: String(product.category ?? "").trim(),
    description: String(product.description ?? "").trim(),
    price_minor: Number.isSafeInteger(product.price) ? product.price : 0,
    thumbnail_url: typeof product.thumbnail === "string" && product.thumbnail.trim() ? product.thumbnail.trim() : null,
    is_active: product.isActive !== undefined ? Boolean(product.isActive) : true,
    variants: {
      create: normalizedVariants.map((variant) => ({
        variant_code: `${normalizeVariantCodePart(product.id)}-${normalizeVariantCodePart(variant.size)}-${normalizeVariantCodePart(variant.color)}`,
        size: variant.size,
        color: variant.color,
        stock: variant.stock,
        is_active: true,
      })),
    },
    media: {
      create: normalizedMedia.map((url, index) => ({
        url,
        position: index,
      })),
    },
  };
}

function buildUpdatePayload(productId, updates) {
  const data = {};

  if (typeof updates.slug === "string") data.slug = normalizeSlug(updates.slug);
  if (typeof updates.name === "string") data.name = updates.name.trim();
  if (typeof updates.category === "string") data.category = updates.category.trim();
  if (typeof updates.description === "string") data.description = updates.description.trim();
  if (Number.isSafeInteger(updates.price)) data.price_minor = updates.price;
  if (typeof updates.thumbnail === "string") data.thumbnail_url = updates.thumbnail.trim() || null;
  if (typeof updates.isActive === "boolean") data.is_active = updates.isActive;

  if (Array.isArray(updates.variants)) {
    const normalizedVariants = normalizeVariants(updates.variants);
    data.variants = {
      deleteMany: {},
      create: normalizedVariants.map((variant) => ({
        variant_code: `${normalizeVariantCodePart(productId)}-${normalizeVariantCodePart(variant.size)}-${normalizeVariantCodePart(variant.color)}`,
        size: variant.size,
        color: variant.color,
        stock: variant.stock,
        is_active: true,
      })),
    };
  }

  if (Array.isArray(updates.media)) {
    const normalizedMedia = normalizeMedia(updates.media);
    data.media = {
      deleteMany: {},
      create: normalizedMedia.map((url, index) => ({
        url,
        position: index,
      })),
    };
  }

  return data;
}

async function findManyProducts(where = {}) {
  const prisma = getPrismaClient();
  return prisma.products.findMany({
    where,
    include: {
      variants: {
        where: {
          is_active: true,
        },
        orderBy: [
          { size: "asc" },
          { color: "asc" },
        ],
      },
      media: {
        orderBy: {
          position: "asc",
        },
      },
    },
    orderBy: [
      { created_at: "asc" },
      { slug: "asc" },
    ],
  });
}

export async function listProducts() {
  const products = await findManyProducts();
  return products.map(toRuntimeProduct);
}

export async function findProductById(productId) {
  if (!productId) return null;

  const products = await findManyProducts({ id: productId });
  return products.length > 0 ? toRuntimeProduct(products[0]) : null;
}

export async function createProduct(product) {
  const prisma = getPrismaClient();
  const created = await prisma.products.create({
    data: buildCreatePayload(product),
    include: {
      variants: {
        where: {
          is_active: true,
        },
        orderBy: [
          { size: "asc" },
          { color: "asc" },
        ],
      },
      media: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  return toRuntimeProduct(created);
}

export async function updateProductById(productId, updates) {
  const prisma = getPrismaClient();
  const existing = await prisma.products.findUnique({
    where: {
      id: productId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return null;
  }

  const updated = await prisma.products.update({
    where: {
      id: productId,
    },
    data: buildUpdatePayload(productId, updates),
    include: {
      variants: {
        where: {
          is_active: true,
        },
        orderBy: [
          { size: "asc" },
          { color: "asc" },
        ],
      },
      media: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  return toRuntimeProduct(updated);
}

const DEFAULT_CATALOG_PRODUCTS = [
  {
    id: "p-ao-thun-basic-den",
    slug: "ao-thun-basic-den",
    name: "Áo thun basic màu đen",
    category: "ao-thun",
    description: "Áo thun cotton form regular, phù hợp mặc hằng ngày.",
    price: 199000,
    thumbnail: "/products/ao-thun-basic-den.jpg",
    media: ["/products/ao-thun-basic-den.jpg"],
    variants: [
      { size: "m", color: "den", stock: 18 },
      { size: "l", color: "den", stock: 0 },
    ],
    isActive: true,
  },
  {
    id: "p-ao-thun-basic-trang",
    slug: "ao-thun-basic-trang",
    name: "Áo thun basic màu trắng",
    category: "ao-thun",
    description: "Áo thun cotton mềm, dễ phối cùng quần jean hoặc chân váy.",
    price: 199000,
    thumbnail: "/products/ao-thun-basic-trang.jpg",
    media: ["/products/ao-thun-basic-trang.jpg"],
    variants: [
      { size: "m", color: "trang", stock: 7 },
      { size: "l", color: "trang", stock: 12 },
    ],
    isActive: true,
  },
  {
    id: "p-quan-jean-slim-xanh",
    slug: "quan-jean-slim-xanh",
    name: "Quần jean slim xanh đậm",
    category: "quan-jean",
    description: "Quần jean slim fit co giãn nhẹ, phù hợp phong cách năng động.",
    price: 499000,
    thumbnail: "/products/quan-jean-slim-xanh.jpg",
    media: ["/products/quan-jean-slim-xanh.jpg"],
    variants: [
      { size: "m", color: "xanh", stock: 9 },
      { size: "l", color: "xanh", stock: 4 },
    ],
    isActive: true,
  },
  {
    id: "p-vay-midi-hoa",
    slug: "vay-midi-hoa",
    name: "Váy midi họa tiết hoa",
    category: "vay",
    description: "Váy midi chất voan nhẹ, họa tiết hoa nổi bật cho dịp dạo phố.",
    price: 599000,
    thumbnail: "/products/vay-midi-hoa.jpg",
    media: ["/products/vay-midi-hoa.jpg"],
    variants: [
      { size: "s", color: "do", stock: 6 },
      { size: "m", color: "do", stock: 2 },
    ],
    isActive: true,
  },
  {
    id: "p-hoodie-oversize-xam",
    slug: "hoodie-oversize-xam",
    name: "Hoodie oversize màu xám",
    category: "hoodie",
    description: "Hoodie nỉ dày, form oversize, phù hợp thời tiết se lạnh.",
    price: 649000,
    thumbnail: "/products/hoodie-oversize-xam.jpg",
    media: ["/products/hoodie-oversize-xam.jpg"],
    variants: [{ size: "xl", color: "xam", stock: 3 }],
    isActive: false,
  },
];

export async function __seedCatalogProductsForTests(nextProducts = DEFAULT_CATALOG_PRODUCTS) {
  const prisma = getPrismaClient();

  await prisma.$transaction(async (tx) => {
    await tx.cart_items.deleteMany({});
    await tx.order_items.deleteMany({});
    await tx.inventory_movements.deleteMany({});
    await tx.product_media.deleteMany({});
    await tx.product_variants.deleteMany({});
    await tx.products.deleteMany({});

    for (const product of nextProducts) {
      await tx.products.create({
        data: buildCreatePayload(product),
      });
    }
  });
}
