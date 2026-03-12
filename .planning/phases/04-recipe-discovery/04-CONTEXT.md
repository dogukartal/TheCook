# Phase 4: Recipe Discovery - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can find recipes three ways: (1) ingredient-based search with multi-chip input, (2) browsing a skill-ordered feed, (3) filtering by category, cuisine, cook time, and skill level. Users can bookmark any recipe and find it in a personal saved list. Allergen-incompatible recipes are automatically hidden from all surfaces. Cooking mode (step-by-step guidance) is out of scope — that is Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Navigation structure
- Replace the current three placeholder tabs (Home, Explore, Settings) with: **Feed**, **Search**, **My Kitchen**
- **Feed tab**: Primary discovery surface — top tabs "Trending" and "For You", horizontal category filter chips below, 2-column recipe grid
- **Search tab**: Smart search bar at top, autocomplete suggestions, ingredient chips area, 2-column recipe grid results, recently viewed row-cards when idle
- **My Kitchen tab**: Profile section at top with gear icon (account details, cooking level, dietary preferences, allergens, kitchen tools in a sub-screen) + saved recipes section below. Replaces the current Settings tab — Settings screen functionality is absorbed here

### Feed tabs
- **Trending**: Handpicked featured order — Hira decides a curated display order baked into the app. Works fully offline, no server needed
- **For You**: Recipes ordered by user's skill level match (beginner first for beginner users). If no skill level set (onboarding incomplete), show all recipes beginner-first — no prompt or empty state

### Recipe card — Feed (2-column grid)
- Category-based gradient/color placeholder backgrounds — no real cover photos in v1 (all `coverImage` null)
- Title overlaid on image area; bookmark icon (♡) at top-right of card
- Below image: truncated description (with "..." at character limit) + skill badge (bottom-left) + cook time

### Recipe card — Search results (2-column grid)
- Same 2-column grid style as Feed cards
- Used for both ingredient search results and direct meal name search results

### Recipe card — Recently viewed (row card)
- One-column vertical list in Search tab when no search active
- Image on left, title + skill level + cook time on the right

### Ingredient search UX
- One smart search bar — no mode toggle between "ingredient search" and "recipe search"
- As user types, autocomplete shows matching ingredient names AND recipe names from the DB
- Selecting an ingredient name → becomes a pinned chip below the search bar (with × cancel button); search bar clears for next entry
- Selecting a recipe name → navigates directly to recipe detail
- Multiple ingredient chips active simultaneously: AND logic first — recipes must contain ALL listed ingredients
- Fallback: if 0 recipes match all ingredients, show partial matches ranked by ingredient overlap count
- **Turkish morphology resolved**: autocomplete is built from actual ingredient names stored in recipe DB — user always selects a canonical name, no fuzzy matching or NLP library needed

### Filter presentation
- Horizontal scrollable chip row below Feed's Trending/For You tabs: Hepsi, Kahvaltı, Çorba, Ana Yemek, Tatlı, Salata, Aperatif
- Small down-arrow (▼) at end of chip row opens an advanced filter panel:
  - Cuisine: Türk / Dünya
  - Cook time: < 15 dk / 15–30 dk / 30+ dk
  - Skill level: Başlangıç / Orta / İleri

### Allergen filtering
- Automatic and silent — never a user-facing filter
- Any recipe whose `allergens` array intersects with the user's declared allergens is excluded from all discovery surfaces (feed, search results, filter results)
- User with no allergens declared sees all recipes

### Bookmarks
- Bookmark action: ♡ icon on every recipe card (tap to toggle)
- Saved recipes surface: section in My Kitchen tab below the profile section
- Uses the existing `bookmarks` SQLite table — just needs UI
- Available offline; syncs to cloud when user has an account (Phase 2 sync already handles this)

### Claude's Discretion
- Exact gradient/color palette per category (as long as consistent and on-brand with terracotta `#E07B39`)
- Empty state designs (no results, empty bookmarks)
- Exact character limit for truncated description on feed cards
- Loading skeleton / shimmer approach
- Animation and transition details between screens
- Recent views storage mechanism (new SQLite table or AsyncStorage)

</decisions>

<specifics>
## Specific Ideas

- Feed card image area with title overlay feels like a food app (not a list app) — gradient placeholder keeps the visual even without real photos
- Ingredient chip pinning: after picking from autocomplete, bar clears immediately — user should feel like they're building a shopping-basket-style list
- My Kitchen gear icon opens a settings sub-screen, not a modal — matches the established pattern from Phase 2 where settings changes are immediate (no Save button)
- The ▼ advanced filter affordance keeps the main filter row clean while surfacing power-user controls on demand

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/chip.tsx`: `Chip` component with brand terracotta (`#E07B39`) selected state — use directly for category filter chips and ingredient chips
- `src/types/recipe.ts`: `CategoryEnum`, `SkillLevelEnum`, `AllergenTagEnum`, `MealTypeEnum` — all enums needed for filtering are already exported
- `src/types/profile.ts`: `Profile` type with `allergens` and `skillLevel` — feed ordering and allergen filtering reads from this
- `src/db/client.ts`: SQLite schema already includes indexes on `skill_level` and `category` (created in migration v1) — filter queries are fast
- `src/db/client.ts`: `bookmarks` table already exists with `recipe_id`, `user_id`, `created_at` — bookmark UI just needs DB reads/writes
- `app/(tabs)/_layout.tsx`: Needs to be updated — rename tabs from (Home, Explore, Settings) to (Feed, Search, My Kitchen)
- `app/(tabs)/index.tsx`: Placeholder "coming soon" screen — replace with Feed implementation
- `app/(tabs)/explore.tsx`: Placeholder — replace with Search implementation
- `app/(tabs)/settings.tsx`: Existing Settings screen — refactor into My Kitchen screen

### Established Patterns
- `expo-sqlite` v2 API (`useSQLiteContext`) — all DB reads for recipes, profile, and bookmarks follow this pattern
- Zod `z.infer<typeof Schema>` — any new types for discovery (e.g., recent views) should follow this pattern
- Expo Router file-based routing — new sub-screens (recipe detail, advanced filters) added as new route files
- `Chip` with immediate-save UX (no Save button) — filter state applies immediately on tap, consistent with Phase 2 settings

### Integration Points
- `profile.allergens` → SQL WHERE filter: exclude recipes where stored allergens JSON overlaps with user's list
- `profile.skillLevel` → "For You" ORDER BY: beginner recipes first for beginner users; null skill_level → treat as beginner
- `bookmarks` table → My Kitchen saved recipes section; join with `recipes` table to display recipe info
- Ingredient autocomplete → build from `recipes` SQLite table: extract all unique ingredient names from `ingredient_groups` JSON column
- Tab navigation restructure → `app/(tabs)/_layout.tsx` updated; `settings.tsx` route replaced by `my-kitchen.tsx`

</code_context>

<deferred>
## Deferred Ideas

- Recipe cooking mode (step-by-step guidance) — Phase 5
- Cover photos for recipe cards — deferred beyond v1; Phase 3 decision holds (null for v1, placeholder gradients in Phase 4 UI)

</deferred>

---

*Phase: 04-recipe-discovery*
*Context gathered: 2026-03-12*
