import Link from "next/link";

import { FeedbackMessage } from "@/components/ui/feedback-message";

type ProductVariant = {
  size: string;
  color: string;
  stock: number;
  inStock: boolean;
};

type VariantFitSelectorProps = {
  productSlug: string;
  variants: ProductVariant[];
  selectedVariant: ProductVariant;
  fitSignal: string;
};

function buildVariantHref(slug: string, size: string, color: string) {
  const params = new URLSearchParams({ size, color });
  return `/products/${slug}?${params.toString()}`;
}

function getStockStateLabel(variant: ProductVariant) {
  if (!variant.inStock || variant.stock <= 0) return "out-of-stock";
  if (variant.stock <= 3) return "low-stock";
  return "available";
}

export function VariantFitSelector({ productSlug, variants, selectedVariant, fitSignal }: VariantFitSelectorProps) {
  const colors = Array.from(new Set(variants.map((v) => v.color)));
  const sizes = Array.from(new Set(variants.map((v) => v.size)));

  const selectedState = getStockStateLabel(selectedVariant);

  return (
    <div className="space-y-6" aria-labelledby="variant-fit-selector-heading">
      <h2 id="variant-fit-selector-heading" className="sr-only">
        Chọn biến thể size/màu
      </h2>

      {/* Màu Sắc */}
      <div className="flex items-start gap-4">
        <span className="w-20 text-sm text-zinc-500 pt-2 shrink-0">Màu sắc</span>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => {
            const selected = color === selectedVariant.color;
            const hasStock = variants.some(v => v.color === color && v.inStock && v.stock > 0);
            
            return (
              <Link
                key={color}
                href={buildVariantHref(productSlug, selectedVariant.size, color)}
                className={`relative min-w-16 px-3 py-1.5 text-sm text-center border rounded-sm transition-colors ${
                  selected 
                    ? "border-[#ee4d2d] text-[#ee4d2d]" 
                    : !hasStock 
                      ? "border-dashed border-zinc-200 text-zinc-400 bg-zinc-50 opacity-50 cursor-not-allowed pointer-events-none" 
                      : "border-zinc-200 text-zinc-800 hover:border-[#ee4d2d]"
                }`}
              >
                {color}
                {selected && (
                  <div className="absolute right-0 bottom-0 w-4 h-4 overflow-hidden before:content-[''] before:absolute before:-right-2 before:-bottom-2 before:w-4 before:h-4 before:bg-[#ee4d2d] before:rotate-45">
                    <svg className="absolute right-0 bottom-0 w-2 h-2 text-white fill-current" viewBox="0 0 12 12"><path d="M4.7 9.8L1 6.1l1.4-1.4 2.3 2.3 5.9-5.9 1.4 1.4z" /></svg>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Kích Cỡ */}
      <div className="flex items-start gap-4">
        <span className="w-20 text-sm text-zinc-500 pt-2 shrink-0">Kích cỡ</span>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => {
            const selected = size === selectedVariant.size;
            const hasStock = variants.some(v => v.size === size && v.color === selectedVariant.color && v.inStock && v.stock > 0);
            
            return (
              <Link
                key={size}
                href={buildVariantHref(productSlug, size, selectedVariant.color)}
                className={`relative min-w-16 px-3 py-1.5 text-sm text-center border rounded-sm uppercase transition-colors ${
                  selected 
                    ? "border-[#ee4d2d] text-[#ee4d2d]" 
                    : !hasStock 
                      ? "border-dashed border-zinc-200 text-zinc-400 bg-zinc-50 opacity-50 cursor-not-allowed pointer-events-none" 
                      : "border-zinc-200 text-zinc-800 hover:border-[#ee4d2d]"
                }`}
              >
                {size}
                {selected && (
                  <div className="absolute right-0 bottom-0 w-4 h-4 overflow-hidden before:content-[''] before:absolute before:-right-2 before:-bottom-2 before:w-4 before:h-4 before:bg-[#ee4d2d] before:rotate-45">
                    <svg className="absolute right-0 bottom-0 w-2 h-2 text-white fill-current" viewBox="0 0 12 12"><path d="M4.7 9.8L1 6.1l1.4-1.4 2.3 2.3 5.9-5.9 1.4 1.4z" /></svg>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Số lượng */}
      <div className="flex items-center gap-4 py-3">
        <span className="w-20 text-sm text-zinc-500 shrink-0">Số lượng</span>
        <div className="flex items-center">
          <button className="w-8 h-8 flex items-center justify-center border border-zinc-200 text-zinc-600 outline-none hover:bg-zinc-50 rounded-l-sm" disabled>-</button>
          <input type="text" value="1" readOnly className="w-12 h-8 border-y border-zinc-200 text-center text-sm font-medium focus:outline-none" />
          <button className="w-8 h-8 flex items-center justify-center border border-zinc-200 text-zinc-600 outline-none hover:bg-zinc-50 rounded-r-sm" disabled>+</button>
        </div>
        <div className="text-sm text-zinc-500 pl-4">
          {selectedState === "out-of-stock"
            ? "Hết hàng"
            : `Còn ${selectedVariant.stock} sản phẩm`}
        </div>
      </div>
{/* 
      <FeedbackMessage tone="info" message={`Tín hiệu fit: ${fitSignal}`} />
*/}
    </div>
  );
}
