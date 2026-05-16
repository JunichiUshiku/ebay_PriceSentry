import { describe, expect, it } from "vitest";
import { calculatePriceDecision } from "./price-engine";

describe("calculatePriceDecision", () => {
  it("updates automatically when all guards pass", () => {
    const decision = calculatePriceDecision({
      ownPrice: 120,
      ownShipping: 30,
      competitorPrice: 149,
      competitorShipping: 0,
      minPrice: 90,
      undercutAmount: 0.01,
      maxDropPercent: 5,
      autoUpdateEnabled: true,
      isOnSale: false,
      aiUsed: true,
      aiConfidence: 0.95,
      aiAutoThreshold: 0.85,
    });

    expect(decision.result).toBe("updated");
    expect(decision.suggestedPrice).toBe(118.99);
  });

  it("moves large drops into approval", () => {
    const decision = calculatePriceDecision({
      ownPrice: 120,
      ownShipping: 30,
      competitorPrice: 130,
      competitorShipping: 9.99,
      minPrice: 90,
      undercutAmount: 0.01,
      maxDropPercent: 5,
      autoUpdateEnabled: true,
      isOnSale: false,
      aiUsed: true,
      aiConfidence: 0.92,
      aiAutoThreshold: 0.85,
    });

    expect(decision.result).toBe("pending_approval");
    expect(decision.guardCode).toBe("drop_too_large");
  });

  it("skips prices below minimum", () => {
    const decision = calculatePriceDecision({
      ownPrice: 80,
      ownShipping: 10,
      competitorPrice: 70,
      competitorShipping: 0,
      minPrice: 75,
      undercutAmount: 0.01,
      maxDropPercent: 5,
      autoUpdateEnabled: true,
      isOnSale: false,
      aiUsed: false,
      aiConfidence: null,
      aiAutoThreshold: 0.85,
    });

    expect(decision.result).toBe("skipped");
    expect(decision.guardCode).toBe("below_min_price");
  });
});
