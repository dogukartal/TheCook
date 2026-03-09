# Phase 2: Profile and Auth - Research

**Researched:** 2026-03-09
**Domain:** Supabase Auth, expo-sqlite profile storage, Expo Router onboarding flow, OAuth (Google + Apple)
**Confidence:** HIGH (core stack), MEDIUM (OAuth flow wiring details)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Auth provider:** Supabase for authentication and cloud sync backend
- **Login methods:** Google, Apple, and email + password (all three)
- **Apple login required** — App Store mandate when offering any social login; no magic link / passwordless in v1
- **Onboarding flow:** 3-step wizard — (1) allergens, (2) skill level, (3) kitchen equipment; skip allowed on every step; if skipped, profile starts empty; allergen filtering is off until declared; shown once per install — dismissed permanently after completing or skipping
- **After onboarding:** Soft interstitial screen shown once — "Your profile is saved. Create an account to sync across devices." — skippable with one tap; never shown again
- **Profile editing:** All three declarations editable in a Settings screen at any time; no re-run onboarding flow
- **What syncs:** profile (allergens, skill, equipment) + bookmarks + onboarding completion state
- **Sync trigger:** Immediately on sign-in, pulling cloud data
- **Conflict resolution:** Cloud wins — cloud data overwrites local on sign-in
- **Sign-out:** Local data kept on device after sign-out; not wiped
- **Selection UX:** Consistent chip/toggle style — tappable chips for allergens, skill level, and equipment
- **Equipment:** Icon grid with labels; tap to toggle; oven and stovetop pre-selected by default
- **Allergen chips:** None pre-selected — opt-in, safety-critical
- **Skill level:** Single-select chip row (beginner / intermediate / advanced)

### Claude's Discretion
- Exact Supabase table schema for profiles and bookmarks
- OAuth flow implementation details (Supabase + expo-auth-session or similar)
- Loading/error states during sync
- Exact equipment icon set (SF Symbols or custom SVGs)
- Animation between onboarding steps

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ONBRD-01 | User can declare allergens and dietary restrictions at onboarding; stored and applied automatically | SQLite profile table (DB_VERSION 2); AllergenTagEnum already in recipe.ts; chip UI pattern |
| ONBRD-02 | User can set cooking skill level (beginner / intermediate / advanced) | SkillLevelEnum already in recipe.ts; single-select chip row; stored in profile table |
| ONBRD-03 | User can declare available kitchen equipment; recipes requiring unlisted equipment are de-prioritized or flagged | EquipmentEnum already in recipe.ts; icon grid; stored in profile table; pre-select oven + stovetop |
| AUTH-01 | App works fully without an account — user profile and bookmarks stored locally on device | expo-sqlite v2 profile + bookmarks tables; onboarding_completed flag in SQLite |
| AUTH-02 | User can optionally create an account; doing so syncs their profile and bookmarks across devices | Supabase @supabase/supabase-js; upsert on sign-in; cloud wins conflict resolution |
| AUTH-03 | User can log in and out; local data syncs on sign-in | supabase.auth.signOut() keeps local data; onAuthStateChange triggers pull on SIGNED_IN |
</phase_requirements>

---

## Summary

Phase 2 builds on top of the expo-sqlite + Expo Router foundation from Phase 1. The profile, bookmarks, and onboarding completion state all live in SQLite first — the app is fully offline-capable before any cloud account is created. Supabase is added as an optional cloud sync layer: when the user signs in, cloud data is pulled and overwrites local. Supabase session tokens are persisted using `expo-sqlite/localStorage` (backed by the same SQLite file already in use), avoiding an extra AsyncStorage dependency.

OAuth requires native builds — neither Google Sign-In nor Apple Sign-In work in Expo Go. Google uses `@react-native-google-signin/google-signin` (native SDK, ID token exchange via `supabase.auth.signInWithIdToken`). Apple uses `expo-apple-authentication` (native SDK, same `signInWithIdToken` pattern with a required nonce). Email + password uses Supabase's built-in `signInWithPassword` / `signUp`. All three paths converge on the same `onAuthStateChange` listener that triggers the cloud-wins sync pull.

The onboarding routing problem (show wizard on first launch, never again) is solved with an `onboarding_completed` INTEGER column in the SQLite `profile` table — checked in the root layout and used to conditionally redirect via Expo Router's `<Redirect>` component. This keeps all user state in one place (SQLite) with no AsyncStorage dependency.

**Primary recommendation:** Use `@supabase/supabase-js` with `expo-sqlite/localStorage` for session storage, `@react-native-google-signin/google-signin` for Google OAuth, and `expo-apple-authentication` for Apple Sign In. All three converge on `signInWithIdToken`. Drive onboarding gating from a SQLite flag, not AsyncStorage.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.x (latest) | Supabase client — auth, database, realtime | Official Supabase SDK; handles token refresh, session persistence |
| expo-apple-authentication | ~8.x (SDK 54 compat) | Native Apple Sign In on iOS | Expo-maintained; returns identityToken for signInWithIdToken |
| @react-native-google-signin/google-signin | ^14.x | Native Google Sign In on iOS and Android | Required — expo-auth-session OAuth flow has nonce mismatch issues on iOS with Google |
| expo-sqlite/localStorage | ships with expo-sqlite ~16.x | Session persistence for Supabase auth | Already in project; avoids adding AsyncStorage; SQLite-backed localStorage drop-in |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-crypto | ~14.x | Generate cryptographic nonce | Required for Apple + Google signInWithIdToken nonce validation |
| expo-secure-store | ~14.x | NOT used for session (too small — 2 KB limit) | Use only if storing a small encryption key; full session goes in SQLite localStorage |
| react-native-url-polyfill | ^2.x | URL API polyfill for Supabase SDK | Required in React Native environments for Supabase to work correctly |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @react-native-google-signin/google-signin | expo-auth-session OAuth web flow | expo-auth-session works but has known nonce issues on iOS with Google; native SDK is more reliable |
| expo-sqlite/localStorage | @react-native-async-storage/async-storage | Both work; expo-sqlite/localStorage avoids a new dependency since expo-sqlite is already installed |
| expo-apple-authentication | expo-auth-session OAuth for Apple | Native is best practice per Supabase docs; OAuth web flow requires extra server-side config |

**Installation:**
```bash
npx expo install @supabase/supabase-js expo-apple-authentication expo-crypto react-native-url-polyfill
npx expo install @react-native-google-signin/google-signin
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── db/
│   ├── client.ts          # migrateDb — add DB_VERSION 2 (profile + bookmarks tables)
│   ├── profile.ts         # profile read/write queries (useSQLiteContext pattern)
│   ├── bookmarks.ts       # bookmark read/write queries
│   └── seed.ts            # existing — no changes needed
├── types/
│   ├── recipe.ts          # existing — AllergenTagEnum, EquipmentEnum, SkillLevelEnum reused
│   └── profile.ts         # ProfileSchema (Zod), BookmarkSchema — import enums from recipe.ts
├── auth/
│   ├── supabase.ts        # Supabase client init with expo-sqlite/localStorage
│   ├── useSession.ts      # React context + hook: session state, sign-in/out
│   └── sync.ts            # pullCloudProfile() — cloud wins upsert into SQLite on SIGNED_IN
app/
├── _layout.tsx            # root layout — add onboarding gate + SessionProvider
├── onboarding/
│   ├── _layout.tsx        # Stack layout for onboarding flow
│   ├── allergens.tsx      # Step 1: allergen chip selection
│   ├── skill-level.tsx    # Step 2: skill level single-select
│   ├── equipment.tsx      # Step 3: equipment icon grid
│   └── account-nudge.tsx  # Soft interstitial (once after onboarding)
├── (auth)/
│   ├── _layout.tsx        # Stack layout for auth screens
│   ├── sign-in.tsx        # Email + Google + Apple sign-in
│   └── sign-up.tsx        # Email sign-up form
├── (tabs)/
│   ├── _layout.tsx        # add Settings tab
│   ├── index.tsx          # existing
│   └── settings.tsx       # NEW: profile editing (allergens, skill, equipment)
└── modal.tsx              # existing
```

### Pattern 1: Onboarding Gate via SQLite Flag
**What:** Read `onboarding_completed` from SQLite on root layout mount. Redirect to onboarding wizard if 0. Write 1 on wizard completion or full skip.
**When to use:** Controls the one-time onboarding experience without AsyncStorage.
**Example:**
```typescript
// app/_layout.tsx — inside SQLiteProvider's onInit callback, flag is loaded
// app/_layout.tsx — root layout redirects
import { Redirect } from 'expo-router';

export default function RootLayout() {
  const { onboardingDone, isLoading } = useProfile(); // reads from SQLiteContext
  if (isLoading) return <SplashScreen />;
  return (
    <Stack>
      {!onboardingDone && <Stack.Screen name="onboarding" />}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
```

### Pattern 2: Supabase Client with SQLite-backed localStorage
**What:** Import `expo-sqlite/localStorage/install` before creating the Supabase client to use SQLite as the session storage backend.
**When to use:** Session persists across restarts; no extra dependency; single storage technology.
**Example:**
```typescript
// src/auth/supabase.ts
import 'expo-sqlite/localStorage/install';
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

### Pattern 3: Apple Sign In with signInWithIdToken + nonce
**What:** Generate a raw nonce via expo-crypto, pass to Apple SDK, pass raw nonce + identity token to Supabase.
**When to use:** Native Apple Sign In on iOS — required if offering any social login (App Store rule).
**Example:**
```typescript
// Source: Supabase docs — Login with Apple (React Native)
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from '../auth/supabase';

async function signInWithApple() {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken!,
    nonce: rawNonce, // raw nonce, NOT the hashed one
  });
  return { data, error };
}
```

### Pattern 4: Google Sign In with signInWithIdToken
**What:** Use @react-native-google-signin native SDK to get idToken, pass to Supabase.
**When to use:** Google Sign In on both iOS and Android.
**Example:**
```typescript
// Source: react-native-google-signin docs + Supabase guide
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from '../auth/supabase';

// Configure once in root layout (not inside component):
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  const idToken = userInfo.data?.idToken;
  if (!idToken) throw new Error('No idToken from Google');
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  return { data, error };
}
```

### Pattern 5: Cloud-Wins Sync on Sign-In
**What:** Listen to `onAuthStateChange`. On `SIGNED_IN`, pull profile + bookmarks from Supabase and upsert into SQLite.
**When to use:** Every sign-in — first time and re-login.
**Example:**
```typescript
// src/auth/sync.ts
import { supabase } from './supabase';
import { saveProfileLocally, saveBookmarksLocally } from '../db/profile';

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    const userId = session.user.id;
    // Pull cloud profile — cloud wins, overwrite local
    const { data: cloudProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (cloudProfile) await saveProfileLocally(cloudProfile);

    const { data: cloudBookmarks } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId);
    if (cloudBookmarks) await saveBookmarksLocally(cloudBookmarks);
  }
  // SIGNED_OUT: do nothing — local data persists
});
```

### Anti-Patterns to Avoid
- **Storing onboarding flag in AsyncStorage:** Causes split-brain between AsyncStorage and SQLite. Keep all user state in one place — SQLite.
- **Using expo-auth-session OAuth web flow for Google on iOS:** Known nonce mismatch issues. Use the native `@react-native-google-signin/google-signin` SDK.
- **Using expo-secure-store for full Supabase sessions:** SecureStore has a 2048-byte limit; Supabase sessions exceed this. Use `expo-sqlite/localStorage`.
- **Duplicating AllergenTagEnum / EquipmentEnum / SkillLevelEnum:** These are locked in `src/types/recipe.ts`. Profile schema must import and reuse them — no duplication.
- **Navigating before root layout mounts:** Expo Router throws "Attempted to navigate before mounting Root Layout." Always check `isLoading` before redirecting.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token refresh lifecycle | Custom JWT refresh timer | Supabase's `autoRefreshToken: true` | Handles background/foreground transitions, token expiry edge cases |
| OAuth PKCE flow | Custom PKCE code verifier + state | expo-auth-session / native SDK | Cryptographic edge cases; easy to get wrong |
| Apple nonce validation | Custom SHA-256 hashing | expo-crypto `digestStringAsync` | Correct constant-time implementation |
| Session persistence | Custom serialization to file | `expo-sqlite/localStorage` storage adapter | Already handles concurrent writes, eviction |
| RLS enforcement | Application-layer row filtering | Supabase Row Level Security policies | Database-level guarantee; app-layer checks are bypassable |
| DB migration versioning | Custom schema versioning table | `PRAGMA user_version` (already established in Phase 1) | Established pattern; atomic, reliable |

**Key insight:** Auth session management and OAuth flows contain subtle cryptographic and timing edge cases. Supabase's SDK handles all of this correctly — the app layer only needs to pass tokens and react to auth state events.

---

## Common Pitfalls

### Pitfall 1: Expo Go Incompatibility with Native Auth SDKs
**What goes wrong:** Testing Apple or Google Sign In in Expo Go fails completely with native module errors.
**Why it happens:** `expo-apple-authentication` and `@react-native-google-signin/google-signin` require native code compiled into the app bundle.
**How to avoid:** Build a development client (`npx expo run:ios`) before implementing any auth screen. Never test auth in Expo Go.
**Warning signs:** "Native module ExpoAppleAuthentication not found" or similar errors.

### Pitfall 2: Apple Secret Key Expiry
**What goes wrong:** Apple Sign In silently stops working after 6 months.
**Why it happens:** Apple requires regenerating the secret key used in the Supabase Apple provider configuration every 6 months.
**How to avoid:** Set a calendar reminder for key rotation immediately after initial setup.
**Warning signs:** `invalid_client` errors from Apple's auth endpoint.

### Pitfall 3: Apple Only Provides Full Name Once
**What goes wrong:** User's display name is null after first sign-in if not captured immediately.
**Why it happens:** Apple only returns `fullName` in the credential on the first sign-in ever. Subsequent sign-ins return null.
**How to avoid:** Immediately after `signInWithIdToken` succeeds, call `supabase.auth.updateUser({ data: { full_name: ... } })` if `credential.fullName` is non-null.
**Warning signs:** All existing users have null display names.

### Pitfall 4: Google OAuth Client IDs — Separate per Platform
**What goes wrong:** Google Sign In works on Android but fails on iOS (or vice versa).
**Why it happens:** Google requires separate OAuth client IDs for iOS and Android, plus a web client ID for token validation. Using only `webClientId` may fail on one platform.
**How to avoid:** Create three client IDs in Google Cloud Console (web, iOS, Android). Pass `iosClientId` explicitly to `GoogleSignin.configure()`.
**Warning signs:** "Developer error" from Google Sign In on one platform only.

### Pitfall 5: Navigator Not Mounted Before Redirect
**What goes wrong:** App crashes with "Attempted to navigate before mounting the Root Layout component."
**Why it happens:** Conditional `<Redirect>` fires before the navigator tree is initialized. Common when redirecting based on async data (SQLite read).
**How to avoid:** Show a loading/splash state while the profile flag is being read. Only redirect after `isLoading === false`.
**Warning signs:** Crash on first launch before any screen renders.

### Pitfall 6: Allergen Opt-In Inverted to Opt-Out
**What goes wrong:** Allergens have default selections that silently suppress valid safety warnings.
**Why it happens:** Developer treats allergens like equipment (which has oven/stovetop pre-selected) and pre-selects common ones like gluten.
**How to avoid:** Allergen chips must start with zero selections. This is a user safety decision locked in CONTEXT.md.
**Warning signs:** Any allergen chip initialized with `selected: true` by default.

### Pitfall 7: Bookmarks Table Schema Not Forward-Compatible
**What goes wrong:** Phase 4 (Discovery) needs to display bookmarks but the schema defined in Phase 2 is missing required fields.
**Why it happens:** Bookmarks are stored locally in Phase 2 before the recipe discovery UI is designed.
**How to avoid:** Define the bookmarks table with `id`, `recipe_id`, `user_id` (nullable for local-only), and `created_at`. This is the minimum Phase 4 will need.
**Warning signs:** Phase 4 requires a DB migration to add fields to the bookmarks table.

---

## Code Examples

### DB_VERSION 2 Migration (profile + bookmarks tables)
```typescript
// src/db/client.ts — extend existing migrateDb
const DB_VERSION = 2;

// Inside migrateDb, add after currentVersion === 0 block:
if (currentVersion < 2) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY NOT NULL DEFAULT 1,
      allergens TEXT NOT NULL DEFAULT '[]',
      skill_level TEXT,
      equipment TEXT NOT NULL DEFAULT '["fırın","tava"]',
      onboarding_completed INTEGER NOT NULL DEFAULT 0,
      account_nudge_shown INTEGER NOT NULL DEFAULT 0
    );

    INSERT OR IGNORE INTO profile (id) VALUES (1);

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY NOT NULL,
      recipe_id TEXT NOT NULL,
      user_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_bookmarks_recipe_id ON bookmarks (recipe_id);
  `);
}
```

### Profile Zod Schema (imports existing enums)
```typescript
// src/types/profile.ts
import { z } from 'zod';
import { AllergenTagEnum, SkillLevelEnum, EquipmentEnum } from './recipe';

export const ProfileSchema = z.object({
  allergens: z.array(AllergenTagEnum).default([]),
  skillLevel: SkillLevelEnum.nullable().default(null),
  equipment: z.array(EquipmentEnum).default(['fırın', 'tava']),
  onboardingCompleted: z.boolean().default(false),
  accountNudgeShown: z.boolean().default(false),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const BookmarkSchema = z.object({
  id: z.string().uuid(),
  recipeId: z.string(),
  userId: z.string().nullable().default(null),
  createdAt: z.string().datetime(),
});

export type Bookmark = z.infer<typeof BookmarkSchema>;
```

### Supabase Profiles Table Schema (cloud)
```sql
-- Run in Supabase SQL Editor
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  allergens JSONB NOT NULL DEFAULT '[]',
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  equipment JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can upsert own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can read own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks
  FOR ALL USING (auth.uid() = user_id);
```

### Expo Auth State Change Listener (foreground/background handling)
```typescript
// Source: Supabase React Native quickstart
import { AppState } from 'react-native';

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AsyncStorage for session | expo-sqlite/localStorage | Expo SDK 52+ | No extra dependency; SQLite-backed; consistent with app storage strategy |
| expo-auth-session for Google OAuth | @react-native-google-signin/google-signin native SDK | 2024 | Eliminates nonce mismatch issues on iOS |
| `supabase.auth.signIn({ provider: 'apple' })` web OAuth | `expo-apple-authentication` + `signInWithIdToken` | 2023 (Supabase native mobile auth support) | Native UX; no browser redirect; required for App Store |
| Deprecated `openDatabase()` | `SQLiteProvider` + `useSQLiteContext` | expo-sqlite v2 | Already adopted in Phase 1 |
| `PRAGMA user_version` manual tracking | Same (remains the pattern) | — | Established in Phase 1; continue with DB_VERSION bump |

**Deprecated/outdated:**
- `supabase.auth.signIn({ provider: 'google' })` OAuth redirect: works but inferior on mobile — native SDK preferred
- `expo-secure-store` for full sessions: 2 KB limit exceeded by Supabase session payloads
- `z.nativeEnum()`: Removed in Zod v4; project uses `z.enum([...])` exclusively

---

## Open Questions

1. **Google Sign In — iOS Client ID availability**
   - What we know: `@react-native-google-signin/google-signin` requires a Google Cloud Console iOS client ID and `iosUrlScheme` in app.json
   - What's unclear: Whether the project has a Firebase project or uses Google Cloud Console directly; which approach to use for generating the GoogleService-Info.plist
   - Recommendation: Planner should add a Wave 0 task to create Google Cloud project + OAuth credentials. Cannot be done in code — requires developer action in Google/Firebase console.

2. **Supabase project provisioning**
   - What we know: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are required before any auth code can run
   - What's unclear: Whether a Supabase project exists already or needs to be created
   - Recommendation: Wave 0 task to provision Supabase project + add env vars to `.env`. Block subsequent auth tasks on this.

3. **Development build requirement**
   - What we know: Both `expo-apple-authentication` and `@react-native-google-signin/google-signin` require a native development build; Expo Go will not work
   - What's unclear: Whether the developer has already done `expo prebuild` and has a working iOS development build
   - Recommendation: Verify `ios/` directory exists and a dev client is buildable before implementing auth UI. The `expo:prebuild` script exists in package.json.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | jest 29.7.0 + jest-expo ~54.0.17 |
| Config file | `TheCook/package.json` (jest key), `TheCook/jest/setup.ts` |
| Quick run command | `cd TheCook && npx jest --passWithNoTests` |
| Full suite command | `cd TheCook && npx jest` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONBRD-01 | AllergenTagEnum values match ProfileSchema; profile saves/reads allergens correctly | unit | `npx jest __tests__/profile.test.ts -x` | ❌ Wave 0 |
| ONBRD-02 | SkillLevelEnum single-select; profile saves/reads skill_level | unit | `npx jest __tests__/profile.test.ts -x` | ❌ Wave 0 |
| ONBRD-03 | EquipmentEnum; oven+stovetop default pre-selected; profile saves/reads equipment | unit | `npx jest __tests__/profile.test.ts -x` | ❌ Wave 0 |
| AUTH-01 | migrateDb creates profile + bookmarks tables in DB_VERSION 2; onboarding flag works offline | unit | `npx jest __tests__/migration.test.ts -x` | ❌ Wave 0 |
| AUTH-02 | pullCloudProfile() upserts cloud data into SQLite; cloud allergens overwrite local | unit (mock Supabase) | `npx jest __tests__/sync.test.ts -x` | ❌ Wave 0 |
| AUTH-03 | sign-out leaves local profile intact; sign-in triggers sync pull | unit (mock Supabase) | `npx jest __tests__/sync.test.ts -x` | ❌ Wave 0 |

**Note:** OAuth UI flows (Apple, Google) are manual-only — they require native builds and real accounts; not automatable in jest.

### Sampling Rate
- **Per task commit:** `cd TheCook && npx jest --passWithNoTests`
- **Per wave merge:** `cd TheCook && npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `TheCook/__tests__/profile.test.ts` — covers ONBRD-01, ONBRD-02, ONBRD-03: ProfileSchema validation, default values, allergen opt-in constraint
- [ ] `TheCook/__tests__/migration.test.ts` — covers AUTH-01: DB_VERSION 2 creates profile + bookmarks tables; profile row seeded with defaults
- [ ] `TheCook/__tests__/sync.test.ts` — covers AUTH-02, AUTH-03: mock Supabase client; cloud wins upsert; sign-out leaves local data
- [ ] Environment: `npx expo install @supabase/supabase-js expo-apple-authentication expo-crypto react-native-url-polyfill @react-native-google-signin/google-signin`

---

## Sources

### Primary (HIGH confidence)
- Expo Docs — Using Supabase: https://docs.expo.dev/guides/using-supabase/
- Expo Docs — Google Authentication: https://docs.expo.dev/guides/google-authentication/
- Expo Docs — Apple Authentication: https://docs.expo.dev/versions/latest/sdk/apple-authentication/
- Expo Docs — Authentication patterns / rewrites: https://docs.expo.dev/router/advanced/authentication-rewrites/
- Supabase Docs — Login with Apple: https://supabase.com/docs/guides/auth/social-login/auth-apple
- Supabase Docs — Login with Google: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase Docs — Native Mobile Auth: https://supabase.com/blog/native-mobile-auth
- Supabase Docs — React Native Quickstart: https://supabase.com/docs/guides/auth/quickstarts/react-native
- Supabase Docs — Expo Tutorial: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
- expo-sqlite/localStorage docs (Expo SDK 54 release notes confirming localStorage support)
- @react-native-google-signin/google-signin docs: https://react-native-google-signin.github.io/docs/setting-up/expo

### Secondary (MEDIUM confidence)
- SecureStore 2 KB limit workaround pattern (multiple community sources; confirmed via Supabase GitHub discussions)
- Apple fullName null on re-sign-in (Supabase docs for Apple login + multiple corroborating community reports)
- Google nonce mismatch issue with expo-auth-session (multiple 2025 community reports; prefer native SDK as resolution)

### Tertiary (LOW confidence)
- Exact `expo-sqlite/localStorage/install` import syntax for React Native (observed in Supabase quickstart but not independently verified against expo-sqlite v16 release notes — planner should verify at implementation time)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against official Expo and Supabase docs
- Architecture: HIGH — patterns derived from official Supabase + Expo Router docs
- Pitfalls: HIGH for Apple/Google specifics (official docs + widespread community reports); MEDIUM for SQLite migration details (established Phase 1 pattern extrapolated to DB_VERSION 2)
- OAuth iOS wiring details: MEDIUM — pattern is documented but exact `iosClientId` configuration requires console setup that is environment-specific

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (30 days — Supabase SDK stable; expo-sqlite localStorage API stable since SDK 52)
