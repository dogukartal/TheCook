import { SQLiteDatabase } from "expo-sqlite";
import { CookedRecipeMeta } from "@/src/types/discovery";

export async function logCookingCompletion(
  db: SQLiteDatabase,
  recipeId: string,
  rating?: number
): Promise<void> {
  await db.runAsync(
    "INSERT INTO cooking_history (recipe_id, rating) VALUES (?, ?)",
    [recipeId, rating ?? null]
  );
}

export async function getCookedRecipeIds(
  db: SQLiteDatabase
): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ recipe_id: string }>(
    "SELECT DISTINCT recipe_id FROM cooking_history"
  );
  return new Set(rows.map((row) => row.recipe_id));
}

export async function getCookedRecipesWithMeta(
  db: SQLiteDatabase
): Promise<CookedRecipeMeta[]> {
  const rows = await db.getAllAsync<{
    recipe_id: string;
    cook_count: number;
    latest_rating: number | null;
    last_cooked_at: string;
  }>(
    `SELECT
      recipe_id,
      COUNT(*) as cook_count,
      (SELECT rating FROM cooking_history ch2
       WHERE ch2.recipe_id = ch.recipe_id
       ORDER BY cooked_at DESC LIMIT 1) as latest_rating,
      MAX(cooked_at) as last_cooked_at
    FROM cooking_history ch
    GROUP BY recipe_id
    ORDER BY MAX(cooked_at) DESC`
  );
  return rows.map((row) => ({
    recipeId: row.recipe_id,
    cookCount: row.cook_count,
    latestRating: row.latest_rating,
    lastCookedAt: row.last_cooked_at,
  }));
}

export async function updateLatestRating(
  db: SQLiteDatabase,
  recipeId: string,
  rating: number
): Promise<void> {
  await db.runAsync(
    `UPDATE cooking_history SET rating = ?
    WHERE id = (
      SELECT id FROM cooking_history
      WHERE recipe_id = ?
      ORDER BY cooked_at DESC LIMIT 1
    )`,
    [rating, recipeId]
  );
}
