import Link from "next/link";

type ProductCardProps = {
  slug: string;
  name: string;
  price: number;
  thumbnail?: string;
  category?: string;
  size?: string;
  color?: string;
  originalPrice?: number;
  rating?: number;
  soldCount?: number;
  hasAI?: boolean;
  ctaLabel?: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

export default function ProductCard({
  slug,
  name,
  price,
  thumbnail,
  category,
  size,
  color,
  originalPrice,
  rating,
  soldCount,
  hasAI,
  ctaLabel = "Xem chi tiết",
}: ProductCardProps) {
  return (
    <Link
      href={`/products/${slug}`}
      className="group flex h-full flex-col rounded-sm border border-zinc-200 bg-white p-3 transition hover:border-[#ee4d2d] hover:shadow-md"
    >
      <div className="relative mb-3 aspect-square overflow-hidden rounded-sm bg-gradient-to-br from-orange-50 to-orange-100">
        {thumbnail ? (
          <div
            className="h-full w-full bg-cover bg-center bg-no-repeat transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundImage: `url(${thumbnail})` }}
          />
        ) : null}
        {hasAI ? (
          <span className="absolute left-2 top-2 z-10 rounded bg-purple-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            AI
          </span>
        ) : null}
      </div>

      {category ? <p className="text-xs text-zinc-500">{category}</p> : null}
      <h3 className="mt-1 line-clamp-2 text-sm font-medium transition-colors group-hover:text-[#ee4d2d]">{name}</h3>

      {(size || color) ? (
        <p className="mt-1 text-xs text-zinc-600">
          {size ? `Size ${size.toUpperCase()}` : ""}
          {size && color ? " · " : ""}
          {color ? `Màu ${color}` : ""}
        </p>
      ) : null}

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-sm font-bold text-[#ee4d2d]">{formatCurrency(price)}</span>
        {originalPrice ? (
          <span className="text-xs text-zinc-400 line-through">{formatCurrency(originalPrice)}</span>
        ) : null}
      </div>

      {(rating || soldCount) ? (
        <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
          {rating ? <span className="text-yellow-500">★ {rating}</span> : <span />}
          {soldCount ? <span>Đã bán {soldCount}</span> : null}
        </div>
      ) : null}

      <span className="mt-3 inline-block text-sm font-medium text-[#ee4d2d] hover:underline">{ctaLabel}</span>
    </Link>
  );
}
