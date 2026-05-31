import { describe, expect, it } from "vitest";
import { readDatabaseConfig } from "./config";

describe("readDatabaseConfig", () => {
  it("disables database access when DATABASE_URL is missing", () => {
    expect(readDatabaseConfig(undefined)).toEqual({ enabled: false, databaseUrl: null });
    expect(readDatabaseConfig("")).toEqual({
      enabled: false,
      databaseUrl: null,
    });
  });

  it("enables database access when DATABASE_URL is provided", () => {
    expect(readDatabaseConfig("postgres://user:pass@example.com/db")).toEqual({
      enabled: true,
      databaseUrl: "postgres://user:pass@example.com/db",
    });
  });
});
