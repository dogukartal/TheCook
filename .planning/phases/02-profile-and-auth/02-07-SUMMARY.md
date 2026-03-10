---
phase: 02-profile-and-auth
plan: "07"
subsystem: integration
tags: [expo-router, onboarding-gate, auth-listener, settings-screen, chip-component, supabase-sync, google-signin]

# Dependency graph
requires:
  - phase: 02-profile-and-auth/02-05
    provides: Chip component, onboarding screens (allergens, skill-level, equipment, account-nudge)
  - phase: 02-profile-and-auth/02-06
    provides: (auth) route group with sign-in and sign-up screens

provides:
  - app/_layout.tsx: Root layout with SessionProvider + onboarding gate + initAuthListener
  - app/(tabs)/_layout.tsx: Tab layout with Settings tab (gearshape.fill icon)
  - app/(tabs)/settings.tsx: Inline profile editing (allergens, skill-level, equipment) + account section (sign-out, create-account link)

affects:
  - All future phases — root layout is the entry point for the entire app

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RootNavigator inner component reads onboarding_completed from SQLite — returns null while loading, redirects only after state confirmed"
    - "Redirect inside Stack: placed after all Stack.Screen declarations, conditional on !onboardingDone"
    - "initAuthListener called in SQLiteProvider.onInit after migrateDb + seedIfNeeded"
    - "GoogleSignin.configure() at module level in root layout — called before any component mounts"
    - "Settings screen saves profile changes immediately (no Save button) — each toggle/selection triggers saveProfile + optional Supabase upsert"
    - "Supabase upsert in settings gated on session presence — offline-first users get no network call"

key-files:
  created:
    - TheCook/app/(tabs)/settings.tsx
  modified:
    - TheCook/app/_layout.tsx
    - TheCook/app/(tabs)/_layout.tsx

key-decisions:
  - "RootNavigator returns null while onboarding state is loading — prevents premature redirect before SQLite resolves"
  - "Redirect placed after Stack.Screen declarations inside Stack — renders conditionally when !onboardingDone is true"
  - "Settings saves immediately on change (no Save button) — better UX for inline editing, consistent with chip interaction model"
  - "Supabase upsert in settings only fires when session is present — preserves offline-first for unauthenticated users"
  - "GoogleSignin.configure() at module level in root layout — ensures configuration before any screen mounts (overrides plan 02-06 pattern of configuring on sign-in screen mount)"

patterns-established:
  - "Onboarding gate: load flag → null guard → Redirect inside Stack — reusable pattern for future feature gates"
  - "Settings inline editing: load profile on mount, controlled state, immediate save on change, optional cloud sync"

requirements-completed: [ONBRD-01, ONBRD-02, ONBRD-03, AUTH-01, AUTH-02, AUTH-03]

# Metrics
duration: 3min
completed: 2026-03-10
---

# Phase 2 Plan 07: Integration — Root Layout + Settings Summary

**Root layout wired with onboarding gate (SQLite flag check + Redirect) and auth listener (initAuthListener on DB init); Settings tab added; Settings screen built with immediate-save inline editing for allergens, skill level, and equipment plus sign-out and account creation link**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-10T16:25:38Z
- **Completed:** 2026-03-10T16:27:51Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- `app/_layout.tsx` fully integrated: SQLiteProvider → SessionProvider → RootNavigator with onboarding gate; `initAuthListener(db)` called after DB init; GoogleSignin configured at module level
- Onboarding gate logic: reads `onboardingCompleted` from SQLite, returns null while loading (no premature redirect), redirects to `/onboarding/allergens` if false
- All four route groups registered in root Stack: `(tabs)`, `onboarding`, `(auth)`, `modal`
- `app/(tabs)/_layout.tsx` updated with Settings tab (gearshape.fill, third tab)
- `app/(tabs)/settings.tsx` built with four sections: Account (signed-in/out states), Allergens (14 chips), Skill Level (3 chips), Equipment (13 icon grid items)
- All profile changes save immediately on toggle/selection — no Save button
- When signed in, profile changes also push to Supabase via `upsert` (cloud + local kept in sync)
- Sign Out calls `useSession().signOut()` — local data not cleared per user decision
- All 49 tests continue to pass

## Task Commits

Each task committed atomically:

1. **Task 1: Root layout — onboarding gate + auth listener** — `a626d93` (feat)
2. **Task 2: Settings tab + Settings screen** — `9a598e5` (feat)

## Files Created/Modified

- `TheCook/app/_layout.tsx` — rewritten: SQLiteProvider + SessionProvider + RootNavigator (onboarding gate + all route group Stack.Screens + GoogleSignin.configure at module level)
- `TheCook/app/(tabs)/_layout.tsx` — Settings tab added (third tab entry with gearshape.fill icon)
- `TheCook/app/(tabs)/settings.tsx` — new: Account section (signed-in/out), Allergens chips, Skill Level chips, Equipment icon grid; immediate-save; Supabase upsert when session active

## Decisions Made

- `RootNavigator` returns `null` while `onboardingDone === null` — this prevents Expo Router from seeing a render with no decided destination, which would cause a redirect race condition (Pitfall 5 from plan research)
- Settings changes save on each toggle with no confirmation step — aligns with chip interaction model (chips are designed to feel immediate); debounce considered but rejected as added complexity for a low-frequency action
- `GoogleSignin.configure()` moved to root layout module level (overrides plan 02-06 pattern of configuring on sign-in screen mount) — guarantees configuration happens before any screen attempts sign-in, including deep links

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

### Pre-existing TypeScript Errors (Out of Scope)

Two pre-existing TypeScript errors in `src/db/profile.ts` lines 56 and 125 (`unknown[]` not assignable to `SQLiteBindParams`) — logged in plan 02-05 SUMMARY.md as out of scope. No new errors introduced by this plan's changes.

## User Setup Required

None for this plan. Google Sign In requires env vars from plan 02-02 setup (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`). Apple Sign In requires Apple Developer Portal configuration (documented in plan 02-06 SUMMARY.md).

## Next Phase Readiness

- Phase 2 complete — all 7 plans executed
- App is fully integrated: onboarding gate, auth listener, Settings screen, sign-out, cloud sync
- Phase 3 (Content Library) can begin — depends only on Phase 1 (confirmed in ROADMAP.md)

## Self-Check: PASSED

- FOUND: TheCook/app/_layout.tsx
- FOUND: TheCook/app/(tabs)/_layout.tsx
- FOUND: TheCook/app/(tabs)/settings.tsx
- FOUND: commit a626d93 (feat Task 1)
- FOUND: commit 9a598e5 (feat Task 2)

---
*Phase: 02-profile-and-auth*
*Completed: 2026-03-10*
