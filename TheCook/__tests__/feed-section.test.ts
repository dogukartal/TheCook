import type { FeedSection, RecipeListItem } from "@/src/types/discovery";

describe("feed section data logic", () => {
  test.todo(
    "trending section returns all hard-filtered recipes in rowid order"
  );

  test.todo("quick section filters to recipes with totalTime <= 30");

  test.todo(
    "personal section sorts by cuisine preference match then skill proximity"
  );

  test.todo(
    "personal section falls back to skill proximity when cuisinePreferences is null"
  );

  test.todo("untried section excludes recipes in cooking_history");

  test.todo("untried section shows all recipes when cooking_history is empty");

  test.todo("sections with empty data are excluded from output");

  test.todo("allEmpty is true when all sections have zero recipes");
});
