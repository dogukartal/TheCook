# Phase 3: Content Library - Research

**Researched:** 2026-03-10
**Domain:** YAML recipe authoring, build pipeline integration, SQLite seed versioning
**Confidence:** HIGH

## Summary

Phase 3 is a content authoring phase, not a feature development phase. The entire technical infrastructure — schema, validator, build script, seed mechanism — was completed in Phase 1 and is confirmed stable. The only engineering work is: (1) bump `SEED_VERSION` in `src/db/seed.ts` so the new recipes seed on first launch after install, and (2) run `npm run build-recipes` to regenerate `app/assets/recipes.json` after all YAML files are authored. All remaining work is Hira authoring 27+ YAML recipe files and running `npm run validate-recipes` to self-QA.

The single non-trivial risk is the `seed_version` sentinel: the current `SEED_VERSION = "1.0.0"` was set when 3 recipes were seeded. Adding 27+ new recipes without bumping this version means the new recipes will never be seeded into SQLite on existing devices — they will be in `recipes.json` but the seed logic will see version "1.0.0" already present and skip. The developer must bump to `"2.0.0"` before the final build.

**Primary recommendation:** Developer bumps `SEED_VERSION` to `"2.0.0"` in `src/db/seed.ts`, Hira authors 27+ YAML files passing `npm run validate-recipes`, then developer runs `npm run build-recipes` and verifies all 30+ recipes appear in the seeded SQLite DB.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- No pre-set recipe list — Hira decides which recipes to author based on what she knows best
- Phase 4 can begin with however many recipes exist — no hard minimum gate between phases
- The 3 existing test recipes (menemen, mercimek-corbasi, borek) count as-is; no revision required
- All `coverImage` fields: `null` for v1 — no cover photos; UI shows placeholder
- All `stepImage` fields: `null` for v1 — step images are a future enhancement
- Schema already supports null in both fields — no changes needed
- Hira writes all YAML recipe files herself using the authoring guide from Phase 1
- The only QA gate is `npm run validate-recipes` passing — Hira is the content authority and self-reviews
- Developer role in this phase: run the build pipeline, bundle recipes.json, verify seeding works
- Target skill distribution: ~70% beginner, ~25% intermediate, ~5% advanced (guiding intent, not hard ratio)
- All 6 categories must have at least 1 recipe before phase is done: `kahvaltı`, `çorba`, `ana yemek`, `tatlı`, `salata`, `aperatif`
- No specific allergen distribution required — natural reflection of Turkish cuisine

### Claude's Discretion
- Exact order recipes are authored (Hira's call)
- How the build pipeline integrates into the CI/prebuild step (already established in Phase 1)
- Whether to add a count check to the validator (e.g., warn if < 30 recipes)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-01 | App ships with 30–50 hand-curated beginner-friendly Turkish recipes | 3 recipes already exist; 27+ more needed; build pipeline is ready; seed version bump required to load all recipes into SQLite |
</phase_requirements>

## Standard Stack

### Core (already installed — no new dependencies)

| Tool | Version | Purpose | Status |
|------|---------|---------|--------|
| `yaml` npm package | existing | Parse `.yaml` files in validate/build scripts | Installed in Phase 1 |
| `tsx` | existing | Run TypeScript scripts directly (`validate-recipes.ts`, `build-recipes.ts`) | Installed in Phase 1 |
| `zod` v4 | existing | `RecipeSchema.safeParse()` — validation at build time | Installed in Phase 1 |
| `expo-sqlite` v2 | existing | SQLite seed target — `seedIfNeeded()` called on app launch | Installed in Phase 1 |

**No new packages needed.** Phase 3 is pure content + one code edit.

### Build Commands (established in Phase 1)

```bash
# Hira's QA gate — run after every recipe authored
npm run validate-recipes

# Developer runs once after all recipes authored
npm run build-recipes

# Prebuild automatically runs build-recipes
npm run prebuild
```

## Architecture Patterns

### Recipe Authoring Flow

```
1. Hira copies menemen.yaml → new-recipe.yaml in TheCook/content/recipes/
2. Hira fills all fields, uses >- block scalar for instructions containing colons
3. Hira runs `npm run validate-recipes` — iterates until "All recipes valid."
4. Repeat for each recipe until 30+ total
5. Developer bumps SEED_VERSION in src/db/seed.ts ("1.0.0" → "2.0.0")
6. Developer runs `npm run build-recipes` → regenerates app/assets/recipes.json
7. Developer launches app on device/simulator — confirms 30+ recipes in SQLite
```

### File Locations (locked from Phase 1)

```
TheCook/
├── content/
│   └── recipes/           # Hira's YAML files — source of truth
│       ├── menemen.yaml           # existing ✓
│       ├── mercimek-corbasi.yaml  # existing ✓
│       ├── borek.yaml             # existing ✓
│       └── [27+ new files].yaml   # Phase 3 deliverable
├── app/
│   └── assets/
│       └── recipes.json   # Generated output — do NOT edit by hand
└── src/
    └── db/
        └── seed.ts        # SEED_VERSION must be bumped to "2.0.0"
```

### Seed Version Pattern (CRITICAL)

```typescript
// src/db/seed.ts — CURRENT (Phase 1):
const SEED_VERSION = "1.0.0";

// src/db/seed.ts — REQUIRED for Phase 3:
const SEED_VERSION = "2.0.0";
```

The `seedIfNeeded()` function checks if `seed_version` row exists with matching version. If the current device already has `"1.0.0"`, it will NOT re-seed even though `recipes.json` now has 30+ recipes. Bumping to `"2.0.0"` triggers a full re-seed (DELETE + re-INSERT all recipes).

### YAML Authoring Patterns (from existing recipes)

**Single ingredient group (all recipes so far):**
```yaml
ingredientGroups:
  - label: null
    items:
      - name: Soğan
        amount: 1
        unit: adet
        optional: false
```

**Multi-group recipe (e.g., börek with dough + filling):**
```yaml
ingredientGroups:
  - label: Hamur için
    items:
      - name: Un
        amount: 3
        unit: su bardağı
        optional: false
  - label: İç için
    items:
      - name: Beyaz peynir
        amount: 200
        unit: gr
        optional: false
```

**Instruction with colon — requires block scalar:**
```yaml
steps:
  - instruction: >-
      Malzemeleri ekleyin: un, yağ ve tuz.
    why: ...
```

**Step with no timer:**
```yaml
    timerSeconds: null
```

**Step with timer (always in seconds):**
```yaml
    timerSeconds: 300   # 5 minutes
```

### Category Coverage Constraint

All 6 categories must be represented before phase is complete:

| Category | Current | Needed |
|----------|---------|--------|
| `kahvaltı` | menemen ✓ | covered |
| `çorba` | mercimek-corbasi ✓ | covered |
| `ana yemek` | borek (aperatif?) | verify — borek might be `aperatif` |
| `tatlı` | — | at least 1 needed |
| `salata` | — | at least 1 needed |
| `aperatif` | borek ✓ | verify borek's category |

> Note: borek.yaml's category field should be verified. If it is `ana yemek`, then `aperatif` still needs a recipe. If it is `aperatif`, then `ana yemek` still needs a recipe.

### Anti-Patterns to Avoid

- **Using Turkish characters in filenames:** `karnıyarık.yaml` is wrong; use `karniyarik.yaml`
- **Using `ingredients:` instead of `ingredientGroups:`:** Schema rejects flat ingredients array — always use `ingredientGroups`
- **Omitting any step field:** All 7 step fields (`instruction`, `why`, `looksLikeWhenDone`, `commonMistake`, `recovery`, `stepImage`, `timerSeconds`) are required — even nullable ones must be present as `null`
- **Inventing new enum values:** All enum values (`allergens`, `equipment`, `unit`, `category`, `mealType`, `skillLevel`) are closed sets defined in `src/types/recipe.ts`; validator will reject anything not in the list
- **Forgetting to bump SEED_VERSION:** New recipes in `recipes.json` that are never seeded = recipes invisible to users

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Recipe validation | Custom parser | `npm run validate-recipes` | Already built in Phase 1; Zod gives precise field-level errors |
| JSON bundling | Manual JSON editing | `npm run build-recipes` | Already built in Phase 1; validates all recipes before writing |
| Re-seed logic | DB migration script | Bump `SEED_VERSION` constant | Already built in Phase 1; DELETE + re-INSERT pattern is atomic |

**Key insight:** All developer tooling for Phase 3 is complete. The only code change is a one-line constant bump.

## Common Pitfalls

### Pitfall 1: Forgetting to Bump SEED_VERSION
**What goes wrong:** App launches, reads `seed_version WHERE id=1`, finds `"1.0.0"` already present, returns early — 30+ recipes in `recipes.json` but SQLite still has only 3.
**Why it happens:** `seedIfNeeded()` is designed to prevent re-seeding on every restart; the sentinel must be bumped to signal "new data available."
**How to avoid:** Developer bumps `SEED_VERSION` from `"1.0.0"` to `"2.0.0"` in `src/db/seed.ts` before running `npm run build-recipes`.
**Warning signs:** App shows 3 recipes after update instead of 30+.

### Pitfall 2: Duplicate Recipe IDs
**What goes wrong:** Two YAML files with the same `id` field; the second one silently overwrites the first in the JSON output (or causes downstream SQL issues since `id` is likely a primary key).
**Why it happens:** Hira copies `menemen.yaml` as a template and forgets to change the `id` field.
**How to avoid:** Always update `id` to match the new filename (kebab-case, no Turkish characters).
**Warning signs:** `npm run build-recipes` doesn't warn about duplicates — verify count in output matches expected file count.

### Pitfall 3: Turkish Characters in Enum Values
**What goes wrong:** Hira writes `category: çorba` correctly but writes `equipment: çırpici` (missing ı) — validator rejects with `Invalid enum value`.
**Why it happens:** Turkish special characters are required verbatim for enum values but auto-correct or keyboard differences cause subtle typos.
**How to avoid:** Copy-paste enum values from the Quick Reference section of AUTHORING-GUIDE.md rather than typing them.
**Warning signs:** Validator error `Invalid enum value. Expected 'fırın' | 'blender' | ...`

### Pitfall 4: Missing Required Step Fields With `null` Values
**What goes wrong:** Hira omits `stepImage` or `timerSeconds` entirely (rather than writing `null`) — Zod treats absent nullable-with-default fields as missing and may not apply the default when parsing YAML.
**Why it happens:** YAML parsers don't apply Zod defaults for truly absent keys in all cases.
**How to avoid:** Always write `stepImage: null` and `timerSeconds: null` explicitly on every step where those fields don't apply.
**Warning signs:** Validator error `Field "steps > N > stepImage": Required`.

### Pitfall 5: Category Coverage Gap Blocks Phase 4
**What goes wrong:** Phase 3 closes with all 6 categories showing at least 1 recipe — but Discovery UI in Phase 4 has been built expecting all 6 categories to have content. Empty category = empty state UI that was never designed.
**Why it happens:** Easy to author many recipes in familiar categories (kahvaltı, çorba, ana yemek) and defer tatlı/salata/aperatif.
**How to avoid:** Ensure at least 1 recipe per category exists before marking phase complete. Verify coverage with a simple count query or by scanning YAML filenames.

## Code Examples

### Count Check (discretionary enhancement to validator)
The CONTEXT.md notes it's at Claude's discretion whether to add a recipe count check to the validator. If added, it would look like:

```typescript
// At end of validate-recipes.ts, after error check:
if (!hasErrors) {
  console.log(`\nAll ${files.length} recipes valid.`);
  if (files.length < 30) {
    console.warn(`Warning: only ${files.length} recipes — target is 30+`);
  }
  process.exit(0);
}
```

This is a low-risk, high-value addition: gives Hira visible progress feedback without blocking her if she validates mid-authoring with fewer than 30 recipes.

### Verify Category Coverage (developer check)
```bash
# Quick category audit — run from TheCook/ directory
grep -h "^category:" content/recipes/*.yaml | sort | uniq -c | sort -rn
```
Expected output when phase is complete:
```
  N  category: ana yemek
  N  category: kahvaltı
  1  category: çorba
  1  category: tatlı
  1  category: salata
  1  category: aperatif
```

### Seed Version Bump (the one required code change)
```typescript
// File: TheCook/src/db/seed.ts
// Change line 8 from:
const SEED_VERSION = "1.0.0";
// To:
const SEED_VERSION = "2.0.0";
```

### Verify SQLite Seeding (developer integration check)
After running `npm run build-recipes` and launching the app in a fresh simulator:
```javascript
// In Expo Go or dev build — run via a debug screen or Expo DevTools:
// SELECT COUNT(*) FROM recipes;
// Expected: 30+ rows
```

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + jest-expo ~54.0.17 |
| Config file | `TheCook/package.json` (`"jest": { "preset": "jest-expo" }`) |
| Quick run command | `cd TheCook && npx jest --testPathPattern="schema|validator|buildScript|seed" --no-coverage` |
| Full suite command | `cd TheCook && npx jest --no-coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-01 | 30+ recipes pass schema validation | integration | `cd TheCook && npm run validate-recipes` | ✓ (validate-recipes CLI tested in `__tests__/validator.test.ts`) |
| CONT-01 | build-recipes.ts produces valid recipes.json | integration | `cd TheCook && npm run build-recipes` | ✓ (`__tests__/buildScript.test.ts`) |
| CONT-01 | seed.ts loads all recipes into SQLite on first launch | unit | `cd TheCook && npx jest __tests__/seed.test.ts --no-coverage` | ✓ (`__tests__/seed.test.ts`) |
| CONT-01 | RecipeSchema validates all required step fields | unit | `cd TheCook && npx jest __tests__/schema.test.ts --no-coverage` | ✓ (`__tests__/schema.test.ts`) |

### Sampling Rate
- **Per recipe authored:** `npm run validate-recipes` (Hira runs this herself as QA gate)
- **Per wave merge:** `cd TheCook && npx jest --no-coverage`
- **Phase gate:** All 30+ recipes pass `npm run validate-recipes`; all tests green; device/simulator shows 30+ recipes after fresh install

### Wave 0 Gaps

One new test scenario that doesn't exist yet but adds meaningful coverage:

- [ ] `TheCook/__tests__/seed.test.ts` — add test: "seeds new version when SEED_VERSION bumped (version mismatch triggers re-seed)" — covers the version bump path critical to Phase 3 delivery

This gap is LOW severity because the existing "seeds on first launch" test covers the seeding logic. The version mismatch case (existing `"1.0.0"` row → new `"2.0.0"` → re-seed) is functionally the same code path since `existing?.version !== SEED_VERSION` is true in both cases.

## State of the Art

| Aspect | Current Approach | Notes |
|--------|------------------|-------|
| Validation | Zod v4 `safeParse` via CLI script | Stable — no changes needed |
| Bundling | Build-time YAML → JSON via tsx script | Stable — no changes needed |
| Seeding | `seedIfNeeded()` with sentinel row + `withTransactionAsync` | Stable — only change is SEED_VERSION constant |
| Content authoring | Hand-authored YAML by Hira | Correct for v1 (AI generation is v2 deferred) |

## Open Questions

1. **borek.yaml category**
   - What we know: borek was created in Phase 1 as a test recipe
   - What's unclear: Whether its `category` is `ana yemek` or `aperatif` — this determines which of those two categories still needs a recipe for the phase-complete coverage requirement
   - Recommendation: Check `TheCook/content/recipes/borek.yaml` category field before counting which categories are already covered

2. **Count check in validator (Claude's Discretion)**
   - What we know: CONTEXT.md marks this as Claude's discretion
   - What's unclear: Whether Hira would find it confusing to see a warning when validating mid-authoring with fewer than 30 recipes
   - Recommendation: Add the count warning (not an error) — it's informational and does not block validation; gives Hira clear progress signal

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `TheCook/src/db/seed.ts` — seed version mechanism confirmed
- Direct code inspection: `TheCook/scripts/validate-recipes.ts` — CLI validator behavior confirmed
- Direct code inspection: `TheCook/scripts/build-recipes.ts` — build pipeline behavior confirmed
- Direct code inspection: `TheCook/src/types/recipe.ts` — all enum values and schema fields confirmed
- Direct code inspection: `TheCook/content/recipes/menemen.yaml`, `mercimek-corbasi.yaml` — YAML pattern confirmed
- Direct code inspection: `TheCook/content/AUTHORING-GUIDE.md` — authoring workflow confirmed
- Direct code inspection: `TheCook/__tests__/seed.test.ts`, `validator.test.ts`, `buildScript.test.ts`, `schema.test.ts` — existing test coverage confirmed

### Secondary (MEDIUM confidence)
- `.planning/phases/03-content-library/03-CONTEXT.md` — user decisions and constraints
- `.planning/STATE.md` — accumulated project decisions confirming Phase 1 infrastructure

### Tertiary (LOW confidence)
- None — all claims verified from source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools verified from installed code; no new dependencies
- Architecture: HIGH — seed pattern, build pipeline, YAML format verified from source
- Pitfalls: HIGH — seed version pitfall verified by reading `seedIfNeeded()` implementation directly
- Content strategy: HIGH — constraints locked by CONTEXT.md user decisions

**Research date:** 2026-03-10
**Valid until:** 2026-06-10 (stable domain — schema is locked, no fast-moving dependencies in scope)
