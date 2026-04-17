import Link from "next/link";
import ProductCard from "@/components/features/product-card";

type FlashSaleItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  size: string;
  color: string;
  thumbnail: string;
};

export default function FlashSale({ items }: { items: FlashSaleItem[] }) {
  return (
    <section className="overflow-hidden rounded-sm bg-white shadow-sm">
      <div className="flex items-center justify-between bg-gradient-to-r from-[#ee4d2d] to-orange-400 px-4 py-3 text-white">
        <h2 className="text-lg font-black">FLASH SALE</h2>
        <Link href="/products" className="text-xs underline underline-offset-2">
          Xem tất cả
        </Link>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, 4).map((item) => (
          <ProductCard
            key={item.id}
            slug={item.slug}
            name={item.name}
            price={item.price}
            category={item.category}
            size={item.size}
            color={item.color}
            thumbnail={item.thumbnail}
            hasAI
          />
        ))}
      </div>
    </section>
  );
}
