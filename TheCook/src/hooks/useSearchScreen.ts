import { useState, useEffect, useMemo, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';

import { useRecipesDb, extractIngredientNames } from '@/src/db/recipes';
import { useProfileDb } from '@/src/db/profile';

import type { Profile } from '@/src/types/profile';
import type { RecipeListItem, HardFilter } from '@/src/types/discovery';
import type { Category, SkillLevel } from '@/src/types/recipe';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchScreenState {
  allIngredients: string[];
  allRecipes: (RecipeListItem & { ingredient_groups: string })[];
  profile: Profile | null;
  profileLoaded: boolean;
  recentViews: RecipeListItem[];
  query: string;
  ingredientChips: string[];
  results: RecipeListItem[];
  searchLoading: boolean;
  bookmarkedIds: Set<string>;
  dropdownOpen: boolean;
  ingredientSuggestions: string[];
  displayResults: RecipeListItem[];
  isIdle: boolean;
  hasChips: boolean;
  showDropdown: boolean;
  selectedCategory: Category | null;
  showFilterPanel: boolean;
  skillFilter: SkillLevel | null;
  equipmentFilter: string[];
}

export interface SearchScreenActions {
  handleSelectIngredient: (name: string) => void;
  handleRemoveChip: (name: string) => void;
  handleRecipePress: (id: string) => void;
  handleBookmarkToggle: (id: string) => Promise<void>;
  handleQueryChange: (text: string) => void;
  setDropdownOpen: (open: boolean) => void;
  handleCategorySelect: (category: Category | null) => void;
  handleSkillFilterChange: (skill: SkillLevel | null) => void;
  handleEquipmentFilterChange: (equipment: string[]) => void;
  handleToggleFilterPanel: () => void;
}

// ---------------------------------------------------------------------------
// Pure computation function (exported for testing)
// ---------------------------------------------------------------------------

export interface ComputeDisplayResultsInput {
  allRecipes: (RecipeListItem & { ingredient_groups: string })[];
  selectedCategory: Category | null;
  query: string;
  ingredientChips: string[];
  chipResults: RecipeListItem[];
  showFilters: boolean;
  skillFilter: SkillLevel | null;
  equipmentFilter: string[];
}

export function computeDisplayResults(input: ComputeDisplayResultsInput): RecipeListItem[] {
  const {
    allRecipes,
    selectedCategory,
    query,
    ingredientChips,
    chipResults,
    showFilters,
    skillFilter,
    equipmentFilter,
  } = input;

  const lowerQuery = query.length >= 2 ? query.toLocaleLowerCase('tr') : '';

  // Ingredient chip mode: use pre-filtered chipResults as base
  if (ingredientChips.length > 0) {
    let base = chipResults;
    if (lowerQuery) {
      base = base.filter((r) => r.title.toLocaleLowerCase('tr').includes(lowerQuery));
    }
    return base;
  }

  // Start with allRecipes, apply category filter if set
  let base = selectedCategory
    ? allRecipes.filter((r) => r.category === selectedCategory)
    : allRecipes;

  // Apply text query (title + ingredient matching)
  if (lowerQuery) {
    base = base.filter((r) => {
      const titleMatch = r.title.toLocaleLowerCase('tr').includes(lowerQuery);
      if (titleMatch) return true;
      // Also match against ingredient names
      const ingredientNames = extractIngredientNames(
        (r as RecipeListItem & { ingredient_groups: string }).ingredient_groups,
      );
      return ingredientNames.some((name) => name.includes(lowerQuery));
    });
  } else if (!selectedCategory) {
    // No query, no category, no chips = idle state
    return [];
  }

  // Apply skill/equipment filters ONLY when category is selected and filters are active
  if (selectedCategory && showFilters) {
    if (skillFilter) {
      base = base.filter((r) => r.skillLevel === skillFilter);
    }
    if (equipmentFilter.length > 0) {
      base = base.filter((r) => {
        // Recipe is cookable if all its required equipment is in the user's filter set
        return r.equipment.every((eq) => equipmentFilter.includes(eq));
      });
    }
  }

  return base;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSearchScreen(): SearchScreenState & SearchScreenActions {
  const {
    getAllIngredientNames,
    getAllRecipesForSearch,
    searchRecipesByIngredients,
    getRecentViews,
    recordRecentView,
    getBookmarks,
    addBookmark,
    removeBookmark,
  } = useRecipesDb();
  const { getProfile } = useProfileDb();

  // Data loaded on focus
  const [allIngredients, setAllIngredients] = useState<string[]>([]);
  const [allRecipes, setAllRecipes] = useState<(RecipeListItem & { ingredient_groups: string })[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [recentViews, setRecentViews] = useState<RecipeListItem[]>([]);

  // Search interaction state
  const [query, setQuery] = useState('');
  const [ingredientChips, setIngredientChips] = useState<string[]>([]);
  const [results, setResults] = useState<RecipeListItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Category & filter state (session-only)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [skillFilter, setSkillFilter] = useState<SkillLevel | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string[]>([]);

  // Load data on focus (re-fetches profile for allergen changes)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadAll() {
        const p = await getProfile();
        if (cancelled) return;
        setProfile(p);

        const [ingredients, recipes, bookmarks, recentViewEntries] = await Promise.all([
          getAllIngredientNames(),
          getAllRecipesForSearch({
            allergens: p.allergens,
            skillLevel: p.skillLevel,
            equipment: p.equipment,
          } as HardFilter),
          getBookmarks(null),
          getRecentViews(),
        ]);

        if (cancelled) return;

        setAllIngredients(ingredients);
        setAllRecipes(recipes);
        setBookmarkedIds(new Set(bookmarks.map((b) => b.recipeId)));

        const recipeMap = new Map(recipes.map((r) => [r.id, r as RecipeListItem]));
        const recentRecipes = recentViewEntries
          .map((rv) => recipeMap.get(rv.recipeId))
          .filter((r): r is RecipeListItem => r !== undefined);
        setRecentViews(recentRecipes);

        setProfileLoaded(true);
      }

      loadAll();
      return () => { cancelled = true; };
    }, [])
  );

  // Reset session state on tab blur
  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectedCategory(null);
        setSkillFilter(null);
        setEquipmentFilter([]);
        setShowFilters(false);
      };
    }, [])
  );

  // Ingredient autocomplete
  const ingredientSuggestions = useMemo<string[]>(() => {
    if (query.length < 2) return [];
    const lowerQuery = query.toLocaleLowerCase('tr');
    return allIngredients
      .filter((name) => name.toLocaleLowerCase('tr').includes(lowerQuery))
      .filter((name) => !ingredientChips.includes(name))
      .slice(0, 8);
  }, [query, allIngredients, ingredientChips]);

  // Search by ingredient chips + optional title filter
  useEffect(() => {
    if (ingredientChips.length === 0) {
      setResults([]);
      return;
    }
    if (!profile) return;

    let cancelled = false;
    setSearchLoading(true);

    searchRecipesByIngredients(allRecipes, ingredientChips, true).then((matched) => {
      if (cancelled) return;
      setResults(matched);
      setSearchLoading(false);
    });

    return () => { cancelled = true; };
  }, [ingredientChips, allRecipes, profile]);

  // Display results using pure computation function
  const displayResults = useMemo(
    () =>
      computeDisplayResults({
        allRecipes,
        selectedCategory,
        query,
        ingredientChips,
        chipResults: results,
        showFilters,
        skillFilter,
        equipmentFilter,
      }),
    [results, query, ingredientChips, allRecipes, selectedCategory, showFilters, skillFilter, equipmentFilter],
  );

  // Computed state
  const isIdle = ingredientChips.length === 0 && query.length < 2 && selectedCategory === null;
  const hasChips = ingredientChips.length > 0;
  const showDropdown = dropdownOpen && ingredientSuggestions.length > 0 && !hasChips;
  const showFilterPanel = selectedCategory !== null && ingredientChips.length === 0;

  // Interactions
  function handleSelectIngredient(name: string) {
    if (!ingredientChips.includes(name)) {
      setIngredientChips((prev) => [...prev, name]);
    }
    setQuery('');
    setDropdownOpen(false);
  }

  function handleRemoveChip(name: string) {
    setIngredientChips((prev) => prev.filter((c) => c !== name));
  }

  function handleRecipePress(id: string) {
    recordRecentView(id);
    const recipe = allRecipes.find((r) => r.id === id);
    if (recipe) {
      setRecentViews((prev) => {
        const filtered = prev.filter((r) => r.id !== id);
        return [recipe, ...filtered].slice(0, 10);
      });
    }
    router.push(`/recipe/${id}` as never);
  }

  async function handleBookmarkToggle(id: string) {
    if (bookmarkedIds.has(id)) {
      await removeBookmark(id);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      await addBookmark(id, null);
      setBookmarkedIds((prev) => new Set([...prev, id]));
    }
  }

  function handleQueryChange(text: string) {
    setQuery(text);
    setDropdownOpen(text.length >= 2);
  }

  function handleCategorySelect(category: Category | null) {
    if (category === selectedCategory) {
      // Toggle off if same category tapped again
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
    // Reset filters when category changes
    setSkillFilter(null);
    setEquipmentFilter([]);
  }

  function handleSkillFilterChange(skill: SkillLevel | null) {
    setSkillFilter(skill === skillFilter ? null : skill);
  }

  function handleEquipmentFilterChange(equipment: string[]) {
    setEquipmentFilter(equipment);
  }

  function handleToggleFilterPanel() {
    setShowFilters((prev) => !prev);
  }

  return {
    // State
    allIngredients,
    allRecipes,
    profile,
    profileLoaded,
    recentViews,
    query,
    ingredientChips,
    results,
    searchLoading,
    bookmarkedIds,
    dropdownOpen,
    ingredientSuggestions,
    displayResults,
    isIdle,
    hasChips,
    showDropdown,
    selectedCategory,
    showFilterPanel,
    skillFilter,
    equipmentFilter,
    // Actions
    handleSelectIngredient,
    handleRemoveChip,
    handleRecipePress,
    handleBookmarkToggle,
    handleQueryChange,
    setDropdownOpen,
    handleCategorySelect,
    handleSkillFilterChange,
    handleEquipmentFilterChange,
    handleToggleFilterPanel,
  };
}
