-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "account_status" TEXT NOT NULL,
    "full_name" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME
);

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "address_line" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price_minor" INTEGER NOT NULL,
    "thumbnail_url" TEXT,
    "is_active" BOOLEAN NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "variant_code" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_media_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_variant_id" TEXT NOT NULL,
    "movement_type" TEXT NOT NULL,
    "quantity_delta" INTEGER NOT NULL,
    "reason" TEXT,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_movements_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cart_id" TEXT NOT NULL,
    "product_variant_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "added_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cart_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "selected_address" TEXT NOT NULL,
    "selected_shipping_method" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "subtotal_minor" INTEGER NOT NULL,
    "shipping_fee_minor" INTEGER NOT NULL,
    "discount_minor" INTEGER NOT NULL,
    "total_minor" INTEGER NOT NULL,
    "picked_at" DATETIME,
    "packed_at" DATETIME,
    "shipped_at" DATETIME,
    "delivered_at" DATETIME,
    "cancelled_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "product_variant_id" TEXT NOT NULL,
    "product_slug_snapshot" TEXT NOT NULL,
    "title_snapshot" TEXT NOT NULL,
    "price_minor_snapshot" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "retry_of_transaction_id" TEXT,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_reference" TEXT,
    "checkout_url" TEXT,
    "last_idempotency_key" TEXT,
    "callback_event_time" DATETIME,
    "callback_received_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "payment_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payment_transactions_retry_of_transaction_id_fkey" FOREIGN KEY ("retry_of_transaction_id") REFERENCES "payment_transactions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_callbacks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payment_transaction_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "provider_reference" TEXT NOT NULL,
    "raw_status" TEXT NOT NULL,
    "mapped_status" TEXT NOT NULL,
    "event_time" DATETIME,
    "received_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_payload" TEXT NOT NULL,
    CONSTRAINT "payment_callbacks_payment_transaction_id_fkey" FOREIGN KEY ("payment_transaction_id") REFERENCES "payment_transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payment_callbacks_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "carrier" TEXT,
    "status" TEXT NOT NULL,
    "last_synced_at" DATETIME,
    "is_degraded" BOOLEAN NOT NULL DEFAULT false,
    "degraded_reason" TEXT,
    "retryable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shipment_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipment_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "event_time" DATETIME NOT NULL,
    "source" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shipment_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actor_id" TEXT,
    "order_id" TEXT,
    "action" TEXT NOT NULL,
    "before_status" TEXT,
    "after_status" TEXT,
    "reason" TEXT,
    "correlation_id" TEXT,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "report_type" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "download_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "export_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_users_account_status" ON "users"("account_status");

-- CreateIndex
CREATE INDEX "idx_users_created_at" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "idx_user_addresses_user_id" ON "user_addresses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_addresses_user_position" ON "user_addresses"("user_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_addresses_user_address" ON "user_addresses"("user_id", "address_line");

-- CreateIndex
CREATE UNIQUE INDEX "uq_sessions_token_hash" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "idx_sessions_user_id" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "idx_sessions_expires_at" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_products_slug" ON "products"("slug");

-- CreateIndex
CREATE INDEX "idx_products_category_is_active" ON "products"("category", "is_active");

-- CreateIndex
CREATE INDEX "idx_products_is_active" ON "products"("is_active");

-- CreateIndex
CREATE INDEX "idx_products_created_at" ON "products"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_product_variants_variant_code" ON "product_variants"("variant_code");

-- CreateIndex
CREATE INDEX "idx_product_variants_product_id" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "idx_product_variants_stock" ON "product_variants"("stock");

-- CreateIndex
CREATE UNIQUE INDEX "uq_product_variants_product_size_color" ON "product_variants"("product_id", "size", "color");

-- CreateIndex
CREATE INDEX "idx_product_media_product_id" ON "product_media"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_product_media_product_position" ON "product_media"("product_id", "position");

-- CreateIndex
CREATE INDEX "idx_inventory_movements_variant_created" ON "inventory_movements"("product_variant_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_inventory_movements_reference" ON "inventory_movements"("reference_type", "reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_carts_user_id" ON "carts"("user_id");

-- CreateIndex
CREATE INDEX "idx_carts_user_id" ON "carts"("user_id");

-- CreateIndex
CREATE INDEX "idx_cart_items_cart_id" ON "cart_items"("cart_id");

-- CreateIndex
CREATE INDEX "idx_cart_items_variant_id" ON "cart_items"("product_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cart_items_cart_variant" ON "cart_items"("cart_id", "product_variant_id");

-- CreateIndex
CREATE INDEX "idx_orders_user_id_created_at" ON "orders"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_orders_status_updated_at" ON "orders"("status", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "idx_orders_created_at" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "idx_orders_selected_shipping_method" ON "orders"("selected_shipping_method");

-- CreateIndex
CREATE INDEX "idx_order_items_order_id" ON "order_items"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_order_items_order_variant" ON "order_items"("order_id", "product_variant_id");

-- CreateIndex
CREATE INDEX "idx_payment_transactions_order_created" ON "payment_transactions"("order_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_payment_transactions_status_updated" ON "payment_transactions"("status", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "idx_payment_transactions_provider_reference" ON "payment_transactions"("provider_reference");

-- CreateIndex
CREATE UNIQUE INDEX "uq_payment_transactions_provider_provider_reference" ON "payment_transactions"("provider", "provider_reference");

-- CreateIndex
CREATE UNIQUE INDEX "uq_payment_transactions_provider_last_idempotency_key" ON "payment_transactions"("provider", "last_idempotency_key");

-- CreateIndex
CREATE INDEX "idx_payment_callbacks_transaction_received" ON "payment_callbacks"("payment_transaction_id", "received_at" DESC);

-- CreateIndex
CREATE INDEX "idx_payment_callbacks_order_received" ON "payment_callbacks"("order_id", "received_at" DESC);

-- CreateIndex
CREATE INDEX "idx_payment_callbacks_provider_reference" ON "payment_callbacks"("provider_reference");

-- CreateIndex
CREATE UNIQUE INDEX "uq_payment_callbacks_provider_idempotency_key" ON "payment_callbacks"("provider_reference", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "uq_shipments_order_id" ON "shipments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_shipments_tracking_number" ON "shipments"("tracking_number");

-- CreateIndex
CREATE INDEX "idx_shipments_status_updated" ON "shipments"("status", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "idx_shipments_tracking_number" ON "shipments"("tracking_number");

-- CreateIndex
CREATE INDEX "idx_shipment_events_shipment_event_time" ON "shipment_events"("shipment_id", "event_time" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_order_timestamp" ON "audit_logs"("order_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_actor_timestamp" ON "audit_logs"("actor_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_correlation_id" ON "audit_logs"("correlation_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_action_timestamp" ON "audit_logs"("action", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_export_jobs_user_id_created" ON "export_jobs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_export_jobs_status_created" ON "export_jobs"("status", "created_at" DESC);
