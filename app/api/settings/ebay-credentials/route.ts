import { NextResponse } from "next/server";
import { z } from "zod";
import {
  credentialStatus,
  readEbayCredentials,
  writeEbayCredentials,
} from "@/lib/server/env-file";

export const runtime = "nodejs";

const credentialSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  devId: z.string().optional(),
  refreshToken: z.string().optional(),
  redirectUri: z.string().optional(),
});

export async function GET() {
  const credentials = await readEbayCredentials();
  return NextResponse.json(credentialStatus(credentials));
}

export async function POST(request: Request) {
  const payload = credentialSchema.parse(await request.json());
  const credentials = await writeEbayCredentials(payload);
  return NextResponse.json(credentialStatus(credentials));
}
