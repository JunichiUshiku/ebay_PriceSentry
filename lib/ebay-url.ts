import { z } from "zod";
import type { ParsedEbaySearchUrl } from "./types";

export type EbayUrlValidation =
  | { ok: true; value: ParsedEbaySearchUrl }
  | { ok: false; error: string };

const ebayHostSchema = z
  .string()
  .refine((host) => host === "ebay.com" || host.endsWith(".ebay.com"), {
    message: "eBay.comのURLではありません",
  });

export function parseEbaySearchUrl(rawUrl: string): EbayUrlValidation {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, error: "URLの形式が正しくありません" };
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const hostResult = ebayHostSchema.safeParse(host);
  if (!hostResult.success) {
    return { ok: false, error: "eBay.comのURLではありません" };
  }

  const params = url.searchParams;
  const nkw = params.get("_nkw");
  if (nkw == null) {
    return { ok: false, error: "検索キーワードが含まれていません" };
  }
  if (!nkw.trim()) {
    return { ok: false, error: "検索キーワードが空です" };
  }
  if (params.get("LH_Sold") === "1") {
    return { ok: false, error: "Sold listings 検索URLは使用できません" };
  }

  const tokenized = tokenizeKeyword(nkw);

  return {
    ok: true,
    value: {
      searchKeyword: tokenized.keyword,
      excludedTitleKeywords: tokenized.excluded,
      requiredTitleKeywords: tokenized.required,
      categoryId: params.get("_sacat"),
      priceMin: numberOrNull(params.get("_udlo")),
      priceMax: numberOrNull(params.get("_udhi")),
      conditionFilter: splitCsv(params.get("LH_ItemCondition")),
      locationFilter: params.get("LH_PrefLoc"),
      buyingOptions: params.get("LH_BIN") === "1" ? "FIXED_PRICE" : null,
    },
  };
}

function tokenizeKeyword(keyword: string) {
  const required: string[] = [];
  const excluded: string[] = [];
  const normal: string[] = [];
  const normalized = keyword.replace(/\+/g, " ");
  const matcher = /"([^"]+)"|(\S+)/g;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(normalized))) {
    const phrase = match[1];
    const word = match[2];
    if (phrase) {
      required.push(phrase.trim());
      normal.push(phrase.trim());
      continue;
    }
    if (!word) continue;
    if (word.startsWith("-") && word.length > 1) {
      excluded.push(word.slice(1));
    } else {
      normal.push(word);
    }
  }

  return {
    keyword: normal.join(" ").trim(),
    required,
    excluded,
  };
}

function numberOrNull(value: string | null) {
  if (value == null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function splitCsv(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}
