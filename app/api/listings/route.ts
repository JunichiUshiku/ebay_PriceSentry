import { NextResponse } from "next/server";
import { initialListings } from "@/lib/data";
import { readDevListings } from "@/lib/server/dev-store";

export const runtime = "nodejs";

export async function GET() {
  const listings = (await readDevListings()) ?? initialListings;
  return NextResponse.json({ listings, source: listings === initialListings ? "sample" : "dev-store" });
}
