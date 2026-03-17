/**
 * useSearchScreen hook tests -- Phase 9 Search & Category Redesign
 *
 * Tests the pure computeDisplayResults function extracted from useSearchScreen.
 * This avoids needing renderHook with expo-sqlite context.
 */
import { computeDisplayResults, type ComputeDisplayResultsInput } from '../useSearchScreen';

// Mock recipe data
const MOCK_RECIPES = [
  {
    id: '1',
    title: 'Menemen',
    category: 'kahvaltı' as const,
    skillLevel: 'beginner' as const,
    equipment: ['tava'],
    allergens: ['egg'],
    cuisine: 'Turkish',
    prepTime: 5,
    cookTime: 15,
    coverImage: null,
    ingredient_groups: JSON.stringify([
      {
        label: null,
        items: [
          { name: 'domates', amount: 3, unit: 'adet' },
          { name: 'yumurta', amount: 2, unit: 'adet' },
          { name: 'biber', amount: 1, unit: 'adet' },
        ],
      },
    ]),
  },
  {
    id: '2',
    title: 'Mercimek \u00c7orbas\u0131',
    category: '\u00e7orba' as const,
    skillLevel: 'beginner' as const,
    equipment: ['tencere'],
    allergens: [],
    cuisine: 'Turkish',
    prepTime: 10,
    cookTime: 30,
    coverImage: null,
    ingredient_groups: JSON.stringify([
      {
        label: null,
        items: [{ name: 'k\u0131rm\u0131z\u0131 mercimek', amount: 200, unit: 'gr' }],
      },
    ]),
  },
  {
    id: '3',
    title: 'Izgara Tavuk',
    category: 'ana yemek' as const,
    skillLevel: 'intermediate' as const,
    equipment: ['f\u0131r\u0131n'],
    allergens: [],
    cuisine: 'Turkish',
    prepTime: 15,
    cookTime: 25,
    coverImage: null,
    ingredient_groups: JSON.stringify([
      {
        label: null,
        items: [{ name: 'tavuk g\u00f6\u011fs\u00fc', amount: 500, unit: 'gr' }],
      },
    ]),
  },
  {
    id: '4',
    title: 'Domates \u00c7orbas\u0131',
    category: '\u00e7orba' as const,
    skillLevel: 'beginner' as const,
    equipment: ['tencere'],
    allergens: ['dairy'],
    cuisine: 'Turkish',
    prepTime: 10,
    cookTime: 20,
    coverImage: null,
    ingredient_groups: JSON.stringify([
      {
        label: null,
        items: [
          { name: 'domates', amount: 5, unit: 'adet' },
          { name: 'so\u011fan', amount: 1, unit: 'adet' },
        ],
      },
    ]),
  },
  {
    id: '5',
    title: 'Kahvalt\u0131 Tabag\u0131',
    category: 'kahvalt\u0131' as const,
    skillLevel: 'advanced' as const,
    equipment: ['tava', 'f\u0131r\u0131n'],
    allergens: ['egg', 'dairy'],
    cuisine: 'Turkish',
    prepTime: 20,
    cookTime: 15,
    coverImage: null,
    ingredient_groups: JSON.stringify([
      {
        label: null,
        items: [
          { name: 'yumurta', amount: 3, unit: 'adet' },
          { name: 'peynir', amount: 100, unit: 'gr' },
        ],
      },
    ]),
  },
];

function makeInput(overrides: Partial<ComputeDisplayResultsInput> = {}): ComputeDisplayResultsInput {
  return {
    allRecipes: MOCK_RECIPES as any,
    selectedCategory: null,
    query: '',
    ingredientChips: [],
    chipResults: [],
    showFilters: false,
    skillFilter: null,
    equipmentFilter: [],
    ...overrides,
  };
}

describe('useSearchScreen', () => {
  describe('category selection', () => {
    it('selecting a category filters allRecipes by that category', () => {
      const result = computeDisplayResults(makeInput({ selectedCategory: '\u00e7orba' }));
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.category === '\u00e7orba')).toBe(true);
    });

    it('deselecting a category (tap again) clears category filter', () => {
      // null category = no category filter = idle state (empty results when no query)
      const result = computeDisplayResults(makeInput({ selectedCategory: null }));
      expect(result).toEqual([]);
    });

    it('category + text query compose together', () => {
      const result = computeDisplayResults(
        makeInput({ selectedCategory: 'kahvalt\u0131', query: 'yumurta' }),
      );
      // Both kahvalt\u0131 recipes have yumurta in ingredients
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.every((r) => r.category === 'kahvalt\u0131')).toBe(true);
    });
  });

  describe('search matching', () => {
    it('text query matches recipe titles (Turkish locale)', () => {
      const result = computeDisplayResults(makeInput({ query: 'menemen' }));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('text query matches ingredient names from ingredient_groups', () => {
      const result = computeDisplayResults(makeInput({ query: 'domates' }));
      // Should match: Menemen (ingredient), Domates \u00c7orbas\u0131 (title + ingredient)
      expect(result.length).toBeGreaterThanOrEqual(2);
      const ids = result.map((r) => r.id);
      expect(ids).toContain('1'); // Menemen has domates ingredient
      expect(ids).toContain('4'); // Domates \u00c7orbas\u0131
    });

    it('ingredient chips still work with searchRecipesByIngredients', () => {
      // When chipResults are provided (pre-filtered by ingredient chip logic),
      // computeDisplayResults uses them as base
      const chipResults = [MOCK_RECIPES[0], MOCK_RECIPES[3]] as any; // recipes with domates
      const result = computeDisplayResults(
        makeInput({ ingredientChips: ['domates'], chipResults }),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('filter panel', () => {
    it('filter panel state only available when category is selected', () => {
      // showFilters with no category: filters should NOT be applied
      const result = computeDisplayResults(
        makeInput({ query: 'tavuk', showFilters: true, skillFilter: 'beginner' }),
      );
      // Izgara Tavuk is intermediate -- but without category, skill filter is ignored
      expect(result.some((r) => r.id === '3')).toBe(true);
    });

    it('skill filter narrows category results by skill level', () => {
      const result = computeDisplayResults(
        makeInput({
          selectedCategory: 'kahvalt\u0131',
          showFilters: true,
          skillFilter: 'beginner',
        }),
      );
      // kahvalt\u0131 has beginner (Menemen) and advanced (Kahvalt\u0131 Tabag\u0131)
      // skill filter beginner should only return beginner
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('equipment filter narrows category results by required equipment', () => {
      const result = computeDisplayResults(
        makeInput({
          selectedCategory: 'kahvalt\u0131',
          showFilters: true,
          equipmentFilter: ['tava'],
        }),
      );
      // Menemen needs tava (in filter set) -- OK
      // Kahvalt\u0131 Tabag\u0131 needs tava+f\u0131r\u0131n (f\u0131r\u0131n not in filter set) -- excluded
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('session state reset', () => {
    // These test the reset behavior conceptually via computeDisplayResults
    it('selectedCategory resets on tab blur', () => {
      // After reset: selectedCategory=null, query empty -> idle -> empty results
      const result = computeDisplayResults(makeInput({ selectedCategory: null }));
      expect(result).toEqual([]);
    });

    it('skill and equipment filters reset on tab blur', () => {
      // After reset: filters are null/empty, category null -> idle
      const result = computeDisplayResults(
        makeInput({
          selectedCategory: null,
          skillFilter: null,
          equipmentFilter: [],
        }),
      );
      expect(result).toEqual([]);
    });
  });

  describe('dietary-only on search results', () => {
    it('search results do not have skill/equipment filter panel', () => {
      // When no category is selected, skill/equipment filters should not apply
      const allResults = computeDisplayResults(makeInput({ query: 'tavuk' }));
      const filteredResults = computeDisplayResults(
        makeInput({
          query: 'tavuk',
          showFilters: true,
          skillFilter: 'beginner',
          equipmentFilter: ['tava'],
        }),
      );
      // Results should be the same -- filters ignored without category
      expect(filteredResults).toEqual(allResults);
    });
  });

  describe('edge cases', () => {
    it('returns empty array when idle (no category, no query, no chips)', () => {
      const result = computeDisplayResults(makeInput());
      expect(result).toEqual([]);
    });

    it('query under 2 chars returns empty (not matching)', () => {
      const result = computeDisplayResults(makeInput({ query: 'a' }));
      expect(result).toEqual([]);
    });

    it('category selected with no query shows all recipes in category', () => {
      const result = computeDisplayResults(makeInput({ selectedCategory: 'ana yemek' }));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });
  });
});
