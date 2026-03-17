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
- [x] **Phase 4: Recipe Discovery** - Users can find recipes by ingredient input, browse the curated feed, filter by mood/category, and bookmark favorites — all offline (completed 2026-03-12)
- [x] **Phase 5: Guided Cooking Mode** - Users can enter cooking mode for any recipe and be guided through each step with timers, mistake warnings, and why annotations (completed 2026-03-14)

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
- [x] 04-01-PLAN.md — Install packages (FlashList, LinearGradient), bump DB to version 3 (recent_views), create failing discovery test stubs (Wave 1)
- [x] 04-02-PLAN.md — Define discovery types + implement useRecipesDb hook with all query logic; tests go GREEN (Wave 2)
- [x] 04-03-PLAN.md — Build RecipeCardGrid, RecipeCardRow, SkeletonCard, CategoryFilter, IngredientChips components (Wave 2)
- [x] 04-04-PLAN.md — Tab restructure (Feed/Search/My Kitchen) + Feed screen + Search screen (Wave 3)
- [x] 04-05-PLAN.md — My Kitchen tab + Recipe detail screen + getRecipeById (Wave 3)
- [x] 04-06-PLAN.md — Settings sub-screen + human verification of all DISC requirements (Wave 4)

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
**Plans**: 3 plans

Plans:
- [ ] 05-01-PLAN.md — Install deps, DB migration to v4 (cooking_sessions), session CRUD + timer hook + notification service with tests
- [ ] 05-02-PLAN.md — Cooking preview screen (replace recipe detail) + all cooking UI components (step-content, timer, progress bar, ingredients sheet, etc.)
- [ ] 05-03-PLAN.md — Full-screen cooking view wiring (PagerView) + session persistence + resume banner + human verification

### Phase 6: Wire Equipment to Recipe Discovery
**Goal**: Declared kitchen equipment actually affects recipe surfacing — recipes requiring equipment the user hasn't declared are visibly de-prioritized or flagged across all discovery surfaces
**Depends on**: Phase 4 (discovery layer), Phase 2 (equipment in profile)
**Requirements**: ONBRD-03
**Gap Closure:** Closes gap from v1.0 audit — equipment stored in profile but never consumed by recipe queries
**Success Criteria** (what must be TRUE):
  1. `DiscoveryFilterSchema` includes an `equipment` field representing user's declared equipment
  2. `queryRecipesByFilter` de-prioritizes (sorts to end) or flags recipes whose `equipment` requirements are not in the user's declared list
  3. Feed, Search, and My Kitchen screens pass user equipment into filter queries
  4. Recipe cards display a visible indicator when a recipe requires equipment the user hasn't declared
  5. Allergen filtering is unaffected — both filters compose correctly

**Plans**: 3 plans

Plans:
- [ ] 06-01-PLAN.md — Test stubs (RED) + extend DiscoveryFilterSchema, RecipeListItemSchema, SELECT_LIST_COLUMNS with equipment field (Wave 1)
- [ ] 06-02-PLAN.md — Equipment sort logic in queryRecipesByFilter, getAllRecipesForFeed, getAllRecipesForSearch; tests go GREEN (Wave 2)
- [ ] 06-03-PLAN.md — Equipment badge on RecipeCardGrid/RecipeCardRow + wire profile.equipment from Feed, Search, My Kitchen screens + human verification (Wave 3)

### Phase 7: Foundation Pivot
**Goal**: Restructure the app for the evolved product vision and enable parallel frontend/backend development — hard filters, 4-tab navigation, screen data hooks extraction, and new profile schema
**Depends on**: Phase 6
**Requirements**: DISC-05, PROF-01, PROF-02, PROF-03, NAV-01
**Gap Closure:** Fixes DISC-05 (allergen exclusion on Cookbook bookmarks). DISC-03 deferred to Phase 9 (superseded by new search/feed design).
**Success Criteria** (what must be TRUE):
  1. Screen data orchestration extracted into typed hooks (`useFeedScreen`, `useSearchScreen`, `useCookbookScreen`) — screens are thin shells calling hook + rendering components
  2. My Kitchen tab renamed to Cookbook; Profile added as 4th tab (Feed / Search / Cookbook / Profile)
  3. Skill level and kitchen equipment are hard filters — recipes above skill ceiling or requiring missing tools never surface on any screen
  4. Allergen exclusion applied to Cookbook bookmarks query (DISC-05 closed)
  5. Profile DB schema extended with `cuisine_preferences` and `app_goals` columns (nullable, no UI yet)
  6. Inline SQL in my-kitchen.tsx extracted to `src/db/recipes.ts`
**Plans**: 3 plans

Plans:
- [ ] 07-01-PLAN.md — DB migration v5 + hard filter SQL (skill + equipment + allergen on bookmarks) + profile schema extension (Wave 1)
- [ ] 07-02-PLAN.md — Extract screen data hooks (useFeedScreen, useSearchScreen, useCookbookScreen) + inline SQL extraction (Wave 2)
- [ ] 07-03-PLAN.md — Tab restructure (Cookbook + Profile tabs) + 4-tab navigation + human verification (Wave 3)

### Phase 8: Feed Redesign
**Goal**: Replace the current vertical feed with 4 horizontal sections that surface recipes based on trending, speed, personalization, and novelty
**Depends on**: Phase 7
**Requirements**: DISC-02, FEED-01, FEED-02
**Success Criteria** (what must be TRUE):
  1. Feed displays 4 horizontal sections: Şu an trend, 30 dakikada bitir, Sana özel, Denemediklerin
  2. Each section scrolls horizontally with recipe cards
  3. Sections with zero results after filtering are hidden (no empty states)
  4. Geçmiş (cooking history) table exists and feeds Denemediklerin exclusion
  5. Sana özel uses rule-based ranking from profile data (AI ranking deferred)
  6. All sections respect hard filters (skill, tools, dietary restrictions)
**Plans**: 3 plans

Plans:
- [ ] 08-01-PLAN.md — DB migration v6 (cooking_history table) + cooking-history.ts module + types + test stubs (Wave 1)
- [ ] 08-02-PLAN.md — Rewrite useFeedScreen hook for 4-section model + rankByProfile + fill feed-section tests (Wave 2)
- [ ] 08-03-PLAN.md — FeedSection UI component + rewrite feed screen with horizontal sections + human verification (Wave 3)

### Phase 9: Search & Category Redesign
**Goal**: Rebuild search with category strip, dietary-only filtering on search results, and optional skill/tool filter panel on category results
**Depends on**: Phase 7
**Requirements**: DISC-03, DISC-01
**Success Criteria** (what must be TRUE):
  1. Category strip displays horizontal scrolling category cards (Pasta, Burgers, Breakfast, Desserts, Chicken, Soups, Rice & Grains, Meat)
  2. Search results filtered only by dietary restrictions — no skill/tool filtering
  3. Category results have an optional filter panel for skill level and kitchen tools
  4. Filter state is session-only (resets on app close or tab switch)
  5. Search matches against recipe names and ingredient lists with real-time results
  6. Category + search query compose together when both active
**Plans**: 3 plans

Plans:
- [ ] 09-01-PLAN.md — Test stubs + CategoryStrip and FilterPanel UI components (Wave 1)
- [ ] 09-02-PLAN.md — Rewrite useSearchScreen hook with category, composition, and split filter logic (Wave 2)
- [ ] 09-03-PLAN.md — Rewrite search.tsx screen + human verification of all criteria (Wave 3)

### Phase 10: Recipe Detail Evolution
**Goal**: Add serving size scaling, ingredient substitution, and step preview to the recipe detail page — all adaptation happens before cooking starts
**Depends on**: Phase 8
**Requirements**: ADAPT-01, ADAPT-02, ADAPT-03
**Success Criteria** (what must be TRUE):
  1. Serving size scaler (inline stepper) proportionally adjusts all ingredient quantities
  2. Adjusted serving size carries forward into Cooking Mode
  3. Ingredients with pre-defined alternatives show "Elimde yok" swap button
  4. Swapped ingredients reflect in step copy via dynamic variables (not hardcoded strings)
  5. Step preview shows step titles as read-only inline list
  6. Start Cooking accessible from both main screen and ingredients bottom sheet

### Phase 11: Cooking Mode Evolution
**Goal**: Elevate cooking mode with step images, checkpoint/warning fields, celebration screen, rating, and completion logging to Gecmis
**Depends on**: Phase 10
**Requirements**: COOKX-01, COOKX-02, COOKX-03
**Success Criteria** (what must be TRUE):
  1. Each step displays an image (AI-generated process shot) with fallback color block
  2. Each step shows Böyle görünmeli (checkpoint) and Dikkat et! (warning) fields
  3. Completing the final step navigates to celebration screen
  4. Post-cook star rating is submitted and stored with recipe ID and timestamp
  5. Completion writes to Geçmiş — partial cooks are not logged
  6. Exit triggers confirmation modal; nav bar hidden during cooking

### Phase 12: Sef'im (AI Companion)
**Goal**: Build the AI chef companion that lives inside cooking mode — context-aware, always one tap away, with pre-loaded answers and live AI fallback
**Depends on**: Phase 11
**Requirements**: COOKX-04, COOKX-05
**Success Criteria** (what must be TRUE):
  1. Each step has 3 pre-loaded question-answer chips (stored at recipe creation time)
  2. Tapping Şef'im opens a bottom sheet showing recipe + step context
  3. Chip taps return instant pre-written answers (no AI call)
  4. Open text and voice input trigger live AI call with full context (recipe, step, skill, swaps)
  5. Pulse animation triggers when user lingers on a step beyond average duration
  6. Şef'im redirects off-topic questions back to the recipe

## Progress

**Execution Order:**
Phases 1–6 complete. Phases 7–12 represent the product evolution toward the full v1 vision.
Phase 8 and Phase 9 can run in parallel (both depend on Phase 7 only).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 5/5 | Complete    | 2026-03-09 |
| 2. Profile and Auth | 8/8 | Complete   | 2026-03-10 |
| 3. Content Library | 3/3 | Complete   | 2026-03-11 |
| 4. Recipe Discovery | 6/6 | Complete   | 2026-03-12 |
| 5. Guided Cooking Mode | 3/3 | Complete   | 2026-03-14 |
| 6. Wire Equipment to Recipe Discovery | 3/3 | Complete   | 2026-03-14 |
| 7. Foundation Pivot | 3/3 | Complete   | 2026-03-17 |
| 8. Feed Redesign | 3/3 | Complete   | 2026-03-17 |
| 9. Search & Category Redesign | 0/3 | Planned | — |
| 10. Recipe Detail Evolution | 0/0 | Pending | — |
| 11. Cooking Mode Evolution | 0/0 | Pending | — |
| 12. Şef'im (AI Companion) | 0/0 | Pending | — |
