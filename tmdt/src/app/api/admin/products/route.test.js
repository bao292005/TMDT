import assert from "node:assert/strict";
import test from "node:test";

import { createSession } from "../../../../modules/identity/session-store.js";
import { createUser, USER_ROLES } from "../../../../modules/identity/user-store.js";
import { __seedCatalogProductsForTests } from "../../../../modules/catalog/product-store.js";
import { GET as getAdminProducts, POST as postAdminProduct } from "./route.js";
import { PATCH as patchAdminProduct, DELETE as deleteAdminProduct } from "./[productId]/route.js";

function createRequest(path, { method = "GET", token, body } = {}) {
  const headers = new Headers();
  if (token) {
    headers.set("cookie", `session_token=${token}`);
  }
  if (body !== undefined) {
    headers.set("content-type", "application/json");
  }

  return new Request(`http://localhost${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

async function createTokenByRole(role) {
  const created = await createUser({
    email: `admin-products-${role}-${Date.now()}-${Math.random()}@example.com`,
    passwordHash: "hash",
    role,
  });

  assert.equal(created.success, true);
  return createSession(created.user.id, role);
}

function sampleProductPayload(overrides = {}) {
  return {
    slug: "ao-so-mi-lua-xanh",
    name: "Áo sơ mi lụa xanh",
    category: "ao-so-mi",
    description: "Áo sơ mi lụa mịn",
    price: 459000,
    size: "m",
    color: "xanh",
    thumbnail: "/products/ao-so-mi-lua-xanh.jpg",
    media: ["/products/ao-so-mi-lua-xanh.jpg"],
    variants: [{ size: "m", color: "xanh", stock: 10 }],
    isActive: true,
    ...overrides,
  };
}

test.beforeEach(async () => {
  await __seedCatalogProductsForTests();
});

test("admin products GET chặn request chưa đăng nhập", async () => {
  const response = await getAdminProducts(createRequest("/api/admin/products"));
  assert.equal(response.status, 401);

  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_UNAUTHORIZED");
});

test("admin products GET chặn role không phải admin", async () => {
  const customerToken = await createTokenByRole(USER_ROLES.CUSTOMER);
  const response = await getAdminProducts(
    createRequest("/api/admin/products", {
      token: customerToken,
    }),
  );

  assert.equal(response.status, 403);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "AUTH_FORBIDDEN");
});

test("admin products GET trả danh sách quản trị", async () => {
  const adminToken = await createTokenByRole(USER_ROLES.ADMIN);
  const response = await getAdminProducts(
    createRequest("/api/admin/products", {
      token: adminToken,
    }),
  );

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(Array.isArray(payload.data.items), true);
  assert.equal(payload.data.items.length > 0, true);
});

test("admin products POST tạo sản phẩm thành công", async () => {
  const adminToken = await createTokenByRole(USER_ROLES.ADMIN);
  const response = await postAdminProduct(
    createRequest("/api/admin/products", {
      method: "POST",
      token: adminToken,
      body: sampleProductPayload(),
    }),
  );

  assert.equal(response.status, 201);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.slug, "ao-so-mi-lua-xanh");
  assert.equal(payload.data.isActive, true);
});

test("admin products POST trả lỗi khi slug trùng", async () => {
  const adminToken = await createTokenByRole(USER_ROLES.ADMIN);
  const response = await postAdminProduct(
    createRequest("/api/admin/products", {
      method: "POST",
      token: adminToken,
      body: sampleProductPayload({ slug: "ao-thun-basic-den" }),
    }),
  );

  assert.equal(response.status, 409);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "CATALOG_DUPLICATE_SLUG");
});

test("admin products PATCH cập nhật sản phẩm", async () => {
  const adminToken = await createTokenByRole(USER_ROLES.ADMIN);

  const listedResponse = await getAdminProducts(createRequest("/api/admin/products", { token: adminToken }));
  const listedPayload = await listedResponse.json();
  const productId = listedPayload.data.items[0].id;

  const response = await patchAdminProduct(
    createRequest(`/api/admin/products/${productId}`, {
      method: "PATCH",
      token: adminToken,
      body: {
        name: "Áo thun basic đen premium",
        price: 239000,
      },
    }),
    { params: Promise.resolve({ productId }) },
  );

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("X-Correlation-Id"));

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.name, "Áo thun basic đen premium");
  assert.equal(payload.data.price, 239000);
});

test("admin products PATCH trả lỗi payload rỗng", async () => {
  const adminToken = await createTokenByRole(USER_ROLES.ADMIN);

  const listedResponse = await getAdminProducts(createRequest("/api/admin/products", { token: adminToken }));
  const listedPayload = await listedResponse.json();
  const productId = listedPayload.data.items[0].id;

  const response = await patchAdminProduct(
    createRequest(`/api/admin/products/${productId}`, {
      method: "PATCH",
      token: adminToken,
      body: {},
    }),
    { params: Promise.resolve({ productId }) },
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "CATALOG_INVALID_INPUT");
});

test("admin products DELETE soft deactivate sản phẩm", async () => {
  const adminToken = await createTokenByRole(USER_ROLES.ADMIN);

  const listedResponse = await getAdminProducts(createRequest("/api/admin/products", { token: adminToken }));
  const listedPayload = await listedResponse.json();
  const target = listedPayload.data.items.find((item) => item.slug === "ao-thun-basic-trang");

  const response = await deleteAdminProduct(
    createRequest(`/api/admin/products/${target.id}`, {
      method: "DELETE",
      token: adminToken,
    }),
    { params: Promise.resolve({ productId: target.id }) },
  );

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.isActive, false);
  assert.equal(payload.data.idempotent, false);

  const responseSecond = await deleteAdminProduct(
    createRequest(`/api/admin/products/${target.id}`, {
      method: "DELETE",
      token: adminToken,
    }),
    { params: Promise.resolve({ productId: target.id }) },
  );
  const payloadSecond = await responseSecond.json();
  assert.equal(payloadSecond.success, true);
  assert.equal(payloadSecond.data.idempotent, true);
});
