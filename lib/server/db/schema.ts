import { relations, sql } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const authSchema = pgSchema("auth");

const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const globalSettings = pgTable("global_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  defaultUndercutAmount: decimal("default_undercut_amount", { precision: 10, scale: 2 })
    .default("0.01")
    .notNull(),
  defaultMinPrice: decimal("default_min_price", { precision: 10, scale: 2 }),
  timeSlotPresets: jsonb("time_slot_presets").default(sql`'[]'::jsonb`).notNull(),
  defaultCheckTimeSlots: jsonb("default_check_time_slots").default(sql`'[]'::jsonb`).notNull(),
  defaultMarketplace: text("default_marketplace").default("EBAY_US").notNull(),
  defaultDeliveryCountry: text("default_delivery_country").default("US").notNull(),
  defaultDeliveryPostalCode: text("default_delivery_postal_code").default("90001").notNull(),
  timezone: text("timezone").default("Asia/Tokyo").notNull(),
  conditionMatch: boolean("condition_match").default(true).notNull(),
  excludeForParts: boolean("exclude_for_parts").default(true).notNull(),
  excludeForeignSellers: boolean("exclude_foreign_sellers").default(false).notNull(),
  skipSaleItems: boolean("skip_sale_items").default(true).notNull(),
  maxDropPercentBeforeApproval: decimal("max_drop_percent_before_approval", {
    precision: 5,
    scale: 2,
  })
    .default("5.00")
    .notNull(),
  aiConfidenceAutoThreshold: decimal("ai_confidence_auto_threshold", {
    precision: 4,
    scale: 2,
  })
    .default("0.85")
    .notNull(),
  aiConfidenceRejectThreshold: decimal("ai_confidence_reject_threshold", {
    precision: 4,
    scale: 2,
  })
    .default("0.64")
    .notNull(),
  allowPriceIncrease: boolean("allow_price_increase").default(false).notNull(),
  automationEnabled: boolean("automation_enabled").default(true).notNull(),
  logRetentionDays: integer("log_retention_days").default(90).notNull(),
  approvalExpirationDays: integer("approval_expiration_days").default(7).notNull(),
  ...timestamps,
});

export const ebayCredentials = pgTable("ebay_credentials", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  appId: text("app_id").notNull(),
  certSecretRef: text("cert_secret_ref").notNull(),
  devId: text("dev_id").notNull(),
  refreshTokenSecretRef: text("refresh_token_secret_ref"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  oauthStatus: text("oauth_status").default("pending").notNull(),
  ...timestamps,
});

export const listingSettings = pgTable(
  "listing_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    priceAdjustmentEnabled: boolean("price_adjustment_enabled").default(false).notNull(),
    localMinPrice: decimal("local_min_price", { precision: 10, scale: 2 }),
    localUndercutAmount: decimal("local_undercut_amount", { precision: 10, scale: 2 }),
    autoUpdateEnabled: boolean("auto_update_enabled"),
    localCheckTimeSlots: jsonb("local_check_time_slots"),
    searchUrl: text("search_url"),
    searchKeyword: text("search_keyword"),
    categoryId: text("category_id"),
    priceMin: decimal("price_min", { precision: 10, scale: 2 }),
    priceMax: decimal("price_max", { precision: 10, scale: 2 }),
    conditionFilter: jsonb("condition_filter"),
    locationFilter: text("location_filter"),
    buyingOptions: text("buying_options"),
    ignoreCondition: boolean("ignore_condition").default(false).notNull(),
    excludeForeignSellers: boolean("exclude_foreign_sellers"),
    useAiJudgement: boolean("use_ai_judgement").default(false).notNull(),
    allowPriceIncrease: boolean("allow_price_increase").default(false).notNull(),
    priceIncreaseMode: text("price_increase_mode"),
    maxPriceIncreaseAmount: decimal("max_price_increase_amount", { precision: 10, scale: 2 }),
    requiredTitleKeywords: jsonb("required_title_keywords"),
    excludedTitleKeywords: jsonb("excluded_title_keywords"),
    includeSellerIds: jsonb("include_seller_ids"),
    excludeSellerIds: jsonb("exclude_seller_ids"),
    ...timestamps,
  },
  (table) => ({
    itemUserUnique: uniqueIndex("listing_settings_user_item_unique").on(table.userId, table.itemId),
    userIndex: index("listing_settings_user_idx").on(table.userId),
  }),
);

export const listingCache = pgTable(
  "listing_cache",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    title: text("title"),
    currentPrice: decimal("current_price", { precision: 10, scale: 2 }),
    shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }),
    conditionId: text("condition_id"),
    conditionName: text("condition_name"),
    imageUrl: text("image_url"),
    sellerId: text("seller_id"),
    marketplace: text("marketplace"),
    listingStatus: text("listing_status"),
    isOnSale: boolean("is_on_sale").default(false).notNull(),
    lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.itemId] }),
    userIndex: index("listing_cache_user_idx").on(table.userId),
  }),
);

export const competitorSnapshots = pgTable(
  "competitor_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    ownItemId: text("own_item_id").notNull(),
    competitorItemId: text("competitor_item_id"),
    competitorTitle: text("competitor_title"),
    competitorPrice: decimal("competitor_price", { precision: 10, scale: 2 }),
    competitorShipping: decimal("competitor_shipping", { precision: 10, scale: 2 }),
    competitorTotalPrice: decimal("competitor_total_price", { precision: 10, scale: 2 }),
    competitorSellerId: text("competitor_seller_id"),
    competitorCondition: text("competitor_condition"),
    competitorLocationCountry: text("competitor_location_country"),
    competitorUrl: text("competitor_url"),
    rankPosition: integer("rank_position"),
    isAdopted: boolean("is_adopted").default(false).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userOwnItemIndex: index("competitor_snapshots_user_own_item_idx").on(
      table.userId,
      table.ownItemId,
    ),
    fetchedAtIndex: index("competitor_snapshots_fetched_at_idx").on(table.fetchedAt),
  }),
);

export const priceCheckLogs = pgTable(
  "price_check_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    checkedAt: timestamp("checked_at", { withTimezone: true }).defaultNow().notNull(),
    itemId: text("item_id").notNull(),
    ownTitle: text("own_title"),
    oldPrice: decimal("old_price", { precision: 10, scale: 2 }),
    newPrice: decimal("new_price", { precision: 10, scale: 2 }),
    ownShipping: decimal("own_shipping", { precision: 10, scale: 2 }),
    competitorItemId: text("competitor_item_id"),
    competitorTitle: text("competitor_title"),
    competitorPrice: decimal("competitor_price", { precision: 10, scale: 2 }),
    competitorShipping: decimal("competitor_shipping", { precision: 10, scale: 2 }),
    competitorTotalPrice: decimal("competitor_total_price", { precision: 10, scale: 2 }),
    competitorSellerId: text("competitor_seller_id"),
    decision: text("decision").notNull(),
    reason: text("reason").notNull(),
    aiUsed: boolean("ai_used").default(false).notNull(),
    aiConfidence: decimal("ai_confidence", { precision: 4, scale: 2 }),
    aiReason: text("ai_reason"),
    apiUpdateStatus: text("api_update_status"),
    apiErrorMessage: text("api_error_message"),
  },
  (table) => ({
    userCheckedAtIndex: index("price_check_logs_user_checked_at_idx").on(
      table.userId,
      table.checkedAt,
    ),
    userItemIndex: index("price_check_logs_user_item_idx").on(table.userId, table.itemId),
  }),
);

export const approvalQueue = pgTable(
  "approval_queue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    oldPrice: decimal("old_price", { precision: 10, scale: 2 }),
    proposedPrice: decimal("proposed_price", { precision: 10, scale: 2 }),
    competitorItemId: text("competitor_item_id"),
    competitorTitle: text("competitor_title"),
    competitorTotalPrice: decimal("competitor_total_price", { precision: 10, scale: 2 }),
    reason: text("reason").notNull(),
    status: text("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    expiredAt: timestamp("expired_at", { withTimezone: true }),
  },
  (table) => ({
    userStatusIndex: index("approval_queue_user_status_idx").on(table.userId, table.status),
    userItemIndex: index("approval_queue_user_item_idx").on(table.userId, table.itemId),
  }),
);

export const schedulerLock = pgTable("scheduler_lock", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  lockedAt: timestamp("locked_at", { withTimezone: true }).defaultNow().notNull(),
  releasedAt: timestamp("released_at", { withTimezone: true }),
});

export const userRelations = relations(authUsers, ({ one, many }) => ({
  globalSettings: one(globalSettings),
  ebayCredentials: one(ebayCredentials),
  listingSettings: many(listingSettings),
  listingCache: many(listingCache),
  priceCheckLogs: many(priceCheckLogs),
  approvalQueue: many(approvalQueue),
}));
