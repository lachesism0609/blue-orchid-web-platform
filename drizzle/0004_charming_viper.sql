CREATE TABLE "error_events" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"message" text NOT NULL,
	"stack" text DEFAULT '' NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"user_agent" text DEFAULT '' NOT NULL,
	"ip_hash" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "error_events_created_at_idx" ON "error_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "error_events_source_idx" ON "error_events" USING btree ("source");