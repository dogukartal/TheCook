// Phase 10 — Tests for recipe adaptation pure functions
// Tests for scaleIngredientGroups, applySwaps, resolveStepVariables, formatAmount

import {
  scaleIngredientGroups,
  applySwaps,
  resolveStepVariables,
  formatAmount,
} from "../src/hooks/useRecipeAdaptation";
import type { IngredientGroup } from "../src/types/recipe";

// ---------------------------------------------------------------------------
// Mock data — 2 ingredient groups with realistic Turkish recipe data
// ---------------------------------------------------------------------------

const mockGroups: IngredientGroup[] = [
  {
    label: "Ana Malzemeler",
    items: [
      {
        name: "Tereyağı",
        amount: 1,
        unit: "yemek kaşığı",
        optional: false,
        alternatives: [
          { name: "Zeytinyağı", amount: 1, unit: "yemek kaşığı" },
        ],
        scalable: true,
      },
      {
        name: "Tuz",
        amount: 1,
        unit: "tutam",
        optional: false,
        alternatives: [],
        scalable: false,
      },
    ],
  },
  {
    label: "Diğer",
    items: [
      {
        name: "Yumurta",
        amount: 4,
        unit: "adet",
        optional: false,
        alternatives: [],
        scalable: true,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// scaleIngredientGroups
// ---------------------------------------------------------------------------

describe("scaleIngredientGroups", () => {
  test("scales amounts by multiplier (2x servings doubles amounts)", () => {
    const result = scaleIngredientGroups(mockGroups, 2.0);
    // Tereyağı: 1 * 2 = 2
    expect(result[0].items[0].amount).toBe(2);
    // Yumurta: 4 * 2 = 8
    expect(result[1].items[0].amount).toBe(8);
  });

  test("does not scale ingredients with scalable=false", () => {
    const result = scaleIngredientGroups(mockGroups, 2.0);
    // Tuz has scalable=false, should remain 1
    expect(result[0].items[1].amount).toBe(1);
  });

  test("rounds scaled amounts to 1 decimal place (no floating point artifacts)", () => {
    const result = scaleIngredientGroups(mockGroups, 1.5);
    // Tereyağı: 1 * 1.5 = 1.5
    expect(result[0].items[0].amount).toBe(1.5);
    // Yumurta: 4 * 1.5 = 6.0
    expect(result[1].items[0].amount).toBe(6);
  });

  test("handles multiplier of 1 (no change)", () => {
    const result = scaleIngredientGroups(mockGroups, 1.0);
    expect(result[0].items[0].amount).toBe(1);
    expect(result[0].items[1].amount).toBe(1);
    expect(result[1].items[0].amount).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// applySwaps
// ---------------------------------------------------------------------------

describe("applySwaps", () => {
  test("replaces ingredient name and amount with substitute values", () => {
    const result = applySwaps(mockGroups, { "Tereyağı": "Zeytinyağı" });
    expect(result[0].items[0].name).toBe("Zeytinyağı");
    expect(result[0].items[0].amount).toBe(1);
    expect(result[0].items[0].unit).toBe("yemek kaşığı");
  });

  test("leaves non-swapped ingredients unchanged", () => {
    const result = applySwaps(mockGroups, { "Tereyağı": "Zeytinyağı" });
    // Tuz should be unchanged
    expect(result[0].items[1].name).toBe("Tuz");
    expect(result[0].items[1].amount).toBe(1);
    // Yumurta should be unchanged
    expect(result[1].items[0].name).toBe("Yumurta");
    expect(result[1].items[0].amount).toBe(4);
  });

  test("only swaps ingredients that have matching alternative defined", () => {
    // Yumurta has no alternatives, so swapping it should have no effect
    const result = applySwaps(mockGroups, { "Yumurta": "SomeNonExistent" });
    expect(result[1].items[0].name).toBe("Yumurta");
    expect(result[1].items[0].amount).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// resolveStepVariables
// ---------------------------------------------------------------------------

describe("resolveStepVariables", () => {
  const ingredientMap = new Map<string, { name: string; amount: number; unit: string }>([
    ["Yumurta", { name: "Yumurta", amount: 4, unit: "adet" }],
    ["Tereyağı", { name: "Tereyağı", amount: 1, unit: "yemek kaşığı" }],
  ]);

  test("resolves {{IngredientName.amount}} to scaled amount", () => {
    const result = resolveStepVariables("{{Yumurta.amount}} adet yumurta ekleyin", ingredientMap);
    expect(result).toBe("4 adet yumurta ekleyin");
  });

  test("resolves {{IngredientName.name}} to current name (or swapped name)", () => {
    const result = resolveStepVariables("{{Tereyağı.name}} eritin", ingredientMap);
    expect(result).toBe("Tereyağı eritin");
  });

  test("resolves {{IngredientName.unit}} to unit string", () => {
    const result = resolveStepVariables("{{Tereyağı.amount}} {{Tereyağı.unit}}", ingredientMap);
    expect(result).toBe("1 yemek kaşığı");
  });

  test("leaves unmatched {{variables}} as-is (graceful degradation)", () => {
    const result = resolveStepVariables("{{Unknown.amount}} bilinmeyen", ingredientMap);
    expect(result).toBe("{{Unknown.amount}} bilinmeyen");
  });

  test("handles step text with no variables (returns unchanged)", () => {
    const result = resolveStepVariables("no vars here", ingredientMap);
    expect(result).toBe("no vars here");
  });
});

// ---------------------------------------------------------------------------
// formatAmount
// ---------------------------------------------------------------------------

describe("formatAmount", () => {
  test("integer amounts display without decimal (1.0 -> '1')", () => {
    expect(formatAmount(1.0)).toBe("1");
  });

  test("fractional amounts show one decimal (1.5 -> '1.5')", () => {
    expect(formatAmount(1.5)).toBe("1.5");
  });

  test("rounds to nearest tenth (2.333 -> '2.3')", () => {
    expect(formatAmount(2.333)).toBe("2.3");
  });
});
