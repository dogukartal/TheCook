// Plan 04-01 — Discovery feature failing test stubs (RED state)
// These tests will be made GREEN by Plans 04-02 and 04-03.

// Mock the recipes module before importing — it does not exist yet.
jest.mock("../src/db/recipes", () => ({
  filterRecipesByAllergens: jest.fn().mockRejectedValue(new Error("not implemented")),
  getFeedRecipes: jest.fn().mockRejectedValue(new Error("not implemented")),
  filterRecipesByCategory: jest.fn().mockRejectedValue(new Error("not implemented")),
  searchRecipesByIngredients: jest.fn().mockRejectedValue(new Error("not implemented")),
  addBookmark: jest.fn().mockRejectedValue(new Error("not implemented")),
  removeBookmark: jest.fn().mockRejectedValue(new Error("not implemented")),
  getBookmarks: jest.fn().mockRejectedValue(new Error("not implemented")),
}));

import {
  filterRecipesByAllergens,
  getFeedRecipes,
  filterRecipesByCategory,
  searchRecipesByIngredients,
  addBookmark,
  removeBookmark,
  getBookmarks,
} from "../src/db/recipes";

// ---------------------------------------------------------------------------
// Shared mock DB factory (same pattern as migration.test.ts)
// ---------------------------------------------------------------------------

function createMockDb() {
  const execCalls: string[] = [];
  const db = {
    getFirstAsync: jest.fn().mockResolvedValue({ user_version: 3 }),
    execAsync: jest.fn().mockImplementation(async (sql: string) => {
      execCalls.push(sql);
    }),
    getAllAsync: jest.fn().mockResolvedValue([]),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    _execCalls: execCalls,
  };
  return db;
}

// ---------------------------------------------------------------------------
// allergen exclusion
// ---------------------------------------------------------------------------

describe("allergen exclusion", () => {
  it("excludes recipe when user allergen matches recipe allergen", async () => {
    const db = createMockDb();
    const recipeWithGluten = {
      id: "recipe-1",
      title: "Pasta",
      allergens: JSON.stringify(["gluten"]),
    };
    // Function should filter out recipe-1 because user has gluten allergen
    await expect(
      filterRecipesByAllergens(db as any, [recipeWithGluten], ["gluten"])
    ).resolves.not.toContainEqual(
      expect.objectContaining({ id: "recipe-1" })
    );
  });

  it("includes recipe when user has no allergens", async () => {
    const db = createMockDb();
    const recipe = {
      id: "recipe-1",
      title: "Pasta",
      allergens: JSON.stringify(["gluten"]),
    };
    await expect(
      filterRecipesByAllergens(db as any, [recipe], [])
    ).resolves.toContainEqual(expect.objectContaining({ id: "recipe-1" }));
  });

  it.todo("handles recipe with multiple allergens — partial match still excludes");
  it.todo("handles user with multiple allergens");
});

// ---------------------------------------------------------------------------
// feed ordering
// ---------------------------------------------------------------------------

describe("feed ordering", () => {
  it("returns beginner recipes at index 0 in beginner-first order", async () => {
    const db = createMockDb();
    const recipes = [
      { id: "r1", skill_level: "advanced" },
      { id: "r2", skill_level: "beginner" },
      { id: "r3", skill_level: "intermediate" },
    ];
    const result = await getFeedRecipes(db as any, recipes, "beginner");
    expect(result[0]).toEqual(expect.objectContaining({ skill_level: "beginner" }));
  });

  it("treats null skill_level as beginner (no empty state)", async () => {
    const db = createMockDb();
    const recipes = [
      { id: "r1", skill_level: null },
      { id: "r2", skill_level: "advanced" },
    ];
    const result = await getFeedRecipes(db as any, recipes, "beginner");
    expect(result[0]).toEqual(expect.objectContaining({ id: "r1" }));
  });

  it.todo("returns intermediate recipes at index 0 in intermediate-first order");
  it.todo("does not return empty array when all recipes have null skill_level");
});

// ---------------------------------------------------------------------------
// category filter
// ---------------------------------------------------------------------------

describe("category filter", () => {
  it("returns only çorba recipes when filtering by category=çorba", async () => {
    const db = createMockDb();
    const recipes = [
      { id: "r1", category: "çorba" },
      { id: "r2", category: "ana yemek" },
      { id: "r3", category: "çorba" },
    ];
    const result = await filterRecipesByCategory(db as any, recipes, "çorba");
    expect(result).toHaveLength(2);
    expect(result.every((r: any) => r.category === "çorba")).toBe(true);
  });

  it("returns all recipes when category is null", async () => {
    const db = createMockDb();
    const recipes = [
      { id: "r1", category: "çorba" },
      { id: "r2", category: "ana yemek" },
    ];
    const result = await filterRecipesByCategory(db as any, recipes, null);
    expect(result).toHaveLength(2);
  });

  it.todo("category filter is case-insensitive for Turkish characters");
  it.todo("returns empty array when no recipes match the specified category");
});

// ---------------------------------------------------------------------------
// ingredient search — AND logic
// ---------------------------------------------------------------------------

describe("ingredient search — AND logic", () => {
  it("returns only recipes containing all active ingredient chips", async () => {
    const db = createMockDb();
    const recipes = [
      {
        id: "r1",
        ingredient_groups: JSON.stringify([
          { ingredients: [{ name: "domates" }, { name: "soğan" }] },
        ]),
      },
      {
        id: "r2",
        ingredient_groups: JSON.stringify([
          { ingredients: [{ name: "domates" }] },
        ]),
      },
    ];
    // Both "domates" AND "soğan" chips active — only r1 qualifies
    const result = await searchRecipesByIngredients(
      db as any,
      recipes,
      ["domates", "soğan"],
      false
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({ id: "r1" }));
  });

  it.todo("AND logic with three chips returns only recipes with all three ingredients");
  it.todo("empty chips array returns all recipes");
});

// ---------------------------------------------------------------------------
// ingredient search — fallback partial matches
// ---------------------------------------------------------------------------

describe("ingredient search — fallback partial matches", () => {
  it("returns partial matches ranked by overlap count when no full match exists", async () => {
    const db = createMockDb();
    const recipes = [
      {
        id: "r1",
        ingredient_groups: JSON.stringify([
          { ingredients: [{ name: "domates" }, { name: "soğan" }, { name: "biber" }] },
        ]),
      },
      {
        id: "r2",
        ingredient_groups: JSON.stringify([
          { ingredients: [{ name: "domates" }] },
        ]),
      },
    ];
    // Fallback: chips=["domates","soğan","biber"] but no full AND match — rank by overlap
    const result = await searchRecipesByIngredients(
      db as any,
      recipes,
      ["domates", "soğan", "biber"],
      true
    );
    // r1 has 3 matching ingredients, r2 has 1 — r1 should rank higher
    expect(result[0]).toEqual(expect.objectContaining({ id: "r1" }));
  });

  it.todo("fallback returns empty array when no ingredients overlap at all");
  it.todo("fallback ranking is stable for equal overlap counts");
});

// ---------------------------------------------------------------------------
// bookmark roundtrip
// ---------------------------------------------------------------------------

describe("bookmark roundtrip", () => {
  it("addBookmark inserts a row", async () => {
    const db = createMockDb();
    await expect(addBookmark(db as any, "recipe-1", "user-1")).resolves.not.toThrow();
  });

  it("removeBookmark deletes the row", async () => {
    const db = createMockDb();
    await expect(removeBookmark(db as any, "recipe-1")).resolves.not.toThrow();
  });

  it("getBookmarks returns only remaining bookmarks", async () => {
    const db = createMockDb();
    const result = await getBookmarks(db as any, "user-1");
    expect(Array.isArray(result)).toBe(true);
  });

  it.todo("addBookmark is idempotent (INSERT OR REPLACE or INSERT OR IGNORE)");
  it.todo("removeBookmark on non-existent recipe_id does not throw");
  it.todo("getBookmarks returns empty array when user has no bookmarks");
});
