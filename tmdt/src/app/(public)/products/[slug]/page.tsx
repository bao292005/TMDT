import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCatalogProductDetail } from "@/modules/catalog/catalog-service.js";
import { validateCatalogDetailQuery } from "@/shared/validation/catalog.js";

import { FeedbackMessage } from "@/components/ui/feedback-message";

import { RecommendationList } from "./recommendation-list";
import { TryOnPanel } from "./try-on-panel";
import { VariantFitSelector } from "./variant-fit-selector";
import { ProductActions } from "./product-actions";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function appendQueryParam(searchParams: URLSearchParams, key: string, value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = item.trim();
      if (normalized) {
        searchParams.append(key, normalized);
      }
    }
    return;
  }

  const normalized = value?.trim();
  if (normalized) {
    searchParams.append(key, normalized);
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCatalogProductDetail({ slug, size: "", color: "" });

  if (!result.success || !result.data) {
    return {
      title: "Sản phẩm không tồn tại | TMDT",
      description: "Không tìm thấy thông tin sản phẩm bạn yêu cầu.",
    };
  }

  const product = result.data;

  return {
    title: `${product.name} | TMDT`,
    description: product.description,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.thumbnail ? [{ url: product.thumbnail }] : [],
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const detailQuery = new URLSearchParams();
  appendQueryParam(detailQuery, "size", query.size);
  appendQueryParam(detailQuery, "color", query.color);

  const validation = validateCatalogDetailQuery(detailQuery);

  const detailResult = validation.success && validation.data
    ? await getCatalogProductDetail({
        slug,
        size: validation.data.size,
        color: validation.data.color,
      })
    : await getCatalogProductDetail({ slug, size: "", color: "" });

  if (!detailResult.success && detailResult.code === "CATALOG_NOT_FOUND") {
    notFound();
  }

  if (!detailResult.success || !detailResult.data) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-4 px-6 py-10">
        <h1 className="text-2xl font-semibold">Chi tiết sản phẩm</h1>
        <FeedbackMessage
          tone="error"
          message={detailResult.success ? "Không thể tải chi tiết sản phẩm." : (detailResult.message ?? "Không thể tải chi tiết sản phẩm.")}
        />
        <Link href="/products" className="w-fit text-sm font-medium text-[#ee4d2d] hover:underline">
          ← Quay lại danh mục
        </Link>
      </main>
    );
  }

  const product = detailResult.data;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <Link href="/products" className="w-fit text-sm font-medium text-[#ee4d2d] hover:underline">
        ← Quay lại danh mục
      </Link>

      <section className="grid gap-6 rounded-sm border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div className="overflow-hidden rounded-sm border border-zinc-200 self-start sticky top-6">
          {product.thumbnail ? (
            <div
              className="w-full aspect-square bg-cover bg-center bg-no-repeat"
              role="img"
              aria-label={product.name}
              style={{ backgroundImage: `url(${product.thumbnail})` }}
            />
          ) : (
            <div className="w-full aspect-square bg-zinc-100" aria-hidden="true" />
          )}
        </div>

        <div className="space-y-6">
          {/* Title and Ratings */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#ee4d2d] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase">Mall</span>
              <p className="text-sm text-zinc-500 capitalize">{product.category}</p>
            </div>
            <h1 className="text-xl md:text-[22px] font-medium text-zinc-900 leading-snug">{product.name}</h1>
            
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1 text-[#ee4d2d]">
                <span className="font-medium underline">4.8</span>
                <span className="text-xs">★★★★★</span>
              </div>
              <div className="w-px h-4 bg-zinc-300"></div>
              <div><span className="font-medium underline">124</span> <span className="text-zinc-500">đánh giá</span></div>
              <div className="w-px h-4 bg-zinc-300"></div>
              <div><span className="font-medium">312</span> <span className="text-zinc-500">đã mua</span></div>
            </div>
          </div>

          {/* Price Box */}
          <div className="bg-zinc-50 px-5 py-4 rounded-sm flex items-end gap-3 border border-zinc-100">
            <span className="text-3xl font-medium text-[#ee4d2d]">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.price)}
            </span>
            <span className="text-zinc-400 line-through text-base mb-1">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Math.round(product.price * 1.25))}
            </span>
            <span className="bg-[#ee4d2d]/10 text-[#ee4d2d] text-xs font-bold px-1.5 py-0.5 rounded-sm mb-1 uppercase">
              Giảm 20%
            </span>
          </div>

          {!validation.success && <FeedbackMessage tone="warning" message={validation.error ?? "Dữ liệu biến thể không hợp lệ."} />}

          <VariantFitSelector
            productSlug={product.slug}
            variants={product.variants}
            selectedVariant={product.selectedVariant}
            fitSignal={`Đang đồng bộ theo biến thể ${product.selectedVariant.size.toUpperCase()} / ${product.selectedVariant.color}`}
          />
          
          <ProductActions 
            productSlug={product.slug} 
            selectedVariantId={`${product.selectedVariant.size}-${product.selectedVariant.color}`}
            inStock={product.selectedVariant.inStock} 
            stock={product.selectedVariant.stock} 
          />

          <TryOnPanel productSlug={product.slug} selectedVariant={product.selectedVariant} />

          <RecommendationList productSlug={product.slug} />
        </div>
      </section>
    </main>
  );
}
