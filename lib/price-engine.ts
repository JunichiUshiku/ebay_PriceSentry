import type { PriceCheckDecision, PriceCheckInput } from "./types";

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export function calculatePriceDecision(input: PriceCheckInput): PriceCheckDecision {
  const ownTotal =
    input.ownShipping == null ? null : roundMoney(input.ownPrice + input.ownShipping);
  const competitorTotal =
    input.competitorPrice == null || input.competitorShipping == null
      ? null
      : roundMoney(input.competitorPrice + input.competitorShipping);
  const suggestedPrice =
    competitorTotal == null || input.ownShipping == null
      ? null
      : roundMoney(competitorTotal - input.undercutAmount - input.ownShipping);
  const dropPercent =
    suggestedPrice == null
      ? null
      : roundMoney(((input.ownPrice - suggestedPrice) / input.ownPrice) * 100);

  if (input.isOnSale) {
    return {
      result: "skipped",
      guardCode: "sale",
      reason: "セール中商品のためスキップ",
      ownTotal,
      competitorTotal,
      suggestedPrice,
      dropPercent,
    };
  }

  if (!input.minPrice) {
    return {
      result: "pending_approval",
      guardCode: "missing_min_price",
      reason: "有効な最低価格が未設定",
      ownTotal,
      competitorTotal,
      suggestedPrice,
      dropPercent,
    };
  }

  if (suggestedPrice == null || ownTotal == null || competitorTotal == null) {
    return {
      result: "pending_approval",
      guardCode: "shipping_unknown",
      reason: "送料込み価格が不明",
      ownTotal,
      competitorTotal,
      suggestedPrice,
      dropPercent,
    };
  }

  if (suggestedPrice < input.minPrice) {
    return {
      result: "skipped",
      guardCode: "below_min_price",
      reason: "最低価格を下回る",
      ownTotal,
      competitorTotal,
      suggestedPrice,
      dropPercent,
    };
  }

  if (dropPercent != null && dropPercent >= input.maxDropPercent) {
    return {
      result: "pending_approval",
      guardCode: "drop_too_large",
      reason: `1回の下落率が${input.maxDropPercent}%以上`,
      ownTotal,
      competitorTotal,
      suggestedPrice,
      dropPercent,
    };
  }

  if (
    input.aiUsed &&
    input.aiConfidence != null &&
    input.aiConfidence < input.aiAutoThreshold
  ) {
    return {
      result: "pending_approval",
      guardCode: "ai_low_confidence",
      reason: "AI判定信頼度低",
      ownTotal,
      competitorTotal,
      suggestedPrice,
      dropPercent,
    };
  }

  if (input.currentPriceChangedBeforeUpdate) {
    return {
      result: "pending_approval",
      guardCode: "price_changed",
      reason: "更新直前に価格変動",
      ownTotal,
      competitorTotal,
      suggestedPrice,
      dropPercent,
    };
  }

  if (!input.autoUpdateEnabled) {
    return {
      result: "pending_approval",
      guardCode: "manual_approval",
      reason: "手動承認設定",
      ownTotal,
      competitorTotal,
      suggestedPrice,
      dropPercent,
    };
  }

  return {
    result: "updated",
    guardCode: "ok",
    reason: "自動更新対象",
    ownTotal,
    competitorTotal,
    suggestedPrice,
    dropPercent,
  };
}
