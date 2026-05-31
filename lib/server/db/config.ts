export type DatabaseConfig =
  | { enabled: false; databaseUrl: null }
  | { enabled: true; databaseUrl: string };

export function readDatabaseConfig(databaseUrlInput: string | undefined): DatabaseConfig {
  const databaseUrl = databaseUrlInput?.trim();
  if (!databaseUrl) return { enabled: false, databaseUrl: null };
  return { enabled: true, databaseUrl };
}
