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

describe("migrateDb — DB_VERSION 6", () => {
  it("DB_VERSION constant is 6", async () => {
    // Fresh DB (version 0) — migration should run; version 6 should be set at end
    const db = createMockDb(0);
    await migrateDb(db as any);

    // The last execAsync call should set user_version = 6
    const allSql = db._execCalls.join("\n");
    expect(allSql).toContain("PRAGMA user_version = 6");
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

  it("is idempotent — does not run migration when already at version 6", async () => {
    const db = createMockDb(6);
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

  it("creates cooking_sessions table on fresh install", async () => {
    const db = createMockDb(0);
    await migrateDb(db as any);

    const allSql = db._execCalls.join("\n");
    expect(allSql).toContain("CREATE TABLE IF NOT EXISTS cooking_sessions");
  });

  it("creates cooking_sessions table when upgrading from version 3", async () => {
    const db = createMockDb(3);
    await migrateDb(db as any);

    const allSql = db._execCalls.join("\n");
    expect(allSql).toContain("CREATE TABLE IF NOT EXISTS cooking_sessions");
  });

  it("cooking_sessions table has required columns", async () => {
    const db = createMockDb(0);
    await migrateDb(db as any);

    const allSql = db._execCalls.join("\n");
    expect(allSql).toContain("recipe_id");
    expect(allSql).toContain("current_step");
    expect(allSql).toContain("timer_remaining");
    expect(allSql).toContain("timer_start_timestamp");
    expect(allSql).toContain("ingredient_checks");
    expect(allSql).toContain("session_started_at");
  });

  it("adds cuisine_preferences and app_goals columns in v5 migration", async () => {
    const db = createMockDb(4);
    await migrateDb(db as any);

    const allSql = db._execCalls.join("\n");
    expect(allSql).toContain("cuisine_preferences");
    expect(allSql).toContain("app_goals");
  });

  it("adds cuisine_preferences and app_goals on fresh install via v5 migration", async () => {
    const db = createMockDb(0);
    await migrateDb(db as any);

    const allSql = db._execCalls.join("\n");
    expect(allSql).toContain("ALTER TABLE profile ADD COLUMN cuisine_preferences");
    expect(allSql).toContain("ALTER TABLE profile ADD COLUMN app_goals");
  });

  it("creates cooking_history table on fresh install", async () => {
    const db = createMockDb(0);
    await migrateDb(db as any);

    const allSql = db._execCalls.join("\n");
    expect(allSql).toContain("CREATE TABLE IF NOT EXISTS cooking_history");
  });

  it("creates cooking_history table when upgrading from version 5", async () => {
    const db = createMockDb(5);
    await migrateDb(db as any);

    const allSql = db._execCalls.join("\n");
    expect(allSql).toContain("CREATE TABLE IF NOT EXISTS cooking_history");
  });

  it("cooking_history table has required columns", async () => {
    const db = createMockDb(0);
    await migrateDb(db as any);

    const allSql = db._execCalls.join("\n");
    expect(allSql).toContain("recipe_id TEXT NOT NULL");
    expect(allSql).toContain("cooked_at TEXT NOT NULL");
    expect(allSql).toContain("rating INTEGER");
  });

  it("cooking_history has index on recipe_id", async () => {
    const db = createMockDb(0);
    await migrateDb(db as any);

    const allSql = db._execCalls.join("\n");
    expect(allSql).toContain("idx_cooking_history_recipe_id");
  });
});
