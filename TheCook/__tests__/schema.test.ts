// Plan 02 — full schema test suite (replaces Wave 0 stubs)
import { RecipeSchema, StepSchema, IngredientSchema, SubstitutionSchema } from "../src/types/recipe";

// ---------------------------------------------------------------------------
// Fixture: a complete valid menemen recipe
// ---------------------------------------------------------------------------
const validStep = {
  title: "Soğanları kavurun",
  instruction: "Zeytinyağını tavada kızdırın, soğanları ekleyin.",
  why: "Soğanların karamelize olması tatlılık katar.",
  looksLikeWhenDone: "Soğanlar şeffaf ve hafif altın rengi.",
  commonMistake: "Soğanları çok yüksek ateşte yakmak.",
  recovery: "Ocağı kısın ve yarım çay bardağı su ekleyin.",
  stepImage: null,
  timerSeconds: null,
};

const validStep2 = {
  title: "Sebzeleri pişirin",
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

// ---------------------------------------------------------------------------
// StepSchema — Phase 11 fields (checkpoint, warning)
// ---------------------------------------------------------------------------

describe("StepSchema — Phase 11 fields", () => {
  const baseStep = {
    title: "Soğanları kavurun",
    instruction: "Zeytinyağını tavada kızdırın.",
    why: "Soğanların karamelize olması tatlılık katar.",
    looksLikeWhenDone: "Soğanlar şeffaf ve hafif altın rengi.",
    commonMistake: "Soğanları çok yüksek ateşte yakmak.",
    recovery: "Ocağı kısın ve yarım çay bardağı su ekleyin.",
    stepImage: null,
    timerSeconds: null,
  };

  it("parses step with checkpoint string — checkpoint is preserved", () => {
    const result = StepSchema.safeParse({
      ...baseStep,
      checkpoint: "Köpürmeli ve hafif kızarmış olmalı",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checkpoint).toBe("Köpürmeli ve hafif kızarmış olmalı");
    }
  });

  it("parses step with warning string — warning is preserved", () => {
    const result = StepSchema.safeParse({
      ...baseStep,
      warning: "Çok kızdırmayın, yanar!",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.warning).toBe("Çok kızdırmayın, yanar!");
    }
  });

  it("parses step without checkpoint/warning — both default to null", () => {
    const result = StepSchema.safeParse(baseStep);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checkpoint).toBeNull();
      expect(result.data.warning).toBeNull();
    }
  });

  it("parses step with checkpoint: null and warning: null — both are null", () => {
    const result = StepSchema.safeParse({
      ...baseStep,
      checkpoint: null,
      warning: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checkpoint).toBeNull();
      expect(result.data.warning).toBeNull();
    }
  });

  it("existing step fixtures (validStep, validStep2) still parse successfully (backward compat)", () => {
    const r1 = StepSchema.safeParse(validStep);
    const r2 = StepSchema.safeParse(validStep2);
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    if (r1.success) {
      expect(r1.data.checkpoint).toBeNull();
      expect(r1.data.warning).toBeNull();
    }
    if (r2.success) {
      expect(r2.data.checkpoint).toBeNull();
      expect(r2.data.warning).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// SubstitutionSchema tests (Phase 10)
// ---------------------------------------------------------------------------

describe("SubstitutionSchema", () => {
  it("validates a valid substitution", () => {
    const result = SubstitutionSchema.safeParse({
      name: "Margarin",
      amount: 50,
      unit: "gr",
    });
    expect(result.success).toBe(true);
  });

  it("rejects substitution with empty name", () => {
    const result = SubstitutionSchema.safeParse({
      name: "",
      amount: 50,
      unit: "gr",
    });
    expect(result.success).toBe(false);
  });

  it("rejects substitution with invalid unit", () => {
    const result = SubstitutionSchema.safeParse({
      name: "Margarin",
      amount: 50,
      unit: "pounds",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// IngredientSchema with alternatives + scalable (Phase 10)
// ---------------------------------------------------------------------------

describe("IngredientSchema — alternatives & scalable", () => {
  it("accepts alternatives array and scalable boolean", () => {
    const result = IngredientSchema.safeParse({
      name: "Tereyağı",
      amount: 50,
      unit: "gr",
      optional: false,
      alternatives: [{ name: "Margarin", amount: 50, unit: "gr" }],
      scalable: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.alternatives).toHaveLength(1);
      expect(result.data.scalable).toBe(true);
    }
  });

  it("defaults alternatives to [] and scalable to true when omitted", () => {
    const result = IngredientSchema.safeParse({
      name: "Yumurta",
      amount: 3,
      unit: "adet",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.alternatives).toEqual([]);
      expect(result.data.scalable).toBe(true);
    }
  });

  it("allows scalable=false for non-scalable ingredients", () => {
    const result = IngredientSchema.safeParse({
      name: "Tuz",
      amount: 1,
      unit: "tutam",
      scalable: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scalable).toBe(false);
    }
  });

  it("existing recipe ingredient without alternatives/scalable still parses (backward compat)", () => {
    // This simulates existing recipe data from the 30 curated recipes
    const existing = { name: "Domates", amount: 200, unit: "gr", optional: false };
    const result = IngredientSchema.safeParse(existing);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.alternatives).toEqual([]);
      expect(result.data.scalable).toBe(true);
    }
  });
});
