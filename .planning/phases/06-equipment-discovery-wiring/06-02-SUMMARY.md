---
phase: 06-equipment-discovery-wiring
plan: 02
subsystem: database
tags: [sqlite, expo-sqlite, recipes, equipment, sorting, typescript]

# Dependency graph
requires:
  - phase: 06-01
    provides: "DiscoveryFilter with equipment field, RecipeListItem with equipment field, 5 RED equipment-filter tests"
provides:
  - "Equipment-aware queryRecipesByFilter — sorts incompatible recipes to end via JS sort after SQL fetch"
  - "Equipment-aware getAllRecipesForFeed — optional userEquipment param with default []"
  - "Equipment-aware getAllRecipesForSearch — optional userEquipment param with inline sort preserving ingredient_groups"
  - "Updated useRecipesDb hook signatures exposing userEquipment on all three functions"
  - "All 5 equipment-filter tests GREEN"
affects:
  - 06-03
  - FeedScreen
  - SearchScreen

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "JS-after-fetch sort for equipment compatibility — no SQL WHERE on equipment, sort applied after rows.map()"
    - "sortByEquipmentCompatibility uses Set for O(1) lookup and every() for vacuous-truth correctness"
    - "getAllRecipesForSearch sorts inline (not via helper) to preserve extended return type with ingredient_groups"

key-files:
  created: []
  modified:
    - TheCook/src/db/recipes.ts

key-decisions:
  - "Equipment sort uses every() not some() — a recipe with empty equipment array is always compatible (vacuous truth)"
  - "sortByEquipmentCompatibility returns items unchanged when userEquipment is empty — no allocation on no-op path"
  - "getAllRecipesForSearch sorts inline rather than delegating to helper — avoids losing ingredient_groups in return type"
  - "Equipment sort applied in JS after SQL fetch — not SQL WHERE — consistent with plan spec and avoids JSON SQL complexity"

patterns-established:
  - "Pattern: JS-sort-after-fetch for soft de-prioritization (equipment). SQL WHERE for hard exclusion (allergens)"

requirements-completed:
  - ONBRD-03

# Metrics
duration: 5min
completed: 2026-03-14
---

# Phase 06 Plan 02: Equipment Discovery Wiring — Sort Implementation Summary

**Equipment de-prioritization wired into queryRecipesByFilter, getAllRecipesForFeed, getAllRecipesForSearch via JS-after-fetch sort using Set-based every() compatibility check — all 5 tests GREEN**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-14T16:00:00Z
- **Completed:** 2026-03-14T16:05:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added `sortByEquipmentCompatibility` private helper: takes RecipeListItem[] + userEquipment[], returns items unchanged when userEquipment is empty, otherwise stable-sorts compatible recipes first using Set + every()
- Updated `getAllRecipesForFeed` with optional `userEquipment: string[] = []` param and applies sort after SQL fetch
- Updated `queryRecipesByFilter` to apply equipment sort using `filter.equipment` after SQL fetch
- Updated `getAllRecipesForSearch` with optional `userEquipment: string[] = []` param and inline sort that preserves extended return type
- Updated `useRecipesDb` hook to forward `userEquipment` through all three functions
- Full jest suite: 93 tests passed, 0 failures; TypeScript: 0 errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Add equipment sort to queryRecipesByFilter, getAllRecipesForFeed, getAllRecipesForSearch** - `b5848b9` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `TheCook/src/db/recipes.ts` - Added sortByEquipmentCompatibility helper; updated three fetch functions and useRecipesDb hook with equipment-aware signatures

## Decisions Made
- `every()` used for compatibility check: a recipe with no required equipment is always compatible (vacuous truth) — matches test 3 specification
- Sort returns input array unchanged when `userEquipment.length === 0` — avoids unnecessary allocation and preserves original rowid order exactly
- `getAllRecipesForSearch` handles sort inline rather than via the shared helper — preserves `ingredient_groups` in the extended return type without re-mapping

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plan 03 can now wire `userEquipment` from profile context into FeedScreen, SearchScreen, and DiscoveryFilterModal
- All three functions have backward-compatible signatures (default [] for userEquipment)
- No breaking changes to existing callers — they continue to work without passing userEquipment

## Self-Check: PASSED

- TheCook/src/db/recipes.ts: FOUND
- Commit b5848b9: FOUND

---
*Phase: 06-equipment-discovery-wiring*
*Completed: 2026-03-14*
