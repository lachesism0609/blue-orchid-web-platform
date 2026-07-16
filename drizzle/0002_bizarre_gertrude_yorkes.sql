CREATE TABLE "product_inventory" (
	"product_id" integer PRIMARY KEY NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "product_inventory_stock_idx" ON "product_inventory" USING btree ("stock");