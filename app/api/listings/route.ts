import { NextResponse } from "next/server";
import { z } from "zod";
import { initialListings } from "@/lib/data";
import { parseEbaySearchUrl } from "@/lib/ebay-url";
import { readDevListings } from "@/lib/server/dev-store";
import { createDbListingFromSearchUrl, readDbListings } from "@/lib/server/listing-persistence";

export const runtime = "nodejs";

const createListingSchema = z.object({
  searchUrl: z.string().url(),
});

export async function GET() {
  const dbListings = await readDbListings();
  if (dbListings) {
    return NextResponse.json({ listings: dbListings, source: "database" });
  }

  const listings = (await readDevListings()) ?? initialListings;
  return NextResponse.json({ listings, source: listings === initialListings ? "sample" : "dev-store" });
}

export async function POST(request: Request) {
  const payload = createListingSchema.parse(await request.json());
  const parsed = parseEbaySearchUrl(payload.searchUrl);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const dbListing = await createDbListingFromSearchUrl({
    searchUrl: payload.searchUrl,
    parsed: parsed.value,
  });

  if (dbListing) {
    const listings = await readDbListings();
    return NextResponse.json({
      ok: true,
      listing: dbListing,
      listings: listings ?? [dbListing],
      source: "database",
    });
  }

  return NextResponse.json(
    { ok: false, error: "DATABASE_URLが未設定のためDB登録できません" },
    { status: 503 },
  );
}
