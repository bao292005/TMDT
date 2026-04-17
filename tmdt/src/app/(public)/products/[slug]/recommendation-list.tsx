"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import ProductCard from "@/components/features/product-card";

type RecommendationItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  size: string;
  color: string;
  thumbnail: string;
};

type RecommendationPayload = {
  success: boolean;
  state?: "success" | "fallback" | "error";
  message?: string;
  data?: {
    items?: RecommendationItem[];
    strategy?: string;
    signalsUsed?: string[];
  };
};

type RecommendationListProps = {
  productSlug: string;
};

function getStoredViewedSlugs() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem("recently_viewed_products");
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => String(item).trim()).filter((item) => item !== "").slice(0, 10);
  } catch {
    return [];
  }
}

function saveViewedSlugs(slugs: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("recently_viewed_products", JSON.stringify(slugs.slice(0, 10)));
}

export function RecommendationList({ productSlug }: RecommendationListProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [state, setState] = useState<"success" | "fallback" | "error">("fallback");
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [viewed, setViewed] = useState<string[]>([]);
  const requestVersionRef = useRef(0);

  useEffect(() => {
    const normalizedCurrent = productSlug.trim();
    const previousViewed = getStoredViewedSlugs();

    const nextViewed = [normalizedCurrent, ...previousViewed.filter((slug) => slug !== normalizedCurrent)];
    saveViewedSlugs(nextViewed);

    setViewed(previousViewed.filter((slug) => slug !== normalizedCurrent));
  }, [productSlug]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("productSlug", productSlug);
    params.set("limit", "5");

    for (const slug of viewed) {
      params.append("viewed", slug);
    }

    return params.toString();
  }, [productSlug, viewed]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestVersionRef.current;

    async function loadRecommendations() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/recommendations?${queryString}`, {
          signal: controller.signal,
        });

        let payload: RecommendationPayload | null = null;

        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (requestVersionRef.current !== requestId) {
          return;
        }

        if (!response.ok || !payload?.success) {
          setState("error");
          setItems([]);
          setError(payload?.message ?? "Không thể tải gợi ý sản phẩm.");
          return;
        }

        setState(payload.state === "success" ? "success" : "fallback");
        setItems(payload.data?.items ?? []);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        if (requestVersionRef.current !== requestId) {
          return;
        }

        setState("error");
        setItems([]);
        setError("Không thể kết nối tới dịch vụ gợi ý.");
      } finally {
        if (requestVersionRef.current === requestId) {
          setLoading(false);
        }
      }
    }

    loadRecommendations();

    return () => {
      controller.abort();
    };
  }, [queryString]);

  return (
    <section className="space-y-3 rounded-sm border border-zinc-200 bg-white p-4" aria-labelledby="recommendation-heading">
      <div className="space-y-1">
        <h2 id="recommendation-heading" className="text-lg font-semibold">
          Gợi ý cho bạn
        </h2>
        <p className="text-sm text-zinc-600">Danh sách sản phẩm liên quan theo ngữ cảnh duyệt và phiên hiện tại.</p>
      </div>

      {loading ? <p className="text-sm text-zinc-600">Đang tải gợi ý...</p> : null}

      {!loading && state === "error" ? (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error || "Không thể tải gợi ý."}</p>
      ) : null}

      {!loading && state !== "error" && items.length === 0 ? (
        <p className="rounded border border-dashed px-3 py-2 text-sm text-zinc-600">Chưa có gợi ý phù hợp.</p>
      ) : null}

      {!loading && state !== "error" && items.length > 0 ? (
        <>
          {state === "fallback" ? (
            <p className="rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Đang dùng baseline recommendation do thiếu tín hiệu cá nhân hóa.
            </p>
          ) : null}
          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item.id}>
                <ProductCard
                  slug={item.slug}
                  name={item.name}
                  price={item.price}
                  category={item.category}
                  size={item.size}
                  color={item.color}
                  thumbnail={item.thumbnail}
                  hasAI
                />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
