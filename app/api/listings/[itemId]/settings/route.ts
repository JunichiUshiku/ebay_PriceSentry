import { NextResponse } from "next/server";
import { z } from "zod";
import { updateDbListingSettings } from "@/lib/server/listing-persistence";

export const runtime = "nodejs";

const stringArraySchema = z.array(z.string());

const listingSettingsSchema = z.object({
  enabled: z.boolean(),
  searchUrl: z.string(),
  searchKeyword: z.string(),
  minPrice: z.number().nullable(),
  undercutAmount: z.number(),
  autoUpdateEnabled: z.boolean(),
  localCheckTimeSlots: stringArraySchema,
  priceRaiseEnabled: z.boolean(),
  priceRaiseMode: z.union([z.literal("competitor_gap"), z.literal("range")]),
  maxRaiseAmount: z.number(),
  ignoreConditionComparison: z.boolean(),
  excludeForeignSellers: z.boolean(),
  includeSellerIds: stringArraySchema,
  excludeSellerIds: stringArraySchema,
  requiredTitleKeywords: stringArraySchema,
  excludedTitleKeywords: stringArraySchema,
  aiJudgeEnabled: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  const payload = listingSettingsSchema.parse(await request.json());
  const updated = await updateDbListingSettings(itemId, payload);

  if (!updated) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URLが未設定のためDB保存できません" },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
