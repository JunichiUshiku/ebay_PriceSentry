import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type EbayEnv = "production";

export type EbayCredentialValues = {
  ebayEnv: EbayEnv;
  clientId: string;
  clientSecret: string;
  devId: string;
  refreshToken: string;
  redirectUri: string;
  compatibilityLevel: string;
};

export type EbayCredentialPatch = Partial<EbayCredentialValues>;

const ENV_FILE = ".env.local";

const ebayEnvKeys: Record<keyof EbayCredentialValues, string> = {
  ebayEnv: "EBAY_ENV",
  clientId: "EBAY_CLIENT_ID",
  clientSecret: "EBAY_CLIENT_SECRET",
  devId: "EBAY_DEV_ID",
  refreshToken: "EBAY_REFRESH_TOKEN",
  redirectUri: "EBAY_REDIRECT_URI",
  compatibilityLevel: "EBAY_COMPATIBILITY_LEVEL",
};

const defaults: EbayCredentialValues = {
  ebayEnv: "production",
  clientId: "",
  clientSecret: "",
  devId: "",
  refreshToken: "",
  redirectUri: "http://localhost:3000/api/auth/ebay/callback",
  compatibilityLevel: "1209",
};

export function envFilePath() {
  return join(process.cwd(), ENV_FILE);
}

export async function readDotEnvLocal() {
  try {
    return parseDotEnv(await readFile(envFilePath(), "utf8"));
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return {};
    throw error;
  }
}

export async function readEbayCredentials(): Promise<EbayCredentialValues> {
  const env = await readDotEnvLocal();
  return {
    ebayEnv: "production",
    clientId: env.EBAY_CLIENT_ID ?? "",
    clientSecret: env.EBAY_CLIENT_SECRET ?? "",
    devId: env.EBAY_DEV_ID ?? "",
    refreshToken: env.EBAY_REFRESH_TOKEN ?? "",
    redirectUri: env.EBAY_REDIRECT_URI ?? defaults.redirectUri,
    compatibilityLevel: defaults.compatibilityLevel,
  };
}

export async function writeEbayCredentials(patch: EbayCredentialPatch) {
  const currentRaw = await readEnvFileRaw();
  const current = parseDotEnv(currentRaw);
  const next = { ...current };
  next.EBAY_ENV = "production";
  next.EBAY_COMPATIBILITY_LEVEL = defaults.compatibilityLevel;

  for (const [field, envKey] of Object.entries(ebayEnvKeys) as Array<
    [keyof EbayCredentialValues, string]
  >) {
    const value = patch[field];
    if (value == null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    next[envKey] = String(value).trim();
  }

  await mkdir(dirname(envFilePath()), { recursive: true });
  await writeFile(envFilePath(), stringifyDotEnv(next, currentRaw), "utf8");
  return readEbayCredentials();
}

export function credentialStatus(credentials: EbayCredentialValues) {
  const configured = {
    clientId: Boolean(credentials.clientId),
    clientSecret: Boolean(credentials.clientSecret),
    devId: Boolean(credentials.devId),
    refreshToken: Boolean(credentials.refreshToken),
    redirectUri: Boolean(credentials.redirectUri),
  };

  return {
    ebayEnv: credentials.ebayEnv,
    redirectUri: credentials.redirectUri,
    compatibilityLevel: credentials.compatibilityLevel,
    configured,
    masked: {
      clientId: maskSecret(credentials.clientId, 4, 4),
      clientSecret: maskSecret(credentials.clientSecret, 0, 4),
      devId: maskSecret(credentials.devId, 4, 4),
      refreshToken: maskSecret(credentials.refreshToken, 0, 6),
    },
    ready:
      configured.clientId &&
      configured.clientSecret &&
      configured.devId &&
      configured.refreshToken,
  };
}

export function maskSecret(value: string, prefix = 4, suffix = 4) {
  if (!value) return "未設定";
  if (value.length <= prefix + suffix) return "設定済み";
  const left = prefix > 0 ? value.slice(0, prefix) : "";
  const right = suffix > 0 ? value.slice(-suffix) : "";
  return `${left}****${right}`;
}

export function parseDotEnv(raw: string) {
  const result: Record<string, string> = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    result[key] = unquote(value);
  }

  return result;
}

function stringifyDotEnv(next: Record<string, string>, previousRaw: string) {
  const seen = new Set<string>();
  const lines = previousRaw
    .split(/\r?\n/)
    .filter((line, index, array) => index < array.length - 1 || line !== "")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return line;
      const key = trimmed.slice(0, trimmed.indexOf("=")).trim();
      if (!(key in next)) return line;
      seen.add(key);
      return `${key}=${quoteIfNeeded(next[key])}`;
    });

  for (const [key, value] of Object.entries(next)) {
    if (!seen.has(key)) lines.push(`${key}=${quoteIfNeeded(value)}`);
  }

  return `${lines.join("\n")}\n`;
}

async function readEnvFileRaw() {
  try {
    return await readFile(envFilePath(), "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return "";
    throw error;
  }
}

function quoteIfNeeded(value: string) {
  if (!/[#\s"'\\]/.test(value)) return value;
  return JSON.stringify(value);
}

function unquote(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  return value;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
