import { describe, expect, it } from "vitest";
import { initialListings } from "../data";
import type { Listing } from "../types";
import {
  buildSearchRegistrationListing,
  mergeSyncedListingWithExistingSettings,
} from "./listing-persistence";

describe("listing persistence mapping", () => {
  it("builds a disabled listing from an eBay search URL registration", () => {
    const listing = buildSearchRegistrationListing({
      itemId: "search-1",
      searchUrl:
        "https://www.ebay.com/sch/i.html?_nkw=Sony+XAV-AX1000+-junk&_sacat=0&_udlo=160&_udhi=260&LH_BIN=1",
      parsed: {
        searchKeyword: "Sony XAV-AX1000",
        categoryId: "0",
        priceMin: 160,
        priceMax: 260,
        conditionFilter: [],
        locationFilter: null,
        buyingOptions: "FIXED_PRICE",
        requiredTitleKeywords: ["Sony", "XAV-AX1000"],
        excludedTitleKeywords: ["junk"],
      },
    });

    expect(listing.itemId).toBe("search-1");
    expect(listing.status).toBe("off");
    expect(listing.settings.enabled).toBe(false);
    expect(listing.settings.searchUrl).toContain("_nkw=Sony+XAV-AX1000");
    expect(listing.settings.searchKeyword).toBe("Sony XAV-AX1000");
    expect(listing.settings.requiredTitleKeywords).toEqual(["Sony", "XAV-AX1000"]);
    expect(listing.settings.excludedTitleKeywords).toEqual(["junk"]);
  });

  it("preserves existing local settings when an eBay sync refreshes listing cache data", () => {
    const existing: Listing = {
      ...initialListings[0],
      itemId: "123",
      settings: {
        ...initialListings[0].settings,
        enabled: true,
        minPrice: 88,
        undercutAmount: 0.25,
        searchUrl: "https://www.ebay.com/sch/i.html?_nkw=custom",
        searchKeyword: "custom keyword",
        localCheckTimeSlots: ["10:00"],
      },
    };
    const synced: Listing = {
      ...initialListings[1],
      itemId: "123",
      title: "Fresh title from eBay",
      currentPrice: 199,
      settings: {
        ...initialListings[1].settings,
        enabled: false,
        minPrice: null,
        undercutAmount: 0.01,
        searchUrl: "",
        searchKeyword: "Fresh title from eBay",
        localCheckTimeSlots: [],
      },
    };

    const merged = mergeSyncedListingWithExistingSettings(synced, existing);

    expect(merged.title).toBe("Fresh title from eBay");
    expect(merged.currentPrice).toBe(199);
    expect(merged.settings.enabled).toBe(true);
    expect(merged.settings.minPrice).toBe(88);
    expect(merged.settings.undercutAmount).toBe(0.25);
    expect(merged.settings.searchUrl).toBe("https://www.ebay.com/sch/i.html?_nkw=custom");
    expect(merged.settings.searchKeyword).toBe("custom keyword");
    expect(merged.settings.localCheckTimeSlots).toEqual(["10:00"]);
  });
});
