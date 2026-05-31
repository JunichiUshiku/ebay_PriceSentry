import { NextResponse } from "next/server";
import { syncEbayListings } from "@/lib/server/ebay";
import { writeDevListings } from "@/lib/server/dev-store";
import { persistSyncedDbListings } from "@/lib/server/listing-persistence";

export const runtime = "nodejs";

export async function POST() {
  try {
    const listings = await syncEbayListings();
    const dbListings = await persistSyncedDbListings(listings);
    if (!dbListings) await writeDevListings(listings);
    const persistedListings = dbListings ?? listings;
    return NextResponse.json({
      ok: true,
      count: persistedListings.length,
      listings: persistedListings,
      source: dbListings ? "database" : "dev-store",
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "eBay出品同期に失敗しました" },
      { status: 400 },
    );
  }
}
