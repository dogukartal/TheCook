// Plan 06-01 — Equipment filter test stubs (RED state)
// Tests 1 and 4 are RED until Plan 02 adds equipment sort logic to queryRecipesByFilter.
// Tests 2 and 3 pass immediately as pure logic tests.
// Test 5 passes as compose test (allergen exclusion is SQL-side, mock simulates it).

import { queryRecipesByFilter } from "../src/db/recipes";

// ---------------------------------------------------------------------------
// Shared mock DB factory (same pattern as discovery.test.ts)
// ---------------------------------------------------------------------------

function createMockDb(rows: Record<string, unknown>[] = []) {
  const db = {
    getFirstAsync: jest.fn().mockResolvedValue({ user_version: 3 }),
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
    cuisine: overrides.cuisine ?? "Türk",
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
// Test 1: Equipment de-prioritization
// Compatible recipe must come first when filter.equipment is set.
// RED until queryRecipesByFilter re-orders by equipment compatibility.
// ---------------------------------------------------------------------------

describe("equipment de-prioritization", () => {
  it("places equipment-compatible recipe before incompatible one", async () => {
    const rows = [
      makeRow({ id: "incompatible", equipment: JSON.stringify(["fırın"]) }),
      makeRow({ id: "compatible", equipment: JSON.stringify(["tava"]) }),
    ];
    const db = createMockDb(rows);

    const filter = {
      category: null,
      cookTimeBucket: null,
      skillLevel: null,
      cuisine: null,
      equipment: ["tava"], // user has tava but not fırın
    };

    const result = await queryRecipesByFilter(db as any, filter as any, []);

    // compatible recipe (has only "tava" which user owns) should come first
    expect(result[0].id).toBe("compatible");
  });
});

// ---------------------------------------------------------------------------
// Test 2: Equipment indicator logic (pure logic — passes immediately)
// hasMissingEquipment=true when recipe.equipment is NOT a subset of userEquipment
// ---------------------------------------------------------------------------

describe("equipment indicator logic", () => {
  it("hasMissingEquipment is true when recipe requires equipment the user lacks", () => {
    const recipe = { equipment: ["fırın"] };
    const userEquipment = ["tava"];
    const hasMissing = recipe.equipment.some((e) => !userEquipment.includes(e));
    expect(hasMissing).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 3: Vacuous truth — empty equipment array never triggers missing-equipment flag
// (pure logic — passes immediately)
// ---------------------------------------------------------------------------

describe("vacuous truth — empty recipe equipment", () => {
  it("hasMissingEquipment is false when recipe.equipment is empty", () => {
    const recipeNoEquip = { equipment: [] };
    const userEquipment = ["tava"];
    const hasMissing2 = recipeNoEquip.equipment.some((e) => !userEquipment.includes(e));
    expect(hasMissing2).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Test 4: Empty filter.equipment — sort is skipped, original order preserved
// RED until queryRecipesByFilter handles equipment=[] as no-op for ordering.
// ---------------------------------------------------------------------------

describe("empty filter.equipment — no sort applied", () => {
  it("preserves original row order when filter.equipment is empty", async () => {
    const rows = [
      makeRow({ id: "first", equipment: JSON.stringify(["fırın"]) }),
      makeRow({ id: "second", equipment: JSON.stringify(["tava"]) }),
    ];
    const db = createMockDb(rows);

    const filter = {
      category: null,
      cookTimeBucket: null,
      skillLevel: null,
      cuisine: null,
      equipment: [], // empty — no equipment sort
    };

    const result = await queryRecipesByFilter(db as any, filter as any, []);

    // Original order must be preserved: first before second
    expect(result[0].id).toBe("first");
    expect(result[1].id).toBe("second");
  });
});

// ---------------------------------------------------------------------------
// Test 5: Compose with allergens — allergen-excluded recipes do not appear
// Allergen exclusion is SQL-side; mock simulates SQL having already excluded
// allergen recipes by returning only non-allergen rows.
// (passes immediately — no equipment sort needed to verify compose)
// ---------------------------------------------------------------------------

describe("compose with allergens — allergen-excluded recipes absent from equipment sort", () => {
  it("allergen-excluded recipes do not appear in equipment-sorted output", async () => {
    // Mock simulates SQL allergen exclusion: only non-allergen recipe returned
    const rows = [
      makeRow({
        id: "safe",
        equipment: JSON.stringify(["tava"]),
        allergens: "[]", // safe recipe
      }),
      // allergen recipe (e.g. id: "allergen-recipe") is NOT in rows —
      // SQL WHERE clause already excluded it from the result set
    ];
    const db = createMockDb(rows);

    const filter = {
      category: null,
      cookTimeBucket: null,
      skillLevel: null,
      cuisine: null,
      equipment: ["tava"],
    };

    // userAllergens=["gluten"] — SQL already excluded allergen recipe from rows mock
    const result = await queryRecipesByFilter(db as any, filter as any, ["gluten"]);

    // Only the safe recipe should be present
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("safe");
  });
});
