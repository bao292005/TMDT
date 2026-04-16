import assert from "node:assert/strict";
import test from "node:test";

import {
  createAdminCatalogProduct,
  deactivateAdminCatalogProduct,
  getCatalogProductDetail,
  listAdminCatalogProducts,
  updateAdminCatalogProduct,
} from "./catalog-service.js";
import { __resetProductStoreForTests } from "./product-store.js";

test.beforeEach(() => {
  __resetProductStoreForTests();
});

test("catalog service trả chi tiết sản phẩm theo slug", () => {
  const result = getCatalogProductDetail({ slug: "ao-thun-basic-den", size: "", color: "" });

  assert.equal(result.success, true);
  assert.equal(result.data.slug, "ao-thun-basic-den");
  assert.ok(Array.isArray(result.data.variants));
  assert.ok(result.data.variants.length > 0);
});

test("catalog service chọn biến thể theo size/màu", () => {
  const result = getCatalogProductDetail({ slug: "ao-thun-basic-den", size: "l", color: "den" });

  assert.equal(result.success, true);
  assert.equal(result.data.selectedVariant.size, "l");
  assert.equal(result.data.selectedVariant.color, "den");
  assert.equal(result.data.selectedVariant.inStock, false);
});

test("catalog service trả lỗi khi biến thể không thuộc sản phẩm", () => {
  const result = getCatalogProductDetail({ slug: "ao-thun-basic-den", size: "s", color: "do" });

  assert.equal(result.success, false);
  assert.equal(result.code, "CATALOG_INVALID_QUERY");
});

test("admin catalog service tạo sản phẩm thành công", () => {
  const created = createAdminCatalogProduct({
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

  const listed = listAdminCatalogProducts();
  assert.equal(listed.success, true);
  assert.equal(listed.data.items.some((item) => item.slug === "ao-so-mi-xanh"), true);
});

test("admin catalog service chặn slug trùng", () => {
  const created = createAdminCatalogProduct({
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

test("admin catalog service cập nhật sản phẩm", () => {
  const listed = listAdminCatalogProducts();
  const productId = listed.data.items[0].id;

  const updated = updateAdminCatalogProduct(productId, {
    name: "Áo thun basic đen bản mới",
    price: 209000,
    variants: [{ size: "m", color: "den", stock: 25 }],
  });

  assert.equal(updated.success, true);
  assert.equal(updated.data.name, "Áo thun basic đen bản mới");
  assert.equal(updated.data.price, 209000);
  assert.equal(updated.data.variants[0].stock, 25);
});

test("admin catalog service soft deactivate sản phẩm", () => {
  const listed = listAdminCatalogProducts();
  const productId = listed.data.items.find((item) => item.slug === "ao-thun-basic-trang").id;

  const deactivated = deactivateAdminCatalogProduct(productId);
  assert.equal(deactivated.success, true);
  assert.equal(deactivated.data.isActive, false);
  assert.equal(deactivated.data.idempotent, false);

  const again = deactivateAdminCatalogProduct(productId);
  assert.equal(again.success, true);
  assert.equal(again.data.isActive, false);
  assert.equal(again.data.idempotent, true);
});

test("admin catalog service invalid payload", () => {
  const created = createAdminCatalogProduct({
    slug: "",
    name: "Lỗi",
    price: -100
  });

  assert.equal(created.success, false);
  assert.equal(created.code, "CATALOG_INVALID_PAYLOAD");
});

