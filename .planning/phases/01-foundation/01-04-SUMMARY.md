---
phase: 01-foundation
plan: "04"
subsystem: content-pipeline
tags: [yaml, zod, typescript, jest, tdd, tsx, recipe-content]

# Dependency graph
requires:
  - phase: 01-foundation plan 02
    provides: Zod v4 RecipeSchema as single source of truth for recipe data shape

provides:
  - validate-recipes.ts CLI that reads content/recipes/*.yaml, validates with Zod RecipeSchema, prints human-readable errors per field
  - build-recipes.ts CLI that converts YAML to app/assets/recipes.json, aborts on invalid recipe (never writes partial output)
  - Three real Turkish test recipes validating cleanly against RecipeSchema with 0 schema changes needed
  - menemen.yaml: beginner kahvalti, single ingredientGroup (label null), egg+dairy allergens
  - mercimek-corbasi.yaml: beginner corba, blender equipment confirmed, no allergens
  - borek.yaml: intermediate aperatif, 2 ingredientGroups (Hamur icin + Ic icin), gluten+egg+dairy allergens
  - app/assets/recipes.json: compiled seed data with all 3 recipes
  - Full test suite for both CLI scripts (5 tests) confirming exit codes and output

affects:
  - 01-03 (SQLite seed — recipes.json provides seed data for DB population)
  - Phase 3 (content authoring — schema is now confirmed stable for Hira to write recipes)
  - Phase 5 (timerSeconds values set on timed steps, confirming step timer UI data is available)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CLI scripts use --dir and --out flags for testability against temp directories
    - spawnSync with shell:true for Windows-compatible subprocess test execution
    - YAML block scalars (>-) to avoid colon-in-string parse errors in recipe instructions
    - RecipeSchema.safeParse() + issue.path.join(" > ") for structured, human-readable validation errors
    - process.exit(0)/process.exit(1) contract: scripts are composable build steps

key-files:
  created:
    - TheCook/scripts/validate-recipes.ts
    - TheCook/scripts/build-recipes.ts
    - TheCook/content/recipes/menemen.yaml
    - TheCook/content/recipes/mercimek-corbasi.yaml
    - TheCook/content/recipes/borek.yaml
    - TheCook/app/assets/recipes.json
  modified:
    - TheCook/__tests__/validator.test.ts
    - TheCook/__tests__/buildScript.test.ts

key-decisions:
  - "YAML block scalars (>-) used for step instructions containing colons — avoids BLOCK_AS_IMPLICIT_KEY parse errors in yaml package"
  - "spawnSync with shell:true required on Windows for npx to resolve in subprocess tests"
  - "borek.yaml uses two ingredientGroups with Turkish labels (Hamur icin, Ic icin) — multi-group schema confirmed working"
  - "build-recipes.ts never writes partial output — process.exit(1) before writeFileSync if any recipe fails validation"

patterns-established:
  - "Content authoring workflow: write YAML -> npm run validate-recipes -> npm run build-recipes -> JSON compiled automatically"
  - "Script testability: --dir and --out flags allow any temp directory for isolated test environments"
  - "Schema stability test: all 3 recipes validated without adding any field to RecipeSchema"

requirements-completed: [CONT-02]

# Metrics
duration: 35min
completed: 2026-03-09
---

# Phase 1 Plan 04: Content Authoring Pipeline Summary

**Validator CLI + build script converting Turkish YAML recipes to JSON, with three real test recipes (menemen, mercimek corbasi, borek) confirming Zod RecipeSchema stability — 0 schema changes needed across all three**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-03-09T00:00:00Z
- **Completed:** 2026-03-09
- **Tasks:** 2 (TDD RED + GREEN + recipe authoring)
- **Files modified:** 8

## Accomplishments
- validate-recipes.ts CLI exits 0 on valid YAML, exits 1 on invalid YAML, prints human-readable field path errors (e.g. `Field "steps > 0 > why": Required`)
- build-recipes.ts CLI converts all YAML to app/assets/recipes.json, aborts on first invalid recipe with no partial write
- Three authentic Turkish recipes validate cleanly against RecipeSchema — schema stability confirmed for Phase 3
- Börek confirmed 2 ingredientGroups (Hamur için + İç için), proving multi-group schema works end-to-end
- Mercimek çorbası confirmed blender in equipment array, proving EquipmentEnum range is sufficient
- All 21 tests pass (schema.test.ts: 12, seed.test.ts: 4, validator.test.ts: 3, buildScript.test.ts: 2)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Write failing CLI script tests** - `322fed6` (test)
2. **Task 1 GREEN: Implement validate-recipes and build-recipes scripts** - `b9ff686` (feat)
3. **Task 2: Author three real test recipes and compile recipes.json** - `78ead61` (feat)

## Files Created/Modified
- `TheCook/scripts/validate-recipes.ts` - Reads content/recipes/*.yaml, validates each with RecipeSchema.safeParse, prints per-field errors, exits 0/1
- `TheCook/scripts/build-recipes.ts` - Same validation flow, writes app/assets/recipes.json only if all recipes pass; aborts without partial write
- `TheCook/__tests__/validator.test.ts` - 3 tests: exits 0 on valid, exits 1 on invalid, prints field path in error output
- `TheCook/__tests__/buildScript.test.ts` - 2 tests: produces recipes.json with correct content, aborts on invalid without writing partial output
- `TheCook/content/recipes/menemen.yaml` - Turkish scrambled eggs with tomatoes and peppers; beginner, kahvalti, egg+dairy allergens
- `TheCook/content/recipes/mercimek-corbasi.yaml` - Red lentil soup; beginner, corba, blender equipment, no allergens
- `TheCook/content/recipes/borek.yaml` - Layered pastry; intermediate, aperatif, 2 ingredientGroups (Hamur icin + Ic icin), firin
- `TheCook/app/assets/recipes.json` - Compiled JSON array of 3 parsed recipes (borek, menemen, mercimek-corbasi)

## Decisions Made
- Used YAML block scalars (`>-`) for step instructions containing colons followed by spaces. The `yaml` package throws `BLOCK_AS_IMPLICIT_KEY` errors when unquoted values in block sequences contain `: ` patterns. Block scalars are cleaner than quoting every instruction string.
- Used `spawnSync` with `shell: true` for Windows compatibility. Without `shell: true`, `npx` cannot be found as a command on Windows since it is a `.cmd` file, causing `spawnSync` to return `status: null` (killed by signal).
- Börek recipe uses genuine Turkish labels for ingredientGroups (`Hamur için` and `İç için`) to confirm that Turkish characters parse correctly in labels, not just values.
- `build-recipes.ts` performs a full validation pass before any write — collects all recipes into memory first, then writes once. This ensures `recipes.json` is never left in a partially-written state.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed YAML parse error in borek.yaml for colon-in-instruction strings**
- **Found during:** Task 2 (authoring recipes)
- **Issue:** YAML package threw `BLOCK_AS_IMPLICIT_KEY` error at line 59 of the initial borek.yaml. The instruction string `İç harcı hazırlayın: peyniri...` contained `: ` (colon + space) which the YAML parser interpreted as a nested mapping key in compact mapping context.
- **Fix:** Rewrote the two affected step instructions using YAML block scalar syntax (`>-`) which folds multi-line text and avoids compact mapping ambiguity. No schema changes made.
- **Files modified:** TheCook/content/recipes/borek.yaml
- **Verification:** `npm run validate-recipes` exits 0 on all three recipes
- **Committed in:** `78ead61` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed spawnSync returning null status on Windows**
- **Found during:** Task 1 GREEN (running tests)
- **Issue:** Tests were failing with `status: null` (signal termination) because `spawnSync('npx', ...)` without `shell: true` cannot find `npx.cmd` on Windows PATH. The child process was terminated by a signal before exiting normally.
- **Fix:** Added `shell: true` and `timeout: 30000` to all `spawnSync` calls in both test files.
- **Files modified:** TheCook/__tests__/validator.test.ts, TheCook/__tests__/buildScript.test.ts
- **Verification:** All 5 CLI tests pass with correct exit codes (0 and 1)
- **Committed in:** `322fed6` and `b9ff686` (Task 1 commits)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes were required for the plan to function on Windows. No scope creep — fixes are infrastructure-only and don't change script behavior.

## Issues Encountered
- YAML `yaml` package v2.x strictly enforces block mapping rules. The `: ` pattern in unquoted flow scalars within block sequences is rejected as `BLOCK_AS_IMPLICIT_KEY`. Solution: use block scalars (`>-`) for long instruction strings. This is now a documented pattern for all future recipe authoring.
- Windows path resolution for `npx` requires `shell: true` in `spawnSync`. This is a Windows-specific constraint (npx is a `.cmd` file), not a cross-platform issue. Documented in test files with comments.

## User Setup Required
None - no external service configuration required. All commands run locally with `npm run validate-recipes` and `npm run build-recipes`.

## Next Phase Readiness
- RecipeSchema is confirmed stable: 0 field changes needed to accommodate 3 real recipes spanning beginner to intermediate, single-group to multi-group, 0 to 3 allergens
- Hira can author new recipes by writing YAML files to content/recipes/ and running `npm run validate-recipes` for immediate feedback
- app/assets/recipes.json is populated and ready for Phase 1 Plan 03 SQLite seed ingestion
- Phase 3 content authoring can begin with confidence that the schema will not require migration

## Self-Check: PASSED

All expected files confirmed:
- `TheCook/scripts/validate-recipes.ts` - FOUND
- `TheCook/scripts/build-recipes.ts` - FOUND
- `TheCook/content/recipes/menemen.yaml` - FOUND
- `TheCook/content/recipes/mercimek-corbasi.yaml` - FOUND
- `TheCook/content/recipes/borek.yaml` - FOUND
- `TheCook/app/assets/recipes.json` - FOUND (3 recipes, borek has 2 ingredientGroups)
- `.planning/phases/01-foundation/01-04-SUMMARY.md` - FOUND

All commits confirmed:
- `322fed6` test(01-04): add failing CLI script tests - FOUND
- `b9ff686` feat(01-04): implement validate-recipes and build-recipes scripts - FOUND
- `78ead61` feat(01-04): author three real Turkish test recipes and compile recipes.json - FOUND

---
*Phase: 01-foundation*
*Completed: 2026-03-09*
