CREATE TABLE "product_sizes" (
	"id" integer PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"label" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_skus" (
	"id" integer PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"variant_id" integer NOT NULL,
	"size_id" integer NOT NULL,
	"sku" text NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" integer PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"code" text NOT NULL,
	"name_zh" text NOT NULL,
	"name_en" text NOT NULL,
	"color_hex" text NOT NULL,
	"image_url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" integer PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"name_zh" text NOT NULL,
	"name_en" text NOT NULL,
	"description_zh" text NOT NULL,
	"description_en" text NOT NULL,
	"materials_zh" text NOT NULL,
	"materials_en" text NOT NULL,
	"price" integer NOT NULL,
	"sale_percent" integer,
	"image_url" text NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "variant_id" integer;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "variant_name" text DEFAULT 'Default' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_sizes" ADD CONSTRAINT "product_sizes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_skus" ADD CONSTRAINT "product_skus_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_skus" ADD CONSTRAINT "product_skus_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_skus" ADD CONSTRAINT "product_skus_size_id_product_sizes_id_fk" FOREIGN KEY ("size_id") REFERENCES "public"."product_sizes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_sizes_product_label_idx" ON "product_sizes" USING btree ("product_id","label");--> statement-breakpoint
CREATE UNIQUE INDEX "product_sizes_product_position_idx" ON "product_sizes" USING btree ("product_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "product_skus_sku_idx" ON "product_skus" USING btree ("sku");--> statement-breakpoint
CREATE UNIQUE INDEX "product_skus_variant_size_idx" ON "product_skus" USING btree ("variant_id","size_id");--> statement-breakpoint
CREATE INDEX "product_skus_product_stock_idx" ON "product_skus" USING btree ("product_id","stock");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_code_idx" ON "product_variants" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_product_position_idx" ON "product_variants" USING btree ("product_id","position");--> statement-breakpoint
CREATE INDEX "products_category_active_idx" ON "products" USING btree ("category","active");--> statement-breakpoint
CREATE INDEX "products_sale_percent_idx" ON "products" USING btree ("sale_percent");