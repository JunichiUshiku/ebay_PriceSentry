import { NextResponse } from "next/server";
import { syncEbayListings } from "@/lib/server/ebay";
import { writeDevListings } from "@/lib/server/dev-store";

export const runtime = "nodejs";

export async function POST() {
  try {
    const listings = await syncEbayListings();
    await writeDevListings(listings);
    return NextResponse.json({
      ok: true,
      count: listings.length,
      listings,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "eBay出品同期に失敗しました" },
      { status: 400 },
    );
  }
}
