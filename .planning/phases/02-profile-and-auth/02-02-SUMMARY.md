---
phase: 02-profile-and-auth
plan: "02"
subsystem: auth
tags: [supabase, google-oauth, apple-sign-in, native-build, expo]

# Dependency graph
requires:
  - phase: 02-profile-and-auth
    plan: "01"
    provides: "Phase 2 dependencies installed, .env.local placeholder created"
provides:
  - "Supabase project provisioned with profiles + bookmarks tables and RLS policies"
  - "Google OAuth client IDs (web + iOS) in Google Cloud Console"
  - "Populated .env.local with Supabase URL, anon key, Google web + iOS client IDs"
  - "iOS native development build verified on simulator"
affects:
  - "02-03 (DB migration — needs Supabase URL for integration tests)"
  - "02-04 (Supabase client init — requires env vars)"
  - "02-05 (Google Sign In — requires iOS client ID and iosUrlScheme in app.json)"
  - "02-06 (Apple Sign In — deferred; Apple credentials not yet configured)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "External service provisioning gate — all auth code blocked until env vars + credentials exist"

key-files:
  created: []
  modified:
    - "TheCook/TheCook/.env.local — populated with EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID"
    - "TheCook/TheCook/app.json — ios.infoPlist.CFBundleURLTypes set with reversed Google iOS client ID as iosUrlScheme"

key-decisions:
  - "Cloud database: Supabase chosen as auth + sync backend with profiles and bookmarks tables using RLS"
  - "Google OAuth requires separate Web + iOS client IDs — iosUrlScheme (reversed iOS client ID) must be added to app.json ios.infoPlist.CFBundleURLTypes"
  - "Apple Sign In skipped in this provisioning round — will be configured in a future iteration before App Store submission"

patterns-established:
  - "Pattern: .env.local holds all EXPO_PUBLIC_ secrets; gitignore covers *.env*.local"
  - "Pattern: Human-action checkpoint — plan execution paused awaiting external service credentials"

requirements-completed:
  - AUTH-01
  - AUTH-02
  - AUTH-03

# Metrics
duration: checkpoint
completed: 2026-03-10
---

# Phase 2 Plan 02: External Service Provisioning Summary

**Supabase project provisioned and Google OAuth credentials created — iOS development build verified on simulator, unblocking auth implementation. Apple Sign In deferred to a future iteration.**

## Performance

- **Duration:** Checkpoint (human-action gate)
- **Started:** 2026-03-10T15:20:06Z
- **Completed:** 2026-03-10 (confirmed by user)
- **Tasks:** 1/1 checkpoint resolved
- **Files modified:** 2 (.env.local, app.json)

## Accomplishments

- Supabase project provisioned; profiles + bookmarks tables with RLS created via SQL editor
- Google OAuth credentials created: Web client ID and iOS client ID in Google Cloud Console
- `.env.local` populated with all 4 required env vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `app.json` updated with reversed Google iOS client ID under `ios.infoPlist.CFBundleURLTypes`
- `npx expo run:ios` confirmed launching app on iOS simulator without native module errors

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Provision Supabase, Google OAuth, Apple Sign In, verify dev build | e21f75b | .env.local placeholder staged; full provisioning completed by user |

## Files Created/Modified

- `/Users/sado/Documents/Projects/TheCook/TheCook/.env.local` — populated with all 4 required environment variables
- `/Users/sado/Documents/Projects/TheCook/TheCook/app.json` — `ios.infoPlist.CFBundleURLTypes` set with reversed Google iOS client ID

## Decisions Made

- Supabase is the cloud auth + sync backend for profiles and bookmarks
- Google Sign In requires a Web OAuth client ID AND a separate iOS OAuth client ID — both created in Google Cloud Console
- The reversed iOS client ID was added to `app.json` under `ios.infoPlist.CFBundleURLTypes` as the iosUrlScheme
- **Apple Sign In skipped** — will be configured in a future iteration before App Store submission; Plan 02-06 implementation will need to include the provisioning steps at that point

## Deviations from Plan

### Skipped Provisioning Step

**Apple Sign In — skipped, deferred to future iteration**
- **Found during:** Checkpoint resolution
- **Issue:** User chose to skip Apple Sign In setup for now; it is required by App Store rules only when submitting
- **Impact:** Plan 02-06 (Apple Sign In implementation) will need to include the Apple Developer Portal + Supabase provisioning steps before auth code can be tested
- **Downstream:** `02-06 (Apple Sign In — requires Apple .p8 key in Supabase)` remains unblocked for code implementation but cannot be end-to-end tested until Apple credentials are configured

## Next Phase Readiness

All blocking env vars are now in place. Execution can proceed:

- Plan 02-03: DB_VERSION 2 migration (profile + bookmarks tables in SQLite) — **already completed**
- Plan 02-04: Supabase client init with expo-sqlite/localStorage session adapter
- Plan 02-05: Google Sign In implementation — all credentials ready
- Plan 02-06: Apple Sign In implementation — code can be written; credentials needed before testing
- Plan 02-07: Email auth + onboarding wizard

---
*Phase: 02-profile-and-auth*
*Completed: 2026-03-10*
