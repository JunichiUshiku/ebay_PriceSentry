import { NextResponse } from "next/server";
import { diagnoseEbayConnection } from "@/lib/server/ebay";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await diagnoseEbayConnection();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "接続診断に失敗しました" },
      { status: 400 },
    );
  }
}
