import { XMLParser } from "fast-xml-parser";
import { initialListings } from "@/lib/data";
import type { Listing, ListingSettings } from "@/lib/types";
import { readEbayCredentials, type EbayCredentialValues } from "./env-file";

type EbayTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type EbayXmlNode = Record<string, unknown>;

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: true,
  parseAttributeValue: false,
  removeNSPrefix: true,
});

export async function diagnoseEbayConnection() {
  const credentials = await readEbayCredentials();
  validateCredentials(credentials);
  const accessToken = await refreshUserAccessToken(credentials);
  const response = await callTradingApi(credentials, accessToken, "GetUser", getUserRequestXml(credentials));
  const parsed = parser.parse(response) as EbayXmlNode;
  const root = findRoot(parsed, "GetUserResponse");
  assertAck(root, response);

  const user = asRecord(root.User);
  return {
    ebayEnv: credentials.ebayEnv,
    userId: stringValue(user.UserID),
    registrationSite: stringValue(user.RegistrationSite),
    status: stringValue(root.Ack) || "Success",
  };
}

export async function syncEbayListings() {
  const credentials = await readEbayCredentials();
  validateCredentials(credentials);
  const accessToken = await refreshUserAccessToken(credentials);
  const listings: Listing[] = [];
  let pageNumber = 1;
  let totalPages = 1;

  do {
    const xml = await callTradingApi(
      credentials,
      accessToken,
      "GetMyeBaySelling",
      getMyeBaySellingRequestXml(credentials, pageNumber),
    );
    const parsed = parser.parse(xml) as EbayXmlNode;
    const root = findRoot(parsed, "GetMyeBaySellingResponse");
    assertAck(root, xml);
    const activeList = asRecord(root.ActiveList);
    const itemArray = asRecord(activeList.ItemArray);
    const items = toArray(itemArray.Item).map((node) => mapTradingItemToListing(asRecord(node)));
    listings.push(...items);

    const pagination = asRecord(activeList.PaginationResult);
    totalPages = Math.max(1, numberValue(pagination.TotalNumberOfPages) ?? 1);
    pageNumber += 1;
  } while (pageNumber <= totalPages && pageNumber <= 125);

  return listings;
}

async function refreshUserAccessToken(credentials: EbayCredentialValues) {
  const endpoint = "https://api.ebay.com/identity/v1/oauth2/token";
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: credentials.refreshToken,
  });
  const basic = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString("base64");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as EbayTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description ||
        data.error ||
        `eBay OAuth token request failed: HTTP ${response.status}`,
    );
  }

  return data.access_token;
}

async function callTradingApi(
  credentials: EbayCredentialValues,
  accessToken: string,
  callName: "GetMyeBaySelling" | "GetUser",
  body: string,
) {
  const endpoint = "https://api.ebay.com/ws/api.dll";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml;charset=UTF-8",
      "X-EBAY-API-CALL-NAME": callName,
      "X-EBAY-API-SITEID": "0",
      "X-EBAY-API-COMPATIBILITY-LEVEL": credentials.compatibilityLevel,
      "X-EBAY-API-IAF-TOKEN": accessToken,
    },
    body,
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Trading API ${callName} failed: HTTP ${response.status} ${text.slice(0, 240)}`);
  }
  return text;
}

function getUserRequestXml(credentials: EbayCredentialValues) {
  return `<?xml version="1.0" encoding="utf-8"?>
<GetUserRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <Version>${escapeXml(credentials.compatibilityLevel)}</Version>
</GetUserRequest>`;
}

function getMyeBaySellingRequestXml(credentials: EbayCredentialValues, pageNumber: number) {
  return `<?xml version="1.0" encoding="utf-8"?>
<GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <Version>${escapeXml(credentials.compatibilityLevel)}</Version>
  <DetailLevel>ReturnAll</DetailLevel>
  <ActiveList>
    <Include>true</Include>
    <Pagination>
      <EntriesPerPage>100</EntriesPerPage>
      <PageNumber>${pageNumber}</PageNumber>
    </Pagination>
  </ActiveList>
  <ScheduledList><Include>false</Include></ScheduledList>
  <SoldList><Include>false</Include></SoldList>
  <UnsoldList><Include>false</Include></UnsoldList>
</GetMyeBaySellingRequest>`;
}

function mapTradingItemToListing(item: EbayXmlNode): Listing {
  const sellingStatus = asRecord(item.SellingStatus);
  const shippingDetails = asRecord(item.ShippingDetails);
  const shippingOptions = toArray(shippingDetails.ShippingServiceOptions).map(asRecord);
  const firstShipping = shippingOptions[0] ?? {};
  const shipping = amountValue(firstShipping.ShippingServiceCost);
  const currentPrice = amountValue(sellingStatus.CurrentPrice) ?? 0;
  const total = shipping == null ? null : roundMoney(currentPrice + shipping);
  const listingStatus = stringValue(sellingStatus.ListingStatus);
  const itemId = stringValue(item.ItemID) || "unknown";

  return {
    itemId,
    title: stringValue(item.Title) || itemId,
    currentPrice,
    shipping,
    total,
    competitorTotal: null,
    suggestedPrice: null,
    changePercent: null,
    status: listingStatus === "Ended" ? "ended" : "off",
    reason: "eBay同期済み・価格調整OFF",
    lastCheckedAt: new Date().toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    condition: stringValue(item.ConditionDisplayName) || stringValue(item.ConditionID) || "-",
    sellerId: stringValue(asRecord(item.Seller).UserID) || "",
    aiConfidence: null,
    isOnSale: Boolean(asRecord(item.DiscountPriceInfo).OriginalRetailPrice),
    listingStatus: listingStatus === "Ended" ? "Ended" : "Active",
    settings: defaultListingSettings(itemId, stringValue(item.Title) || itemId),
    competitors: [],
  };
}

function defaultListingSettings(itemId: string, title: string): ListingSettings {
  return {
    ...initialListings[0].settings,
    enabled: false,
    searchUrl: "",
    searchKeyword: title,
    minPrice: null,
    localCheckTimeSlots: [],
    requiredTitleKeywords: [],
    excludedTitleKeywords: [],
    excludeSellerIds: [],
    includeSellerIds: [],
  };
}

function validateCredentials(credentials: EbayCredentialValues) {
  const missing = [
    ["EBAY_CLIENT_ID", credentials.clientId],
    ["EBAY_CLIENT_SECRET", credentials.clientSecret],
    ["EBAY_DEV_ID", credentials.devId],
    ["EBAY_REFRESH_TOKEN", credentials.refreshToken],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`eBay認証情報が不足しています: ${missing.join(", ")}`);
  }
}

function assertAck(root: EbayXmlNode, rawXml: string) {
  const ack = stringValue(root.Ack);
  if (ack === "Success" || ack === "Warning") return;
  const errors = toArray(root.Errors)
    .map((error) => {
      const node = asRecord(error);
      return stringValue(node.LongMessage) || stringValue(node.ShortMessage);
    })
    .filter(Boolean)
    .join(" / ");
  throw new Error(errors || `Trading API returned Ack=${ack || "Unknown"}: ${rawXml.slice(0, 240)}`);
}

function findRoot(parsed: EbayXmlNode, rootName: string) {
  const body = asRecord(asRecord(parsed.Envelope).Body);
  const root = parsed[rootName] ?? body[rootName];
  return asRecord(root);
}

function toArray(value: unknown) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function asRecord(value: unknown): EbayXmlNode {
  return value && typeof value === "object" ? (value as EbayXmlNode) : {};
}

function stringValue(value: unknown) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return stringValue(record["#text"]);
  }
  return "";
}

function numberValue(value: unknown) {
  const raw = stringValue(value);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function amountValue(value: unknown) {
  return numberValue(value);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
