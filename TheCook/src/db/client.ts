import { SQLiteDatabase } from "expo-sqlite";

const DB_VERSION = 3;

export async function migrateDb(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DB_VERSION) return;

  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';

      CREATE TABLE IF NOT EXISTS seed_version (
        id INTEGER PRIMARY KEY NOT NULL,
        version TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        cuisine TEXT NOT NULL,
        category TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        skill_level TEXT NOT NULL,
        prep_time INTEGER NOT NULL,
        cook_time INTEGER NOT NULL,
        servings INTEGER NOT NULL,
        cover_image TEXT,
        allergens TEXT NOT NULL,
        equipment TEXT NOT NULL,
        ingredient_groups TEXT NOT NULL,
        steps TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_recipes_skill_level ON recipes (skill_level);
      CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes (category);
    `);
  }

  if (currentVersion < 2) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY NOT NULL DEFAULT 1,
        allergens TEXT NOT NULL DEFAULT '[]',
        skill_level TEXT,
        equipment TEXT NOT NULL DEFAULT '["fırın","tava"]',
        onboarding_completed INTEGER NOT NULL DEFAULT 0,
        account_nudge_shown INTEGER NOT NULL DEFAULT 0
      );

      INSERT OR IGNORE INTO profile (id) VALUES (1);

      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY NOT NULL,
        recipe_id TEXT NOT NULL,
        user_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_bookmarks_recipe_id ON bookmarks (recipe_id);
    `);
  }

  if (currentVersion < 3) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS recent_views (
        recipe_id TEXT PRIMARY KEY NOT NULL,
        viewed_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
}
