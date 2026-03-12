---
phase: 04-recipe-discovery
plan: "01"
subsystem: database
tags: [sqlite, migration, jest, tdd, flash-list, expo-linear-gradient, async-storage]

# Dependency graph
requires:
  - phase: 03-content-library
    provides: "recipes.json seeded into SQLite DB at DB_VERSION=2"
  - phase: 02-profile-and-auth
    provides: "bookmarks and profile tables at DB_VERSION=2"
provides:
  - "DB_VERSION=3 migration with recent_views table"
  - "Failing discovery test stubs (RED) covering allergen exclusion, feed ordering, category filter, ingredient search, bookmark roundtrip"
  - "src/db/recipes.ts stub for Plans 04-02 and 04-03 to implement"
  - "Phase 4 dependency packages: @shopify/flash-list, expo-linear-gradient, @react-native-async-storage/async-storage"
affects:
  - 04-recipe-discovery plans 02 through 05 (GREEN targets defined here)

# Tech tracking
tech-stack:
  added:
    - "@shopify/flash-list 2.0.2 — virtualized list for recipe feed performance"
    - "expo-linear-gradient ~15.0.8 — gradient overlays for recipe cards"
    - "@react-native-async-storage/async-storage 2.2.0 — persistent key-value store"
  patterns:
    - "mock DB pattern (createMockDb) for pure SQLite migration unit tests (established in 02-03)"
    - "jest.mock with stub factory for modules that don't exist yet — allows RED test creation ahead of implementation"
    - "src/db/recipes.ts stub as compilation target — exports real signatures, throws at runtime"

key-files:
  created:
    - "TheCook/__tests__/discovery.test.ts — 6 describe blocks, 11 failing tests, 13 it.todo stubs"
    - "TheCook/src/db/recipes.ts — stub module with correct signatures; throws 'not implemented'"
  modified:
    - "TheCook/src/db/client.ts — DB_VERSION bumped 2→3; recent_views migration added"
    - "TheCook/__tests__/migration.test.ts — updated for DB_VERSION 3; added recent_views tests"

key-decisions:
  - "recent_views table has no index — max 10 rows enforced by application layer (trim on insert), full-table scan negligible"
  - "src/db/recipes.ts stub created with real TypeScript signatures so test imports compile cleanly — avoids virtual module hack"
  - "jest.mock factory pattern used with mocked rejected values — all concrete tests call functions and expect specific results, ensuring RED state even after stub module exists"

patterns-established:
  - "Stub module pattern: create real .ts file with correct signatures that throws 'not implemented' — enables jest.mock resolution without virtual modules"
  - "TDD wave structure: Plan 01 creates RED stubs, Plans 02/03 implement GREEN, Plan 04 adds UI layer"

requirements-completed:
  - DISC-01
  - DISC-02
  - DISC-03
  - DISC-05

# Metrics
duration: 3min
completed: 2026-03-12
---

# Phase 4 Plan 01: Recipe Discovery Foundation Summary

**SQLite DB_VERSION bumped to 3 with recent_views table; failing discovery test stubs created for all 5 DISC requirements using stub module pattern**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-12T17:37:45Z
- **Completed:** 2026-03-12T17:40:47Z
- **Tasks:** 2
- **Files modified:** 4 (created 2, modified 2)

## Accomplishments

- Installed all three Phase 4 dependency packages via `npx expo install`
- Bumped DB_VERSION from 2 to 3 with `CREATE TABLE IF NOT EXISTS recent_views` migration block
- Created `__tests__/discovery.test.ts` with 6 describe blocks covering all 4 DISC requirements (11 concrete failing tests + 13 `it.todo` stubs)
- Updated migration.test.ts to reflect DB_VERSION 3 (added 2 new tests for recent_views creation)
- All 52 pre-existing tests remain GREEN; 11 discovery tests are RED as required

## Task Commits

Each task was committed atomically:

1. **Task 1: Install new packages + bump DB to version 3** - `fb03f45` (feat)
2. **Task 2: Create failing discovery test stubs** - `2092385` (test)

## Files Created/Modified

- `TheCook/src/db/client.ts` — DB_VERSION 2→3, added `if (currentVersion < 3)` migration for recent_views
- `TheCook/__tests__/migration.test.ts` — Updated describe block title and idempotency test for version 3; added 2 new tests for recent_views
- `TheCook/__tests__/discovery.test.ts` — 6 describe blocks (allergen exclusion, feed ordering, category filter, ingredient search AND/fallback, bookmark roundtrip); all RED
- `TheCook/src/db/recipes.ts` — Stub module with correct TypeScript function signatures; all throw "not implemented"
- `TheCook/package.json` + `package-lock.json` — @shopify/flash-list, expo-linear-gradient, @react-native-async-storage/async-storage added

## Decisions Made

- `recent_views` table has no index — at most 10 rows (enforced by application-layer DELETE trim on insert), full-table scan is negligible overhead
- Created real `src/db/recipes.ts` stub file with correct TypeScript signatures rather than using a virtual module factory in jest.mock — this avoids Jest resolver errors when the module path doesn't exist on disk
- Concrete failing tests use `mockRejectedValue(new Error("not implemented"))` rather than `mockReturnValue` — ensures tests fail with a clear error message rather than silently passing with wrong types

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created src/db/recipes.ts stub to resolve jest.mock module resolution failure**
- **Found during:** Task 2 (Create failing discovery test stubs)
- **Issue:** `jest.mock("../src/db/recipes", ...)` failed with "Cannot find module" because Jest's resolver requires the module to exist on disk even with a factory function
- **Fix:** Created `TheCook/src/db/recipes.ts` with correct TypeScript function signatures (matching what Plans 04-02/03 will implement), all throwing "not implemented"
- **Files modified:** TheCook/src/db/recipes.ts (new file)
- **Verification:** `npx jest --testPathPattern=discovery` runs; 11 tests fail RED with "not implemented" errors
- **Committed in:** `2092385` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix required for test suite to load. The stub module is a natural deliverable for this wave (Plans 02/03 will fill it in). No scope creep.

## Issues Encountered

None beyond the jest.mock module resolution issue documented above.

## Next Phase Readiness

- DB_VERSION=3 migration ready — any device upgrading from v2 will get recent_views table automatically
- `discovery.test.ts` provides GREEN targets for Plans 04-02 (feed/filter/search logic) and 04-03 (bookmark CRUD)
- `src/db/recipes.ts` stub exports correct function signatures — Plans 02/03 replace the throw bodies with real SQL queries
- All Phase 4 UI packages installed and available

---
*Phase: 04-recipe-discovery*
*Completed: 2026-03-12*

## Self-Check: PASSED

All created files verified on disk. Both task commits (fb03f45, 2092385) verified in git log.
