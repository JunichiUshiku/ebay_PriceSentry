import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Listing } from "@/lib/types";

const listingsFile = () => join(process.cwd(), "data", "dev-listings.json");

export async function readDevListings() {
  try {
    const raw = await readFile(listingsFile(), "utf8");
    return JSON.parse(raw) as Listing[];
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function writeDevListings(listings: Listing[]) {
  const path = listingsFile();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(listings, null, 2)}\n`, "utf8");
}
