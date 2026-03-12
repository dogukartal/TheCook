// Plan 02-03 — DB_VERSION 2 migration tests
import { migrateDb } from "../src/db/client";

// Helper: create a mock db that simulates a given current user_version
function createMockDb(currentUserVersion: number) {
  const execCalls: string[] = [];

  const db = {
    getFirstAsync: jest.fn().mockResolvedValue({ user_version: currentUserVersion }),
    execAsync: jest.fn().mockImplementation(async (sql: string) => {
      execCalls.push(sql);
    }),
    _execCalls: execCalls,
  };

  return db;
}

describe("migrateDb — DB_VERSION 3", () => {
  it("DB_VERSION constant is 3", async () => {
    // Fresh DB (version 0) — migration should run; version 3 should be set at end
    const db = createMockDb(0);
    await migrateDb(db as any);

    // The last execAsync call should set user_version = 3
    const allSql = db._execCalls.join("\n");
    expect(allSql).toContain("PRAGMA user_version = 3");
  });

  it("creates profile table on fresh install", async () => {
    const db = createMockDb(0);
    await migrateDb(db as any);

    const allSql = db._execCalls.join("\n");
    expect(allSql).toContain("CREATE TABLE IF NOT EXISTS profile");
  });

  it("creates bookmarks table on fresh install", async () => {
    const db = createMockDb(0);
    await migrateDb(db as any);

    const allSql = db._execCalls.join("\n");
    expect(allSql).toContain("CREATE TABLE IF NOT EXISTS bookmarks");
  });

  it("seeds profile row id=1 on fresh install", async () => {
    const db = createMockDb(0);
    await migrateDb(db as any);

    const allSql = db._execCalls.join("\n");
    expect(allSql).toContain("INSERT OR IGNORE INTO profile");
    expect(allSql).toContain("VALUES (1)");
  });

  it("bookmarks table has required columns", async () => {
    const db = createMockDb(0);
    await migrateDb(db as any);

    const allSql = db._execCalls.join("\n");
    expect(allSql).toContain("recipe_id");
    expect(allSql).toContain("user_id");
    expect(allSql).toContain("created_at");
  });

  it("profile table has onboarding_completed column with default 0", async () => {
    const db = createMockDb(0);
    await migrateDb(db as any);

    const allSql = db._execCalls.join("\n");
    expect(allSql).toContain("onboarding_completed");
  });

  it("is idempotent — does not run migration when already at version 3", async () => {
    const db = createMockDb(3);
    await migrateDb(db as any);

    // No execAsync should be called when already at target version
    expect(db.execAsync).not.toHaveBeenCalled();
  });

  it("runs only profile/bookmarks migration when upgrading from version 1", async () => {
    const db = createMockDb(1);
    await migrateDb(db as any);

    const allSql = db._execCalls.join("\n");
    // Should create profile/bookmarks but NOT re-run the v0 migration
    expect(allSql).toContain("CREATE TABLE IF NOT EXISTS profile");
    // Should NOT have journal_mode (that's v0 only)
    expect(allSql).not.toContain("journal_mode");
  });

  it("bookmarks table has an index on recipe_id", async () => {
    const db = createMockDb(0);
    await migrateDb(db as any);

    const allSql = db._execCalls.join("\n");
    expect(allSql).toContain("idx_bookmarks_recipe_id");
  });

  it("creates recent_views table on fresh install", async () => {
    const db = createMockDb(0);
    await migrateDb(db as any);

    const allSql = db._execCalls.join("\n");
    expect(allSql).toContain("CREATE TABLE IF NOT EXISTS recent_views");
  });

  it("creates recent_views table when upgrading from version 2", async () => {
    const db = createMockDb(2);
    await migrateDb(db as any);

    const allSql = db._execCalls.join("\n");
    expect(allSql).toContain("CREATE TABLE IF NOT EXISTS recent_views");
  });
});
