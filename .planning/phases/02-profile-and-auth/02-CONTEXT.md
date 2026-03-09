# Phase 2: Profile and Auth - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Users complete a 3-step onboarding wizard to declare allergens, skill level, and kitchen equipment. Their profile is stored locally in SQLite from the start — the app works fully offline with no account. Optionally, after onboarding, users are nudged to create a Supabase-backed account so their profile and bookmarks sync across devices. Sign-in, sign-out, and cloud sync are all in scope. Recipe discovery, cooking mode, and AI features are out of scope for this phase.

</domain>

<decisions>
## Implementation Decisions

### Auth provider
- **Supabase** for authentication and cloud sync backend
- Login methods: Google, Apple, and email + password (all three)
- Apple login required (App Store mandate when offering any social login)
- No magic link / passwordless in v1

### Onboarding flow
- 3-step wizard — one screen per declaration: (1) allergens, (2) skill level, (3) kitchen equipment
- Skip allowed on every step — "Skip for now" option on each screen; user can also skip all from the start
- If skipped, profile starts empty; allergen filtering is off until they declare
- Shown once per install — dismissed permanently after completing or skipping; standard reinstall starts onboarding again
- After onboarding (or skip), a **soft interstitial screen** is shown once: "Your profile is saved. Create an account to sync across devices." — skippable with one tap
- Account creation is never required; the interstitial surfaces it exactly once, then never again

### Profile editing
- All three declarations (allergens, skill level, equipment) editable in a **Settings screen** at any time
- No "re-run onboarding" flow — inline editing via Settings only

### Sync behavior
- What syncs: profile (allergens, skill, equipment) + bookmarks + onboarding completion state
- Trigger: sync happens **immediately on sign-in**, pulling cloud data
- Conflict resolution: **cloud wins** — cloud data overwrites local on sign-in
- Sign-out: local data is **kept** on device after sign-out; not wiped
- On next sign-in: cloud data overwrites local again (same rule)

### Selection UX (onboarding + settings)
- All three profile selection screens use a **consistent chip/toggle style** — tappable chips for allergens, skill level, and equipment alike
- Equipment uses an **icon grid with labels** — tap to toggle; visual recognition over text scanning
- Common equipment pre-selected by default: oven and stovetop — user deselects what they don't have
- Allergen chips: none pre-selected (opt-in, not opt-out — safety-critical)
- Skill level: single-select chip row (beginner / intermediate / advanced)

### Claude's Discretion
- Exact Supabase table schema for profiles and bookmarks
- OAuth flow implementation details (Supabase + expo-auth-session or similar)
- Loading/error states during sync
- Exact equipment icon set (SF Symbols or custom SVGs)
- Animation between onboarding steps

</decisions>

<specifics>
## Specific Ideas

- Allergen chips must be opt-in (nothing pre-selected) — this is safety-critical; wrong defaults could surface allergen-incompatible recipes
- Equipment icon grid should let users recognize items visually, not just read names — icons matter here
- The soft interstitial after onboarding should feel like a calm, low-pressure nudge, not a paywall or upsell

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TheCook/app/_layout.tsx`: Root layout with `SQLiteProvider` + `migrateDb` + `seedIfNeeded` — profile table migration belongs in `migrateDb` alongside existing recipe tables
- `TheCook/src/db/client.ts`: `migrateDb` function using `PRAGMA user_version` pattern — add profile + bookmarks tables in DB_VERSION 2 migration here
- `TheCook/src/types/recipe.ts`: Equipment and allergen enums already defined — profile types must import and reuse these exact enums (no duplication)
- `TheCook/app/(tabs)/_layout.tsx`: Tab navigation exists — Settings tab can be added here in this phase

### Established Patterns
- expo-sqlite v2 API (`SQLiteProvider` + `useSQLiteContext`) — profile reads/writes follow the same pattern as recipe queries
- `PRAGMA user_version` for DB migration versioning — profile table added in DB_VERSION 2
- Zod schemas for data validation — profile schema should follow the same `z.infer<typeof Schema>` pattern
- Expo Router file-based routing — onboarding screens added as new routes (e.g., `app/onboarding/`, `app/(auth)/`)

### Integration Points
- Profile data (especially allergens + equipment) feeds into Phase 4 recipe discovery — the profile storage contract must be stable before Phase 4 begins
- Bookmarks stored locally now (Phase 2) are displayed in Phase 4 discovery — bookmark schema must be defined here
- `SQLiteProvider` in root layout is the entry point for all local data — onboarding completion flag also stored here (not AsyncStorage)

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-profile-and-auth*
*Context gathered: 2026-03-09*
