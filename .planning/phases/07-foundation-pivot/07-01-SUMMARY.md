---
phase: 07-foundation-pivot
plan: 01
subsystem: database
tags: [sqlite, hard-filter, sql, zod, migration, profile]

# Dependency graph
requires:
  - phase: 06-equipment-discovery-wiring
    provides: Equipment filter infrastructure (soft sort replaced by hard exclusion)
  - phase: 01-foundation
    provides: DB migration framework (PRAGMA user_version), RecipeSchema, SQLite client
provides:
  - HardFilter interface for SQL-level skill + equipment + allergen exclusion
  - DB_VERSION 5 migration with cuisine_preferences and app_goals columns
  - getBookmarkedRecipes function with hard filter + bookmark order preservation
  - buildHardFilterClauses helper for composable SQL WHERE clauses
  - SKILL_CEILING_MAP for skill level ceiling filtering
  - Extended ProfileSchema with cuisinePreferences and appGoals
affects: [07-02-PLAN, 07-03-PLAN, feed-screen, search-screen, my-kitchen-screen]

# Tech tracking
tech-stack:
  added: []
  patterns: [hard-filter-sql-exclusion, buildHardFilterClauses-composable-pattern]

key-files:
  created:
    - TheCook/__tests__/hard-filter.test.ts
  modified:
    - TheCook/src/db/recipes.ts
    - TheCook/src/db/client.ts
    - TheCook/src/db/profile.ts
    - TheCook/src/types/discovery.ts
    - TheCook/src/types/profile.ts
    - TheCook/__tests__/migration.test.ts
    - TheCook/__tests__/profile.test.ts
    - TheCook/__tests__/equipment-filter.test.ts
    - TheCook/app/(tabs)/index.tsx
    - TheCook/app/(tabs)/search.tsx
    - TheCook/app/(tabs)/my-kitchen.tsx

key-decisions:
  - "HardFilter is a plain interface (not Zod schema) for internal use between DB layer and screens"
  - "Equipment exclusion uses NOT EXISTS + json_each SQL pattern (same as allergen exclusion)"
  - "sortByEquipmentCompatibility removed entirely -- hard SQL exclusion replaces soft JS sort"
  - "getBookmarkedRecipes centralizes inline SQL from my-kitchen.tsx into recipes.ts with hard filter support"

patterns-established:
  - "buildHardFilterClauses: composable SQL WHERE builder accepting HardFilter, returns {conditions, params}"
  - "SKILL_CEILING_MAP: static lookup mapping skill level to allowed levels array"

requirements-completed: [DISC-05, PROF-01, PROF-02, PROF-03]

# Metrics
duration: 7min
completed: 2026-03-17
---

# Phase 07 Plan 01: Hard Filter SQL + Profile Extension Summary

**SQL-level hard exclusion for skill ceiling, equipment, and bookmark allergens using composable buildHardFilterClauses pattern, plus DB v5 migration adding cuisine_preferences and app_goals profile columns**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-17T15:27:10Z
- **Completed:** 2026-03-17T15:34:10Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Hard filter SQL excludes recipes above user skill ceiling (beginner sees only beginner, intermediate sees beginner+intermediate)
- Equipment exclusion at SQL level prevents recipes requiring equipment the user does not own from appearing
- Bookmark query (getBookmarkedRecipes) applies allergen + skill + equipment hard filters while preserving recency order (DISC-05)
- DB_VERSION 5 migration adds cuisine_preferences and app_goals nullable columns to profile table
- ProfileSchema extended with cuisinePreferences and appGoals nullable string fields
- All 13 test suites pass (111 tests, 0 failures)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create hard filter test stubs (RED) + DB migration v5 + profile schema extension** - `5df8e12` (test)
2. **Task 2: Implement hard filter SQL in recipes.ts -- tests go GREEN** - `8fd3e7d` (feat)

## Files Created/Modified
- `TheCook/__tests__/hard-filter.test.ts` - 11 tests covering skill ceiling, equipment exclusion, allergen bookmark filtering, combined filters
- `TheCook/src/db/recipes.ts` - Added HardFilter support: SKILL_CEILING_MAP, EQUIPMENT_EXCLUSION, buildHardFilterClauses, getBookmarkedRecipes; removed sortByEquipmentCompatibility
- `TheCook/src/types/discovery.ts` - Added HardFilter interface
- `TheCook/src/db/client.ts` - Bumped DB_VERSION to 5, added v5 migration for cuisine_preferences and app_goals
- `TheCook/src/types/profile.ts` - Added cuisinePreferences and appGoals to ProfileSchema
- `TheCook/src/db/profile.ts` - Updated getProfile, saveProfile, saveProfileToDb for new columns
- `TheCook/__tests__/migration.test.ts` - Updated for DB_VERSION 5, added v5 migration tests
- `TheCook/__tests__/profile.test.ts` - Added tests for cuisinePreferences and appGoals
- `TheCook/__tests__/equipment-filter.test.ts` - Updated for new queryRecipesByFilter(db, filter, hardFilter) signature
- `TheCook/app/(tabs)/index.tsx` - Updated to pass HardFilter to getAllRecipesForFeed
- `TheCook/app/(tabs)/search.tsx` - Updated to pass HardFilter to getAllRecipesForSearch
- `TheCook/app/(tabs)/my-kitchen.tsx` - Replaced inline SQL with getBookmarkedRecipes from hook

## Decisions Made
- HardFilter is a plain TypeScript interface (not Zod schema) since it is internal to the DB/screen layer and does not need runtime validation
- Equipment exclusion uses NOT EXISTS + json_each SQL pattern, matching the existing allergen exclusion pattern for consistency
- sortByEquipmentCompatibility was fully removed -- hard SQL exclusion is a strict superset (incompatible recipes never appear vs. appearing but sorted lower)
- getBookmarkedRecipes centralizes the inline batch SELECT from my-kitchen.tsx into recipes.ts, applying hard filters and preserving bookmark order via rowMap

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated equipment-filter.test.ts for new queryRecipesByFilter signature**
- **Found during:** Task 2 (implementing hard filter SQL)
- **Issue:** equipment-filter.test.ts called queryRecipesByFilter(db, filter, userAllergens) which no longer matches the new signature queryRecipesByFilter(db, filter, hardFilter)
- **Fix:** Rewrote test file to use HardFilter objects and verify SQL clauses instead of JS sort order
- **Files modified:** TheCook/__tests__/equipment-filter.test.ts
- **Verification:** All 5 equipment filter tests pass
- **Committed in:** 8fd3e7d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix -- test would fail without signature update. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- HardFilter infrastructure ready for Plan 02 (feed sections) and Plan 03 (serving scaler)
- All recipe query functions now accept HardFilter -- new screens/features can compose filters freely
- Profile schema extended for future cuisine preference and app goals features

---
*Phase: 07-foundation-pivot*
*Completed: 2026-03-17*
