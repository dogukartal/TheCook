---
phase: 02-profile-and-auth
plan: "01"
subsystem: deps-and-test-stubs
tags: [supabase, google-signin, apple-auth, tdd, test-stubs, dependencies]

# Dependency graph
requires: []
provides:
  - "5 Phase 2 packages installed via expo install with SDK-compatible versions"
  - ".env.local placeholder file with 4 required env var keys"
  - "sync.test.ts failing stub covering AUTH-02 and AUTH-03 (cloud-wins, sign-out preservation)"
  - "profile.test.ts covering ONBRD-01, ONBRD-02, ONBRD-03 (pre-existing, passing)"
  - "migration.test.ts covering AUTH-01 (pre-existing, passing)"
affects:
  - "02-04 (Supabase client — imports from src/auth/supabase which sync.test.ts stubs target)"
  - "02-05 and 02-06 (Google/Apple auth — @react-native-google-signin/google-signin installed)"

# Tech tracking
tech-stack:
  added:
    - "@supabase/supabase-js ^2.99.0 — Supabase JS SDK for auth and cloud sync"
    - "expo-apple-authentication ~8.0.8 — Apple Sign In for iOS"
    - "expo-crypto ~15.0.8 — Crypto utilities for Supabase session storage"
    - "react-native-url-polyfill ^3.0.0 — URL API polyfill required by Supabase JS SDK"
    - "@react-native-google-signin/google-signin ^16.1.2 — Google Sign In with config plugin"
  patterns:
    - "expo install used exclusively (not npm install) to get SDK 54 compatible versions"
    - "TDD stub pattern: import non-existent module to get 'Cannot find module' failure — not expect(true).toBe(false)"
    - "sync tests mock src/auth/supabase inline via jest.mock() — no live Supabase connection needed"

key-files:
  created:
    - "TheCook/TheCook/__tests__/sync.test.ts — failing stubs for AUTH-02 (cloud-wins) and AUTH-03 (sign-out preserves local)"
    - "TheCook/TheCook/.env.local — placeholder env vars (gitignored via .env*.local pattern)"
  modified:
    - "TheCook/TheCook/package.json — 5 new dependencies added"
    - "TheCook/TheCook/package-lock.json — lockfile updated"
    - "TheCook/TheCook/app.json — @react-native-google-signin/google-signin plugin added by expo install"

key-decisions:
  - "profile.test.ts and migration.test.ts already existed and passed — plan stubs already implemented ahead of schedule via commits b8b2daa, c27f5d7, f27dc67"
  - "sync.test.ts created as only new stub — targets src/auth/supabase (missing) and src/db/profile (missing), failing with Cannot find module"
  - "All 44 existing tests continue to pass; sync.test.ts fails as expected (module-not-found)"

# Metrics
duration: 4 minutes
completed: 2026-03-10
---

# Phase 2 Plan 01: Deps and Test Stubs Summary

**5 Phase 2 dependencies installed via `expo install`; sync.test.ts failing stub created for AUTH-02/AUTH-03 alongside pre-existing passing stubs for profile and migration.**

## Performance

- **Duration:** ~4 minutes
- **Started:** 2026-03-10T15:19:26Z
- **Completed:** 2026-03-10T15:23:45Z
- **Tasks:** 2/2
- **Files modified:** 5

## Accomplishments

- Installed all 5 Phase 2 packages using `npx expo install` for SDK 54 compatibility
- Created `.env.local` with 4 placeholder env var keys (gitignored)
- Created `sync.test.ts` as a failing stub targeting `src/auth/supabase` and `src/db/profile` (both not yet implemented)
- Confirmed pre-existing `profile.test.ts` (14 tests, ONBRD-01/02/03) and `migration.test.ts` (9 tests, AUTH-01) are already passing
- All 44 existing tests continue to pass after dependency installation

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install Phase 2 dependencies | 93e4264 | package.json, package-lock.json, app.json |
| 2 | Create failing sync test stubs | 3119dcd | __tests__/sync.test.ts |

## Files Created/Modified

- `/Users/sado/Documents/Projects/TheCook/TheCook/TheCook/__tests__/sync.test.ts` — new failing stub, AUTH-02 + AUTH-03
- `/Users/sado/Documents/Projects/TheCook/TheCook/TheCook/.env.local` — placeholder env vars (gitignored)
- `/Users/sado/Documents/Projects/TheCook/TheCook/TheCook/package.json` — 5 new deps
- `/Users/sado/Documents/Projects/TheCook/TheCook/TheCook/package-lock.json` — updated lockfile
- `/Users/sado/Documents/Projects/TheCook/TheCook/TheCook/app.json` — google-signin plugin added

## Decisions Made

- `profile.test.ts` and `migration.test.ts` were already implemented ahead of this plan (via commits b8b2daa, c27f5d7, f27dc67 from plan 02-03 work done out-of-order) — these are treated as pre-existing, no changes needed
- Only `sync.test.ts` was created as a new stub since the other two files were already present
- Stub uses `jest.mock('../src/auth/supabase')` so tests can be parsed without a live connection, and imports `getLocalProfile` from `src/db/profile` — both modules will be implemented in later plans

## Deviations from Plan

### Auto-noted: Pre-existing work

**Ahead-of-schedule implementations found:**
- **Found during:** Task 2 setup
- **Issue:** `profile.test.ts`, `migration.test.ts`, `src/types/profile.ts`, and `src/db/client.ts` (DB_VERSION 2) were already implemented and passing via commits b8b2daa, c27f5d7, f27dc67
- **Action:** Created only `sync.test.ts` as the remaining stub; did not recreate the already-passing files
- **Impact:** Plan's "failing stubs" criterion is partially met — sync.test.ts fails as expected, profile/migration tests pass (which is functionally better than failing stubs)

## Self-Check: PASSED

- FOUND: TheCook/__tests__/sync.test.ts
- FOUND: TheCook/__tests__/profile.test.ts
- FOUND: TheCook/__tests__/migration.test.ts
- FOUND: TheCook/.env.local
- FOUND: commit 93e4264 (Task 1 - install deps)
- FOUND: commit 3119dcd (Task 2 - sync test stubs)
