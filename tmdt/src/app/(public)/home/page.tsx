import ProductCard from "@/components/features/product-card";
import BannerSlider from "@/components/home/banner-slider";
import FlashSale from "@/components/home/flash-sale";
import { getCatalogProducts } from "@/modules/catalog/catalog-service.js";

type HomeCatalogItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  size: string;
  color: string;
  thumbnail: string;
};

export default async function HomePage() {
  const result = await getCatalogProducts({
    category: "",
    keyword: "",
    size: "",
    color: "",
    minPrice: null,
    maxPrice: null,
    page: 1,
    pageSize: 12,
  });
  const products: HomeCatalogItem[] = result.items;

  return (
    <main className="container mx-auto space-y-6 px-4 py-6">
      <BannerSlider />

      <FlashSale
        items={products.map((item) => ({
          id: item.id,
          slug: item.slug,
          name: item.name,
          category: item.category,
          price: item.price,
          size: item.size,
          color: item.color,
          thumbnail: item.thumbnail,
        }))}
      />

      <section className="space-y-3 rounded-sm bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-[#ee4d2d]">Gợi ý hôm nay</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(4, 12).map((item) => (
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
    </main>
  );
}
