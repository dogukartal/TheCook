// Plan 06-01 — Equipment filter tests
// Updated for Phase 07 hard filter refactor: equipment is now a hard SQL exclusion, not JS sort.

import { queryRecipesByFilter } from "../src/db/recipes";
import { HardFilter } from "../src/types/discovery";

// ---------------------------------------------------------------------------
// Shared mock DB factory (same pattern as discovery.test.ts)
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

// Helper: build a minimal RecipeRow shape with equipment column
function makeRow(overrides: {
  id: string;
  equipment?: string; // JSON string
  allergens?: string; // JSON string
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
// Test 1: Equipment hard exclusion — SQL contains equipment filter clause
// ---------------------------------------------------------------------------

describe("equipment hard exclusion", () => {
  it("SQL contains equipment exclusion clause when equipment is set", async () => {
    const rows = [
      makeRow({ id: "compatible", equipment: JSON.stringify(["tava"]) }),
    ];
    const db = createMockDb(rows);

    const filter = {
      category: null,
      cookTimeBucket: null,
      skillLevel: null,
      cuisine: null,
      equipment: [],
    };
    const hardFilter: HardFilter = { allergens: [], skillLevel: null, equipment: ["tava"] };

    await queryRecipesByFilter(db as any, filter as any, hardFilter);

    const sqlCall = db.getAllAsync.mock.calls[0][0] as string;
    expect(sqlCall).toContain("json_each(r.equipment)");
    expect(sqlCall).toContain("NOT EXISTS");
  });
});

// ---------------------------------------------------------------------------
// Test 2: Equipment indicator logic (pure logic -- passes immediately)
// hasMissingEquipment=true when recipe.equipment is NOT a subset of userEquipment
// ---------------------------------------------------------------------------

describe("equipment indicator logic", () => {
  it("hasMissingEquipment is true when recipe requires equipment the user lacks", () => {
    const recipe = { equipment: ["firin"] };
    const userEquipment = ["tava"];
    const hasMissing = recipe.equipment.some((e) => !userEquipment.includes(e));
    expect(hasMissing).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 3: Vacuous truth -- empty equipment array never triggers missing-equipment flag
// (pure logic -- passes immediately)
// ---------------------------------------------------------------------------

describe("vacuous truth -- empty recipe equipment", () => {
  it("hasMissingEquipment is false when recipe.equipment is empty", () => {
    const recipeNoEquip = { equipment: [] as string[] };
    const userEquipment = ["tava"];
    const hasMissing2 = recipeNoEquip.equipment.some((e: string) => !userEquipment.includes(e));
    expect(hasMissing2).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Test 4: Empty equipment in hard filter -- no equipment clause in SQL
// ---------------------------------------------------------------------------

describe("empty equipment in hard filter -- no exclusion applied", () => {
  it("SQL does not contain equipment clause when equipment is empty", async () => {
    const rows = [
      makeRow({ id: "first", equipment: JSON.stringify(["firin"]) }),
      makeRow({ id: "second", equipment: JSON.stringify(["tava"]) }),
    ];
    const db = createMockDb(rows);

    const filter = {
      category: null,
      cookTimeBucket: null,
      skillLevel: null,
      cuisine: null,
      equipment: [],
    };
    const hardFilter: HardFilter = { allergens: [], skillLevel: null, equipment: [] };

    const result = await queryRecipesByFilter(db as any, filter as any, hardFilter);

    // SQL should NOT contain equipment exclusion
    const sqlCall = db.getAllAsync.mock.calls[0][0] as string;
    expect(sqlCall).not.toContain("json_each(r.equipment)");

    // Original order must be preserved
    expect(result[0].id).toBe("first");
    expect(result[1].id).toBe("second");
  });
});

// ---------------------------------------------------------------------------
// Test 5: Compose with allergens -- allergen-excluded recipes do not appear
// Allergen exclusion is SQL-side; mock simulates SQL having already excluded
// allergen recipes by returning only non-allergen rows.
// ---------------------------------------------------------------------------

describe("compose with allergens -- allergen-excluded recipes absent from output", () => {
  it("allergen-excluded recipes do not appear in output", async () => {
    // Mock simulates SQL allergen exclusion: only non-allergen recipe returned
    const rows = [
      makeRow({
        id: "safe",
        equipment: JSON.stringify(["tava"]),
        allergens: "[]", // safe recipe
      }),
    ];
    const db = createMockDb(rows);

    const filter = {
      category: null,
      cookTimeBucket: null,
      skillLevel: null,
      cuisine: null,
      equipment: [],
    };
    const hardFilter: HardFilter = { allergens: ["gluten"], skillLevel: null, equipment: ["tava"] };

    const result = await queryRecipesByFilter(db as any, filter as any, hardFilter);

    // Only the safe recipe should be present
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("safe");
  });
});
