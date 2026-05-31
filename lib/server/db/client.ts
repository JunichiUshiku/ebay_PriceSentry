import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { readDatabaseConfig } from "./config";
import * as schema from "./schema";

let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null | undefined;
let cachedSql: postgres.Sql | null | undefined;

export function getDatabase() {
  if (cachedDb !== undefined) return cachedDb;

  const config = readDatabaseConfig(process.env.DATABASE_URL);
  if (!config.enabled) {
    cachedDb = null;
    cachedSql = null;
    return null;
  }

  cachedSql = postgres(config.databaseUrl, {
    max: 5,
    prepare: false,
  });
  cachedDb = drizzle(cachedSql, { schema });
  return cachedDb;
}

export async function closeDatabase() {
  if (cachedSql) await cachedSql.end();
  cachedSql = undefined;
  cachedDb = undefined;
}
