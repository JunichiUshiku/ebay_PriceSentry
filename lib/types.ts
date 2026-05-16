export type PageKey = "dashboard" | "approvals" | "settings" | "logs";

export type ListingStatus =
  | "updated"
  | "pending"
  | "skipped"
  | "error"
  | "off"
  | "ended";

export type CheckResult =
  | "updated"
  | "pending_approval"
  | "skipped"
  | "error";

export type GuardCode =
  | "sale"
  | "missing_min_price"
  | "below_min_price"
  | "shipping_unknown"
  | "drop_too_large"
  | "ai_low_confidence"
  | "price_changed"
  | "manual_approval"
  | "ok";

export type CompetitorSnapshot = {
  rank: number;
  sellerId: string;
  itemPrice: number;
  shipping: number | null;
  total: number | null;
  deltaFromOwn: number | null;
  adopted?: boolean;
};

export type ListingSettings = {
  enabled: boolean;
  searchUrl: string;
  searchKeyword: string;
  minPrice: number | null;
  undercutAmount: number;
  autoUpdateEnabled: boolean;
  localCheckTimeSlots: string[];
  priceRaiseEnabled: boolean;
  priceRaiseMode: "competitor_gap" | "range";
  maxRaiseAmount: number;
  ignoreConditionComparison: boolean;
  excludeForeignSellers: boolean;
  includeSellerIds: string[];
  excludeSellerIds: string[];
  requiredTitleKeywords: string[];
  excludedTitleKeywords: string[];
  aiJudgeEnabled: boolean;
};

export type Listing = {
  itemId: string;
  title: string;
  currentPrice: number;
  shipping: number | null;
  total: number | null;
  competitorTotal: number | null;
  suggestedPrice: number | null;
  changePercent: number | null;
  status: ListingStatus;
  reason: string;
  lastCheckedAt: string;
  condition: string;
  sellerId: string;
  aiConfidence: number | null;
  isOnSale: boolean;
  listingStatus: "Active" | "Ended";
  settings: ListingSettings;
  competitors: CompetitorSnapshot[];
};

export type ApprovalItem = Listing & {
  approvalReason: string;
  waitingHours: number;
};

export type LogEntry = {
  id: string;
  at: string;
  itemId: string;
  title: string;
  previousPrice: number | null;
  newPrice: number | null;
  competitorTotal: number | null;
  result: CheckResult;
  reason: string;
  aiConfidence: number | null;
};

export type ParsedEbaySearchUrl = {
  searchKeyword: string;
  categoryId: string | null;
  priceMin: number | null;
  priceMax: number | null;
  conditionFilter: string[];
  locationFilter: string | null;
  buyingOptions: "FIXED_PRICE" | null;
  requiredTitleKeywords: string[];
  excludedTitleKeywords: string[];
};

export type PriceCheckInput = {
  ownPrice: number;
  ownShipping: number | null;
  competitorPrice: number | null;
  competitorShipping: number | null;
  minPrice: number | null;
  undercutAmount: number;
  maxDropPercent: number;
  autoUpdateEnabled: boolean;
  isOnSale: boolean;
  aiUsed: boolean;
  aiConfidence: number | null;
  aiAutoThreshold: number;
  currentPriceChangedBeforeUpdate?: boolean;
};

export type PriceCheckDecision = {
  result: CheckResult;
  guardCode: GuardCode;
  reason: string;
  ownTotal: number | null;
  competitorTotal: number | null;
  suggestedPrice: number | null;
  dropPercent: number | null;
};
