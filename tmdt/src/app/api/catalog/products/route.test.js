import assert from "node:assert/strict";
import test from "node:test";

import { __seedCatalogProductsForTests } from "../../../../modules/catalog/product-store.js";
import { GET as getCatalogProducts } from "./route.js";

function createRequest(path) {
  return new Request(`http://localhost${path}`);
}

test.beforeEach(async () => {
  await __seedCatalogProductsForTests();
});

test("catalog browse trả danh sách sản phẩm active", async () => {
  const response = await getCatalogProducts(createRequest("/api/catalog/products"));

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.ok(Array.isArray(payload.data.items));
  assert.equal(payload.data.pagination.total, 4);
  assert.ok(payload.data.items.every((item) => item.slug !== "hoodie-oversize-xam"));
});

test("catalog filter theo category hoạt động", async () => {
  const response = await getCatalogProducts(createRequest("/api/catalog/products?category=ao-thun"));

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.pagination.total, 2);
  assert.ok(payload.data.items.every((item) => item.category === "ao-thun"));
});

test("catalog search theo keyword hoạt động", async () => {
  const response = await getCatalogProducts(createRequest("/api/catalog/products?keyword=ao-thun-basic"));

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.ok(payload.data.items.length > 0);
  assert.ok(payload.data.items.every((item) => item.slug.includes("ao-thun-basic")));
});

test("catalog filter tổ hợp theo size, color và khoảng giá", async () => {
  const response = await getCatalogProducts(
    createRequest("/api/catalog/products?size=m&color=den&minPrice=100000&maxPrice=300000"),
  );

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.items.length, 1);
  assert.ok(payload.data.items.every((item) => item.size === "m"));
  assert.ok(payload.data.items.every((item) => item.color === "den"));
  assert.ok(payload.data.items.every((item) => item.price >= 100000 && item.price <= 300000));
});

test("catalog filter không phân biệt hoa thường", async () => {
  const response = await getCatalogProducts(
    createRequest("/api/catalog/products?category=AO-THUN&size=M&color=DEN"),
  );

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.items.length, 1);
  assert.ok(payload.data.items.every((item) => item.category === "ao-thun"));
  assert.ok(payload.data.items.every((item) => item.size === "m"));
  assert.ok(payload.data.items.every((item) => item.color === "den"));
});

test("catalog chuẩn hóa page khi vượt totalPages", async () => {
  const response = await getCatalogProducts(createRequest("/api/catalog/products?page=9&pageSize=2"));

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.pagination.total, 4);
  assert.equal(payload.data.pagination.totalPages, 2);
  assert.equal(payload.data.pagination.page, 2);
  assert.equal(payload.data.items.length, 2);
});

test("catalog trả metadata filters trong response", async () => {
  const response = await getCatalogProducts(
    createRequest("/api/catalog/products?category=ao-thun&size=m&color=den&minPrice=100000&maxPrice=300000"),
  );

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.deepEqual(payload.data.filters, {
    category: "ao-thun",
    keyword: "",
    size: "m",
    color: "den",
    minPrice: 100000,
    maxPrice: 300000,
  });
});

test("catalog trả lỗi khi query page không hợp lệ", async () => {
  const response = await getCatalogProducts(createRequest("/api/catalog/products?page=0"));

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "CATALOG_INVALID_QUERY");
});

test("catalog trả lỗi khi pageSize vượt ngưỡng", async () => {
  const response = await getCatalogProducts(createRequest("/api/catalog/products?pageSize=200"));

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "CATALOG_INVALID_QUERY");
});

test("catalog trả lỗi khi khoảng giá không hợp lệ", async () => {
  const response = await getCatalogProducts(
    createRequest("/api/catalog/products?minPrice=700000&maxPrice=200000"),
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "CATALOG_INVALID_QUERY");
});

test("catalog trả lỗi khi giá vượt safe integer", async () => {
  const response = await getCatalogProducts(
    createRequest("/api/catalog/products?minPrice=9007199254740993"),
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "CATALOG_INVALID_QUERY");
});
