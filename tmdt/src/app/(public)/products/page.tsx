"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import ProductCard from "@/components/features/product-card";
import { ActionButton } from "@/components/ui/action-button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";
import { StatePanel } from "@/components/ui/state-panel";

type CatalogItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  size: string;
  color: string;
  thumbnail: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type AppliedFilters = {
  keyword: string;
  category: string;
  size: string;
  color: string;
  minPrice: string;
  maxPrice: string;
  page: number;
};

function toPage(value: string | null) {
  return value && /^[1-9]\d*$/.test(value) ? Number(value) : 1;
}

function toSearchParams(filters: AppliedFilters) {
  const params = new URLSearchParams();

  if (filters.keyword) params.set("keyword", filters.keyword);
  if (filters.category) params.set("category", filters.category);
  if (filters.size) params.set("size", filters.size);
  if (filters.color) params.set("color", filters.color);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.page > 1) params.set("page", String(filters.page));

  return params;
}

const EMPTY_FILTERS: AppliedFilters = {
  keyword: "",
  category: "",
  size: "",
  color: "",
  minPrice: "",
  maxPrice: "",
  page: 1,
};

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 1,
  });
  const [keywordInput, setKeywordInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  useEffect(() => {
    const filtersFromUrl: AppliedFilters = {
      keyword: (searchParams.get("keyword") ?? "").trim(),
      category: (searchParams.get("category") ?? "").trim(),
      size: (searchParams.get("size") ?? "").trim(),
      color: (searchParams.get("color") ?? "").trim(),
      minPrice: (searchParams.get("minPrice") ?? "").trim(),
      maxPrice: (searchParams.get("maxPrice") ?? "").trim(),
      page: toPage(searchParams.get("page")),
    };

    setKeywordInput(filtersFromUrl.keyword);
    setCategoryInput(filtersFromUrl.category);
    setSizeInput(filtersFromUrl.size);
    setColorInput(filtersFromUrl.color);
    setMinPriceInput(filtersFromUrl.minPrice);
    setMaxPriceInput(filtersFromUrl.maxPrice);
    setAppliedFilters(filtersFromUrl);
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);
      setError("");

      try {
        const params = toSearchParams(appliedFilters);
        const response = await fetch(`/api/catalog/products?${params.toString()}`, {
          signal: controller.signal,
        });
        let payload: {
          message?: string;
          data?: {
            items?: CatalogItem[];
            pagination?: Pagination;
          };
        } | null = null;

        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok) {
          setError(payload?.message ?? "Không thể tải danh sách sản phẩm.");
          setItems([]);
          setPagination((prev) => ({
            ...prev,
            page: appliedFilters.page,
            total: 0,
            totalPages: 1,
          }));
          return;
        }

        setItems(payload?.data?.items ?? []);
        setPagination(
          payload?.data?.pagination ?? {
            page: appliedFilters.page,
            pageSize: 12,
            total: 0,
            totalPages: 1,
          },
        );
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setError("Không thể kết nối tới máy chủ.");
        setItems([]);
        setPagination((prev) => ({
          ...prev,
          page: appliedFilters.page,
          total: 0,
          totalPages: 1,
        }));
      } finally {
        setLoading(false);
      }
    }

    void loadProducts();

    return () => {
      controller.abort();
    };
  }, [appliedFilters]);

  function pushFilters(filters: AppliedFilters) {
    const params = toSearchParams(filters);
    const query = params.toString();
    router.push(query ? `/products?${query}` : "/products");
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFilters: AppliedFilters = {
      keyword: keywordInput.trim(),
      category: categoryInput.trim(),
      size: sizeInput.trim(),
      color: colorInput.trim(),
      minPrice: minPriceInput.trim(),
      maxPrice: maxPriceInput.trim(),
      page: 1,
    };

    pushFilters(nextFilters);
  }

  function clearFilters() {
    setKeywordInput("");
    setCategoryInput("");
    setSizeInput("");
    setColorInput("");
    setMinPriceInput("");
    setMaxPriceInput("");
    pushFilters(EMPTY_FILTERS);
  }

  function changePage(nextPage: number) {
    if (nextPage < 1 || nextPage > pagination.totalPages) {
      return;
    }

    pushFilters({ ...appliedFilters, page: nextPage });
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-16">
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-800 pt-20 pb-28 px-4 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-zinc-700 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">Danh Mục Sản Phẩm</h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Khám phá bộ sưu tập mới nhất. Tìm kiếm, chọn lọc và mua sắm các sản phẩm ưng ý một cách dễ dàng và nhanh chóng.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-8 relative -mt-16 z-20">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 rounded-2xl border border-zinc-200/60 bg-white/80 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.09)]">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <Input
              id="keyword"
              name="keyword"
              type="search"
              label="Từ khóa"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="Ví dụ: áo thun, jean..."
            />
          </div>
          <div className="flex gap-2">
            <ActionButton type="submit">Tìm kiếm</ActionButton>
            <ActionButton type="button" variant="secondary" onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}>
              {isFiltersExpanded ? "Thu gọn ▴" : "Lọc nâng cao ▾"}
            </ActionButton>
          </div>
        </div>

        {isFiltersExpanded && (
          <div className="mt-2 border-t border-zinc-100 pt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                id="category"
                name="category"
                type="text"
                label="Danh mục"
                value={categoryInput}
                onChange={(event) => setCategoryInput(event.target.value)}
                placeholder="Ví dụ: ao-thun"
              />

              <Input
                id="size"
                name="size"
                type="text"
                label="Size"
                value={sizeInput}
                onChange={(event) => setSizeInput(event.target.value)}
                placeholder="Ví dụ: m"
              />

              <Input
                id="color"
                name="color"
                type="text"
                label="Màu"
                value={colorInput}
                onChange={(event) => setColorInput(event.target.value)}
                placeholder="Ví dụ: den"
              />

              <Input
                id="minPrice"
                name="minPrice"
                type="number"
                min="0"
                label="Giá từ"
                value={minPriceInput}
                onChange={(event) => setMinPriceInput(event.target.value)}
                placeholder="0"
              />

              <Input
                id="maxPrice"
                name="maxPrice"
                type="number"
                min="0"
                label="Giá đến"
                value={maxPriceInput}
                onChange={(event) => setMaxPriceInput(event.target.value)}
                placeholder="1000000"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <ActionButton type="button" variant="secondary" onClick={clearFilters}>
                Xóa bộ lọc
              </ActionButton>
              <ActionButton type="submit">Áp dụng lọc</ActionButton>
            </div>
          </div>
        )}
      </form>

      {loading ? <StatePanel state="loading" title="Đang tải sản phẩm" description="Vui lòng chờ trong giây lát." /> : null}
      {error ? <FeedbackMessage tone="error" message={error} /> : null}

      {!loading && !error ? (
        <>
          <p className="text-sm text-zinc-600">Tìm thấy {pagination.total} sản phẩm.</p>

          {items.length === 0 ? (
            <StatePanel
              state="empty"
              title="Không có sản phẩm phù hợp"
              description="Hãy thử bộ lọc khác hoặc xóa toàn bộ bộ lọc để xem thêm sản phẩm."
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          )}

          <div className="flex items-center gap-3">
            <ActionButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => changePage(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Trang trước
            </ActionButton>
            <p className="text-sm text-zinc-600">
              Trang {pagination.page}/{pagination.totalPages}
            </p>
            <ActionButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => changePage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Trang sau
            </ActionButton>
          </div>
        </>
      ) : null}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <StatePanel state="loading" title="Đang tải" description="Vui lòng chờ trong giây lát." />
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
