import assert from "node:assert/strict";
import test from "node:test";

import { getProductRecommendations } from "./recommendation-service.js";

const CATALOG_FIXTURE = [
  { id: "p1", slug: "ao-thun-den", name: "Áo thun đen", category: "ao-thun", price: 200000, size: "m", color: "den", thumbnail: "/1.jpg", isActive: true },
  { id: "p2", slug: "ao-thun-trang", name: "Áo thun trắng", category: "ao-thun", price: 210000, size: "m", color: "trang", thumbnail: "/2.jpg", isActive: true },
  { id: "p3", slug: "ao-thun-xanh", name: "Áo thun xanh", category: "ao-thun", price: 220000, size: "l", color: "xanh", thumbnail: "/3.jpg", isActive: true },
  { id: "p4", slug: "quan-jean-xanh", name: "Quần jean xanh", category: "quan-jean", price: 500000, size: "m", color: "xanh", thumbnail: "/4.jpg", isActive: true },
  { id: "p5", slug: "quan-jean-den", name: "Quần jean đen", category: "quan-jean", price: 520000, size: "l", color: "den", thumbnail: "/5.jpg", isActive: true },
  { id: "p6", slug: "vay-midi-do", name: "Váy midi đỏ", category: "vay", price: 600000, size: "s", color: "do", thumbnail: "/6.jpg", isActive: true },
  { id: "p7", slug: "ao-khoac-kem", name: "Áo khoác kem", category: "ao-khoac", price: 650000, size: "m", color: "kem", thumbnail: "/7.jpg", isActive: true },
];

test("recommendation baseline deterministic và fallback khi thiếu tín hiệu", async () => {
  const first = await getProductRecommendations(
    { productSlug: "ao-thun-den", limit: 5, viewed: [], tryOnSnapshot: null },
    { catalogProducts: CATALOG_FIXTURE },
  );
  const second = await getProductRecommendations(
    { productSlug: "ao-thun-den", limit: 5, viewed: [], tryOnSnapshot: null },
    { catalogProducts: CATALOG_FIXTURE },
  );

  assert.equal(first.success, true);
  assert.equal(first.state, "fallback");
  assert.equal(first.data.strategy, "baseline");
  assert.deepEqual(
    first.data.items.map((item) => item.slug),
    second.data.items.map((item) => item.slug),
  );
});

test("recommendation trả tối thiểu 5 item khi dữ liệu đủ", async () => {
  const result = await getProductRecommendations(
    { productSlug: "ao-thun-den", limit: 5, viewed: [], tryOnSnapshot: null },
    { catalogProducts: CATALOG_FIXTURE },
  );

  assert.equal(result.success, true);
  assert.equal(result.data.items.length, 5);
  assert.ok(result.data.items.every((item) => item.slug !== "ao-thun-den"));
});

test("recommendation cá nhân hóa bằng viewed signal", async () => {
  const result = await getProductRecommendations(
    { productSlug: "ao-thun-den", limit: 5, viewed: ["quan-jean-xanh"], tryOnSnapshot: null },
    { catalogProducts: CATALOG_FIXTURE },
  );

  assert.equal(result.success, true);
  assert.equal(result.state, "success");
  assert.ok(result.data.signalsUsed.includes("viewed"));
  assert.equal(result.data.items[0].category, "quan-jean");
});

test("recommendation có tín hiệu try-on thì chuyển sang success", async () => {
  const result = await getProductRecommendations(
    {
      productSlug: "ao-thun-den",
      limit: 5,
      viewed: [],
      tryOnSnapshot: { variantContext: { size: "l", color: "den" }, updatedAt: Date.now() },
    },
    { catalogProducts: CATALOG_FIXTURE },
  );

  assert.equal(result.success, true);
  assert.equal(result.state, "success");
  assert.ok(result.data.signalsUsed.includes("try-on-session"));
});
