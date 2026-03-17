import { useState, useMemo, useCallback } from "react";
import type { Recipe, IngredientGroup } from "../types/recipe";

// ---------------------------------------------------------------------------
// Pure functions — exported for direct unit testing
// ---------------------------------------------------------------------------

/**
 * Format a numeric amount for display:
 * - Whole numbers show no decimal (1.0 -> "1")
 * - Fractional amounts show 1 decimal (1.5 -> "1.5")
 * - Values are rounded to nearest tenth first (2.333 -> "2.3")
 */
export function formatAmount(amount: number): string {
  const rounded = Math.round(amount * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/**
 * Scale all ingredient amounts by a multiplier.
 * Ingredients with scalable=false are left unchanged.
 * Returns new arrays (immutable — does not mutate input).
 */
export function scaleIngredientGroups(
  groups: IngredientGroup[],
  multiplier: number
): IngredientGroup[] {
  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      amount:
        item.scalable !== false
          ? Math.round(item.amount * multiplier * 10) / 10
          : item.amount,
    })),
  }));
}

/**
 * Apply ingredient swaps. For each ingredient whose name is a key in swaps,
 * find the matching alternative (by name === swap value) and replace
 * name, amount, and unit with the alternative's values.
 * If no matching alternative is found, the ingredient is left unchanged.
 */
export function applySwaps(
  groups: IngredientGroup[],
  swaps: Record<string, string>
): IngredientGroup[] {
  if (Object.keys(swaps).length === 0) return groups;

  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      const swapTarget = swaps[item.name];
      if (!swapTarget) return item;

      const alt = item.alternatives.find((a) => a.name === swapTarget);
      if (!alt) return item;

      return {
        ...item,
        name: alt.name,
        amount: alt.amount,
        unit: alt.unit,
      };
    }),
  }));
}

/**
 * Resolve dynamic variables in step instruction text.
 * Pattern: {{IngredientName.field}} where field is name|amount|unit.
 * - amount uses formatAmount for clean display
 * - Unmatched patterns are left as-is (graceful degradation)
 */
export function resolveStepVariables(
  instruction: string,
  ingredientMap: Map<string, { name: string; amount: number; unit: string }>
): string {
  return instruction.replace(
    /\{\{([^.}]+)\.(name|amount|unit)\}\}/g,
    (match, ingredientName: string, field: string) => {
      const ingredient = ingredientMap.get(ingredientName);
      if (!ingredient) return match; // graceful degradation

      switch (field) {
        case "name":
          return ingredient.name;
        case "amount":
          return formatAmount(ingredient.amount);
        case "unit":
          return ingredient.unit;
        default:
          return match;
      }
    }
  );
}

// ---------------------------------------------------------------------------
// Hook — useRecipeAdaptation
// ---------------------------------------------------------------------------

export function useRecipeAdaptation(recipe: Recipe | null) {
  const [servings, setServings] = useState<number>(recipe?.servings ?? 1);
  const [swaps, setSwaps] = useState<Record<string, string>>({});

  // Recompute servings when recipe changes
  // (handled by callers resetting via resetAll or re-mounting)

  const multiplier = recipe ? servings / recipe.servings : 1;

  const adaptedGroups = useMemo(() => {
    if (!recipe) return [];
    const scaled = scaleIngredientGroups(recipe.ingredientGroups, multiplier);
    return applySwaps(scaled, swaps);
  }, [recipe, multiplier, swaps]);

  const ingredientMap = useMemo(() => {
    const map = new Map<string, { name: string; amount: number; unit: string }>();
    for (const group of adaptedGroups) {
      for (const item of group.items) {
        map.set(item.name, {
          name: item.name,
          amount: item.amount,
          unit: item.unit,
        });
      }
    }
    return map;
  }, [adaptedGroups]);

  const adaptedSteps = useMemo(() => {
    if (!recipe) return [];
    return recipe.steps.map((step) => ({
      ...step,
      instruction: resolveStepVariables(step.instruction, ingredientMap),
    }));
  }, [recipe, ingredientMap]);

  const swapIngredient = useCallback((name: string, subName: string) => {
    setSwaps((prev) => ({ ...prev, [name]: subName }));
  }, []);

  const resetSwap = useCallback((name: string) => {
    setSwaps((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setServings(recipe?.servings ?? 1);
    setSwaps({});
  }, [recipe]);

  return {
    servings,
    setServings,
    swaps,
    swapIngredient,
    resetSwap,
    resetAll,
    multiplier,
    adaptedGroups,
    adaptedSteps,
    ingredientMap,
  };
}
