---
phase: 01-foundation
plan: "02"
subsystem: schema
tags: [zod, typescript, recipe-schema, jest, tdd]

# Dependency graph
requires:
  - phase: 01-foundation plan 01
    provides: Expo Router project with jest-expo, zod installed, placeholder recipe.ts
provides:
  - Zod v4 RecipeSchema as single source of truth for recipe data shape
  - All 6 locked enums: UnitEnum (9 values), AllergenTagEnum (14 EU), EquipmentEnum (13), CategoryEnum (6), MealTypeEnum (4), SkillLevelEnum (3)
  - StepSchema with 5 CONT-02 required fields (instruction, why, looksLikeWhenDone, commonMistake, recovery)
  - IngredientGroupSchema enforcing ingredientGroups structure (no flat ingredients[])
  - TypeScript types derived via z.infer (Recipe, RecipeStep, Ingredient, IngredientGroup, Unit, AllergenTag, Equipment, etc.)
  - 12 passing schema validation tests in __tests__/schema.test.ts
  - jest/setup.ts fix for jest 30 + jest-expo 55 lazy global teardown incompatibility
affects:
  - 01-03 (SQLite seed — imports RecipeSchema for type safety in DB operations)
  - 01-04 (Content pipeline — imports RecipeSchema for YAML validation)
  - All Phase 2 user profile (EquipmentEnum must match equipment values)
  - Phase 3 (content authoring uses exact schema shape)
  - Phase 4 (AllergenTagEnum enables closed-enum allergen filtering)
  - Phase 5 (timerSeconds on StepSchema enables step timer UI)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD RED/GREEN cycle: failing tests first, then implementation
    - Zod as single source of truth: z.infer<typeof Schema> for all TypeScript types (no separate interfaces)
    - z.enum([...]) exclusively (no TypeScript enum keyword, no z.nativeEnum per Zod v4)
    - Nullable with default: z.string().nullable().default(null) for optional image fields
    - jest setupFilesAfterEnv for test environment compatibility fixes

key-files:
  created:
    - TheCook/jest/setup.ts
  modified:
    - TheCook/src/types/recipe.ts
    - TheCook/__tests__/schema.test.ts
    - TheCook/package.json

key-decisions:
  - "Zod v4 z.enum([...]) used exclusively — no TypeScript enum keyword, no z.nativeEnum (removed in Zod v4)"
  - "TypeScript types derived via z.infer<typeof Schema> — no duplicate interface definitions"
  - "totalTime field omitted from RecipeSchema — derived at runtime as prepTime + cookTime, never stored"
  - "timerSeconds: z.number().int().positive().nullable().default(null) — positive() ensures non-zero timers, null means no timer"
  - "jest/setup.ts added to fix jest 30 + jest-expo 55 incompatibility: expo lazy globals (TextDecoder, URL, __ExpoImportMetaRegistry, structuredClone) must be force-resolved in setupFilesAfterEnv before isInsideTestCode is set to false by leaveTestCode()"

patterns-established:
  - "Schema-first: all recipe data flows through RecipeSchema.safeParse() — never raw objects"
  - "Closed enums for filterable dimensions (allergens, equipment) — free strings deferred to Phase 4 would be expensive migration"
  - "ingredientGroups required (never flat ingredients[]) — locked permanently before content authoring"

requirements-completed: [CONT-02]

# Metrics
duration: 27min
completed: 2026-03-09
---

# Phase 1 Plan 02: Recipe Schema Definition Summary

**Zod v4 RecipeSchema with 6 locked enums, 5-field StepSchema (CONT-02), ingredientGroups structure, and 12 passing schema validation tests — permanent data contract before content authoring begins**

## Performance

- **Duration:** ~27 min
- **Started:** 2026-03-08T21:02:48Z
- **Completed:** 2026-03-08T21:30:21Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 4 (recipe.ts, schema.test.ts, package.json, jest/setup.ts)

## Accomplishments
- RecipeSchema is the single source of truth: all 6 enums locked, StepSchema with 5 CONT-02 required fields, ingredientGroups enforced
- 12 schema validation tests passing: valid recipes accept, invalid units/allergens/equipment/steps reject
- AllergenTagEnum uses closed EU-14 list — enables reliable Phase 4 allergen filtering without migration
- Fixed jest 30 + jest-expo 55 lazy global teardown incompatibility (blocked all real `it()` tests from running)
- TypeScript strict mode passes `npx tsc --noEmit` with full schema

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing schema tests (RED)** - `fe4fc55` (test)
2. **Task 2: Implement RecipeSchema and make tests GREEN** - `5beb20e` (feat)

## Files Created/Modified
- `TheCook/src/types/recipe.ts` - Full Zod schema implementation (replaces Wave 0 placeholder)
- `TheCook/__tests__/schema.test.ts` - 12 schema validation tests with validMenemen fixture
- `TheCook/package.json` - Added setupFilesAfterEnv config
- `TheCook/jest/setup.ts` - Forces expo lazy globals to resolve before test teardown

## Decisions Made
- Used `z.enum([...])` exclusively — Zod v4 removed `z.nativeEnum`. No TypeScript `enum` keyword used anywhere.
- `totalTime` omitted from RecipeSchema — it's a derived value (`prepTime + cookTime`), storing it would create a consistency hazard.
- `timerSeconds` uses `.positive().nullable()` — this ensures stored timers are non-zero (null = no timer), preventing accidentally storing 0-second timers.
- EquipmentEnum includes 13 values: 6 locked from CONTEXT.md (must match Phase 2 user profile exactly) + 7 additional common kitchen equipment values.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed jest 30 + jest-expo 55 lazy global teardown incompatibility**
- **Found during:** Task 1 (Writing failing tests)
- **Issue:** Any new test file with real `it()` tests (not `it.todo()`) failed with "You are trying to import a file outside of the scope of the test code." Root cause: jest-expo installs expo globals as lazy enumerable getters on `envGlobal`. After a test runs, jest-circus calls `leaveTestCode()` setting `isInsideTestCode = false`. Then `Runtime.teardown()` calls `resetModules()` which iterates `Object.keys(envGlobal)`, triggering the lazy getters. These attempt `require()` calls that fail because `isInsideTestCode === false`.
- **Fix:** Created `jest/setup.ts` (added to `setupFilesAfterEnv`) that forces all expo lazy globals (TextDecoder, TextDecoderStream, TextEncoderStream, URL, URLSearchParams, __ExpoImportMetaRegistry, structuredClone) to resolve during setup (when `isInsideTestCode === undefined`). After resolution, the lazy getters are replaced with concrete values, so `Object.keys` at teardown no longer triggers require() calls.
- **Files modified:** `TheCook/jest/setup.ts` (created), `TheCook/package.json` (added setupFilesAfterEnv)
- **Verification:** All 12 schema tests pass, all 4 test files (schema, seed, validator, buildScript) pass together
- **Committed in:** `fe4fc55` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Fix was required for any real test execution in this project. Without it, the entire test suite would be limited to `it.todo()` stubs. No scope creep — the fix is infrastructure-only and doesn't change the schema behavior.

## Issues Encountered
- jest 30 + jest-expo 55 combination has a bug where `Object.keys(envGlobal)` at teardown triggers expo's lazy global getters after `leaveTestCode()`. This only affects `it()` tests (not `it.todo()`), so it was invisible until Plan 02 replaced the stubs with real assertions. Resolved with `setupFilesAfterEnv` forcing early resolution.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- RecipeSchema is locked and ready to import from Plans 03 (SQLite seed) and 04 (content pipeline)
- All 12 schema tests pass, tsc --noEmit exits 0
- EquipmentEnum values must be kept in sync with Phase 2 user profile equipment settings
- Schema should be validated against 2-3 real test recipes before Phase 3 content authoring begins (blocker documented in STATE.md)

---
*Phase: 01-foundation*
*Completed: 2026-03-09*
