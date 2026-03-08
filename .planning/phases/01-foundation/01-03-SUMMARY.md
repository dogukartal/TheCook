---
phase: 01-foundation
plan: "03"
subsystem: database
tags: [sqlite, expo-sqlite, migration, seeding, tdd, react-native]

# Dependency graph
requires:
  - phase: 01-foundation plan 02
    provides: Recipe type from src/types/recipe.ts (used in seed.ts INSERT loop)
provides:
  - migrateDb: SQLiteDatabase migration using PRAGMA user_version, creates recipes + seed_version tables
  - seedIfNeeded: version-gated, transactional seeding from bundled recipes.json
  - SQLiteProvider root layout wiring (migrateDb + seedIfNeeded in onInit)
  - app/assets/recipes.json empty placeholder for Plan 04's build script
affects:
  - 01-04 (content pipeline — build script writes to app/assets/recipes.json which seed.ts reads)
  - Phase 2 (all browse/filter screens use recipes table with skill_level and category indexes)
  - Phase 3 (recipe detail screen reads from recipes table)
  - Phase 4 (ingredient search — planned recipe_ingredients normalized table via DB_VERSION bump)
  - Phase 5 (step timer — timerSeconds column read from steps JSON blob)

# Tech tracking
tech-stack:
  added:
    - expo-sqlite v2 (SQLiteProvider, useSQLiteContext, SQLiteDatabase — SDK 52 API only)
  patterns:
    - PRAGMA user_version for schema migration versioning (DB_VERSION = 1)
    - WAL journal mode enabled at migration time for write performance
    - seed_version sentinel row (id=1) guards against re-seeding on app restart
    - withTransactionAsync wraps all seed INSERTs for atomicity and performance
    - require() for bundled JSON asset (Metro handles static require at build time)

key-files:
  created:
    - TheCook/src/db/client.ts
    - TheCook/src/db/seed.ts
    - TheCook/src/db/schema.sql
    - TheCook/app/assets/recipes.json
  modified:
    - TheCook/__tests__/seed.test.ts
    - TheCook/app/_layout.tsx

key-decisions:
  - "expo-sqlite v2 API used exclusively — SQLiteProvider + useSQLiteContext, never deprecated openDatabase()"
  - "PRAGMA user_version used for migration versioning (not a custom versions table) — idiomatic SQLite approach"
  - "seed_version sentinel row (id=1) checked before every app launch — prevents data loss on restart"
  - "All seed INSERTs wrapped in withTransactionAsync — single transaction for atomicity and ~10x insert speed"
  - "recipes.json loaded via require() — Metro static bundling, no runtime file I/O, works offline"
  - "ThemeProvider and StatusBar removed from _layout.tsx — SQLiteProvider is the root wrapper now"

# Metrics
duration: 10min
completed: 2026-03-09
---

# Phase 1 Plan 03: SQLite Migration and Seeding Summary

**SQLite database layer with PRAGMA user_version migration, version-gated transactional seeding from bundled JSON, and SQLiteProvider root layout — all 4 seed tests passing GREEN**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-08T21:32:00Z
- **Completed:** 2026-03-08T21:42:00Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files created/modified:** 6

## Accomplishments

- `src/db/client.ts`: `migrateDb()` creates recipes and seed_version tables with WAL mode and skill_level/category indexes via PRAGMA user_version versioning
- `src/db/seed.ts`: `seedIfNeeded()` checks seed_version before seeding, wraps all INSERTs in `withTransactionAsync` for atomicity
- `src/db/schema.sql`: human-readable DDL reference with column purpose comments and Phase 4 planned recipe_ingredients note
- `app/_layout.tsx`: SQLiteProvider wraps Stack navigator, `onInit` chains `migrateDb` → `seedIfNeeded`
- `app/assets/recipes.json`: empty array `[]` placeholder ready for Plan 04's build script to populate
- All 4 seed tests passing: seeds on first launch, skips on version match, uses transaction, inserts seed_version

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing seed tests (RED)** - `1b8281c` (test)
2. **Task 2: Implement migration, seeding, root layout wiring (GREEN)** - `1a5b4fd` (feat)

## Files Created/Modified

- `TheCook/src/db/client.ts` - migrateDb: PRAGMA user_version, WAL mode, DDL for recipes + seed_version + indexes
- `TheCook/src/db/seed.ts` - seedIfNeeded: version check, withTransactionAsync, Recipe[] INSERT loop
- `TheCook/src/db/schema.sql` - Human-readable DDL reference (not executed at runtime)
- `TheCook/app/assets/recipes.json` - Empty array placeholder (Plan 04 populates)
- `TheCook/__tests__/seed.test.ts` - 4 tests replacing Wave 0 it.todo stubs
- `TheCook/app/_layout.tsx` - SQLiteProvider root wrap replacing ThemeProvider (navigation-only layout)

## Decisions Made

- expo-sqlite v2 API only — `SQLiteProvider`, `useSQLiteContext`, `SQLiteDatabase`. The deprecated v1 `openDatabase()` is not used anywhere.
- `PRAGMA user_version` for migration versioning — idiomatic SQLite, avoids a separate migrations table.
- Seed version guard (`seed_version` table, id=1 sentinel row) — checked on every launch, returns early if `version === SEED_VERSION`. No re-seeding on restart, no data loss.
- `withTransactionAsync` wraps all seed INSERTs — single transaction gives both atomicity (all-or-nothing) and ~10x insert performance vs. individual auto-commits.
- `require("../../app/assets/recipes.json")` — Metro bundles the JSON at build time; no runtime file system access needed, works fully offline.
- `ThemeProvider` and `StatusBar` removed from `_layout.tsx` — SQLiteProvider is the sole root wrapper. Navigation theming can be re-added in a later phase if needed.

## Deviations from Plan

None — plan executed exactly as written. TDD RED/GREEN cycle followed, all 4 tests pass, TypeScript clean.

## Issues Encountered

- `validator.test.ts` and `buildScript.test.ts` fail in the full test suite — these are pre-existing Plan 04 wave tests for CLI scripts that do not exist yet. Out of scope per deviation scope boundary rule. Documented in deferred-items below.

## Deferred Items

- `__tests__/validator.test.ts` and `__tests__/buildScript.test.ts`: 5 failing tests for Plan 04 validate-recipes and build-recipes CLI scripts. Pre-existing failures, not caused by this plan's changes. Will be resolved in Plan 04.

## User Setup Required

None — all changes are local code. No external services or environment variables required.

## Next Phase Readiness

- `migrateDb` and `seedIfNeeded` are ready to be called in production by `SQLiteProvider`
- `app/assets/recipes.json` placeholder is in place — Plan 04's build script just needs to overwrite it with validated recipe data
- `useSQLiteContext()` hook available to all child screens — Phase 2 browse/filter screens can start querying

---

## Self-Check: PASSED

- `TheCook/src/db/client.ts` - FOUND
- `TheCook/src/db/seed.ts` - FOUND
- `TheCook/src/db/schema.sql` - FOUND
- `TheCook/app/assets/recipes.json` - FOUND
- `TheCook/__tests__/seed.test.ts` - FOUND (modified)
- `TheCook/app/_layout.tsx` - FOUND (modified)
- Commit `1b8281c` - FOUND
- Commit `1a5b4fd` - FOUND

---
*Phase: 01-foundation*
*Completed: 2026-03-09*
