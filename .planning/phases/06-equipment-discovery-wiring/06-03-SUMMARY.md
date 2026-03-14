---
phase: 06-equipment-discovery-wiring
plan: "03"
subsystem: ui
tags: [react-native, expo, equipment, recipe-discovery, badges, RecipeCardGrid, RecipeCardRow]

# Dependency graph
requires:
  - phase: 06-equipment-discovery-wiring/06-02
    provides: sortByEquipmentCompatibility wired into getAllRecipesForFeed and getAllRecipesForSearch
  - phase: 06-equipment-discovery-wiring/06-01
    provides: equipment field on RecipeListItem and DiscoveryFilterSchema

provides:
  - RecipeCardGrid with userEquipment prop and amber "Ekipman eksik" badge on incompatible cards
  - RecipeCardRow with same badge for recently-viewed entries
  - Feed, Search, and My Kitchen screens passing profile.equipment to fetch functions and card components
  - Full visual surface coverage — badge appears on all three discovery surfaces

affects:
  - any future screen that renders RecipeCardGrid or RecipeCardRow

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "userEquipment optional prop with default [] — avoids breaking existing call sites, safe upgrade path"
    - "hasMissingEquipment computed with .some() — badge = at least one piece missing (distinct from sort which uses .every())"
    - "Badge guard recipe.equipment.length > 0 — zero-equipment recipes never show badge (vacuous truth safe)"
    - "My Kitchen bookmark recency order preserved — badge only, no sort applied to saved recipes"

key-files:
  created: []
  modified:
    - TheCook/components/ui/recipe-card-grid.tsx
    - TheCook/components/ui/recipe-card-row.tsx
    - TheCook/app/(tabs)/index.tsx
    - TheCook/app/(tabs)/search.tsx
    - TheCook/app/(tabs)/my-kitchen.tsx

key-decisions:
  - "Badge uses .some() to detect ANY missing equipment; sort in Plan 02 uses .every() for full compatibility — both correct for their respective purposes"
  - "My Kitchen does not re-sort saved recipes — bookmark recency order preserved per RESEARCH.md recommendation"
  - "userEquipment prop is optional with default [] — backwards-compatible with any future call sites added before profile loads"

patterns-established:
  - "Equipment badge pattern: optional userEquipment prop + .some() guard + zero-equipment guard + amber #D97706 + MaterialCommunityIcons alert-circle-outline"

requirements-completed:
  - ONBRD-03

# Metrics
duration: checkpoint
completed: 2026-03-14
---

# Phase 06 Plan 03: Equipment Badge UI Wiring Summary

**Amber "Ekipman eksik" badge wired into RecipeCardGrid and RecipeCardRow, propagated from profile.equipment through Feed, Search, and My Kitchen screens — equipment-awareness now visible on all discovery surfaces.**

## Performance

- **Duration:** checkpoint (Tasks 1-2 executed prior session; Task 3 human-verify approved)
- **Started:** 2026-03-14
- **Completed:** 2026-03-14
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 5

## Accomplishments

- RecipeCardGrid and RecipeCardRow both accept `userEquipment?: string[]` prop and render an amber "Ekipman eksik" badge when `recipe.equipment.length > 0` and `.some()` equipment is missing from userEquipment
- Feed screen passes `profile.equipment` to `getAllRecipesForFeed` (enabling DB-layer sort) and to every RecipeCardGrid render
- Search screen passes `profile.equipment` to `getAllRecipesForSearch` and to both RecipeCardGrid (results) and RecipeCardRow (recently-viewed idle state)
- My Kitchen screen adds `equipment` column to its bookmark batch SELECT and passes `profile.equipment` to RecipeCardGrid; bookmark recency order preserved (no sort)
- User visually confirmed correct badge behavior on device/simulator ("approved")

## Task Commits

Each task was committed atomically:

1. **Task 1: Add userEquipment prop and equipment badge to RecipeCardGrid and RecipeCardRow** - `2a86ff1` (feat)
2. **Task 2: Pass profile.equipment from Feed, Search, and My Kitchen screens** - `dd9359f` (feat)
3. **Task 3: Human verification checkpoint** - approved (no commit — visual gate only)

## Files Created/Modified

- `TheCook/components/ui/recipe-card-grid.tsx` - Added userEquipment prop, hasMissingEquipment computation, amber badge in metaRow, badge styles
- `TheCook/components/ui/recipe-card-row.tsx` - Same badge pattern applied to row card meta area
- `TheCook/app/(tabs)/index.tsx` - Passes profile.equipment to getAllRecipesForFeed and RecipeCardGrid
- `TheCook/app/(tabs)/search.tsx` - Passes profile.equipment to getAllRecipesForSearch, RecipeCardGrid (results), RecipeCardRow (recently-viewed)
- `TheCook/app/(tabs)/my-kitchen.tsx` - Added equipment to batch SELECT and ordered map; passes profile.equipment to RecipeCardGrid

## Decisions Made

- Badge logic uses `.some()` (at least one missing) while sort in Plan 02 uses `.every()` (fully compatible) — both are correct for their respective intents
- My Kitchen does not sort saved recipes by equipment compatibility — bookmark recency order is the intended UX; badge informs without reordering
- `userEquipment` prop is optional with `default []` — prevents runtime errors when profile loads asynchronously on mount

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Phase 6 is complete. All three plans delivered:
- Plan 01: equipment field on RecipeListItem and DiscoveryFilterSchema
- Plan 02: sortByEquipmentCompatibility wired into fetch functions
- Plan 03: visual badge on all discovery surfaces, confirmed by user

v1.0 milestone is ready for final audit/submission.

---
*Phase: 06-equipment-discovery-wiring*
*Completed: 2026-03-14*
