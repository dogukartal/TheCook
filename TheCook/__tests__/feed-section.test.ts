import type { FeedSection, RecipeListItem } from "@/src/types/discovery";
import type { Profile } from "@/src/types/profile";
import { rankByProfile, buildFeedSections } from "@/src/hooks/useFeedScreen";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeRecipe(overrides: Partial<RecipeListItem> & { id: string }): RecipeListItem {
  return {
    title: `Recipe ${overrides.id}`,
    cuisine: "Turk",
    category: "ana yemek",
    skillLevel: "beginner",
    prepTime: 10,
    cookTime: 20,
    coverImage: null,
    allergens: [],
    equipment: [],
    ...overrides,
  };
}

const baseProfile: Profile = {
  allergens: [],
  skillLevel: "intermediate",
  equipment: [],
  onboardingCompleted: true,
  accountNudgeShown: true,
  cuisinePreferences: "Turk, Italyan",
  appGoals: null,
};

const recipes: RecipeListItem[] = [
  makeRecipe({ id: "r1", cuisine: "Turk", skillLevel: "beginner", prepTime: 5, cookTime: 10 }),
  makeRecipe({ id: "r2", cuisine: "Italyan", skillLevel: "intermediate", prepTime: 10, cookTime: 25 }),
  makeRecipe({ id: "r3", cuisine: "Meksika", skillLevel: "advanced", prepTime: 20, cookTime: 30 }),
  makeRecipe({ id: "r4", cuisine: "Turk", skillLevel: "intermediate", prepTime: 5, cookTime: 5 }),
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("feed section data logic", () => {
  test("trending section returns all hard-filtered recipes in rowid order", () => {
    const { sections } = buildFeedSections(recipes, new Set(), baseProfile);
    const trending = sections.find((s) => s.key === "trending");
    expect(trending).toBeDefined();
    // Trending preserves original order (rowid ASC from DB)
    expect(trending!.data.map((r) => r.id)).toEqual(["r1", "r2", "r3", "r4"]);
  });

  test("quick section filters to recipes with totalTime <= 30", () => {
    const { sections } = buildFeedSections(recipes, new Set(), baseProfile);
    const quick = sections.find((s) => s.key === "quick");
    expect(quick).toBeDefined();
    // r1: 5+10=15, r2: 10+25=35 (excluded), r3: 20+30=50 (excluded), r4: 5+5=10
    expect(quick!.data.map((r) => r.id)).toEqual(["r1", "r4"]);
  });

  test("personal section sorts by cuisine preference match then skill proximity", () => {
    const result = rankByProfile(recipes, baseProfile);
    // baseProfile prefers Turk, Italyan; skillLevel=intermediate
    // All cuisine-matched recipes come first, then non-matched
    // Within cuisine-matched: sorted by skill proximity to intermediate (2)
    // r2: Italyan (match), intermediate (distance=0)
    // r4: Turk (match), intermediate (distance=0)
    // r1: Turk (match), beginner (distance=1)
    // r3: Meksika (no match), advanced (distance=1) -> last
    expect(result.map((r) => r.id)).toEqual(["r2", "r4", "r1", "r3"]);
  });

  test("personal section falls back to skill proximity when cuisinePreferences is null", () => {
    const nullCuisineProfile: Profile = { ...baseProfile, cuisinePreferences: null };
    const result = rankByProfile(recipes, nullCuisineProfile);
    // No cuisine preference, so only skill proximity matters
    // intermediate user (skill=2): r2(0), r4(0), r1(1), r3(1)
    // r2 and r4 are both intermediate (distance=0), should come before r1 and r3
    const distances = result.map((r) => {
      const order: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };
      return Math.abs((order[r.skillLevel] ?? 1) - 2);
    });
    // Distances should be non-decreasing
    for (let i = 1; i < distances.length; i++) {
      expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
    }
  });

  test("untried section excludes recipes in cooking_history", () => {
    const cookedIds = new Set(["r1", "r3"]);
    const { sections } = buildFeedSections(recipes, cookedIds, baseProfile);
    const untried = sections.find((s) => s.key === "untried");
    expect(untried).toBeDefined();
    expect(untried!.data.map((r) => r.id)).toEqual(["r2", "r4"]);
  });

  test("untried section shows all recipes when cooking_history is empty", () => {
    const { sections } = buildFeedSections(recipes, new Set(), baseProfile);
    const untried = sections.find((s) => s.key === "untried");
    expect(untried).toBeDefined();
    expect(untried!.data).toHaveLength(4);
  });

  test("sections with empty data are excluded from output", () => {
    // All recipes have totalTime > 30 -> quick section empty
    const slowRecipes = [
      makeRecipe({ id: "s1", prepTime: 20, cookTime: 20 }),
      makeRecipe({ id: "s2", prepTime: 30, cookTime: 30 }),
    ];
    const { sections } = buildFeedSections(slowRecipes, new Set(), baseProfile);
    const keys = sections.map((s) => s.key);
    expect(keys).not.toContain("quick");
    // trending, personal, untried should still be present
    expect(keys).toContain("trending");
    expect(keys).toContain("personal");
    expect(keys).toContain("untried");
  });

  test("allEmpty is true when all sections have zero recipes", () => {
    const { sections, allEmpty } = buildFeedSections([], new Set(), baseProfile);
    expect(sections).toHaveLength(0);
    expect(allEmpty).toBe(true);
  });

  test("each section exposes data.length for recipe count display", () => {
    const { sections } = buildFeedSections(recipes, new Set(), baseProfile);
    // All non-empty sections should have data.length accessible and > 0
    for (const section of sections) {
      expect(section.data.length).toBeGreaterThan(0);
    }
    // Trending should have all 4 recipes
    const trending = sections.find((s) => s.key === "trending");
    expect(trending!.data.length).toBe(4);
    // Quick should have 2 recipes (totalTime <= 30)
    const quick = sections.find((s) => s.key === "quick");
    expect(quick!.data.length).toBe(2);
  });
});
