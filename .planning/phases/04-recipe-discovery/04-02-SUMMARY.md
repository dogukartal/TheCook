---
phase: 04-recipe-discovery
plan: "02"
subsystem: database
tags: [sqlite, zod, tdd, discovery, allergen-filter, ingredient-search, feed-ordering]

# Dependency graph
requires:
  - phase: 04-recipe-discovery
    plan: "01"
    provides: "DB_VERSION=3 with recent_views table; stub src/db/recipes.ts; RED discovery tests"
provides:
  - "src/types/discovery.ts — Zod schemas for RecipeListItem, AutocompleteSuggestion, RecentView, DiscoveryFilter"
  - "src/db/recipes.ts — useRecipesDb hook + all standalone discovery query functions"
  - "All 11 discovery.test.ts tests passing GREEN"
affects:
  - 04-recipe-discovery plans 03 through 05 (screens call useRecipesDb hook)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure-JS filtering: allergen exclusion, category filter, ingredient search operate on passed arrays — no additional SQL in filter functions"
    - "Dual export pattern (established in profile.ts): standalone functions accept SQLiteDatabase for testability; hook wraps them via useSQLiteContext"
    - "Ingredient matching: parse ingredient_groups JSON in JS, not nested SQL json_each — simpler, fast enough for ~30 recipes"

key-files:
  created:
    - "TheCook/src/types/discovery.ts — RecipeListItemSchema, AutocompleteSuggestionSchema, RecentViewSchema, DiscoveryFilterSchema"
  modified:
    - "TheCook/src/db/recipes.ts — full implementation replacing stub; useRecipesDb hook + all standalone functions"
    - "TheCook/__tests__/discovery.test.ts — removed jest.mock stubs; now uses real imports from src/db/recipes"

key-decisions:
  - "filterRecipesByAllergens is pure JS (no DB call) — accepts recipes array, parses allergens field as JSON string or array"
  - "getFeedRecipes is pure JS sort — skill_level null treated as beginner; sorts beginner < intermediate < advanced"
  - "filterRecipesByCategory is pure JS filter — null category returns all recipes unchanged"
  - "searchRecipesByIngredients uses JS ingredient_groups parsing — AND logic with partial-match fallback ranked by overlap count"
  - "Separate SQL list queries (getAllRecipesForFeed, queryRecipesByFilter) use ALLERGEN_EXCLUSION NOT EXISTS pattern at DB layer for full-dataset queries"

patterns-established:
  - "Array-in/array-out filter functions: all pure-JS filter functions receive pre-fetched recipe arrays — screens fetch once, apply filters in memory"
  - "Standalone + hook dual export: every db module exports standalone functions for testability and a React hook for component use"

requirements-completed:
  - DISC-01
  - DISC-02
  - DISC-03
  - DISC-04
  - DISC-05

# Metrics
duration: 5min
completed: 2026-03-12
---

# Phase 4 Plan 02: Discovery Types and Data Layer Summary

**useRecipesDb hook with allergen exclusion, ingredient AND-search, feed ordering, and bookmark CRUD; all 11 discovery tests GREEN using pure-JS filter functions**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-12T17:43:08Z
- **Completed:** 2026-03-12T17:48:00Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- Created `src/types/discovery.ts` with four Zod schemas (RecipeListItem, AutocompleteSuggestion, RecentView, DiscoveryFilter) and inferred TypeScript types
- Replaced stub `src/db/recipes.ts` with full implementation: pure-JS filter functions + SQL list query functions + `useRecipesDb` hook
- Updated `discovery.test.ts` to remove `jest.mock` and use real imports — all 11 concrete tests now GREEN
- Full test suite: 63 tests passing (up from 52 pre-Phase 4)

## Task Commits

Each task was committed atomically:

1. **Task 1: Define discovery types** - `d619b1e` (feat)
2. **Task 2: Implement useRecipesDb hook and update discovery tests to GREEN** - `7bdb885` (feat)

## Files Created/Modified

- `TheCook/src/types/discovery.ts` — Four Zod schemas with inferred types for discovery data layer
- `TheCook/src/db/recipes.ts` — Full implementation: filterRecipesByAllergens, getFeedRecipes, filterRecipesByCategory, searchRecipesByIngredients, addBookmark, removeBookmark, getBookmarks, getAllIngredientNames, getAllRecipeTitles, recordRecentView, getRecentViews, getAllRecipesForFeed, queryRecipesByFilter, useRecipesDb hook
- `TheCook/__tests__/discovery.test.ts` — Removed jest.mock stubs; tests use real standalone function imports

## Decisions Made

- Pure-JS filter functions (filterRecipesByAllergens, getFeedRecipes, filterRecipesByCategory, searchRecipesByIngredients) accept pre-fetched recipe arrays rather than querying DB internally — this matches the existing test contract (tests pass arrays directly) and supports the screens' pattern of fetching once then filtering in memory
- SQL allergen exclusion (ALLERGEN_EXCLUSION NOT EXISTS pattern) applied only in full-dataset SQL queries (getAllRecipesForFeed, queryRecipesByFilter), not in the pure-JS filter functions
- ingredient_groups JSON parsing done in JS — `items` and `ingredients` field names both supported (test data uses `ingredients`, production schema uses `items`)

## Deviations from Plan

None - plan executed exactly as written. The test signatures in discovery.test.ts were already designed to accept arrays directly, which naturally led to pure-JS filter functions.

## Issues Encountered

None — implementation matched test expectations precisely.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `useRecipesDb` hook ready for all Phase 4 screens (Plans 03–05)
- `RecipeListItem` type available for recipe card components
- `DiscoveryFilter` type ready for filter screen state management
- All 63 tests passing — clean baseline for UI implementation

---
*Phase: 04-recipe-discovery*
*Completed: 2026-03-12*

## Self-Check: PASSED

All created/modified files verified on disk. Both task commits (d619b1e, 7bdb885) verified in git log.
