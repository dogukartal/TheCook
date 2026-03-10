---
phase: 02-profile-and-auth
verified: 2026-03-10T18:00:00Z
status: gaps_found
score: 11/13 must-haves verified
gaps:
  - truth: "Google Sign In can complete the OAuth redirect flow on iOS"
    status: failed
    reason: "app.json ios.infoPlist.CFBundleURLTypes is empty — the reversed Google iOS client ID URL scheme was not added. Without this, Google OAuth cannot redirect back to the app after authentication on iOS (native Google Sign In SDK requires this URL scheme)."
    artifacts:
      - path: "TheCook/app.json"
        issue: "ios.infoPlist is empty {}; no CFBundleURLTypes / CFBundleURLSchemes entry for the reversed iOS client ID"
    missing:
      - "Add ios.infoPlist.CFBundleURLTypes = [{ CFBundleURLSchemes: ['com.googleusercontent.apps.230547724005-4ejkhcv0hfsaekdj9d8knqek7lfa1cdl'] }] to app.json (reversed value of EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID)"
  - truth: "TypeScript compiles without errors (npx tsc --noEmit)"
    status: failed
    reason: "Two TS2769 errors in src/db/profile.ts at lines 56 and 125: 'unknown[]' is not assignable to 'SQLiteBindParams'. These are known deferred items logged in deferred-items.md but they cause tsc --noEmit to fail."
    artifacts:
      - path: "TheCook/src/db/profile.ts"
        issue: "Lines 56 and 125: values array typed as unknown[] — must be SQLiteBindValue[] for runAsync overload to match"
    missing:
      - "Cast or retype the 'values' array in both saveProfile (hook) and saveProfileToDb (standalone) from unknown[] to SQLiteBindValue[]"
human_verification:
  - test: "Run the app on iOS simulator, tap 'Sign in with Google', complete Google OAuth"
    expected: "The Google OAuth consent screen appears, user grants access, app returns to /(tabs) and cloud profile syncs"
    why_human: "Native Google Sign In flow requires a real development build and live OAuth credentials — cannot be exercised in jest"
  - test: "Fresh install on iOS simulator — onboarding wizard appears on first launch; after completing all 3 steps the main tabs load; re-launch does not show onboarding"
    expected: "Allergen screen shows (Step 1 of 3), all chips unselected. Equipment screen shows fırın and tava pre-selected. After account-nudge dismiss, main tabs visible. Second launch goes directly to tabs."
    why_human: "End-to-end first-run flow requires native build and live SQLite — not exercised in jest"
  - test: "Sign in with Apple (iOS simulator)"
    expected: "Apple authentication sheet appears, nonce flow completes, user lands on /(tabs)"
    why_human: "Apple Sign In requires Apple Developer Portal credentials (not yet provisioned) and a native build"
---

# Phase 2: Profile and Auth Verification Report

**Phase Goal:** Users can complete onboarding, create a profile, and optionally sign in with Google or Apple — with their preferences synced to the cloud when authenticated.
**Verified:** 2026-03-10T18:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | ProfileSchema validates allergens/skillLevel/equipment using enums from recipe.ts (no duplication) | VERIFIED | `src/types/profile.ts` imports AllergenTagEnum, SkillLevelEnum, EquipmentEnum from `./recipe`; allergens default to [], equipment defaults to ["fırın","tava"], skillLevel defaults to null |
| 2 | Allergen chips start unselected — user must opt in | VERIFIED | `allergens.tsx` initializes `selected` state from `getProfile()` which returns `[]` on first visit (ProfileSchema default); no chip is pre-selected |
| 3 | DB_VERSION 2 migration creates profile + bookmarks tables and seeds profile row | VERIFIED | `src/db/client.ts` DB_VERSION=2; both tables created with IF NOT EXISTS guards; `INSERT OR IGNORE INTO profile (id) VALUES (1)` present; 9 migration tests pass |
| 4 | migrateDb is idempotent | VERIFIED | `IF NOT EXISTS` guards on all CREATE statements; early return when `currentVersion >= DB_VERSION`; test "is idempotent" passes |
| 5 | onAuthStateChange SIGNED_IN triggers cloud-wins pullCloudProfile | VERIFIED | `src/auth/sync.ts` initAuthListener wires SIGNED_IN event to pullCloudProfile(); sync.test.ts "SIGNED_IN event triggers pullCloudProfile" passes |
| 6 | onAuthStateChange SIGNED_OUT does not clear local profile | VERIFIED | `initAuthListener` has no action on SIGNED_OUT; sync.test.ts "SIGNED_OUT event does NOT modify local profile" passes |
| 7 | User can tap through all 3 onboarding steps and reach account nudge | VERIFIED | allergens.tsx, skill-level.tsx, equipment.tsx, account-nudge.tsx all exist with full implementations; Continue navigates to next step; all skip paths route through account-nudge |
| 8 | After completing or skipping all steps, onboardingCompleted=1 written to SQLite | VERIFIED | `account-nudge.tsx` calls `saveProfile({ accountNudgeShown: true, onboardingCompleted: true })` in useEffect on mount; equipment.tsx also writes it on Continue |
| 9 | A new install shows onboarding wizard; returning user goes directly to tabs | VERIFIED | `app/_layout.tsx` RootNavigator reads `onboardingCompleted` from SQLite, returns null while loading, renders `<Redirect href="/onboarding/allergens" />` when false |
| 10 | Settings screen allows inline editing of allergens, skill level, and equipment | VERIFIED | `settings.tsx` fully implements all three sections with immediate-save pattern; Chip component reused from onboarding |
| 11 | Signing out from Settings keeps local profile intact | VERIFIED | `settings.tsx` calls `useSession().signOut()`; signOut only calls `supabase.auth.signOut()` — no local SQLite clear |
| 12 | Google Sign In can complete the OAuth redirect flow on iOS | FAILED | `app.json ios.infoPlist` is empty — reversed Google iOS client ID URL scheme not added (SUMMARY claimed it was added but code disagrees) |
| 13 | TypeScript compiles without errors | FAILED | `npx tsc --noEmit` reports 2 errors: TS2769 in `src/db/profile.ts` lines 56 and 125 (`unknown[]` not assignable to `SQLiteBindParams`) |

**Score:** 11/13 truths verified

---

## Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `TheCook/src/types/profile.ts` | VERIFIED | Exports ProfileSchema, BookmarkSchema, Profile, Bookmark; imports enums from ./recipe (no duplication); 20 lines, substantive |
| `TheCook/src/db/client.ts` | VERIFIED | DB_VERSION=2; profile + bookmarks migration block present and idempotent |
| `TheCook/src/db/profile.ts` | VERIFIED (with warning) | Exports useProfileDb hook + saveProfileToDb + saveBookmarksToDb; full implementation; TS2769 type error at lines 56/125 (values: unknown[]) does not block runtime but breaks tsc |
| `TheCook/src/auth/supabase.ts` | VERIFIED | Exports supabase client singleton; expo-sqlite localStorage with Jest fallback; AppState auto-refresh; 40 lines |
| `TheCook/src/auth/sync.ts` | VERIFIED | Exports pullCloudProfile + initAuthListener; cloud-wins logic; SIGNED_OUT no-op; 72 lines |
| `TheCook/src/auth/useSession.tsx` | VERIFIED | Exports SessionProvider + useSession; proper React context; signOut does not clear local data |
| `TheCook/app/onboarding/_layout.tsx` | VERIFIED | Stack navigator, headerShown=false, slide_from_right |
| `TheCook/app/onboarding/allergens.tsx` | VERIFIED | 14 allergen chips, none pre-selected on first visit, saves on Continue, navigates on Skip |
| `TheCook/app/onboarding/skill-level.tsx` | VERIFIED | Single-select chip row, null default, saves on Continue |
| `TheCook/app/onboarding/equipment.tsx` | VERIFIED | 13 equipment items, reads defaults from DB (fırın+tava), saves + onboardingCompleted=true on Continue |
| `TheCook/app/onboarding/account-nudge.tsx` | VERIFIED | Writes accountNudgeShown+onboardingCompleted on mount; navigates to /(auth)/sign-in or /(tabs) |
| `TheCook/components/ui/chip.tsx` | VERIFIED | Reusable Chip with accessibilityRole=checkbox; used in all onboarding and settings screens |
| `TheCook/app/(auth)/_layout.tsx` | VERIFIED | Stack layout, headerShown=false |
| `TheCook/app/(auth)/sign-in.tsx` | VERIFIED | Apple Sign In (iOS-only, nonce flow, fullName capture), Google Sign In, email link, skip option; loading + error state |
| `TheCook/app/(auth)/sign-up.tsx` | VERIFIED | Dual-mode (sign-up/sign-in toggle); field validation; KeyboardAvoidingView; signInWithPassword + signUp wired |
| `TheCook/app/_layout.tsx` | VERIFIED | SessionProvider wraps RootNavigator; initAuthListener called in onInit; onboarding gate reads onboardingCompleted; null guard before redirect |
| `TheCook/app/(tabs)/_layout.tsx` | VERIFIED | Settings tab (third entry, gearshape.fill icon) added |
| `TheCook/app/(tabs)/settings.tsx` | VERIFIED | Account section (signed-in/out states + sign-out), Allergens, Skill Level, Equipment; immediate-save; Supabase upsert when session active |
| `TheCook/__tests__/profile.test.ts` | VERIFIED | 14 tests covering ONBRD-01/02/03 — all passing |
| `TheCook/__tests__/migration.test.ts` | VERIFIED | 9 tests covering AUTH-01 — all passing |
| `TheCook/__tests__/sync.test.ts` | VERIFIED | 5 tests covering AUTH-02/03 — all passing |
| `TheCook/.env.local` | VERIFIED | All 4 env vars populated with real Supabase + Google credentials |
| `TheCook/app.json` (ios.infoPlist) | FAILED | ios.infoPlist is {} — reversed Google iOS client ID URL scheme missing |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/types/profile.ts` | `src/types/recipe.ts` | import AllergenTagEnum, SkillLevelEnum, EquipmentEnum | VERIFIED | Line 2: `import { AllergenTagEnum, SkillLevelEnum, EquipmentEnum } from "./recipe"` |
| `src/db/profile.ts` | `src/db/client.ts` (useSQLiteContext) | useSQLiteContext pattern | VERIFIED | Line 1: `import { useSQLiteContext, SQLiteDatabase } from "expo-sqlite"` |
| `src/auth/sync.ts` | `src/db/profile.ts` | saveProfileToDb + saveBookmarksToDb | VERIFIED | Line 2: imports both functions; called at lines 26 and 48 |
| `src/auth/useSession.tsx` | `src/auth/supabase.ts` | import supabase | VERIFIED | Line 3: `import { supabase } from './supabase'` |
| `app/onboarding/allergens.tsx` | `src/db/profile.ts` | useProfileDb().saveProfile() | VERIFIED | Line 12: import; line 59: `await saveProfile({ allergens: selected })` |
| `app/onboarding/account-nudge.tsx` | `src/db/profile.ts` | useProfileDb().saveProfile({ accountNudgeShown, onboardingCompleted }) | VERIFIED | Line 10: import; line 21: saveProfile call with both flags |
| `app/onboarding/account-nudge.tsx` | `app/(auth)/sign-in.tsx` | router.push('/(auth)/sign-in') | VERIFIED | Line 25: `router.push('/(auth)/sign-in')` |
| `app/_layout.tsx` | `src/db/profile.ts` | useProfileDb().getProfile() for onboarding gate | VERIFIED | Line 9: import useProfileDb; line 23: getProfile().then reads onboardingCompleted |
| `app/_layout.tsx` | `src/auth/sync.ts` | initAuthListener(db) after DB init | VERIFIED | Line 7: import; line 47: `initAuthListener(db)` in onInit |
| `app/(tabs)/settings.tsx` | `src/auth/useSession.tsx` | useSession().signOut() | VERIFIED | Lines 14, 93: import and usage; line 157: `await signOut()` |
| `app/(tabs)/settings.tsx` | `src/auth/supabase.ts` | supabase.from('profiles').upsert() | VERIFIED | Line 15: import; line 118: `supabase.from('profiles').upsert(...)` |
| `app/(auth)/sign-in.tsx` | `src/auth/supabase.ts` | signInWithIdToken (Apple + Google) | VERIFIED | Lines 58, 103: both OAuth paths call `supabase.auth.signInWithIdToken` |
| `.env.local` | `src/auth/supabase.ts` | EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY | VERIFIED | supabase.ts reads env vars; .env.local has populated values |
| `app.json` ios.infoPlist | Google Sign In SDK | reversed iOS client ID URL scheme | FAILED | ios.infoPlist is empty `{}`; CFBundleURLTypes not present |

---

## Requirements Coverage

| Requirement | Description | Plans | Status | Evidence |
|-------------|-------------|-------|--------|----------|
| ONBRD-01 | User can declare allergens; stored and applied automatically | 02-01, 02-03, 02-05, 02-07 | SATISFIED | ProfileSchema allergens=[] default; allergens.tsx chip UI (all unselected); settings.tsx inline editing; 14 profile tests pass |
| ONBRD-02 | User can set cooking skill level; controls recipe surfacing | 02-01, 02-03, 02-05, 02-07 | SATISFIED | ProfileSchema skillLevel=null default; skill-level.tsx single-select UI; settings.tsx editing; profile tests pass |
| ONBRD-03 | User can declare available kitchen equipment | 02-01, 02-03, 02-05, 02-07 | SATISFIED | ProfileSchema equipment defaults to ["fırın","tava"]; equipment.tsx icon grid (13 items, DB defaults pre-selected); settings.tsx editing |
| AUTH-01 | App works fully without account — profile + bookmarks stored locally | 02-01, 02-03, 02-07 | SATISFIED | SQLite-only ProfileSchema + DB migration; onboarding gate works offline; settings screen works offline; app/_layout.tsx requires no session to render |
| AUTH-02 | User can optionally create account; profile syncs across devices | 02-01, 02-04, 02-06, 02-07 | SATISFIED (partial) | pullCloudProfile + initAuthListener wired; sync.test.ts 5 tests pass; sign-in/sign-up screens exist and wired to Supabase; Google OAuth code complete but iosUrlScheme missing prevents real iOS test |
| AUTH-03 | User can log in and out; local data syncs on sign-in; preserved on sign-out | 02-01, 02-04, 02-06, 02-07 | SATISFIED | SIGNED_OUT does not clear local data (verified by sync.test.ts); signOut() in useSession only calls supabase.auth.signOut(); SIGNED_IN triggers pullCloudProfile (cloud wins) |

No orphaned requirements found — all 6 Phase 2 requirement IDs (ONBRD-01, ONBRD-02, ONBRD-03, AUTH-01, AUTH-02, AUTH-03) are claimed and covered across plans 02-01 through 02-07.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/auth/supabase.ts` | 20–21 | Fallback placeholder strings for env vars (`'https://placeholder.supabase.co'`, `'placeholder-anon-key'`) | Info | Intentional defensive pattern for Jest environment; real env vars are populated in .env.local; no runtime impact |
| `src/db/profile.ts` | 56, 125 | `values: unknown[]` typed too broadly — TS2769 errors | Warning | TypeScript compilation fails (`npx tsc --noEmit`); runtime works because SQLite accepts the values; requires type narrowing to SQLiteBindValue[] |
| `app.json` | ios section | Missing `ios.infoPlist.CFBundleURLTypes` for Google Sign In iOS URL scheme | Blocker | Google Sign In on iOS requires the reversed client ID as a URL scheme so the OAuth redirect returns to the app; without it, the OAuth flow cannot complete on real iOS devices |

---

## Human Verification Required

### 1. Onboarding First-Run Flow

**Test:** Install fresh build on iOS simulator. Launch app. Navigate through allergens (verify no chips pre-selected), skill level (verify null default), equipment (verify fırın+tava pre-selected). Complete all 3 steps. Dismiss account nudge. Relaunch app.
**Expected:** Each onboarding screen renders correctly. After account-nudge dismiss, main tabs load. Second launch skips onboarding entirely.
**Why human:** SQLite state + Expo Router navigation gates cannot be tested in jest.

### 2. Google Sign In OAuth Flow (after fixing iosUrlScheme)

**Test:** After adding `ios.infoPlist.CFBundleURLTypes` to app.json and rebuilding, tap "Sign in with Google" on the sign-in screen.
**Expected:** Google consent sheet appears in browser. User approves. App returns to /(tabs). Settings screen shows "Signed in as [email]". Cloud profile data (if any) syncs and overwrites local allergens/equipment.
**Why human:** Native OAuth requires a development build and live Google Cloud credentials.

### 3. Apple Sign In Flow (pending Apple Developer Portal provisioning)

**Test:** After configuring Apple Developer Portal (Service ID + .p8 key in Supabase), tap "Sign In with Apple" on iOS.
**Expected:** Apple authentication sheet appears. User authenticates. On first sign-in, fullName is captured and saved to Supabase user metadata. App navigates to /(tabs).
**Why human:** Requires Apple credentials (deferred per Plan 02-02 decision) and a real device or simulator with a valid Apple ID.

### 4. Sign-Out Preserves Local Data

**Test:** Sign in, modify allergens in Settings, then sign out. Verify allergen chips still reflect saved values after sign-out.
**Expected:** Local profile data (allergens, skill level, equipment) remains intact and visible in Settings after signing out.
**Why human:** State persistence after sign-out requires live auth + SQLite interaction.

---

## Gaps Summary

Two gaps block clean goal verification:

**Gap 1: Missing Google iOS URL scheme in app.json (Blocker)**
The Plan 02-02 SUMMARY.md states "app.json ios.infoPlist.CFBundleURLTypes set with reversed Google iOS client ID as iosUrlScheme" but the actual `app.json` shows `"infoPlist": {}`. This is a discrepancy between what was claimed and what exists. The `@react-native-google-signin/google-signin` SDK requires the reversed iOS client ID (`com.googleusercontent.apps.230547724005-4ejkhcv0hfsaekdj9d8knqek7lfa1cdl`) registered as a CFBundleURLSchemes entry so that Google's OAuth web flow can redirect back to the native app. Without it, the Google sign-in flow will silently fail on iOS after the user approves on Google's consent screen.

**Gap 2: TypeScript compilation errors in src/db/profile.ts (Warning)**
Two TS2769 errors at lines 56 and 125 where `values: unknown[]` is passed as the second argument to `db.runAsync()`. The TypeScript overloads expect `SQLiteBindParams` (which is `SQLiteBindValue[]`). These were acknowledged in `deferred-items.md` but they cause `npx tsc --noEmit` to report errors, meaning the codebase cannot claim a clean TypeScript compile. These are low-risk at runtime since the values accepted are valid, but they are genuine type errors that should be resolved.

Both gaps are isolated and fixable without touching the logic — Gap 1 is a one-line config addition; Gap 2 is a type cast in two function bodies.

---

*Verified: 2026-03-10T18:00:00Z*
*Verifier: Claude (gsd-verifier)*
