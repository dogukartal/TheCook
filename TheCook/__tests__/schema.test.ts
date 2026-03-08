// Plan 02 — full schema test suite (replaces Wave 0 stubs)
import { RecipeSchema } from "../src/types/recipe";

// ---------------------------------------------------------------------------
// Fixture: a complete valid menemen recipe
// ---------------------------------------------------------------------------
const validStep = {
  instruction: "Zeytinyağını tavada kızdırın, soğanları ekleyin.",
  why: "Soğanların karamelize olması tatlılık katar.",
  looksLikeWhenDone: "Soğanlar şeffaf ve hafif altın rengi.",
  commonMistake: "Soğanları çok yüksek ateşte yakmak.",
  recovery: "Ocağı kısın ve yarım çay bardağı su ekleyin.",
  stepImage: null,
  timerSeconds: null,
};

const validStep2 = {
  instruction: "Domatesleri ve biberleri ekleyin, 5 dakika pişirin.",
  why: "Domateslerin suyunu salması sosun tabanını oluşturur.",
  looksLikeWhenDone: "Domates parçaları yumuşayıp sos kıvamına gelmiş.",
  commonMistake: "Yeterince pişirmeden yumurtaları eklemek.",
  recovery: "Daha fazla pişirin, gerekirse kapağı kapatın.",
  stepImage: null,
  timerSeconds: 300,
};

const validMenemen = {
  id: "menemen-001",
  title: "Menemen",
  cuisine: "Türk",
  category: "kahvaltı",
  mealType: "breakfast",
  skillLevel: "beginner",
  prepTime: 5,
  cookTime: 10,
  servings: 2,
  coverImage: null,
  allergens: ["egg", "dairy"],
  equipment: ["tava"],
  ingredientGroups: [
    {
      label: null,
      items: [
        { name: "Yumurta", amount: 3, unit: "adet", optional: false },
        { name: "Domates", amount: 200, unit: "gr", optional: false },
        { name: "Yeşil biber", amount: 1, unit: "adet", optional: false },
      ],
    },
  ],
  steps: [validStep, validStep2],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RecipeSchema", () => {
  it("validates complete recipe", () => {
    const result = RecipeSchema.safeParse(validMenemen);
    expect(result.success).toBe(true);
  });

  it("rejects incomplete step — missing 'why' field", () => {
    const badStep = { ...validStep };
    delete (badStep as Record<string, unknown>).why;
    const recipe = {
      ...validMenemen,
      steps: [badStep],
    };
    const result = RecipeSchema.safeParse(recipe);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.includes("why"))).toBe(true);
    }
  });

  it("rejects invalid unit", () => {
    const recipe = {
      ...validMenemen,
      ingredientGroups: [
        {
          label: null,
          items: [{ name: "Un", amount: 100, unit: "gram", optional: false }],
        },
      ],
    };
    const result = RecipeSchema.safeParse(recipe);
    expect(result.success).toBe(false);
  });

  it("rejects invalid allergen", () => {
    const recipe = { ...validMenemen, allergens: ["pollen"] };
    const result = RecipeSchema.safeParse(recipe);
    expect(result.success).toBe(false);
  });

  it("rejects invalid equipment", () => {
    const recipe = { ...validMenemen, equipment: ["microwave"] };
    const result = RecipeSchema.safeParse(recipe);
    expect(result.success).toBe(false);
  });

  it("rejects flat ingredients array — ingredientGroups required", () => {
    const recipe: Record<string, unknown> = { ...validMenemen };
    delete recipe.ingredientGroups;
    recipe.ingredients = [
      { name: "Yumurta", amount: 3, unit: "adet", optional: false },
    ];
    const result = RecipeSchema.safeParse(recipe);
    expect(result.success).toBe(false);
  });

  it("allows null stepImage and null timerSeconds on step", () => {
    const step = { ...validStep, stepImage: null, timerSeconds: null };
    const recipe = { ...validMenemen, steps: [step] };
    const result = RecipeSchema.safeParse(recipe);
    expect(result.success).toBe(true);
  });

  it("allows null coverImage on recipe", () => {
    const recipe = { ...validMenemen, coverImage: null };
    const result = RecipeSchema.safeParse(recipe);
    expect(result.success).toBe(true);
  });

  it("rejects missing required step field: looksLikeWhenDone", () => {
    const badStep = { ...validStep };
    delete (badStep as Record<string, unknown>).looksLikeWhenDone;
    const recipe = { ...validMenemen, steps: [badStep] };
    const result = RecipeSchema.safeParse(recipe);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.includes("looksLikeWhenDone"))).toBe(true);
    }
  });

  it("rejects missing required step field: commonMistake", () => {
    const badStep = { ...validStep };
    delete (badStep as Record<string, unknown>).commonMistake;
    const recipe = { ...validMenemen, steps: [badStep] };
    const result = RecipeSchema.safeParse(recipe);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.includes("commonMistake"))).toBe(true);
    }
  });

  it("rejects missing required step field: recovery", () => {
    const badStep = { ...validStep };
    delete (badStep as Record<string, unknown>).recovery;
    const recipe = { ...validMenemen, steps: [badStep] };
    const result = RecipeSchema.safeParse(recipe);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.includes("recovery"))).toBe(true);
    }
  });

  it("ingredientGroup with label: null is valid", () => {
    const recipe = {
      ...validMenemen,
      ingredientGroups: [
        {
          label: null,
          items: [{ name: "Yumurta", amount: 3, unit: "adet", optional: false }],
        },
      ],
    };
    const result = RecipeSchema.safeParse(recipe);
    expect(result.success).toBe(true);
  });
});
