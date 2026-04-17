import assert from "node:assert/strict";
import test from "node:test";

import { __seedCatalogProductsForTests } from "../../../../../modules/catalog/product-store.js";
import { GET as getCatalogProductDetail } from "./route.js";

function createRequest(path) {
  return new Request(`http://localhost${path}`);
}

test.beforeEach(async () => {
  await __seedCatalogProductsForTests();
});

test("catalog detail trả sản phẩm theo slug", async () => {
  const response = await getCatalogProductDetail(createRequest("/api/catalog/products/ao-thun-basic-den"), {
    params: { slug: "ao-thun-basic-den" },
  });

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.slug, "ao-thun-basic-den");
  assert.ok(Array.isArray(payload.data.variants));
  assert.ok(payload.data.variants.length > 0);
  assert.equal(typeof payload.data.selectedVariant.stock, "number");
});

test("catalog detail chọn đúng biến thể theo query", async () => {
  const response = await getCatalogProductDetail(
    createRequest("/api/catalog/products/ao-thun-basic-den?size=l&color=den"),
    {
      params: { slug: "ao-thun-basic-den" },
    },
  );

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.selectedVariant.size, "l");
  assert.equal(payload.data.selectedVariant.color, "den");
  assert.equal(payload.data.selectedVariant.inStock, false);
});

test("catalog detail trả lỗi khi slug không tồn tại", async () => {
  const response = await getCatalogProductDetail(createRequest("/api/catalog/products/khong-ton-tai"), {
    params: { slug: "khong-ton-tai" },
  });

  assert.equal(response.status, 404);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "CATALOG_NOT_FOUND");
});

test("catalog detail trả lỗi khi query biến thể thiếu cặp size/color", async () => {
  const response = await getCatalogProductDetail(
    createRequest("/api/catalog/products/ao-thun-basic-den?size=m"),
    {
      params: { slug: "ao-thun-basic-den" },
    },
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "CATALOG_INVALID_QUERY");
});

test("catalog detail trả lỗi khi biến thể không hợp lệ", async () => {
  const response = await getCatalogProductDetail(
    createRequest("/api/catalog/products/ao-thun-basic-den?size=xl&color=do"),
    {
      params: { slug: "ao-thun-basic-den" },
    },
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "CATALOG_INVALID_QUERY");
});

test("catalog detail trả lỗi khi query có nhiều size", async () => {
  const response = await getCatalogProductDetail(
    createRequest("/api/catalog/products/ao-thun-basic-den?size=m&size=l&color=den"),
    {
      params: { slug: "ao-thun-basic-den" },
    },
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "CATALOG_INVALID_QUERY");
});

test("catalog detail trả lỗi nội bộ khi URL request không hợp lệ", async () => {
  const response = await getCatalogProductDetail(
    { url: "::::" },
    {
      params: { slug: "ao-thun-basic-den" },
    },
  );

  assert.equal(response.status, 500);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "CATALOG_INTERNAL_ERROR");
  assert.ok(response.headers.get("X-Correlation-Id"));
});
