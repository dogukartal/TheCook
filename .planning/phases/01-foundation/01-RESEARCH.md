# Phase 1: Foundation - Research

**Researched:** 2026-03-08
**Domain:** Expo SDK 52 / TypeScript / expo-sqlite / Zod / YAML content pipeline
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Ingredient modeling**
- Ingredients are structured objects: `{ name, amount, unit, optional }`
- `unit` is a defined TypeScript enum (not free string): `"gr" | "ml" | "adet" | "yemek kaşığı" | "tatlı kaşığı" | "su bardağı" | "demet" | "dilim" | "tutam"`
- `optional` is a boolean flag on the ingredient object (not a separate array)
- Recipes always use `ingredientGroups: [{ label: string | null, items: Ingredient[] }]` — single-group recipes use `label: null`, never a flat `ingredients[]` array

**Allergen modeling**
- Allergens are enum tags on the recipe (not per-ingredient): `allergens: AllergenTag[]`
- Closed enum list (e.g., `"gluten" | "dairy" | "egg" | "nuts" | "shellfish" | ...`) — required for reliable Phase 4 allergen filtering

**Equipment modeling**
- Equipment requirements use a defined enum (not free strings): `equipment: Equipment[]`
- Same enum is used in Phase 2 user profile declaration — required for the match to work
- Examples: `"fırın" | "blender" | "döküm tava" | "stand mixer" | "wok" | "su ısıtıcı"`

**Schema fields to lock in Phase 1**
Beyond CONT-02 fields (step list, allergens, skill level, equipment, ingredients), also lock:
- `prepTime: number` (minutes) + `cookTime: number` (minutes) — derived `totalTime` computed at runtime
- `servings: number`
- `category` enum: `"ana yemek" | "kahvaltı" | "çorba" | "tatlı" | "salata" | "aperatif"`
- `mealType` enum: `"breakfast" | "lunch" | "dinner" | "snack"`
- `cuisine` field (e.g., `"türk"`)
- `coverImage: string | null` — filename pointing to `content/images/`
- `stepImage: string | null` on each step — nullable, pointing to `content/images/`

**Content authoring format**
- Hira writes recipes as YAML files (not JSON, not Google Sheets)
- Files live in `content/recipes/*.yaml`
- Step images and cover photos live in `content/images/`
- A CLI validator (`npm run validate-recipes`) validates all YAML files against the TypeScript schema and prints clear error messages per file/field — Hira can run it herself
- A build script (`scripts/build-recipes.ts`) auto-converts `content/recipes/*.yaml` → `app/assets/recipes.json` at build time (`prebuild` hook); Hira never touches JSON

**Project structure**
- Clear separation: `app/` for Expo code, `content/` for recipe files, `scripts/` for build/validate tooling
- The compiled `recipes.json` is bundled as an app asset

**Database library**
- expo-sqlite — built-in to Expo, no extra native setup, ideal for this read-heavy offline use case
- WatermelonDB deferred — not needed until sync/scale milestone

**Database seeding strategy**
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

### Deferred Ideas (OUT OF SCOPE)
- None raised during discussion — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-02 | Each recipe contains structured metadata: step list (each with instruction, why, looks-like-when-done, common mistake, recovery), allergen flags, skill level tag, equipment requirements, ingredient list with quantities | Zod schema patterns, TypeScript enum modeling, YAML authoring pipeline, expo-sqlite seeding all support full CONT-02 implementation |
</phase_requirements>

---

## Summary

Phase 1 bootstraps the entire project's data layer. The core technical challenge is not building an app — it is defining a TypeScript schema that is robust enough that no field changes are needed once Hira begins authoring 30–50 recipes in Phase 3. Every subsequent phase imports these types, so the schema is the most consequential decision in this phase.

The technology stack is well-established and compatible. Expo SDK 52 with the New Architecture enabled by default is the current standard. expo-sqlite (the v2 API, available since SDK 50) provides `SQLiteProvider` and `useSQLiteContext` — a clean, context-based API that eliminates global database singletons. Zod 4 (stable since May 2025) is the standard for TypeScript-first schema validation and is the right tool for both validating YAML files at authoring time and enforcing shape at seeding time. The YAML authoring pipeline (js-yaml or the `yaml` package + Zod + tsx runner) is a well-understood pattern.

The key architectural decision left to Claude's discretion — which navigation library to bootstrap with — should favor Expo Router: it is what `create-expo-app` installs by default, is actively recommended by the Expo team for new projects, and costs nothing to have present even if Phase 1 only shows a single placeholder screen.

**Primary recommendation:** Bootstrap with `create-expo-app` (Expo Router template), enable TypeScript strict mode, define all enums and the Recipe type in a shared `src/types/` module using Zod schemas (so the same definition validates YAML and infers TypeScript types), seed SQLite on first launch via the `onInit` migration pattern checking `PRAGMA user_version`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo | SDK 52 | React Native framework + managed workflow | Current stable SDK; New Architecture enabled by default |
| react-native | 0.76.x | Native layer | Bundled with Expo SDK 52 |
| typescript | ~5.3 | Type safety | Bundled with Expo; strict mode recommended |
| expo-sqlite | ~15.x | Local SQLite database | Built into Expo, no native setup, read-heavy offline use |
| zod | ^4.x | Schema definition + runtime validation | TypeScript-first, infers types, validates YAML at authoring time |
| js-yaml or yaml | latest | Parse YAML files in Node.js scripts | Parse content/recipes/*.yaml in validator + build scripts |
| tsx | ^4.x | Run TypeScript scripts in Node without compiling | Runs scripts/validate-recipes.ts and scripts/build-recipes.ts directly |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-router | ~4.x | File-based navigation | Default in create-expo-app template; use for Phase 1 placeholder screens |
| jest-expo | ~52.x | Unit testing preset | Expo-compatible Jest preset matching SDK version |
| @testing-library/react-native | ^12.x | Component testing utilities | Test schema validation, seeding logic |
| @types/js-yaml | latest | TypeScript types for js-yaml | If using js-yaml instead of yaml package |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-router | React Navigation 7 | React Navigation is more flexible for complex navigation but requires more setup; expo-router is the Expo-recommended default and is built on top of React Navigation anyway |
| zod v4 | zod v3 | v4 is stable since May 2025, significantly faster, same core API. Use v4. |
| yaml package | js-yaml | Both work; `yaml` package has better TypeScript support and is actively maintained; js-yaml is older but very widely used. Either is acceptable. |
| tsx | ts-node | ts-node is not actively maintained as of 2025; tsx uses esbuild for ~20ms transpilation vs 500ms+ |
| PRAGMA user_version | custom seed_version table | PRAGMA user_version is the SQLite-native versioning mechanism; the locked decision calls for a separate seed_version table, which is also fine — it is just more explicit |

**Installation:**
```bash
npx create-expo-app@latest TheCook --template default
cd TheCook
npx expo install expo-sqlite
npm install zod yaml tsx --save-dev
npx expo install jest-expo jest @types/jest @testing-library/react-native --save-dev
```

---

## Architecture Patterns

### Recommended Project Structure

```
TheCook/
├── app/                    # Expo Router file-based routes (Expo code only)
│   ├── _layout.tsx         # Root layout — wraps SQLiteProvider
│   └── index.tsx           # Placeholder home screen
├── src/
│   ├── types/
│   │   ├── recipe.ts       # Zod schemas + z.infer TypeScript types (single source of truth)
│   │   └── enums.ts        # Re-exports of enum values for use at runtime
│   └── db/
│       ├── client.ts       # SQLiteProvider setup, migration function
│       ├── seed.ts         # seeding logic: reads recipes.json, inserts rows
│       └── schema.sql      # Human-readable reference for table structure
├── content/
│   ├── recipes/            # Hira's YAML files (*.yaml)
│   └── images/             # Cover photos and step images
├── scripts/
│   ├── validate-recipes.ts # CLI: reads all YAML, validates with Zod, prints errors
│   └── build-recipes.ts    # CLI: YAML → app/assets/recipes.json
├── app/assets/
│   └── recipes.json        # Auto-generated by build script (committed)
└── __tests__/
    ├── schema.test.ts      # Zod schema unit tests against test recipes
    └── seed.test.ts        # Seeding logic tests
```

### Pattern 1: Zod as Single Source of Truth for Schema + Types

**What:** Define Zod schemas in `src/types/recipe.ts`. Use `z.infer<typeof RecipeSchema>` to get TypeScript types. The same schema object is imported by both the validator script (Node.js, authoring time) and the app code (SQLite seeding, runtime).

**When to use:** Always — this eliminates the risk of the TypeScript type and the runtime validator drifting apart.

**Example:**
```typescript
// src/types/recipe.ts
import { z } from "zod";

export const UnitEnum = z.enum([
  "gr", "ml", "adet", "yemek kaşığı", "tatlı kaşığı",
  "su bardağı", "demet", "dilim", "tutam"
]);

export const AllergenTagEnum = z.enum([
  "gluten", "dairy", "egg", "nuts", "shellfish",
  "soy", "sesame", "fish", "mustard", "celery"
]);

export const EquipmentEnum = z.enum([
  "fırın", "blender", "döküm tava", "stand mixer",
  "wok", "su ısıtıcı", "çırpıcı", "tencere", "tava"
]);

export const CategoryEnum = z.enum([
  "ana yemek", "kahvaltı", "çorba", "tatlı", "salata", "aperatif"
]);

export const MealTypeEnum = z.enum([
  "breakfast", "lunch", "dinner", "snack"
]);

export const SkillLevelEnum = z.enum(["beginner", "intermediate", "advanced"]);

export const IngredientSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  unit: UnitEnum,
  optional: z.boolean().default(false),
});

export const IngredientGroupSchema = z.object({
  label: z.string().nullable(),
  items: z.array(IngredientSchema).min(1),
});

export const StepSchema = z.object({
  instruction: z.string().min(1),
  why: z.string().min(1),
  looksLikeWhenDone: z.string().min(1),
  commonMistake: z.string().min(1),
  recovery: z.string().min(1),
  stepImage: z.string().nullable().default(null),
  timerSeconds: z.number().int().positive().nullable().default(null), // discretion: lock now
});

export const RecipeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  cuisine: z.string().min(1),
  category: CategoryEnum,
  mealType: MealTypeEnum,
  skillLevel: SkillLevelEnum,
  prepTime: z.number().int().positive(),   // minutes
  cookTime: z.number().int().positive(),   // minutes
  servings: z.number().int().positive(),
  coverImage: z.string().nullable().default(null),
  allergens: z.array(AllergenTagEnum),
  equipment: z.array(EquipmentEnum),
  ingredientGroups: z.array(IngredientGroupSchema).min(1),
  steps: z.array(StepSchema).min(1),
});

// TypeScript types inferred from schema — no separate interface needed
export type Recipe = z.infer<typeof RecipeSchema>;
export type Ingredient = z.infer<typeof IngredientSchema>;
export type RecipeStep = z.infer<typeof StepSchema>;
```

### Pattern 2: expo-sqlite v2 — SQLiteProvider with onInit Migration

**What:** Wrap the root layout in `SQLiteProvider`. Use the `onInit` callback to check `PRAGMA user_version` and run migrations. Use `useSQLiteContext` in child components.

**When to use:** Phase 1 initializes the database and seeds it. All subsequent phases read from it.

**Example:**
```typescript
// src/db/client.ts
import { SQLiteDatabase } from "expo-sqlite";

const DB_VERSION = 1;

export async function migrateDb(db: SQLiteDatabase) {
  const { user_version } = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );

  if (user_version >= DB_VERSION) return;

  if (user_version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';

      CREATE TABLE IF NOT EXISTS seed_version (
        id INTEGER PRIMARY KEY NOT NULL,
        version TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        cuisine TEXT NOT NULL,
        category TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        skill_level TEXT NOT NULL,
        prep_time INTEGER NOT NULL,
        cook_time INTEGER NOT NULL,
        servings INTEGER NOT NULL,
        cover_image TEXT,
        allergens TEXT NOT NULL,       -- JSON array stored as TEXT
        equipment TEXT NOT NULL,       -- JSON array stored as TEXT
        ingredient_groups TEXT NOT NULL, -- JSON blob
        steps TEXT NOT NULL            -- JSON blob
      );

      CREATE INDEX IF NOT EXISTS idx_recipes_skill_level ON recipes (skill_level);
      CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes (category);
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
}
```

```tsx
// app/_layout.tsx
import { SQLiteProvider } from "expo-sqlite";
import { migrateDb } from "../src/db/client";
import { seedIfNeeded } from "../src/db/seed";

export default function RootLayout() {
  return (
    <SQLiteProvider
      databaseName="thecook.db"
      onInit={async (db) => {
        await migrateDb(db);
        await seedIfNeeded(db);
      }}
    >
      <Stack />
    </SQLiteProvider>
  );
}
```

### Pattern 3: JSON Blob Storage for Complex Nested Fields

**What:** Store `ingredientGroups`, `steps`, `allergens`, and `equipment` as JSON strings in TEXT columns. Parse on read with Zod for type safety.

**When to use:** Phase 1 only needs to seed and retrieve full recipes. Normalizing into separate tables (recipe_ingredients, recipe_steps) provides query flexibility needed for Phase 4 filtering but adds join complexity now. Store as JSON blobs in Phase 1; normalize in Phase 4 if query patterns require it.

**Rationale:** The app reads entire recipes by ID for cooking mode. Ingredient-level queries are only needed in Phase 4 (ingredient-based discovery). JSON blob storage keeps Phase 1 schema simple while the normalized approach can be added as a migration in Phase 4.

**Example:**
```typescript
// src/db/seed.ts
import { SQLiteDatabase } from "expo-sqlite";
import { RecipeSchema, Recipe } from "../types/recipe";
import recipesJson from "../../app/assets/recipes.json";

const SEED_VERSION = "1.0.0";

export async function seedIfNeeded(db: SQLiteDatabase) {
  const existing = await db.getFirstAsync<{ version: string } | null>(
    "SELECT version FROM seed_version WHERE id = 1"
  );

  if (existing?.version === SEED_VERSION) return;

  const recipes = recipesJson as Recipe[];

  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM recipes");
    await db.runAsync("DELETE FROM seed_version");

    for (const recipe of recipes) {
      await db.runAsync(
        `INSERT INTO recipes
          (id, title, cuisine, category, meal_type, skill_level,
           prep_time, cook_time, servings, cover_image,
           allergens, equipment, ingredient_groups, steps)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        recipe.id,
        recipe.title,
        recipe.cuisine,
        recipe.category,
        recipe.mealType,
        recipe.skillLevel,
        recipe.prepTime,
        recipe.cookTime,
        recipe.servings,
        recipe.coverImage,
        JSON.stringify(recipe.allergens),
        JSON.stringify(recipe.equipment),
        JSON.stringify(recipe.ingredientGroups),
        JSON.stringify(recipe.steps)
      );
    }

    await db.runAsync(
      "INSERT INTO seed_version (id, version) VALUES (1, ?)",
      SEED_VERSION
    );
  });
}
```

### Pattern 4: YAML Validator CLI Script

**What:** Node.js/TypeScript script run via `tsx` that reads all `content/recipes/*.yaml`, parses with `yaml` package, validates each against Zod RecipeSchema, and prints human-readable errors.

**When to use:** `npm run validate-recipes` — Hira runs this herself after writing a recipe.

**Example:**
```typescript
// scripts/validate-recipes.ts
import * as fs from "fs";
import * as path from "path";
import { parse } from "yaml";
import { RecipeSchema } from "../src/types/recipe";

const recipesDir = path.join(process.cwd(), "content", "recipes");
const files = fs.readdirSync(recipesDir).filter((f) => f.endsWith(".yaml"));

let hasErrors = false;

for (const file of files) {
  const raw = fs.readFileSync(path.join(recipesDir, file), "utf8");
  const data = parse(raw);
  const result = RecipeSchema.safeParse(data);

  if (!result.success) {
    hasErrors = true;
    console.error(`\nERROR in ${file}:`);
    for (const issue of result.error.issues) {
      const fieldPath = issue.path.join(" > ") || "root";
      console.error(`  Field "${fieldPath}": ${issue.message}`);
    }
  } else {
    console.log(`OK: ${file}`);
  }
}

if (hasErrors) {
  process.exit(1);
} else {
  console.log("\nAll recipes valid.");
}
```

### Pattern 5: Build Script (YAML → JSON)

**What:** Reads validated YAML files, converts to a JSON array, writes to `app/assets/recipes.json`. Run as `prebuild` hook so the asset is always fresh before `expo prebuild`.

**Example:**
```typescript
// scripts/build-recipes.ts
import * as fs from "fs";
import * as path from "path";
import { parse } from "yaml";
import { RecipeSchema } from "../src/types/recipe";

const recipesDir = path.join(process.cwd(), "content", "recipes");
const outputPath = path.join(process.cwd(), "app", "assets", "recipes.json");

const files = fs.readdirSync(recipesDir).filter((f) => f.endsWith(".yaml"));
const recipes = [];

for (const file of files) {
  const raw = fs.readFileSync(path.join(recipesDir, file), "utf8");
  const data = parse(raw);
  const result = RecipeSchema.safeParse(data);
  if (!result.success) {
    console.error(`Build aborted: invalid recipe in ${file}`);
    process.exit(1);
  }
  recipes.push(result.data);
}

fs.writeFileSync(outputPath, JSON.stringify(recipes, null, 2));
console.log(`Built ${recipes.length} recipes → app/assets/recipes.json`);
```

**package.json scripts:**
```json
{
  "scripts": {
    "validate-recipes": "tsx scripts/validate-recipes.ts",
    "build-recipes": "tsx scripts/build-recipes.ts",
    "prebuild": "npm run build-recipes"
  }
}
```

### Anti-Patterns to Avoid

- **Free-string enums:** Using `unit: string` instead of `unit: UnitEnum` makes Phase 4 filtering unreliable and allows typos ("gram" vs "gr") that only show up at runtime.
- **Flat ingredients array:** Using `ingredients: Ingredient[]` directly on Recipe instead of `ingredientGroups`. Hira's test recipes include multi-section dishes (e.g., dough + filling). Changing the schema after content is written is expensive.
- **Schema defined twice (TypeScript interface + separate Zod schema):** Drift is inevitable. Zod schema is the source of truth; TypeScript type is inferred from it with `z.infer`.
- **Skipping the seed_version check:** Without versioning, re-seeding on every launch will truncate user data in later phases (bookmarks, notes).
- **Storing totalTime in database:** It is derived from `prepTime + cookTime`. Compute it at read time, do not store a redundant field.
- **Not wrapping seed inserts in a transaction:** Inserting 50 recipes one at a time without a transaction is 50x slower; use `db.withTransactionAsync`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation | Custom type-checking functions | Zod | Handles nested objects, enum values, nullable fields, union types; generates readable errors; infers TypeScript types |
| YAML parsing | Custom YAML parser | `yaml` npm package | YAML has complex edge cases (multi-line strings, Turkish characters, numeric coercion) |
| TypeScript script runner | Compile + run pipeline | `tsx` | Zero-config, instant, esbuild-based — ts-node is unmaintained |
| SQLite migration versioning | Custom flag file or AsyncStorage check | `PRAGMA user_version` | Built into SQLite; transactional; no additional dependencies |
| Transaction batching | Manual BEGIN/COMMIT SQL strings | `db.withTransactionAsync()` | expo-sqlite v2 handles transaction lifecycle; rollback on error is automatic |

**Key insight:** The validator and build scripts are Node.js tooling, not app code. They do not need React Native compatibility — any Node.js-compatible library works.

---

## Common Pitfalls

### Pitfall 1: Schema Locked Too Late — Field Changes After Content Authoring

**What goes wrong:** Hira writes 20 recipes in Phase 3, then a field name changes (e.g., `looksLikeWhenDone` → `sensoryCheck`), requiring bulk edits to all YAML files and a database migration.
**Why it happens:** Schema validated against only 1 recipe; edge cases (multi-section dishes, recipes with no equipment, recipes with multiple allergens) not tested before Phase 3.
**How to avoid:** Validate schema against at minimum 3 diverse test recipes (e.g., menemen = simple single-group, mercimek çorbası = single group with equipment, börek = multi-group) before Phase 3 begins. This is the Phase 1 success criterion.
**Warning signs:** Any test recipe requires adding a field that RecipeSchema does not have.

### Pitfall 2: Turkish Characters in YAML Cause Encoding Issues

**What goes wrong:** YAML files with Turkish characters (ğ, ş, ü, ö, ç, ı) fail to parse or produce garbled strings on Windows development machines.
**Why it happens:** The YAML file was saved as Windows-1252 instead of UTF-8, or `fs.readFileSync` is called without `'utf8'` encoding.
**How to avoid:** Always pass `'utf8'` to `readFileSync`. Add `.editorconfig` to the project enforcing UTF-8. Validate with a Turkish-character test recipe in CI.
**Warning signs:** Validator passes on macOS but fails on Windows, or unit values appear as `?` in the database.

### Pitfall 3: expo-sqlite v2 Breaking Change — No Global Singleton

**What goes wrong:** Code tries to call `SQLite.openDatabase()` (the legacy v1 API), which was removed in SDK 52 (the `/legacy` path was removed). The v2 API requires `SQLiteProvider` as a context wrapper.
**Why it happens:** Tutorials and Stack Overflow answers from before SDK 50 use the old API.
**How to avoid:** Only use `SQLiteProvider` + `useSQLiteContext` from `expo-sqlite`. Never import `openDatabase`.
**Warning signs:** TypeScript error: `openDatabase does not exist on module 'expo-sqlite'`.

### Pitfall 4: Zod v4 Breaking Changes — Deprecated Methods

**What goes wrong:** Code uses `z.nativeEnum(MyEnum)` (removed in v4) or `.passthrough()` on objects (deprecated in v4), causing runtime errors.
**Why it happens:** Zod v4 released May 2025 with breaking changes; older tutorials use v3 patterns.
**How to avoid:** Use `z.enum([...] as const)` instead of `z.nativeEnum`. Do not use TypeScript `enum` — use `z.enum` values directly. The core `z.object`, `z.string`, `z.number`, `z.array`, `z.enum`, `safeParse` API is unchanged.
**Warning signs:** TypeScript error on `z.nativeEnum`; `.passthrough()` showing deprecation warnings.

### Pitfall 5: recipes.json Not Bundled as Asset

**What goes wrong:** `require('../../app/assets/recipes.json')` works in Metro but the file is not included in the EAS/production build, causing `null` or module-not-found at runtime.
**Why it happens:** Metro auto-bundles `.json` files via `require()` but `assetBundlePatterns` in `app.json` may need to explicitly include it.
**How to avoid:** Keep `recipes.json` in `app/assets/` and reference it with `require()`. Add `"assets/**"` to `assetBundlePatterns` in `app.json`. Test on a production build (not just Expo Go) before Phase 3.
**Warning signs:** App crashes on first launch in production build but works in development.

### Pitfall 6: SQLite seed_version Table Not Seeded Before Recipe Table

**What goes wrong:** App crashes if `SELECT version FROM seed_version WHERE id = 1` runs before the `seed_version` table exists.
**Why it happens:** Migration and seeding run in the same `onInit` callback but in the wrong order.
**How to avoid:** Ensure `migrateDb` (which creates all tables) completes before `seedIfNeeded` runs. Both are `await`ed sequentially in the `onInit` callback.

---

## Code Examples

Verified patterns from official sources:

### SQLiteProvider root layout (from Expo docs)
```tsx
// Source: https://docs.expo.dev/versions/latest/sdk/sqlite/
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";

export default function App() {
  return (
    <SQLiteProvider databaseName="test.db" onInit={migrateDbIfNeeded}>
      <Main />
    </SQLiteProvider>
  );
}
```

### PRAGMA user_version migration (from Expo docs)
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/sqlite/
async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 1;
  const { user_version: currentDbVersion } = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  if (currentDbVersion >= DATABASE_VERSION) return;
  if (currentDbVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE todos (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    `);
  }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
```

### Zod safeParse with error extraction (from zod.dev)
```typescript
// Source: https://zod.dev/basics
const result = RecipeSchema.safeParse(data);
if (!result.success) {
  for (const issue of result.error.issues) {
    const field = issue.path.join(" > ") || "root";
    console.error(`Field "${field}": ${issue.message}`);
  }
}
```

### Zod z.infer for TypeScript type (from zod.dev)
```typescript
// Source: https://zod.dev/basics
type Recipe = z.infer<typeof RecipeSchema>;
// Recipe is the full TypeScript type — no separate interface needed
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `SQLite.openDatabase()` global singleton | `SQLiteProvider` + `useSQLiteContext` context API | SDK 50 (legacy removed in SDK 52) | Must use context API; old tutorials are wrong |
| ts-node for TypeScript scripts | tsx (esbuild-based runner) | 2024 (ts-node unmaintained) | ~20ms transpile vs 500ms+; no tsconfig complexity |
| Zod v3 `z.nativeEnum`, `.passthrough()` | Zod v4 `z.enum`, direct object schemas | May 2025 | Breaking: `nativeEnum` removed; use `z.enum` |
| React Navigation manually installed | Expo Router (built on React Navigation) | SDK 50+ | Expo team recommends Expo Router for new projects; ships with `create-expo-app` |
| New Architecture opt-in | New Architecture enabled by default | SDK 52 | All new SDK 52 projects run New Architecture; no opt-in needed |

**Deprecated/outdated:**
- `expo-sqlite/legacy`: Removed in SDK 52. The `openDatabase()` singleton API no longer exists.
- `expo-barcode-scanner`: Removed in SDK 52 (not relevant here, noted for awareness).
- `z.nativeEnum`: Removed in Zod v4. Use `z.enum([...])` with a plain array.
- `ts-node`: Unmaintained. Use `tsx` for all scripts.

---

## Open Questions

1. **Step timer field — lock now or defer to Phase 5?**
   - What we know: COOK-04 requires timers per step. Locking `timerSeconds: number | null` now means Hira can author timer durations alongside instructions. Deferring means a schema migration in Phase 5.
   - What's unclear: Whether Hira will know the correct timer durations per step during Phase 3 authoring, or whether timers are a developer-determined annotation.
   - Recommendation: Lock `timerSeconds: z.number().int().positive().nullable().default(null)` in Phase 1 schema. Cost of adding a nullable field now is zero; cost of migrating 30–50 authored YAML files in Phase 5 is non-trivial. Hira can leave it null when unknown.

2. **SQLite normalization strategy for Phase 4 readiness**
   - What we know: Phase 4 needs to query recipes by ingredient. JSON blob storage of ingredientGroups makes this impossible without loading all recipes and filtering in JS.
   - What's unclear: Whether a normalized `recipe_ingredients` join table should be added in Phase 1 or Phase 4.
   - Recommendation: Add `recipe_ingredients` table in Phase 1 as a parallel index alongside the JSON blob column. Seed both. Phase 4 uses the normalized table for queries; cooking mode uses the JSON blob for display. This avoids a Phase 4 migration on a populated database.

3. **Exact allergen enum values**
   - What we know: Must include common ones (gluten, dairy, egg, nuts, shellfish). Must be closed for Phase 4 filtering.
   - What's unclear: Whether Turkish-specific allergens (e.g., sesame is common in Turkish cuisine) need to be added.
   - Recommendation: Include EU-14 mandatory allergens as the baseline: gluten, dairy, egg, nuts (tree nuts), peanuts, shellfish, fish, soy, sesame, mustard, celery, lupin, molluscs, sulphites. Validate against test recipes and adjust before Phase 3.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | jest-expo (Jest preset for Expo SDK 52) |
| Config file | `package.json` `"jest": { "preset": "jest-expo" }` — created in Wave 0 |
| Quick run command | `npx jest --testPathPattern="schema\|seed" --passWithNoTests` |
| Full suite command | `npx jest --passWithNoTests` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-02 | RecipeSchema validates a complete recipe with all required fields | unit | `npx jest __tests__/schema.test.ts -t "validates complete recipe"` | Wave 0 |
| CONT-02 | RecipeSchema rejects recipe missing required step fields (instruction, why, looksLikeWhenDone, commonMistake, recovery) | unit | `npx jest __tests__/schema.test.ts -t "rejects incomplete step"` | Wave 0 |
| CONT-02 | RecipeSchema rejects invalid unit enum value | unit | `npx jest __tests__/schema.test.ts -t "rejects invalid unit"` | Wave 0 |
| CONT-02 | RecipeSchema rejects invalid allergen tag | unit | `npx jest __tests__/schema.test.ts -t "rejects invalid allergen"` | Wave 0 |
| CONT-02 | RecipeSchema rejects invalid equipment value | unit | `npx jest __tests__/schema.test.ts -t "rejects invalid equipment"` | Wave 0 |
| CONT-02 | seedIfNeeded inserts test recipes into SQLite and sets seed_version | unit | `npx jest __tests__/seed.test.ts -t "seeds database on first launch"` | Wave 0 |
| CONT-02 | seedIfNeeded skips re-seeding when seed_version matches | unit | `npx jest __tests__/seed.test.ts -t "skips seed when version matches"` | Wave 0 |
| CONT-02 | validate-recipes script exits 0 on valid YAML, exits 1 on invalid YAML | integration | `npx jest __tests__/validator.test.ts` | Wave 0 |
| CONT-02 | build-recipes script produces recipes.json with all test recipes | integration | `npx jest __tests__/buildScript.test.ts` | Wave 0 |
| (bootstrap) | Expo app launches on iOS/Android without crash | manual | `npx expo run:ios / npx expo run:android` | manual |

### Sampling Rate

- **Per task commit:** `npx jest __tests__/schema.test.ts --passWithNoTests`
- **Per wave merge:** `npx jest --passWithNoTests`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `__tests__/schema.test.ts` — covers CONT-02 schema shape, enum validation, safeParse behavior
- [ ] `__tests__/seed.test.ts` — covers seeding logic with in-memory SQLite mock
- [ ] `__tests__/validator.test.ts` — covers CLI validator exit codes
- [ ] `__tests__/buildScript.test.ts` — covers build-recipes output
- [ ] `package.json` jest config block — `"preset": "jest-expo"`
- [ ] Framework install: `npx expo install jest-expo jest @types/jest @testing-library/react-native --save-dev`

---

## Sources

### Primary (HIGH confidence)
- [Expo SQLite official docs](https://docs.expo.dev/versions/latest/sdk/sqlite/) — SQLiteProvider API, PRAGMA user_version migration pattern, useSQLiteContext, runAsync/getAllAsync/getFirstAsync signatures
- [Expo SDK 52 changelog](https://expo.dev/changelog/2024-11-12-sdk-52) — New Architecture default, legacy SQLite removal, iOS/Android minimum versions
- [Zod v4 basics](https://zod.dev/basics) — safeParse, z.infer, z.object, z.enum API (verified current)
- [Expo unit testing docs](https://docs.expo.dev/develop/unit-testing/) — jest-expo setup, package installation commands
- [Expo TypeScript docs](https://docs.expo.dev/guides/typescript/) — expo/tsconfig.base, strict mode opt-in

### Secondary (MEDIUM confidence)
- [Expo Router introduction](https://docs.expo.dev/router/introduction/) — Expo team recommendation for new projects, file-based routing features
- [Zod v4 migration guide](https://zod.dev/v4/changelog) — breaking changes from v3: z.nativeEnum removed, .passthrough deprecated, core z.enum/z.object/z.array unchanged
- [Modern SQLite for React Native apps](https://expo.dev/blog/modern-sqlite-for-react-native-apps) — Expo blog post on v2 API patterns

### Tertiary (LOW confidence)
- Multiple WebSearch results on YAML + Zod combination patterns — unverified but converge on js-yaml/yaml package + safeParse as the standard approach

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against official Expo, Zod, and Jest docs
- Architecture: HIGH — patterns directly from official Expo SQLite docs and Zod docs
- Pitfalls: HIGH for SQLite API changes (official docs), HIGH for Zod v4 changes (official changelog), MEDIUM for YAML encoding (common knowledge, not specifically documented)
- Validation architecture: HIGH — jest-expo is the official Expo testing solution

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (Expo SDK releases quarterly; Zod v4 is stable)
