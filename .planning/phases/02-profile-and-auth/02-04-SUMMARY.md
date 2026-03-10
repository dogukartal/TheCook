---
phase: 02-profile-and-auth
plan: "04"
subsystem: auth
tags: [supabase, expo-sqlite, session, sync, cloud-wins, react-context]

# Dependency graph
requires:
  - phase: 02-profile-and-auth/02-03
    provides: saveProfileToDb, saveBookmarksToDb standalone functions; Profile, Bookmark types
  - phase: 02-profile-and-auth/02-02
    provides: Supabase project credentials, EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY

provides:
  - supabase client singleton with expo-sqlite localStorage session storage and AppState auto-refresh
  - pullCloudProfile() that fetches profiles+bookmarks from Supabase and upserts into SQLite (cloud wins)
  - initAuthListener() that wires SIGNED_IN to pullCloudProfile; SIGNED_OUT leaves local data intact
  - SessionProvider React context + useSession hook exposing session, isLoading, signOut

affects:
  - 02-05 (onboarding UI — uses useSession for auth-aware rendering)
  - 02-06 (auth UI — uses useSession for sign-in/sign-out)
  - 02-07 (root layout — wraps app in SessionProvider, calls initAuthListener)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase createClient with expo-sqlite/localStorage for native session persistence"
    - "AppState listener start/stop pattern for Supabase token auto-refresh"
    - "Jest mock of supabase module for unit tests without live connection"
    - "pullCloudProfile null-guard: returns early if userId is null/undefined"
    - "initAuthListener returns unsubscribe fn — caller controls lifecycle"
    - "Cloud-wins: SIGNED_IN overwrites local SQLite; SIGNED_OUT leaves local data intact"

key-files:
  created:
    - TheCook/src/auth/supabase.ts
    - TheCook/src/auth/sync.ts
    - TheCook/src/auth/useSession.ts
  modified:
    - TheCook/__tests__/sync.test.ts

key-decisions:
  - "expo-sqlite localStorage required via try/catch — falls back gracefully in Jest/Node environments"
  - "pullCloudProfile accepts nullable userId and returns early — prevents accidental calls with no session"
  - "sync.test.ts stub (Plan 02-01) replaced with real tests matching plan behavior spec — stub had different API shape"

requirements-completed: [AUTH-02, AUTH-03]

# Metrics
duration: 3min
completed: 2026-03-10
---

# Phase 2 Plan 04: Supabase Auth Layer Summary

**Supabase client singleton with expo-sqlite localStorage persistence, cloud-wins pullCloudProfile sync, SIGNED_IN/SIGNED_OUT listener, and React SessionProvider/useSession hook**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-10T16:13:13Z
- **Completed:** 2026-03-10T16:15:20Z
- **Tasks:** 2 (Task 1 via TDD, Task 2 direct)
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments

- `src/auth/supabase.ts` — Supabase createClient with expo-sqlite localStorage (graceful Jest fallback), AppState listener for auto-refresh on foreground/background
- `src/auth/sync.ts` — `pullCloudProfile()` fetches profiles+bookmarks from Supabase and overwrites local SQLite; `initAuthListener()` wires SIGNED_IN to sync and leaves local data unchanged on SIGNED_OUT
- `src/auth/useSession.ts` — React context providing `session`, `isLoading`, `signOut`; ready to be wired to app root in Plan 02-07
- 5 new sync.test.ts tests all passing; full 49-test suite passes

## Task Commits

Each task committed atomically using TDD (RED then GREEN) for Task 1:

1. **Task 1 RED: Failing sync tests** — `ee3246e` (test)
2. **Task 1 GREEN: Supabase client + sync layer** — `0c166f5` (feat)
3. **Task 2: SessionProvider and useSession hook** — `c20b843` (feat)

## Files Created/Modified

- `TheCook/src/auth/supabase.ts` — Supabase client singleton; exports `supabase`
- `TheCook/src/auth/sync.ts` — exports `pullCloudProfile`, `initAuthListener`
- `TheCook/src/auth/useSession.ts` — exports `SessionProvider`, `useSession`
- `TheCook/__tests__/sync.test.ts` — rewritten from Plan 02-01 stub; 5 tests covering cloud-wins and SIGNED_OUT preservation

## Decisions Made

- expo-sqlite localStorage import wrapped in try/catch — falls back gracefully in Jest/Node test environments where the native module isn't available
- Plan 02-01 sync.test.ts stub had a different API shape (imported from wrong modules) — rewritten to match the actual plan behavior spec and correct module structure
- pullCloudProfile accepts nullable userId and returns early — defensive guard prevents accidental Supabase queries with no active session

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Rewrote sync.test.ts stub to match correct API**
- **Found during:** Task 1 RED
- **Issue:** The Plan 02-01 stub imported `pullCloudProfile, signOut` from `../src/auth/supabase` and `getLocalProfile` from `../src/db/profile` — neither of which match the plan's specified API (sync.ts is separate from supabase.ts; `getLocalProfile` never existed)
- **Fix:** Replaced stub with tests matching the plan's behavior spec: imports from `../src/auth/sync`, mocks `../src/auth/supabase` module, verifies `saveProfileToDb`/`saveBookmarksToDb` calls
- **Files modified:** `TheCook/__tests__/sync.test.ts`
- **Commit:** `ee3246e`

**2. [Rule 2 - Missing critical functionality] Added null-guard to pullCloudProfile**
- **Found during:** Task 1 implementation
- **Issue:** Plan spec states "pullCloudProfile() called with null session does nothing and does not throw" but did not include an explicit null check in the code template
- **Fix:** Added `if (!userId) return;` guard at the top of `pullCloudProfile`
- **Files modified:** `TheCook/src/auth/sync.ts`
- **Commit:** `0c166f5`

## Issues Encountered

None beyond the above auto-fixed deviations.

## User Setup Required

None — Supabase credentials must be in `.env.local` (set up in Plan 02-02).

## Next Phase Readiness

- `supabase.ts` client ready for use by any module needing Supabase access
- `pullCloudProfile` + `initAuthListener` ready for Plan 02-07 root layout wiring
- `useSession` hook ready for onboarding (02-05) and auth UI (02-06)
- All 49 tests passing

## Self-Check: PASSED

- FOUND: TheCook/src/auth/supabase.ts
- FOUND: TheCook/src/auth/sync.ts
- FOUND: TheCook/src/auth/useSession.ts
- FOUND: 02-04-SUMMARY.md
- FOUND: commit ee3246e (test RED)
- FOUND: commit 0c166f5 (feat GREEN)
- FOUND: commit c20b843 (feat useSession)

---
*Phase: 02-profile-and-auth*
*Completed: 2026-03-10*
