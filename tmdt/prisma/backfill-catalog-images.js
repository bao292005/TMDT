import { PrismaClient } from "@prisma/client";

import { listProducts } from "../src/modules/catalog/product-store.js";

const prisma = new PrismaClient();

function normalizeMedia(media) {
  if (!Array.isArray(media)) {
    return [];
  }

  return media
    .filter((url) => typeof url === "string")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
}

async function resolveProductId({ id, slug }) {
  if (typeof id === "string" && id.trim()) {
    const byId = await prisma.products.findUnique({
      where: { id: id.trim() },
      select: { id: true },
    });

    if (byId) {
      return byId.id;
    }
  }

  if (typeof slug === "string" && slug.trim()) {
    const bySlug = await prisma.products.findUnique({
      where: { slug: slug.trim().toLowerCase() },
      select: { id: true },
    });

    if (bySlug) {
      return bySlug.id;
    }
  }

  return null;
}

async function backfillProductImages(product) {
  const productId = await resolveProductId(product);
  if (!productId) {
    return { status: "skipped", slug: product.slug, reason: "product-not-found" };
  }

  const thumbnail = typeof product.thumbnail === "string" ? product.thumbnail.trim() : "";
  const media = normalizeMedia(product.media);

  await prisma.$transaction(async (tx) => {
    await tx.products.update({
      where: { id: productId },
      data: {
        thumbnail_url: thumbnail || null,
      },
    });

    await tx.product_media.deleteMany({
      where: {
        product_id: productId,
      },
    });

    if (media.length > 0) {
      await tx.product_media.createMany({
        data: media.map((url, index) => ({
          product_id: productId,
          url,
          position: index,
        })),
      });
    }
  });

  return { status: "updated", slug: product.slug, mediaCount: media.length };
}

async function main() {
  const products = listProducts();
  const summary = {
    total: products.length,
    updated: 0,
    skipped: 0,
  };

  for (const product of products) {
    const result = await backfillProductImages(product);
    if (result.status === "updated") {
      summary.updated += 1;
      console.log(`[updated] ${result.slug} (media: ${result.mediaCount})`);
      continue;
    }

    summary.skipped += 1;
    console.log(`[skipped] ${result.slug} (${result.reason})`);
  }

  console.log("Backfill done", summary);
}

main()
  .catch((error) => {
    console.error("Backfill failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
