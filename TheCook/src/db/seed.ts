import { SQLiteDatabase } from "expo-sqlite";
import { Recipe } from "../types/recipe";

// Import bundled asset — Metro handles this via require()
// eslint-disable-next-line @typescript-eslint/no-var-requires
const recipesJson: Recipe[] = require("../../app/assets/recipes.json");

const SEED_VERSION = "1.0.0";

export async function seedIfNeeded(db: SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ version: string } | null>(
    "SELECT version FROM seed_version WHERE id = 1"
  );

  if (existing?.version === SEED_VERSION) return;

  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM recipes");
    await db.runAsync("DELETE FROM seed_version");

    for (const recipe of recipesJson) {
      await db.runAsync(
        `INSERT INTO recipes
          (id, title, cuisine, category, meal_type, skill_level,
           prep_time, cook_time, servings, cover_image,
           allergens, equipment, ingredient_groups, steps)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        recipe.id,
        recipe.title,
        recipe.cuisine,
        recipe.category,
        recipe.mealType,
        recipe.skillLevel,
        recipe.prepTime,
        recipe.cookTime,
        recipe.servings,
        recipe.coverImage ?? null,
        JSON.stringify(recipe.allergens),
        JSON.stringify(recipe.equipment),
        JSON.stringify(recipe.ingredientGroups),
        JSON.stringify(recipe.steps)
      );
    }

    await db.runAsync(
      "INSERT INTO seed_version (id, version) VALUES (1, ?)",
      SEED_VERSION
    );
  });
}
