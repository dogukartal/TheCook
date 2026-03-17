import { SQLiteDatabase } from "expo-sqlite";

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
