---
phase: 06-equipment-discovery-wiring
plan: "01"
subsystem: types, db, tests
tags: [tdd, equipment, discovery, types, schema]
dependency_graph:
  requires: []
  provides:
    - DiscoveryFilterSchema with equipment field
    - RecipeListItemSchema with equipment field
    - RecipeRow with equipment column
    - SELECT_LIST_COLUMNS includes equipment
    - mapRowToRecipeListItem parses equipment
    - 5 equipment-filter test stubs (1 RED, 4 pass)
  affects:
    - TheCook/src/types/discovery.ts
    - TheCook/src/db/recipes.ts
    - TheCook/__tests__/equipment-filter.test.ts
    - TheCook/app/(tabs)/index.tsx
    - TheCook/app/(tabs)/my-kitchen.tsx
tech_stack:
  added: []
  patterns:
    - TDD RED phase — failing stubs before implementation
    - z.array(EquipmentEnum).default([]) for filter field (Zod v4 pattern)
    - JSON.parse(row.equipment ?? "[]") for DB row mapping
key_files:
  created:
    - TheCook/__tests__/equipment-filter.test.ts
  modified:
    - TheCook/src/types/discovery.ts
    - TheCook/src/db/recipes.ts
    - TheCook/app/(tabs)/index.tsx
    - TheCook/app/(tabs)/my-kitchen.tsx
decisions:
  - EquipmentEnum imported from recipe.ts into discovery.ts (not redeclared)
  - RecipeListItemSchema uses z.array(z.string()) for equipment (raw string array, same pattern as allergens)
  - DiscoveryFilterSchema uses z.array(EquipmentEnum).default([]) for equipment filter
  - my-kitchen.tsx inline SELECT updated alongside central SELECT_LIST_COLUMNS (cascade fix)
metrics:
  duration: "3 minutes"
  completed_date: "2026-03-14"
  tasks_completed: 2
  files_modified: 5
---

# Phase 6 Plan 01: Equipment Type Foundation and Test Stubs Summary

Type and test foundation for equipment-awareness: added equipment fields to DiscoveryFilterSchema, RecipeListItemSchema, and DB row select/parse path; wrote 5 failing test stubs covering all ONBRD-03 behaviors.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write failing equipment-filter test stubs (RED) | 08bf9c2 | TheCook/__tests__/equipment-filter.test.ts |
| 2 | Extend type contracts | e9a3089 | src/types/discovery.ts, src/db/recipes.ts, app/(tabs)/index.tsx, app/(tabs)/my-kitchen.tsx |

## Test Results

| Test | Name | Status |
|------|------|--------|
| 1 | Equipment de-prioritization | RED (expected — sort not yet wired) |
| 2 | Equipment indicator logic | GREEN (pure logic) |
| 3 | Vacuous truth — empty equipment | GREEN (pure logic) |
| 4 | Empty filter.equipment — no sort applied | GREEN (no-op behavior correct) |
| 5 | Compose with allergens | GREEN (SQL-side exclusion simulated by mock) |

## Verification

- `npx jest --testPathPattern="equipment-filter"` — 1 fail (Test 1 RED), 4 pass
- `npx jest --no-coverage` — 1 fail (only expected RED), 92 pass, 13 todo
- `npx tsc --noEmit` — clean (0 errors)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] my-kitchen.tsx cascade TypeScript error**
- **Found during:** Task 2
- **Issue:** my-kitchen.tsx has an inline SELECT query and RecipeListItem mapping that did not include the `equipment` column. Adding `equipment` to RecipeListItemSchema caused a TypeScript type mismatch.
- **Fix:** Added `equipment: string` to the inline row type, added `equipment` to the SELECT column list, and added `equipment: JSON.parse(row.equipment ?? '[]')` to the mapping.
- **Files modified:** TheCook/app/(tabs)/my-kitchen.tsx
- **Commit:** e9a3089

## Self-Check: PASSED

- TheCook/__tests__/equipment-filter.test.ts: FOUND
- .planning/phases/06-equipment-discovery-wiring/06-01-SUMMARY.md: FOUND
- Commit 08bf9c2: FOUND
- Commit e9a3089: FOUND
