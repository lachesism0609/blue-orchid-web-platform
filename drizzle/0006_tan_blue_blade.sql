ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_skus" ADD CONSTRAINT "product_skus_stock_check" CHECK ("product_skus"."stock" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_price_check" CHECK ("products"."price" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_sale_percent_check" CHECK ("products"."sale_percent" IS NULL OR ("products"."sale_percent" BETWEEN 1 AND 99));--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_active_check" CHECK ("products"."active" IN (0, 1));