---
phase: 10-recipe-detail-evolution
plan: 01
subsystem: database, types
tags: [zod, sqlite, migration, tdd, schema-extension]

requires:
  - phase: 05-cooking-mode
    provides: CookingSession CRUD and cooking_sessions table
  - phase: 01-foundation
    provides: RecipeSchema, IngredientSchema, DB migration pattern
provides:
  - SubstitutionSchema with name/amount/unit fields
  - IngredientSchema extended with alternatives array and scalable boolean
  - DB migration v7 adding adapted_servings and ingredient_swaps to cooking_sessions
  - CookingSession interface extended with adaptedServings and ingredientSwaps
  - Failing test stubs for scaleIngredientGroups, applySwaps, resolveStepVariables, formatAmount
affects: [10-02-adaptation-hook, 10-03-ui-wiring]

tech-stack:
  added: []
  patterns: [backward-compatible schema defaults, JSON column for key-value swaps]

key-files:
  created:
    - TheCook/__tests__/recipe-adaptation.test.ts
  modified:
    - TheCook/src/types/recipe.ts
    - TheCook/src/db/client.ts
    - TheCook/src/db/cooking-session.ts
    - TheCook/__tests__/schema.test.ts
    - TheCook/__tests__/cooking-session.test.ts
    - TheCook/__tests__/migration.test.ts

key-decisions:
  - "SubstitutionSchema mirrors IngredientSchema fields (name, amount, unit) for swap compatibility"
  - "alternatives defaults to [] and scalable defaults to true for full backward compatibility with 30 existing recipes"
  - "ingredient_swaps stored as JSON TEXT column with DEFAULT '{}' for null-safe reads"
  - "test.todo() used for adaptation stubs (pending, not failing) so full suite stays green"

patterns-established:
  - "Schema extension with backward-compatible defaults: new optional fields use .default() to avoid breaking existing data"
  - "JSON TEXT column pattern for flexible key-value storage in SQLite (ingredient_swaps)"

requirements-completed: [ADAPT-01, ADAPT-02, ADAPT-03]

duration: 3min
completed: 2026-03-17
---

# Phase 10 Plan 01: Schema Extensions and Adaptation Foundations Summary

**SubstitutionSchema + IngredientSchema alternatives/scalable fields, DB migration v7 with adaptation columns, and 15 TDD test stubs for scaling/swaps/variable resolution**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-17T18:35:25Z
- **Completed:** 2026-03-17T18:38:30Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Extended IngredientSchema with alternatives array and scalable boolean, fully backward-compatible with all 30 existing recipes
- Added SubstitutionSchema for ingredient swap definitions (name, amount, unit)
- DB migration v7 adds adapted_servings (INTEGER) and ingredient_swaps (TEXT) columns to cooking_sessions
- CookingSession CRUD updated to persist and read adaptation state with null/empty defaults
- Created 15 test.todo stubs covering all ADAPT requirements for Plan 02 TDD

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend schema types + DB migration v7 + session CRUD (RED)** - `e3cc6ba` (test)
2. **Task 1: Extend schema types + DB migration v7 + session CRUD (GREEN)** - `658520d` (feat)
3. **Task 2: Create failing test stubs for adaptation logic** - `4680fa0` (test)

_Note: Task 1 followed TDD with RED/GREEN commits_

## Files Created/Modified
- `TheCook/src/types/recipe.ts` - Added SubstitutionSchema, extended IngredientSchema with alternatives + scalable
- `TheCook/src/db/client.ts` - Bumped DB_VERSION to 7, added migration for adaptation columns
- `TheCook/src/db/cooking-session.ts` - Extended CookingSession interface and CRUD with adaptedServings/ingredientSwaps
- `TheCook/__tests__/schema.test.ts` - Added SubstitutionSchema and IngredientSchema extension tests
- `TheCook/__tests__/cooking-session.test.ts` - Added adaptation field round-trip tests
- `TheCook/__tests__/migration.test.ts` - Updated for DB_VERSION 7, added v7 migration tests
- `TheCook/__tests__/recipe-adaptation.test.ts` - 15 test.todo stubs for adaptation pure functions

## Decisions Made
- SubstitutionSchema mirrors IngredientSchema fields (name, amount, unit) for swap compatibility
- alternatives defaults to [] and scalable defaults to true for full backward compatibility with 30 existing recipes
- ingredient_swaps stored as JSON TEXT column with DEFAULT '{}' for null-safe reads
- test.todo() used for adaptation stubs (pending, not failing) so full suite stays green

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated migration.test.ts for DB_VERSION 7**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Existing migration tests hardcoded DB_VERSION=6 checks, failing after bump to 7
- **Fix:** Updated version assertions from 6 to 7, added v7 migration-specific tests
- **Files modified:** TheCook/__tests__/migration.test.ts
- **Verification:** Full test suite passes (16 suites, 149 tests)
- **Committed in:** 658520d (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary update to keep migration tests in sync with version bump. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Type contracts established: SubstitutionSchema, extended IngredientSchema, extended CookingSession
- Test stubs ready for Plan 02 TDD: 15 todos covering scaleIngredientGroups, applySwaps, resolveStepVariables, formatAmount
- DB migration v7 ready for adaptation state persistence
- All 30 existing recipes remain fully compatible (backward-compatible defaults)

---
*Phase: 10-recipe-detail-evolution*
*Completed: 2026-03-17*
