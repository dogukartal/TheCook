---
phase: 02-profile-and-auth
plan: "05"
subsystem: ui
tags: [react-native, expo-router, onboarding, chip-component, allergens, equipment, profile-ui]

# Dependency graph
requires:
  - phase: 02-profile-and-auth/02-03
    provides: useProfileDb hook, ProfileSchema with allergens=[] and equipment=['fırın','tava'] defaults
  - phase: 02-profile-and-auth/02-04
    provides: useSession hook for auth-aware rendering

provides:
  - Reusable Chip component (components/ui/chip.tsx) used across onboarding and settings screens
  - Stack navigator for 4-screen onboarding flow (app/onboarding/_layout.tsx)
  - Allergen selection screen — all 14 chips, none pre-selected (safety constraint) (app/onboarding/allergens.tsx)
  - Skill level screen — single-select beginner/intermediate/advanced (app/onboarding/skill-level.tsx)
  - Equipment selection screen — 13 items icon grid, fırın+tava pre-selected (app/onboarding/equipment.tsx)
  - Account nudge interstitial — one-tap create-account or skip, sets accountNudgeShown+onboardingCompleted flags on mount (app/onboarding/account-nudge.tsx)

affects:
  - 02-07 (root layout — will need to gate onboarding flow based on onboardingCompleted from profile)
  - 05-settings (settings screen will reuse Chip component and link to onboarding screens for preference editing)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Chip component: Pressable + accessibilityRole=checkbox + accessibilityState.checked pattern for accessible multi-select"
    - "Onboarding screens load existing profile on mount for settings re-entry path"
    - "Skip path routes through account-nudge to ensure onboardingCompleted is always written"
    - "equipment.tsx initializes from DB defaults (fırın+tava) not from hardcoded component state"
    - "MaterialCommunityIcons mapped to equipment values — icon names validated against glyphmaps JSON"

key-files:
  created:
    - TheCook/components/ui/chip.tsx
    - TheCook/app/onboarding/_layout.tsx
    - TheCook/app/onboarding/allergens.tsx
    - TheCook/app/onboarding/skill-level.tsx
    - TheCook/app/onboarding/equipment.tsx
    - TheCook/app/onboarding/account-nudge.tsx
  modified: []

key-decisions:
  - "account-nudge writes onboardingCompleted=true and accountNudgeShown=true on mount — covers both complete and skip-all paths"
  - "Equipment screen reads defaults from DB (which contains ['fırın','tava'] from ProfileSchema) not hardcoded component defaults"
  - "MaterialCommunityIcons used for equipment grid — icon names validated against glyphmaps JSON to avoid TypeScript errors"
  - "Skip paths from allergens and skill-level navigate to next step without saving — user gets chance to decide at each step"

patterns-established:
  - "Chip: touchable chip with brand-color selected state (terracotta #E07B39) — reuse in settings screens"
  - "Onboarding screen pattern: load profile on mount, controlled state, Continue saves and navigates, Skip navigates without saving"

requirements-completed: [ONBRD-01, ONBRD-02, ONBRD-03]

# Metrics
duration: 5min
completed: 2026-03-10
---

# Phase 2 Plan 05: Onboarding UI Summary

**4-screen onboarding wizard (allergens, skill-level, equipment, account-nudge) with reusable Chip component; allergen safety constraint enforced (all unselected), fırın+tava pre-selected for equipment, onboardingCompleted written on all exit paths**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-10T16:18:07Z
- **Completed:** 2026-03-10T16:22:48Z
- **Tasks:** 2
- **Files modified:** 6 (all created)

## Accomplishments

- `components/ui/chip.tsx` — reusable, accessible Chip with terracotta selected state; ready for onboarding and settings screens
- 4-screen onboarding flow: allergens (all unselected, multi-select), skill-level (single-select), equipment (icon grid, fırın+tava pre-selected), account-nudge (sets flags on mount)
- All exit paths (Continue, Skip) route through account-nudge, ensuring onboardingCompleted=true is always written to SQLite
- All 49 tests pass; new files compile without TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Chip component + allergen + skill-level screens** - `e670ae3` (feat)
2. **Task 2: Equipment screen + account nudge interstitial** - `686dad5` (feat)

## Files Created/Modified

- `TheCook/components/ui/chip.tsx` — Pressable chip with selected/unselected visual states, accessibilityRole=checkbox
- `TheCook/app/onboarding/_layout.tsx` — Stack navigator, headerShown=false, slide_from_right animation
- `TheCook/app/onboarding/allergens.tsx` — 14 allergen chips, all unselected on first visit; loads saved data for settings re-entry
- `TheCook/app/onboarding/skill-level.tsx` — single-select skill level with description cards; null default
- `TheCook/app/onboarding/equipment.tsx` — 3-column icon grid with MaterialCommunityIcons; reads defaults from DB (fırın+tava)
- `TheCook/app/onboarding/account-nudge.tsx` — soft interstitial; sets accountNudgeShown+onboardingCompleted on mount regardless of action taken

## Decisions Made

- `account-nudge.tsx` calls `saveProfile({ accountNudgeShown: true, onboardingCompleted: true })` in a `useEffect` on mount — this ensures both flags are set whether the user taps "Create account" or "Not now", and also covers the skip-all path from any earlier step
- Equipment screen reads `profile.equipment` from the DB on mount rather than initializing state from a hardcoded array — since ProfileSchema defaults equipment to `['fırın','tava']`, the DB already has correct defaults on first install
- MaterialCommunityIcons names validated against the glyphmaps JSON file — several intuitive names (`mixer`, `frying-pan`, `cutting-board`) were invalid and replaced with valid alternatives (`chef-hat`, `pan`, `silverware`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed invalid MaterialCommunityIcons names in equipment.tsx**
- **Found during:** Task 2 (Equipment screen) — TypeScript compile check
- **Issue:** Four icon names used (`mixer`, `frying-pan`, `mixer-outline`, `cutting-board`) are not valid MaterialCommunityIcons names and caused TS2322 type errors
- **Fix:** Replaced with valid names from glyphmaps JSON: `chef-hat`, `pan`, `silverware-variant`, `silverware`
- **Files modified:** `TheCook/app/onboarding/equipment.tsx`
- **Verification:** `npx tsc --noEmit` shows no errors for new onboarding files
- **Committed in:** `686dad5` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — invalid icon names)
**Impact on plan:** Fix necessary for TypeScript compilation. No scope change.

## Issues Encountered

### Pre-existing TypeScript Errors (Out of Scope)

Two pre-existing TypeScript errors discovered in files from prior plans — logged to `deferred-items.md`, not fixed:

1. `src/db/profile.ts` lines 56, 125 — `unknown[]` not assignable to `SQLiteBindParams` (introduced in plan 02-03)
2. `src/auth/useSession.ts` — JSX in `.ts` file causing parse errors (introduced in plan 02-04; `useSession.tsx` exists as a separate correct file)

These are out of scope per the scope boundary rule (pre-existing in unmodified files).

## User Setup Required

None — all screens are local-first; no external service configuration required.

## Next Phase Readiness

- All 4 onboarding screens ready for navigation wiring in plan 02-07 (root layout)
- `Chip` component ready for reuse in settings screens (Phase 5)
- Root layout (02-07) needs to read `onboardingCompleted` from profile and route new users to `/onboarding/allergens`
- `/(auth)/sign-in` route referenced in account-nudge.tsx will be created in plan 02-06
- All 49 tests passing

## Self-Check: PASSED

- FOUND: TheCook/components/ui/chip.tsx
- FOUND: TheCook/app/onboarding/_layout.tsx
- FOUND: TheCook/app/onboarding/allergens.tsx
- FOUND: TheCook/app/onboarding/skill-level.tsx
- FOUND: TheCook/app/onboarding/equipment.tsx
- FOUND: TheCook/app/onboarding/account-nudge.tsx
- FOUND: 02-05-SUMMARY.md
- FOUND: commit e670ae3 (feat Task 1)
- FOUND: commit 686dad5 (feat Task 2)

---
*Phase: 02-profile-and-auth*
*Completed: 2026-03-10*
