# Roadmap: The Cook

## Overview

The Cook ships as an offline-first mobile cooking companion for Turkish 18–30 year olds. The build sequence follows a single dependency chain: lock the recipe data schema first (everything reads it), then establish the user profile and auth layer (filtering depends on stored preferences), then author and bundle the hand-curated recipe library (content creation requires a finalized schema), then build recipe discovery on top of real content, and finally build guided cooking mode (which requires real recipes and a real profile to be meaningful). The app is functionally complete — offline, no AI — at the end of Phase 5, ready for Turkish App Store and Google Play submission.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Lock the recipe data schema and bootstrap the Expo project so all subsequent work builds on a stable base (completed 2026-03-09)
- [x] **Phase 2: Profile and Auth** - Users can declare allergens, skill, and equipment at onboarding; profile is stored locally and optionally synced via an optional account (completed 2026-03-10)
- [x] **Phase 3: Content Library** - 30–50 hand-curated Turkish recipes authored using the locked schema and bundled into the app binary (completed 2026-03-11)
- [ ] **Phase 4: Recipe Discovery** - Users can find recipes by ingredient input, browse the curated feed, filter by mood/category, and bookmark favorites — all offline
- [ ] **Phase 5: Guided Cooking Mode** - Users can enter cooking mode for any recipe and be guided through each step with timers, mistake warnings, and why annotations

## Phase Details

### Phase 1: Foundation
**Goal**: The project is running on device, the recipe data schema is finalized and validated against real recipes, and the content authoring pipeline is ready for Hira to begin writing
**Depends on**: Nothing (first phase)
**Requirements**: CONT-02
**Success Criteria** (what must be TRUE):
  1. The Expo app launches on both an iOS and Android device or simulator
  2. The TypeScript recipe schema is written, documented, and validated against 2–3 hand-authored test recipes without requiring any field changes
  3. A content authoring guide exists so Hira can write recipes that conform to the schema without developer involvement
  4. The local SQLite database initializes on first launch and seeds from a bundled JSON file containing the test recipes
**Plans**: 5 plans

Plans:
- [x] 01-01-PLAN.md — Bootstrap Expo project, configure TypeScript strict mode, create test scaffolds (Wave 0)
- [x] 01-02-PLAN.md — Define Zod recipe schema with all locked enums and types (TDD)
- [x] 01-03-PLAN.md — SQLite migration + seed logic + SQLiteProvider root layout wiring (TDD)
- [x] 01-04-PLAN.md — Validator CLI, build script, and 3 real test YAML recipes (TDD)
- [x] 01-05-PLAN.md — Content authoring guide for Hira + device verification checkpoint

### Phase 2: Profile and Auth
**Goal**: Users can complete onboarding, declare their preferences, and optionally create an account — their profile is stored locally from the start and synced to the cloud when they sign in
**Depends on**: Phase 1
**Requirements**: ONBRD-01, ONBRD-02, ONBRD-03, AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. A new user can complete onboarding (allergens, skill level, kitchen equipment) and the app never asks for these again
  2. The app works fully — profile intact, preferences applied — with no network connection and no account
  3. A user can create an account and their profile and bookmarks sync to the cloud; the same data is accessible after signing in on a second device
  4. A user can log out; local data persists and is overwritten by their cloud profile on next sign-in
  5. Recipes requiring equipment the user has not declared are visibly flagged or de-prioritized
**Plans**: 7 plans

Plans:
- [x] 02-01-PLAN.md — Install Phase 2 dependencies and create failing test stubs (Wave 0) (completed 2026-03-10)
- [ ] 02-02-PLAN.md — Human checkpoint: Supabase project + Google OAuth + Apple Sign In setup + dev build (Wave 0)
- [ ] 02-03-PLAN.md — ProfileSchema + BookmarkSchema types + DB_VERSION 2 migration + profile CRUD (Wave 1)
- [ ] 02-04-PLAN.md — Supabase client + SessionContext + cloud-wins sync listener (Wave 2)
- [ ] 02-05-PLAN.md — Onboarding wizard: allergens, skill level, equipment screens + account nudge (Wave 3)
- [ ] 02-06-PLAN.md — Auth UI: sign-in screen (Apple + Google + email) + sign-up form (Wave 3)
- [ ] 02-07-PLAN.md — Root layout onboarding gate + Settings screen + Settings tab (Wave 4)

### Phase 3: Content Library
**Goal**: The 30–50 curated Turkish recipes are fully authored, allergen-tagged, structured to schema, and bundled inside the app binary so recipe content is available offline with no network dependency
**Depends on**: Phase 1
**Requirements**: CONT-01
**Success Criteria** (what must be TRUE):
  1. The app ships with at least 30 Turkish recipes covering a range of skill levels, dish types, and meal categories
  2. Every recipe has complete step-level data: instruction, why annotation, looks-like-when-done description, and common-mistake flag — no steps are missing any field
  3. Every recipe has accurate allergen flags and a skill level tag applied at content creation time
  4. The recipe library loads from the local SQLite database with no network request on any launch after first install
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — Developer prep: bump SEED_VERSION to 2.0.0, add validator count warning, add version-mismatch re-seed test
- [ ] 03-02-PLAN.md — Hira authors 27+ YAML recipe files covering all 6 categories
- [ ] 03-03-PLAN.md — Build recipes.json, verify 30+ recipes seed on fresh device install

### Phase 4: Recipe Discovery
**Goal**: Users can find recipes they can actually make — by what they have, by browsing, or by filtering — and allergen-incompatible recipes are never shown
**Depends on**: Phase 2, Phase 3
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, DISC-05
**Success Criteria** (what must be TRUE):
  1. A user can type available ingredients and see a list of recipes they can make with those ingredients; results respect their allergen profile automatically
  2. A user can open the app and browse a curated feed of recipes ordered to match their skill level without typing anything
  3. A user can filter the recipe feed by category (breakfast, soup, main dish, etc.) or cuisine type and receive a relevant subset
  4. A user can bookmark a recipe and find it later in a personal saved list; bookmarks persist across app restarts and are available offline
  5. No recipe that conflicts with the user's declared allergens or restrictions appears on any discovery surface under any filter combination
**Plans**: 6 plans

Plans:
- [ ] 04-01-PLAN.md — Install packages (FlashList, LinearGradient), bump DB to version 3 (recent_views), create failing discovery test stubs (Wave 1)
- [ ] 04-02-PLAN.md — Define discovery types + implement useRecipesDb hook with all query logic; tests go GREEN (Wave 2)
- [ ] 04-03-PLAN.md — Build RecipeCardGrid, RecipeCardRow, SkeletonCard, CategoryFilter, IngredientChips components (Wave 2)
- [ ] 04-04-PLAN.md — Tab restructure (Feed/Search/My Kitchen) + Feed screen + Search screen (Wave 3)
- [ ] 04-05-PLAN.md — My Kitchen tab + Recipe detail screen + getRecipeById (Wave 3)
- [ ] 04-06-PLAN.md — Settings sub-screen + human verification of all DISC requirements (Wave 4)

### Phase 5: Guided Cooking Mode
**Goal**: Users can cook from any recipe using a focused step-by-step mode that keeps them on track, warns them before mistakes happen, and handles timing automatically
**Depends on**: Phase 4
**Requirements**: COOK-01, COOK-02, COOK-03, COOK-04
**Success Criteria** (what must be TRUE):
  1. A user can enter cooking mode from any recipe and see exactly one step at a time; the full recipe list is not visible while cooking
  2. Every step shows what to do, why the step matters, and what the result should look, smell, or feel like when correctly done
  3. Every step that has a known common mistake displays that mistake and what to do if it occurs
  4. Steps requiring timing automatically start a visible countdown timer; the timer continues running if the screen locks or the user switches apps briefly
  5. A cooking session can be interrupted (app killed, phone locked) and resumed at the same step on next open
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

Note: Phase 3 (Content Library) depends only on Phase 1 (schema lock) and can run in parallel with Phase 2 (Profile and Auth). Phase 4 requires both Phase 2 and Phase 3 to be complete.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 5/5 | Complete    | 2026-03-09 |
| 2. Profile and Auth | 8/8 | Complete   | 2026-03-10 |
| 3. Content Library | 3/3 | Complete   | 2026-03-11 |
| 4. Recipe Discovery | 2/6 | In Progress|  |
| 5. Guided Cooking Mode | 0/TBD | Not started | - |
