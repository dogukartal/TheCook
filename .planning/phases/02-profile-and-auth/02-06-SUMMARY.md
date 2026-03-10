---
phase: 02-profile-and-auth
plan: "06"
subsystem: auth
tags: [expo-apple-authentication, expo-crypto, google-signin, supabase, oauth, nonce, react-native, expo-router]

# Dependency graph
requires:
  - phase: 02-profile-and-auth/02-04
    provides: supabase client singleton, useSession hook for loading state

provides:
  - app/(auth)/_layout.tsx: Stack layout for auth screens (headerShown false)
  - app/(auth)/sign-in.tsx: Social auth hub — Apple Sign In (iOS-only, nonce flow), Google Sign In, email link, skip option
  - app/(auth)/sign-up.tsx: Dual-mode email form — sign-up (email+password+confirm) and sign-in toggle

affects:
  - 02-07 (root layout — needs to register (auth) route group in Stack)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Apple Sign In nonce flow: randomUUID() → SHA256 hash → Apple SDK receives hash, Supabase receives raw"
    - "credential.fullName captured immediately after Apple signInAsync — only returned once by Apple"
    - "GoogleSignin.configure() called in useEffect on screen mount (not root layout)"
    - "Platform.OS === 'ios' guard for Apple button — invisible on Android"
    - "ERR_CANCELED / SIGN_IN_CANCELLED swallowed silently — no error shown to user"
    - "Dual-mode sign-up/sign-in screen with useState toggle"

key-files:
  created:
    - TheCook/app/(auth)/_layout.tsx
    - TheCook/app/(auth)/sign-in.tsx
    - TheCook/app/(auth)/sign-up.tsx
  modified:
    - TheCook/src/auth/useSession.tsx (renamed from .ts — contained JSX)

key-decisions:
  - "Apple Sign In end-to-end requires Apple Developer Portal .p8 key + Supabase Apple provider config — code is complete but cannot be tested until credentials are provisioned"
  - "Generic error message 'Invalid email or password' used for sign-in failure — does not distinguish which field is wrong (security best practice)"
  - "Sign-up success shows confirmation email message rather than navigating — Supabase default requires email verification"
  - "useSession.ts renamed to useSession.tsx — file contained JSX (SessionContext.Provider) but had .ts extension causing tsc error"

patterns-established:
  - "Auth screen error state: red text below buttons, no modal — cleared on new attempt"
  - "Loading state: ActivityIndicator replaces button label, all buttons disabled"

requirements-completed: [AUTH-02, AUTH-03]

# Metrics
duration: 4min
completed: 2026-03-10
---

# Phase 2 Plan 06: Auth UI Screens Summary

**Native OAuth hub screen (Apple Sign In iOS-only with SHA256 nonce, Google Sign In cross-platform) plus dual-mode email sign-up/sign-in form, all wired to Supabase signInWithIdToken and signInWithPassword**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-10T16:18:08Z
- **Completed:** 2026-03-10T16:22:00Z
- **Tasks:** 2 (both direct implementation)
- **Files modified:** 4 (3 created, 1 renamed/fixed)

## Accomplishments

- `app/(auth)/_layout.tsx` — minimal Stack layout for the auth route group
- `app/(auth)/sign-in.tsx` — Apple Sign In (iOS-only with proper nonce flow and fullName capture), Google Sign In, email link, "Continue without account" skip; loading + error state; GoogleSignin.configure on mount
- `app/(auth)/sign-up.tsx` — dual-mode (signup/signin) with toggle, field validation, KeyboardAvoidingView, confirmation email message on sign-up success, generic error on sign-in failure
- Pre-existing bug fixed: `useSession.ts` → `useSession.tsx` (JSX in .ts file was causing tsc failure)
- All 49 tests continue to pass

## Task Commits

Each task committed atomically:

1. **Task 1: Auth layout + sign-in screen** — `72b3adb` (feat)
2. **Task 2: Email sign-up/sign-in form** — `b9ac35d` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `TheCook/app/(auth)/_layout.tsx` — Stack layout, headerShown false
- `TheCook/app/(auth)/sign-in.tsx` — Apple (iOS), Google, email, skip; nonce flow; fullName capture; cancel handling
- `TheCook/app/(auth)/sign-up.tsx` — dual-mode form; validation; sign-up confirmation; sign-in error; KeyboardAvoidingView
- `TheCook/src/auth/useSession.tsx` — renamed from .ts; no content changes (file contained JSX)

## Decisions Made

- Apple Sign In code is fully implemented but **cannot be tested end-to-end** until the Apple Developer Portal is configured and the .p8 private key is added to Supabase (noted in STATE.md). The button renders on iOS and the nonce flow is correct.
- `useSession.ts` → `useSession.tsx` rename: the file contained a JSX return (`<SessionContext.Provider>`) but was saved with a `.ts` extension. TypeScript 5.9 does not parse JSX in `.ts` files — this caused `TS1005: '>' expected` at the JSX angle bracket. Renaming to `.tsx` resolves the error with no code changes.
- Dual-mode sign-up screen chosen over separate screens: keeps navigation simple (one back from email entry returns to social login hub) and aligns with Plan spec.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Renamed useSession.ts to useSession.tsx**
- **Found during:** Task 1 (TypeScript verification pass)
- **Issue:** `src/auth/useSession.ts` contained JSX (`<SessionContext.Provider>`) but had `.ts` extension; TypeScript reported `TS1005: '>' expected` and 6 cascading errors making `tsc --noEmit` fail
- **Fix:** Renamed file from `.ts` to `.tsx` — TypeScript correctly parses JSX in `.tsx` files; zero code changes
- **Files modified:** `TheCook/src/auth/useSession.tsx`
- **Verification:** `npx tsc --noEmit` shows no errors from auth files; 49 tests pass
- **Committed in:** `72b3adb` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Pre-existing bug from Plan 02-04, unrelated to new files. Fix required for clean TypeScript compilation.

## Issues Encountered

None beyond the above auto-fixed deviation.

## User Setup Required

**Apple Sign In requires external configuration before end-to-end testing is possible:**
1. Apple Developer Portal: enable Sign In with Apple capability for the app's bundle ID
2. Create a Services ID + private key (.p8 file)
3. In Supabase dashboard → Authentication → Providers → Apple: enter the .p8 key, key ID, team ID
4. Note: the .p8 private key expires after 6 months (calendar reminder required at setup)

Google Sign In is already provisioned from Plan 02-02 — `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` must be in `.env.local`.

## Next Phase Readiness

- `(auth)/_layout.tsx`, `sign-in.tsx`, `sign-up.tsx` ready for Plan 02-07 root layout wiring
- Plan 02-07 needs to add `<Stack.Screen name="(auth)" options={{ headerShown: false }} />` to the root Stack
- All 49 tests passing

## Self-Check: PASSED

- FOUND: TheCook/app/(auth)/_layout.tsx
- FOUND: TheCook/app/(auth)/sign-in.tsx
- FOUND: TheCook/app/(auth)/sign-up.tsx
- FOUND: TheCook/src/auth/useSession.tsx
- FOUND: commit 72b3adb (Task 1)
- FOUND: commit b9ac35d (Task 2)

---
*Phase: 02-profile-and-auth*
*Completed: 2026-03-10*
