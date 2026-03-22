import { useSQLiteContext, SQLiteDatabase, SQLiteBindValue } from "expo-sqlite";
import * as Crypto from "expo-crypto";
import {
  ProfileSchema,
  BookmarkSchema,
  Profile,
  Bookmark,
} from "../types/profile";

// ---------------------------------------------------------------------------
// Hook-based CRUD — for use in React components via expo-sqlite v2 context
// ---------------------------------------------------------------------------

export function useProfileDb() {
  const db = useSQLiteContext();

  async function getProfile(): Promise<Profile> {
    const row = await db.getFirstAsync<Record<string, unknown>>(
      "SELECT * FROM profile WHERE id = 1"
    );
    if (!row) return ProfileSchema.parse({});
    return ProfileSchema.parse({
      allergens: JSON.parse(row.allergens as string),
      skillLevel: row.skill_level ?? null,
      equipment: JSON.parse(row.equipment as string),
      onboardingCompleted: Boolean(row.onboarding_completed),
      accountNudgeShown: Boolean(row.account_nudge_shown),
      cuisinePreferences: row.cuisine_preferences ?? null,
      appGoals: row.app_goals ?? null,
      isPremium: Boolean(row.is_premium),
    });
  }

  async function saveProfile(profile: Partial<Profile>): Promise<void> {
    const fields: string[] = [];
    const values: SQLiteBindValue[] = [];
    if (profile.allergens !== undefined) {
      fields.push("allergens = ?");
      values.push(JSON.stringify(profile.allergens));
    }
    if (profile.skillLevel !== undefined) {
      fields.push("skill_level = ?");
      values.push(profile.skillLevel);
    }
    if (profile.equipment !== undefined) {
      fields.push("equipment = ?");
      values.push(JSON.stringify(profile.equipment));
    }
    if (profile.onboardingCompleted !== undefined) {
      fields.push("onboarding_completed = ?");
      values.push(profile.onboardingCompleted ? 1 : 0);
    }
    if (profile.accountNudgeShown !== undefined) {
      fields.push("account_nudge_shown = ?");
      values.push(profile.accountNudgeShown ? 1 : 0);
    }
    if (profile.cuisinePreferences !== undefined) {
      fields.push("cuisine_preferences = ?");
      values.push(profile.cuisinePreferences);
    }
    if (profile.appGoals !== undefined) {
      fields.push("app_goals = ?");
      values.push(profile.appGoals);
    }
    if (profile.isPremium !== undefined) {
      fields.push("is_premium = ?");
      values.push(profile.isPremium ? 1 : 0);
    }
    if (fields.length === 0) return;
    await db.runAsync(
      `UPDATE profile SET ${fields.join(", ")} WHERE id = 1`,
      values
    );
  }

  async function addBookmark(
    recipeId: string,
    userId: string | null
  ): Promise<void> {
    const id = Crypto.randomUUID();
    await db.runAsync(
      "INSERT OR IGNORE INTO bookmarks (id, recipe_id, user_id, created_at) VALUES (?, ?, ?, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))",
      [id, recipeId, userId]
    );
  }

  async function removeBookmark(recipeId: string): Promise<void> {
    await db.runAsync("DELETE FROM bookmarks WHERE recipe_id = ?", [recipeId]);
  }

  async function getBookmarks(): Promise<Bookmark[]> {
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM bookmarks ORDER BY created_at DESC"
    );
    return rows.map((row) => {
      // SQLite datetime('now') returns "YYYY-MM-DD HH:MM:SS" — normalize to ISO 8601
      let createdAt = row.created_at as string;
      if (createdAt && !createdAt.includes('T')) {
        createdAt = createdAt.replace(' ', 'T') + 'Z';
      }
      return BookmarkSchema.parse({
        id: row.id,
        recipeId: row.recipe_id,
        userId: row.user_id ?? null,
        createdAt,
      });
    });
  }

  return { getProfile, saveProfile, addBookmark, removeBookmark, getBookmarks };
}

// ---------------------------------------------------------------------------
// Standalone functions — for use in sync.ts (no React context required)
// ---------------------------------------------------------------------------

export async function saveProfileToDb(
  db: SQLiteDatabase,
  profile: Partial<Profile>
): Promise<void> {
  const fields: string[] = [];
  const values: SQLiteBindValue[] = [];
  if (profile.allergens !== undefined) {
    fields.push("allergens = ?");
    values.push(JSON.stringify(profile.allergens));
  }
  if (profile.skillLevel !== undefined) {
    fields.push("skill_level = ?");
    values.push(profile.skillLevel);
  }
  if (profile.equipment !== undefined) {
    fields.push("equipment = ?");
    values.push(JSON.stringify(profile.equipment));
  }
  if (profile.onboardingCompleted !== undefined) {
    fields.push("onboarding_completed = ?");
    values.push(profile.onboardingCompleted ? 1 : 0);
  }
  if (profile.accountNudgeShown !== undefined) {
    fields.push("account_nudge_shown = ?");
    values.push(profile.accountNudgeShown ? 1 : 0);
  }
  if (profile.cuisinePreferences !== undefined) {
    fields.push("cuisine_preferences = ?");
    values.push(profile.cuisinePreferences);
  }
  if (profile.appGoals !== undefined) {
    fields.push("app_goals = ?");
    values.push(profile.appGoals);
  }
  if (profile.isPremium !== undefined) {
    fields.push("is_premium = ?");
    values.push(profile.isPremium ? 1 : 0);
  }
  if (fields.length === 0) return;
  await db.runAsync(
    `UPDATE profile SET ${fields.join(", ")} WHERE id = 1`,
    values
  );
}

export async function saveBookmarksToDb(
  db: SQLiteDatabase,
  bookmarks: Bookmark[]
): Promise<void> {
  for (const bookmark of bookmarks) {
    await db.runAsync(
      "INSERT OR IGNORE INTO bookmarks (id, recipe_id, user_id, created_at) VALUES (?, ?, ?, ?)",
      [bookmark.id, bookmark.recipeId, bookmark.userId, bookmark.createdAt]
    );
  }
}
