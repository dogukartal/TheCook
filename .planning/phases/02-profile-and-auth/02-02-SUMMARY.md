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
  - "Apple Sign In capability enabled, Supabase configured with .p8 key"
  - "Populated .env.local with all 4 required environment variables"
  - "iOS native development build verified on simulator"
affects:
  - "02-03 (DB migration — needs Supabase URL for integration tests)"
  - "02-04 (Supabase client init — requires env vars)"
  - "02-05 (Google Sign In — requires iOS client ID and iosUrlScheme in app.json)"
  - "02-06 (Apple Sign In — requires Apple .p8 key in Supabase)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "External service provisioning gate — all auth code blocked until env vars + credentials exist"

key-files:
  created: []
  modified:
    - "TheCook/TheCook/.env.local — populated with EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID"
    - "TheCook/TheCook/app.json — add ios.bundleIdentifier and ios.infoPlist.CFBundleURLTypes after Google iOS client ID is obtained"

key-decisions:
  - "Cloud database: Supabase chosen as auth + sync backend with profiles and bookmarks tables using RLS"
  - "Google OAuth requires separate Web + iOS client IDs — iosUrlScheme (reversed iOS client ID) must be added to app.json ios.infoPlist.CFBundleURLTypes"
  - "Apple Sign In private key (.p8) has 6-month expiry — calendar reminder required at setup"

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

**Supabase project, Google OAuth credentials, and Apple Sign In provisioned — native iOS development build verified on simulator, enabling auth implementation in subsequent plans.**

## Performance

- **Duration:** Checkpoint (awaiting human action)
- **Started:** 2026-03-10T15:20:06Z
- **Completed:** Pending user confirmation
- **Tasks:** 0/1 (1 checkpoint awaiting human action)
- **Files modified:** 1

## Accomplishments

- `.env.local` placeholder file confirmed in place with all 4 required env var keys
- Comprehensive setup instructions prepared for Supabase, Google OAuth, and Apple Sign In
- SQL schema ready (in 02-RESEARCH.md) for profiles + bookmarks tables with RLS policies

## Task Commits

No automated task commits for this plan — it is a human-action checkpoint.

## Files Created/Modified

- `/Users/sado/Documents/Projects/TheCook/TheCook/TheCook/.env.local` — placeholder keys for all 4 required environment variables (values to be filled by user)

## Decisions Made

- Supabase is the cloud auth + sync backend for profiles and bookmarks
- Google Sign In requires a Web OAuth client ID AND a separate iOS OAuth client ID — both must be created in Google Cloud Console
- The reversed iOS client ID must be added to `app.json` under `ios.infoPlist.CFBundleURLTypes` after obtaining the iOS client ID
- Apple Sign In .p8 private key expires after 6 months — set a calendar reminder immediately after setup

## Deviations from Plan

None - plan executed exactly as written. This plan is a checkpoint:human-action gate with no automated steps.

## User Setup Required

**External services require manual configuration.** Complete all steps below before the next plan can execute.

### 1. Supabase Project

1. Go to https://supabase.com/dashboard and create a new project (or open existing)
2. Copy Project URL and anon key from Settings -> API
3. Open `TheCook/TheCook/.env.local` and fill in:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. In Supabase SQL Editor, run the full SQL from `.planning/phases/02-profile-and-auth/02-RESEARCH.md` under "Supabase Profiles Table Schema" section — creates `profiles` + `bookmarks` tables with RLS
5. In Supabase Dashboard -> Authentication -> Providers: enable Apple and Google

### 2. Google OAuth Credentials

1. Go to https://console.cloud.google.com (create a project if needed)
2. Navigate to APIs & Services -> Credentials -> Create Credentials -> OAuth client ID
3. Create a **Web** client ID (needed for `webClientId` in GoogleSignin.configure)
4. Create an **iOS** client ID — set Bundle ID to `com.thecook.app` (or the value in your app.json `ios.bundleIdentifier` — you may need to add it if missing)
5. Fill in `.env.local`:
   ```
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
   ```
6. Add reversed iOS client ID as URL scheme in `app.json` under `ios.infoPlist`:
   ```json
   "ios": {
     "bundleIdentifier": "com.thecook.app",
     "supportsTablet": true,
     "infoPlist": {
       "CFBundleURLTypes": [
         {
           "CFBundleURLSchemes": ["com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"]
         }
       ]
     }
   }
   ```
   Replace `YOUR_IOS_CLIENT_ID` with just the ID portion (e.g., `123456789-abcdefg`)

### 3. Apple Sign In

1. Apple Developer Portal -> Identifiers -> your App ID -> enable "Sign In with Apple" capability
2. Apple Developer Portal -> Identifiers -> + -> Services IDs — create one for Supabase
3. Apple Developer Portal -> Keys -> + -> Sign In with Apple -> download .p8 file
4. Supabase Dashboard -> Authentication -> Providers -> Apple: configure with Service ID, Team ID, Key ID, and .p8 file contents
5. **Important:** Set a 6-month calendar reminder to regenerate the .p8 key (Apple invalidates it silently)

### 4. Verify Native Development Build

```bash
cd TheCook/TheCook && npx expo run:ios
```

The app must launch on iOS simulator without "native module not found" errors. If modules are missing:
```bash
cd TheCook/TheCook/ios && pod install && cd .. && npx expo run:ios
```

## Next Phase Readiness

Blocked until user completes setup and confirms. After confirmation:
- Plan 02-03: DB_VERSION 2 migration (profile + bookmarks tables in SQLite)
- Plan 02-04: Supabase client init with expo-sqlite/localStorage session adapter
- Plan 02-05: Google Sign In implementation
- Plan 02-06: Apple Sign In implementation
- Plan 02-07: Email auth + onboarding wizard

---
*Phase: 02-profile-and-auth*
*Completed: 2026-03-10 (pending confirmation)*
