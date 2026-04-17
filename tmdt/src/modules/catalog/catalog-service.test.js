import assert from "node:assert/strict";
import test from "node:test";

import {
  createAdminCatalogProduct,
  deactivateAdminCatalogProduct,
  getCatalogProductDetail,
  getCatalogProducts,
  listAdminCatalogProducts,
  updateAdminCatalogProduct,
} from "./catalog-service.js";
import { __seedCatalogProductsForTests } from "./product-store.js";

test.beforeEach(async () => {
  await __seedCatalogProductsForTests();
});

test("catalog service trả chi tiết sản phẩm theo slug", async () => {
  const result = await getCatalogProductDetail({ slug: "ao-thun-basic-den", size: "", color: "" });

  assert.equal(result.success, true);
  assert.equal(result.data.slug, "ao-thun-basic-den");
  assert.ok(Array.isArray(result.data.variants));
  assert.ok(result.data.variants.length > 0);
});

test("catalog service chọn biến thể theo size/màu", async () => {
  const result = await getCatalogProductDetail({ slug: "ao-thun-basic-den", size: "l", color: "den" });

  assert.equal(result.success, true);
  assert.equal(result.data.selectedVariant.size, "l");
  assert.equal(result.data.selectedVariant.color, "den");
  assert.equal(result.data.selectedVariant.inStock, false);
});

test("catalog service trả lỗi khi biến thể không thuộc sản phẩm", async () => {
  const result = await getCatalogProductDetail({ slug: "ao-thun-basic-den", size: "s", color: "do" });

  assert.equal(result.success, false);
  assert.equal(result.code, "CATALOG_INVALID_QUERY");
});

test("admin catalog service tạo sản phẩm thành công", async () => {
  const created = await createAdminCatalogProduct({
    slug: "ao-so-mi-xanh",
    name: "Áo sơ mi xanh",
    category: "ao-so-mi",
    description: "Áo sơ mi công sở",
    price: 349000,
    size: "m",
    color: "xanh",
    thumbnail: "/products/ao-so-mi-xanh.jpg",
    media: ["/products/ao-so-mi-xanh.jpg"],
    variants: [{ size: "m", color: "xanh", stock: 8 }],
    isActive: true,
  });

  assert.equal(created.success, true);
  assert.equal(created.data.slug, "ao-so-mi-xanh");

  const listed = await listAdminCatalogProducts();
  assert.equal(listed.success, true);
  assert.equal(listed.data.items.some((item) => item.slug === "ao-so-mi-xanh"), true);
});

test("admin catalog service chặn slug trùng", async () => {
  const created = await createAdminCatalogProduct({
    slug: "ao-thun-basic-den",
    name: "Bản sao",
    category: "ao-thun",
    description: "desc",
    price: 199000,
    size: "m",
    color: "den",
    thumbnail: "/products/copy.jpg",
    media: ["/products/copy.jpg"],
    variants: [{ size: "m", color: "den", stock: 1 }],
    isActive: true,
  });

  assert.equal(created.success, false);
  assert.equal(created.code, "CATALOG_DUPLICATE_SLUG");
});

test("admin catalog service cập nhật sản phẩm", async () => {
  const listed = await listAdminCatalogProducts();
  const productId = listed.data.items[0].id;

  const updated = await updateAdminCatalogProduct(productId, {
    name: "Áo thun basic đen bản mới",
    price: 209000,
    variants: [{ size: "m", color: "den", stock: 25 }],
  });

  assert.equal(updated.success, true);
  assert.equal(updated.data.name, "Áo thun basic đen bản mới");
  assert.equal(updated.data.price, 209000);
  assert.equal(updated.data.variants[0].stock, 25);
});

test("admin catalog service soft deactivate sản phẩm", async () => {
  const listed = await listAdminCatalogProducts();
  const productId = listed.data.items.find((item) => item.slug === "ao-thun-basic-trang").id;

  const deactivated = await deactivateAdminCatalogProduct(productId);
  assert.equal(deactivated.success, true);
  assert.equal(deactivated.data.isActive, false);
  assert.equal(deactivated.data.idempotent, false);

  const again = await deactivateAdminCatalogProduct(productId);
  assert.equal(again.success, true);
  assert.equal(again.data.isActive, false);
  assert.equal(again.data.idempotent, true);
});

test("admin catalog service invalid payload", async () => {
  const created = await createAdminCatalogProduct({
    slug: "",
    name: "Lỗi",
    price: -100,
  });

  assert.equal(created.success, false);
  assert.equal(created.code, "CATALOG_INVALID_PAYLOAD");
});

test("catalog service không lọc giá khi minPrice/maxPrice không hợp lệ", async () => {
  const baseline = await getCatalogProducts({
    category: "",
    keyword: "",
    size: "",
    color: "",
    minPrice: null,
    maxPrice: null,
    page: 1,
    pageSize: 50,
  });

  const withInvalidPriceFilter = await getCatalogProducts({
    category: "",
    keyword: "",
    size: "",
    color: "",
    minPrice: undefined,
    maxPrice: undefined,
    page: 1,
    pageSize: 50,
  });

  assert.equal(withInvalidPriceFilter.items.length, baseline.items.length);
  assert.deepEqual(withInvalidPriceFilter.items, baseline.items);
});

test("catalog service chặn page âm và trả về trang 1", async () => {
  const result = await getCatalogProducts({
    category: "",
    keyword: "",
    size: "",
    color: "",
    minPrice: null,
    maxPrice: null,
    page: 0,
    pageSize: 2,
  });

  assert.equal(result.pagination.page, 1);
  assert.equal(result.items.length, 2);
});

test("catalog service không crash khi slug không phải chuỗi", async () => {
  const result = await getCatalogProductDetail({ slug: 123, size: "", color: "" });

  assert.equal(result.success, false);
  assert.equal(result.code, "CATALOG_NOT_FOUND");
});

test("admin catalog service chặn số không hữu hạn và giá bằng 0", async () => {
  const withInfinitePrice = await createAdminCatalogProduct({
    slug: "ao-infinite",
    name: "Áo infinite",
    category: "ao-thun",
    description: "desc",
    price: Number.POSITIVE_INFINITY,
    size: "m",
    color: "den",
    thumbnail: "/products/x.jpg",
    media: ["/products/x.jpg"],
    variants: [{ size: "m", color: "den", stock: 1 }],
    isActive: true,
  });

  const withNaNStock = await createAdminCatalogProduct({
    slug: "ao-nan-stock",
    name: "Áo nan stock",
    category: "ao-thun",
    description: "desc",
    price: 199000,
    size: "m",
    color: "den",
    thumbnail: "/products/x.jpg",
    media: ["/products/x.jpg"],
    variants: [{ size: "m", color: "den", stock: Number.NaN }],
    isActive: true,
  });

  const withZeroPrice = await createAdminCatalogProduct({
    slug: "ao-zero-price",
    name: "Áo zero",
    category: "ao-thun",
    description: "desc",
    price: 0,
    size: "m",
    color: "den",
    thumbnail: "/products/x.jpg",
    media: ["/products/x.jpg"],
    variants: [{ size: "m", color: "den", stock: 1 }],
    isActive: true,
  });

  assert.equal(withInfinitePrice.success, false);
  assert.equal(withInfinitePrice.code, "CATALOG_INVALID_PAYLOAD");
  assert.equal(withNaNStock.success, false);
  assert.equal(withNaNStock.code, "CATALOG_INVALID_PAYLOAD");
  assert.equal(withZeroPrice.success, false);
  assert.equal(withZeroPrice.code, "CATALOG_INVALID_PAYLOAD");
});
