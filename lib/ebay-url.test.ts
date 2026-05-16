import { describe, expect, it } from "vitest";
import { parseEbaySearchUrl } from "./ebay-url";

describe("parseEbaySearchUrl", () => {
  it("extracts search parameters from an ebay.com search URL", () => {
    const result = parseEbaySearchUrl(
      'https://www.ebay.com/sch/i.html?_nkw=Sony+"XAV-AX1000"+-junk&_sacat=123&_udlo=100&_udhi=250&LH_ItemCondition=3000,4000&LH_PrefLoc=1&LH_BIN=1',
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.searchKeyword).toBe("Sony XAV-AX1000");
    expect(result.value.requiredTitleKeywords).toEqual(["XAV-AX1000"]);
    expect(result.value.excludedTitleKeywords).toEqual(["junk"]);
    expect(result.value.categoryId).toBe("123");
    expect(result.value.priceMin).toBe(100);
    expect(result.value.priceMax).toBe(250);
    expect(result.value.conditionFilter).toEqual(["3000", "4000"]);
    expect(result.value.buyingOptions).toBe("FIXED_PRICE");
  });

  it("rejects sold-listing URLs", () => {
    const result = parseEbaySearchUrl(
      "https://www.ebay.com/sch/i.html?_nkw=Pioneer+FH-P7000MD&LH_Sold=1",
    );

    expect(result).toEqual({
      ok: false,
      error: "Sold listings 検索URLは使用できません",
    });
  });
});
