// Plan 07-01 — Hard filter test stubs (RED state for Task 1, GREEN after Task 2)
// Tests the SQL-level hard exclusion for skill level, equipment, and bookmark allergens.

import {
  getAllRecipesForFeed,
  getAllRecipesForSearch,
  queryRecipesByFilter,
  getBookmarkedRecipes,
} from "../src/db/recipes";
import { HardFilter } from "../src/types/discovery";

// ---------------------------------------------------------------------------
// Shared mock DB factory
// ---------------------------------------------------------------------------

function createMockDb(rows: Record<string, unknown>[] = []) {
  const db = {
    getFirstAsync: jest.fn().mockResolvedValue({ user_version: 5 }),
    execAsync: jest.fn(),
    getAllAsync: jest.fn().mockResolvedValue(rows),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
  };
  return db;
}

// Helper: build a minimal RecipeRow shape
function makeRow(overrides: {
  id: string;
  equipment?: string;
  allergens?: string;
  category?: string;
  skill_level?: string | null;
  prep_time?: number;
  cook_time?: number;
  cuisine?: string;
}): Record<string, unknown> {
  return {
    id: overrides.id,
    title: `Recipe ${overrides.id}`,
    cuisine: overrides.cuisine ?? "Turk",
    category: overrides.category ?? "ana yemek",
    skill_level: overrides.skill_level ?? "beginner",
    prep_time: overrides.prep_time ?? 10,
    cook_time: overrides.cook_time ?? 20,
    cover_image: null,
    allergens: overrides.allergens ?? "[]",
    equipment: overrides.equipment ?? "[]",
  };
}

// ---------------------------------------------------------------------------
// Skill level hard filter
// ---------------------------------------------------------------------------

describe("skill level hard filter", () => {
  it("beginner user sees only beginner recipes", async () => {
    const rows = [
      makeRow({ id: "beg", skill_level: "beginner" }),
      makeRow({ id: "int", skill_level: "intermediate" }),
      makeRow({ id: "adv", skill_level: "advanced" }),
    ];
    const db = createMockDb(rows);
    const filter: HardFilter = { allergens: [], skillLevel: "beginner", equipment: [] };

    const result = await getAllRecipesForFeed(db as any, filter);

    // The SQL should have filtered to only beginner — check that the SQL
    // was called with the right skill level constraint
    const sqlCall = db.getAllAsync.mock.calls[0][0] as string;
    expect(sqlCall).toContain("skill_level");
    // Only beginner should be in the allowed list
    expect(sqlCall).toMatch(/IN\s*\(\s*\?\s*\)/);
  });

  it("intermediate user sees beginner + intermediate recipes", async () => {
    const rows = [
      makeRow({ id: "beg", skill_level: "beginner" }),
      makeRow({ id: "int", skill_level: "intermediate" }),
    ];
    const db = createMockDb(rows);
    const filter: HardFilter = { allergens: [], skillLevel: "intermediate", equipment: [] };

    const result = await getAllRecipesForFeed(db as any, filter);

    const sqlCall = db.getAllAsync.mock.calls[0][0] as string;
    expect(sqlCall).toContain("skill_level");
    // Should include placeholders for beginner and intermediate
    expect(sqlCall).toMatch(/IN\s*\(\s*\?\s*,\s*\?\s*\)/);
  });

  it("null skill level shows all recipes (no ceiling)", async () => {
    const rows = [
      makeRow({ id: "beg", skill_level: "beginner" }),
      makeRow({ id: "int", skill_level: "intermediate" }),
      makeRow({ id: "adv", skill_level: "advanced" }),
    ];
    const db = createMockDb(rows);
    const filter: HardFilter = { allergens: [], skillLevel: null, equipment: [] };

    const result = await getAllRecipesForFeed(db as any, filter);

    // SQL should NOT contain skill_level filter
    const sqlCall = db.getAllAsync.mock.calls[0][0] as string;
    expect(sqlCall).not.toContain("r.skill_level IN");
  });
});

// ---------------------------------------------------------------------------
// Equipment hard filter
// ---------------------------------------------------------------------------

describe("equipment hard filter", () => {
  it("user with [tava] does not see recipes requiring [firin, blender]", async () => {
    const rows = [
      makeRow({ id: "compatible", equipment: JSON.stringify(["tava"]) }),
    ];
    const db = createMockDb(rows);
    const filter: HardFilter = { allergens: [], skillLevel: null, equipment: ["tava"] };

    const result = await getAllRecipesForFeed(db as any, filter);

    // SQL should contain equipment exclusion clause
    const sqlCall = db.getAllAsync.mock.calls[0][0] as string;
    expect(sqlCall).toContain("json_each");
    expect(sqlCall).toContain("NOT EXISTS");
  });

  it("empty equipment array shows all recipes (no filter)", async () => {
    const rows = [
      makeRow({ id: "r1", equipment: JSON.stringify(["firin"]) }),
      makeRow({ id: "r2", equipment: JSON.stringify(["blender"]) }),
    ];
    const db = createMockDb(rows);
    const filter: HardFilter = { allergens: [], skillLevel: null, equipment: [] };

    const result = await getAllRecipesForFeed(db as any, filter);

    // SQL should NOT contain equipment exclusion
    const sqlCall = db.getAllAsync.mock.calls[0][0] as string;
    expect(sqlCall).not.toContain("json_each(r.equipment)");
  });
});

// ---------------------------------------------------------------------------
// Allergen exclusion on bookmarks
// ---------------------------------------------------------------------------

describe("allergen exclusion on bookmarks", () => {
  it("bookmarked recipe with dairy allergen excluded when user has dairy allergen", async () => {
    const rows = [
      makeRow({ id: "safe", allergens: "[]" }),
    ];
    const db = createMockDb(rows);
    const filter: HardFilter = { allergens: ["dairy"], skillLevel: null, equipment: [] };

    const result = await getBookmarkedRecipes(db as any, ["safe", "dairy-recipe"], filter);

    // SQL should include allergen exclusion
    const sqlCall = db.getAllAsync.mock.calls[0][0] as string;
    expect(sqlCall).toContain("NOT EXISTS");
    expect(sqlCall).toContain("json_each(r.allergens)");
  });
});

// ---------------------------------------------------------------------------
// Combined filters
// ---------------------------------------------------------------------------

describe("combined hard filters", () => {
  it("skill + equipment + allergen compose correctly in SQL", async () => {
    const rows = [
      makeRow({ id: "ok", skill_level: "beginner", equipment: JSON.stringify(["tava"]), allergens: "[]" }),
    ];
    const db = createMockDb(rows);
    const filter: HardFilter = { allergens: ["gluten"], skillLevel: "beginner", equipment: ["tava"] };

    const result = await getAllRecipesForFeed(db as any, filter);

    const sqlCall = db.getAllAsync.mock.calls[0][0] as string;
    // All three filters should be present
    expect(sqlCall).toContain("json_each(r.allergens)"); // allergen exclusion
    expect(sqlCall).toContain("r.skill_level IN"); // skill ceiling
    expect(sqlCall).toContain("json_each(r.equipment)"); // equipment exclusion
  });
});

// ---------------------------------------------------------------------------
// getAllRecipesForSearch with hard filters
// ---------------------------------------------------------------------------

describe("getAllRecipesForSearch with hard filters", () => {
  it("applies skill + equipment hard filters", async () => {
    const rows = [
      makeRow({ id: "r1", skill_level: "beginner", equipment: JSON.stringify(["tava"]) }),
    ];
    // Add ingredient_groups to rows
    (rows[0] as any).ingredient_groups = "[]";
    const db = createMockDb(rows);
    const filter: HardFilter = { allergens: [], skillLevel: "beginner", equipment: ["tava"] };

    const result = await getAllRecipesForSearch(db as any, filter);

    const sqlCall = db.getAllAsync.mock.calls[0][0] as string;
    expect(sqlCall).toContain("r.skill_level IN");
    expect(sqlCall).toContain("json_each(r.equipment)");
  });
});

// ---------------------------------------------------------------------------
// queryRecipesByFilter with hard filters
// ---------------------------------------------------------------------------

describe("queryRecipesByFilter with hard filters", () => {
  it("applies skill + equipment hard filters alongside discovery filter", async () => {
    const rows = [
      makeRow({ id: "r1", skill_level: "beginner", equipment: JSON.stringify(["tava"]), category: "corba" }),
    ];
    const db = createMockDb(rows);
    const discoveryFilter = {
      category: "corba",
      cookTimeBucket: null,
      skillLevel: null,
      cuisine: null,
      equipment: [],
    };
    const hardFilter: HardFilter = { allergens: ["gluten"], skillLevel: "beginner", equipment: ["tava"] };

    const result = await queryRecipesByFilter(db as any, discoveryFilter as any, hardFilter);

    const sqlCall = db.getAllAsync.mock.calls[0][0] as string;
    expect(sqlCall).toContain("r.skill_level IN"); // hard filter
    expect(sqlCall).toContain("r.category = ?"); // discovery filter
    expect(sqlCall).toContain("json_each(r.allergens)"); // allergen hard filter
  });
});

// ---------------------------------------------------------------------------
// getBookmarkedRecipes preserves bookmark order
// ---------------------------------------------------------------------------

describe("getBookmarkedRecipes", () => {
  it("preserves bookmark recency order for non-excluded recipes", async () => {
    const rows = [
      makeRow({ id: "b", skill_level: "beginner" }),
      makeRow({ id: "a", skill_level: "beginner" }),
    ];
    const db = createMockDb(rows);
    const filter: HardFilter = { allergens: [], skillLevel: null, equipment: [] };

    const result = await getBookmarkedRecipes(db as any, ["a", "b"], filter);

    // Should be ordered as ["a", "b"] matching the bookmarkIds order
    expect(result[0].id).toBe("a");
    expect(result[1].id).toBe("b");
  });

  it("applies skill + equipment hard filters to bookmarks", async () => {
    const rows = [
      makeRow({ id: "r1", skill_level: "beginner", equipment: JSON.stringify(["tava"]) }),
    ];
    const db = createMockDb(rows);
    const filter: HardFilter = { allergens: [], skillLevel: "beginner", equipment: ["tava"] };

    const result = await getBookmarkedRecipes(db as any, ["r1"], filter);

    const sqlCall = db.getAllAsync.mock.calls[0][0] as string;
    expect(sqlCall).toContain("r.skill_level IN");
    expect(sqlCall).toContain("json_each(r.equipment)");
  });
});
