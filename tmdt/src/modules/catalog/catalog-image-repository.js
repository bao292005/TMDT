import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

function getPrismaClient() {
  if (!globalForPrisma.__tmdtPrismaClient) {
    globalForPrisma.__tmdtPrismaClient = new PrismaClient();
  }

  return globalForPrisma.__tmdtPrismaClient;
}

function normalizeUrlList(media) {
  if (!Array.isArray(media)) {
    return [];
  }

  return media
    .filter((url) => typeof url === "string")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
}

function toImagePayload(record) {
  const media = Array.isArray(record?.media) ? record.media.map((item) => item.url) : [];
  const thumbnail = typeof record?.thumbnail_url === "string" && record.thumbnail_url.trim()
    ? record.thumbnail_url.trim()
    : "";

  return {
    thumbnail,
    media,
  };
}

function normalizeSlug(slug) {
  return String(slug ?? "").trim().toLowerCase();
}

export async function getCatalogImageMapBySlugs(slugs) {
  const normalizedSlugs = Array.isArray(slugs)
    ? [...new Set(slugs.map((slug) => normalizeSlug(slug)).filter(Boolean))]
    : [];

  if (normalizedSlugs.length === 0) {
    return new Map();
  }

  try {
    const prisma = getPrismaClient();
    const records = await prisma.products.findMany({
      where: {
        slug: {
          in: normalizedSlugs,
        },
      },
      select: {
        slug: true,
        thumbnail_url: true,
        media: {
          orderBy: {
            position: "asc",
          },
          select: {
            url: true,
          },
        },
      },
    });

    const result = new Map();
    for (const record of records) {
      result.set(normalizeSlug(record.slug), toImagePayload(record));
    }

    return result;
  } catch {
    return new Map();
  }
}

export async function getCatalogImageBySlug(slug) {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) {
    return null;
  }

  try {
    const prisma = getPrismaClient();
    const record = await prisma.products.findUnique({
      where: {
        slug: normalizedSlug,
      },
      select: {
        thumbnail_url: true,
        media: {
          orderBy: {
            position: "asc",
          },
          select: {
            url: true,
          },
        },
      },
    });

    if (!record) {
      return null;
    }

    return toImagePayload(record);
  } catch {
    return null;
  }
}

export async function upsertCatalogProductImages({ productId, slug, thumbnail, media }) {
  const normalizedSlug = normalizeSlug(slug);
  const normalizedMedia = normalizeUrlList(media);
  const normalizedThumbnail = typeof thumbnail === "string" ? thumbnail.trim() : "";

  if (!productId && !normalizedSlug) {
    return null;
  }

  try {
    const prisma = getPrismaClient();
    const existing = await prisma.products.findFirst({
      where: {
        OR: [
          ...(productId ? [{ id: productId }] : []),
          ...(normalizedSlug ? [{ slug: normalizedSlug }] : []),
        ],
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return null;
    }

    await prisma.products.update({
      where: {
        id: existing.id,
      },
      data: {
        thumbnail_url: normalizedThumbnail || null,
      },
    });

    await prisma.product_media.deleteMany({
      where: {
        product_id: existing.id,
      },
    });

    if (normalizedMedia.length > 0) {
      await prisma.product_media.createMany({
        data: normalizedMedia.map((url, index) => ({
          product_id: existing.id,
          url,
          position: index,
        })),
      });
    }

    return {
      thumbnail: normalizedThumbnail,
      media: normalizedMedia,
    };
  } catch {
    return null;
  }
}
