CREATE TABLE "approval_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_id" text NOT NULL,
	"old_price" numeric(10, 2),
	"proposed_price" numeric(10, 2),
	"competitor_item_id" text,
	"competitor_title" text,
	"competitor_total_price" numeric(10, 2),
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"expired_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "competitor_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"own_item_id" text NOT NULL,
	"competitor_item_id" text,
	"competitor_title" text,
	"competitor_price" numeric(10, 2),
	"competitor_shipping" numeric(10, 2),
	"competitor_total_price" numeric(10, 2),
	"competitor_seller_id" text,
	"competitor_condition" text,
	"competitor_location_country" text,
	"competitor_url" text,
	"rank_position" integer,
	"is_adopted" boolean DEFAULT false NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ebay_credentials" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"cert_secret_ref" text NOT NULL,
	"dev_id" text NOT NULL,
	"refresh_token_secret_ref" text,
	"refresh_token_expires_at" timestamp with time zone,
	"oauth_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"default_undercut_amount" numeric(10, 2) DEFAULT '0.01' NOT NULL,
	"default_min_price" numeric(10, 2),
	"time_slot_presets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"default_check_time_slots" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"default_marketplace" text DEFAULT 'EBAY_US' NOT NULL,
	"default_delivery_country" text DEFAULT 'US' NOT NULL,
	"default_delivery_postal_code" text DEFAULT '90001' NOT NULL,
	"timezone" text DEFAULT 'Asia/Tokyo' NOT NULL,
	"condition_match" boolean DEFAULT true NOT NULL,
	"exclude_for_parts" boolean DEFAULT true NOT NULL,
	"exclude_foreign_sellers" boolean DEFAULT false NOT NULL,
	"skip_sale_items" boolean DEFAULT true NOT NULL,
	"max_drop_percent_before_approval" numeric(5, 2) DEFAULT '5.00' NOT NULL,
	"ai_confidence_auto_threshold" numeric(4, 2) DEFAULT '0.85' NOT NULL,
	"ai_confidence_reject_threshold" numeric(4, 2) DEFAULT '0.64' NOT NULL,
	"allow_price_increase" boolean DEFAULT false NOT NULL,
	"automation_enabled" boolean DEFAULT true NOT NULL,
	"log_retention_days" integer DEFAULT 90 NOT NULL,
	"approval_expiration_days" integer DEFAULT 7 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_cache" (
	"user_id" uuid NOT NULL,
	"item_id" text NOT NULL,
	"title" text,
	"current_price" numeric(10, 2),
	"shipping_cost" numeric(10, 2),
	"condition_id" text,
	"condition_name" text,
	"image_url" text,
	"seller_id" text,
	"marketplace" text,
	"listing_status" text,
	"is_on_sale" boolean DEFAULT false NOT NULL,
	"last_fetched_at" timestamp with time zone,
	CONSTRAINT "listing_cache_user_id_item_id_pk" PRIMARY KEY("user_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "listing_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_id" text NOT NULL,
	"price_adjustment_enabled" boolean DEFAULT false NOT NULL,
	"local_min_price" numeric(10, 2),
	"local_undercut_amount" numeric(10, 2),
	"auto_update_enabled" boolean,
	"local_check_time_slots" jsonb,
	"search_url" text,
	"search_keyword" text,
	"category_id" text,
	"price_min" numeric(10, 2),
	"price_max" numeric(10, 2),
	"condition_filter" jsonb,
	"location_filter" text,
	"buying_options" text,
	"ignore_condition" boolean DEFAULT false NOT NULL,
	"exclude_foreign_sellers" boolean,
	"use_ai_judgement" boolean DEFAULT false NOT NULL,
	"allow_price_increase" boolean DEFAULT false NOT NULL,
	"price_increase_mode" text,
	"max_price_increase_amount" numeric(10, 2),
	"required_title_keywords" jsonb,
	"excluded_title_keywords" jsonb,
	"include_seller_ids" jsonb,
	"exclude_seller_ids" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_check_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"item_id" text NOT NULL,
	"own_title" text,
	"old_price" numeric(10, 2),
	"new_price" numeric(10, 2),
	"own_shipping" numeric(10, 2),
	"competitor_item_id" text,
	"competitor_title" text,
	"competitor_price" numeric(10, 2),
	"competitor_shipping" numeric(10, 2),
	"competitor_total_price" numeric(10, 2),
	"competitor_seller_id" text,
	"decision" text NOT NULL,
	"reason" text NOT NULL,
	"ai_used" boolean DEFAULT false NOT NULL,
	"ai_confidence" numeric(4, 2),
	"ai_reason" text,
	"api_update_status" text,
	"api_error_message" text
);
--> statement-breakpoint
CREATE TABLE "scheduler_lock" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"locked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"released_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "approval_queue" ADD CONSTRAINT "approval_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_snapshots" ADD CONSTRAINT "competitor_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ebay_credentials" ADD CONSTRAINT "ebay_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_settings" ADD CONSTRAINT "global_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_cache" ADD CONSTRAINT "listing_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_settings" ADD CONSTRAINT "listing_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_check_logs" ADD CONSTRAINT "price_check_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduler_lock" ADD CONSTRAINT "scheduler_lock_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approval_queue_user_status_idx" ON "approval_queue" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "approval_queue_user_item_idx" ON "approval_queue" USING btree ("user_id","item_id");--> statement-breakpoint
CREATE INDEX "competitor_snapshots_user_own_item_idx" ON "competitor_snapshots" USING btree ("user_id","own_item_id");--> statement-breakpoint
CREATE INDEX "competitor_snapshots_fetched_at_idx" ON "competitor_snapshots" USING btree ("fetched_at");--> statement-breakpoint
CREATE INDEX "listing_cache_user_idx" ON "listing_cache" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "listing_settings_user_item_unique" ON "listing_settings" USING btree ("user_id","item_id");--> statement-breakpoint
CREATE INDEX "listing_settings_user_idx" ON "listing_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "price_check_logs_user_checked_at_idx" ON "price_check_logs" USING btree ("user_id","checked_at");--> statement-breakpoint
CREATE INDEX "price_check_logs_user_item_idx" ON "price_check_logs" USING btree ("user_id","item_id");