# Phase 1: Foundation - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Bootstrap the Expo project so it runs on iOS and Android, lock the TypeScript recipe data schema and validate it against 2–3 hand-authored test recipes, initialize SQLite on first launch with seed data from a bundled JSON file, and deliver a content authoring pipeline (YAML files + validator + guide) so Hira can write recipes without developer involvement.

Content authoring, user profile, and all discovery/cooking features are out of scope for this phase.

</domain>

<decisions>
## Implementation Decisions

### Ingredient modeling
- Ingredients are structured objects: `{ name, amount, unit, optional }`
- `unit` is a defined TypeScript enum (not free string): `"gr" | "ml" | "adet" | "yemek kaşığı" | "tatlı kaşığı" | "su bardağı" | "demet" | "dilim" | "tutam"`
- `optional` is a boolean flag on the ingredient object (not a separate array)
- Recipes always use `ingredientGroups: [{ label: string | null, items: Ingredient[] }]` — single-group recipes use `label: null`, never a flat `ingredients[]` array

### Allergen modeling
- Allergens are enum tags on the recipe (not per-ingredient): `allergens: AllergenTag[]`
- Closed enum list (e.g., `"gluten" | "dairy" | "egg" | "nuts" | "shellfish" | ...`) — required for reliable Phase 4 allergen filtering

### Equipment modeling
- Equipment requirements use a defined enum (not free strings): `equipment: Equipment[]`
- Same enum is used in Phase 2 user profile declaration — required for the match to work
- Examples: `"fırın" | "blender" | "döküm tava" | "stand mixer" | "wok" | "su ısıtıcı"`

### Schema fields to lock in Phase 1
Beyond CONT-02 fields (step list, allergens, skill level, equipment, ingredients), also lock:
- `prepTime: number` (minutes) + `cookTime: number` (minutes) — derived `totalTime` computed at runtime
- `servings: number`
- `category` enum: `"ana yemek" | "kahvaltı" | "çorba" | "tatlı" | "salata" | "aperatif"`
- `mealType` enum: `"breakfast" | "lunch" | "dinner" | "snack"`
- `cuisine` field (e.g., `"türk"`)
- `coverImage: string | null` — filename pointing to `content/images/`
- `stepImage: string | null` on each step — nullable, pointing to `content/images/`

### Content authoring format
- Hira writes recipes as **YAML files** (not JSON, not Google Sheets)
- Files live in `content/recipes/*.yaml`
- Step images and cover photos live in `content/images/`
- A **CLI validator** (`npm run validate-recipes`) validates all YAML files against the TypeScript schema and prints clear error messages per file/field — Hira can run it herself
- A **build script** (`scripts/build-recipes.ts`) auto-converts `content/recipes/*.yaml` → `app/assets/recipes.json` at build time (`prebuild` hook); Hira never touches JSON

### Project structure
- Clear separation: `app/` for Expo code, `content/` for recipe files, `scripts/` for build/validate tooling
- The compiled `recipes.json` is bundled as an app asset

### Database library
- **expo-sqlite** — built-in to Expo, no extra native setup, ideal for this read-heavy offline use case
- WatermelonDB deferred — not needed until sync/scale milestone

### Database seeding strategy
- On first launch: check `seed_version` table; if absent or outdated, read bundled `recipes.json` and insert all rows into SQLite
- Version-based re-seed: bundled `seed_version` string compared on each launch; if newer, truncate + re-seed
- After seeding: all reads go through SQLite (no JSON parsing per query)

### Claude's Discretion
- TypeScript strictness configuration
- Exact SQLite table schema (normalization strategy, indexing)
- Expo Router vs React Navigation (navigation library choice for Phase 1 bootstrapping)
- Exact allergen enum values beyond common ones
- Exact equipment enum values beyond examples above
- Step timer fields in schema (whether to lock timer duration per step now or defer to Phase 5)

</decisions>

<specifics>
## Specific Ideas

- Hira is the sole content author and is not a developer — the authoring guide must explain everything without assuming git or code knowledge
- The validator error messages must be human-readable (field names in plain language, not TypeScript jargon)
- Schema must be validated against 2–3 real test recipes (e.g., menemen, mercimek çorbası) before Phase 3 content authoring begins — no field changes allowed after content is written

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — project is a fresh Expo bootstrap; no existing components or utilities

### Established Patterns
- None yet — patterns established in this phase become the conventions for all subsequent phases

### Integration Points
- `content/recipes/*.yaml` → `scripts/build-recipes.ts` → `app/assets/recipes.json` → SQLite seed on first launch
- TypeScript schema types defined in Phase 1 are imported by all subsequent phases

</code_context>

<deferred>
## Deferred Ideas

- None raised during discussion — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-08*
