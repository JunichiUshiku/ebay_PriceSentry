import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  approvalQueue,
  competitorSnapshots,
  globalSettings,
  listingCache,
  listingSettings,
  priceCheckLogs,
} from "./schema";

describe("db schema", () => {
  it("defines the persistence tables from the requirements", () => {
    expect(getTableName(globalSettings)).toBe("global_settings");
    expect(getTableName(listingSettings)).toBe("listing_settings");
    expect(getTableName(listingCache)).toBe("listing_cache");
    expect(getTableName(competitorSnapshots)).toBe("competitor_snapshots");
    expect(getTableName(priceCheckLogs)).toBe("price_check_logs");
    expect(getTableName(approvalQueue)).toBe("approval_queue");
  });
});
