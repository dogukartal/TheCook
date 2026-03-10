# Phase 3: Content Library - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Author and bundle 30–50 hand-curated Turkish recipes into the app binary. The recipe schema, YAML authoring format, CLI validator, and build pipeline are already complete from Phase 1. Three test recipes (menemen, mercimek-corbasi, borek) already exist and count toward the total. Phase 3 adds the remaining 27–47 recipes to reach the 30+ target. Recipe discovery UI, cooking mode, and AI features are out of scope for this phase.

</domain>

<decisions>
## Implementation Decisions

### Recipe selection
- No pre-set list — Hira decides which recipes to author based on what she knows best
- Phase 4 (Discovery) can begin with however many recipes exist at that point — no hard minimum gate between phases
- The 3 existing test recipes (menemen, mercimek-corbasi, borek) count as-is toward the 30+ total; no revision required

### Image strategy
- All `coverImage` fields: `null` for v1 — recipes ship without cover photos; UI will show a placeholder
- All `stepImage` fields: `null` for v1 — step images are a future enhancement; cooking mode works on text annotations
- Schema already supports null in both fields — no changes needed

### Authoring ownership
- Hira writes all YAML recipe files herself using the authoring guide from Phase 1
- The only QA gate is `npm run validate-recipes` passing — Hira is the content authority and self-reviews
- The existing authoring guide is sufficient for unblocking YAML syntax issues (e.g., colon in instructions uses `>-` block scalar)
- Developer role in this phase: run the build pipeline, bundle recipes.json, verify seeding works

### Skill level distribution
- Target: ~70% beginner, ~25% intermediate, ~5% advanced
- Hira tags each recipe honestly based on actual difficulty — tags are not forced to hit ratios, but this is the guiding intent

### Category coverage
- All 6 categories must have at least 1 recipe before the phase is done:
  `kahvaltı`, `çorba`, `ana yemek`, `tatlı`, `salata`, `aperatif`
- This ensures Phase 4 discovery filters don't show empty category states

### Allergen coverage
- No specific allergen distribution required — Hira tags allergens accurately; the distribution reflects what Turkish cuisine naturally offers
- Nice-to-have: some gluten-free, dairy-free, egg-free options, but not a hard requirement

### Claude's Discretion
- Exact order recipes are authored (Hira's call)
- How the build pipeline integrates into the CI/prebuild step (already established in Phase 1)
- Whether to add a count check to the validator (e.g., warn if < 30 recipes)

</decisions>

<specifics>
## Specific Ideas

- The authoring guide must document the `>-` YAML block scalar for instructions containing colons — already documented in Phase 1 guide
- Existing test recipes validated the schema against 3 real Turkish dishes; schema is confirmed stable with 0 field changes needed
- Recipe data in SQLite is seeded from `app/assets/recipes.json` — the `seed_version` sentinel prevents re-seeding on restart

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TheCook/content/recipes/*.yaml`: 3 production-ready recipes (menemen, mercimek-corbasi, borek) — already meeting schema; 27+ more needed
- `TheCook/scripts/validate-recipes.ts`: CLI validator using Zod RecipeSchema — `npm run validate-recipes` is the authoring QA gate
- `TheCook/scripts/build-recipes.ts`: Converts `content/recipes/*.yaml` → `app/assets/recipes.json` at build time
- `TheCook/src/types/recipe.ts`: RecipeSchema (Zod v4) with all enums locked — no changes needed for Phase 3

### Established Patterns
- YAML block scalar (`>-`) required for step `instruction` fields containing colons — documented in authoring guide
- `ingredientGroups: [{ label: null, items: [...] }]` — even single-group recipes use this structure
- `allergens` enum closed set: `"gluten" | "dairy" | "egg" | "nuts" | "shellfish" | ...`
- `equipment` enum closed set: `"fırın" | "blender" | "döküm tava" | ...`
- `category` enum: `"ana yemek" | "kahvaltı" | "çorba" | "tatlı" | "salata" | "aperatif"`
- `skillLevel`: `"beginner" | "intermediate" | "advanced"`

### Integration Points
- Completed recipes.json is bundled as `app/assets/recipes.json` → SQLite seed on first launch
- `seed_version` sentinel row (id=1) in SQLite prevents re-seeding on restart — any new recipes require a version bump in the seed script

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-content-library*
*Context gathered: 2026-03-10*
