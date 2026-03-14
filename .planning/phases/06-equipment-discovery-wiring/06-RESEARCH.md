# Phase 6: Wire Equipment to Recipe Discovery - Research

**Researched:** 2026-03-14
**Domain:** React Native / Expo — SQLite filter extension, TypeScript schema update, recipe card UI indicator
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ONBRD-03 | User can declare available kitchen equipment; recipes requiring unlisted equipment are de-prioritized or flagged | Equipment is stored in `profile.equipment` (SQLite). Recipe equipment requirements are stored as JSON in `recipes.equipment`. The gap is the filter layer between them — `DiscoveryFilterSchema` needs an `equipment` field; `queryRecipesByFilter` needs to sort/flag recipes based on it; recipe cards need a visual indicator. |

</phase_requirements>

---

## Summary

Phase 6 is a surgical gap-closure phase. The equipment declaration UX (onboarding, settings) and the recipe equipment schema (`RecipeSchema.equipment`) were both fully built in Phase 2 and Phase 1 respectively. The only missing piece is the wiring layer: no discovery query reads `profile.equipment`, no card surface flags equipment-incompatible recipes.

The change surface is narrow: three files need to be modified and one component needs a new prop. The hardest design decision is "de-prioritize vs. flag" — the phase goal says both are acceptable. Based on the allergen precedent in the codebase (allergens are fully *excluded*, not flagged), equipment should use a softer treatment: de-prioritize (sort incompatible recipes to the end) and flag with a visible card indicator. This preserves full recipe discoverability while giving users actionable information.

No new dependencies are needed. No DB migration is needed. The `equipment` column on `recipes` already exists and is seeded. The `profile.equipment` column already exists and is written. This phase is purely a logic and UI wiring job.

**Primary recommendation:** Extend `DiscoveryFilterSchema` with an `equipment` field (user's declared equipment array), modify `queryRecipesByFilter` to sort incompatible recipes to the end of results in JS (not SQL — same pattern as skill ordering), add an equipment-mismatch indicator to `RecipeCardGrid`, and pass `profile.equipment` from all three discovery screens (Feed, Search, My Kitchen).

---

## Standard Stack

### Core (all already installed — no new packages required)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| expo-sqlite | ~16.0.10 | Reading `profile.equipment` and `recipes.equipment` from SQLite | Already in use; no schema change needed |
| zod | ^4.3.6 | Extending `DiscoveryFilterSchema` with `equipment` field | Already in use; z.array(EquipmentEnum) pattern established |
| @expo/vector-icons (MaterialCommunityIcons) | ^15.0.3 | Equipment-mismatch indicator icon on recipe card | Already in use in recipe cards and settings |
| react-native | 0.81.5 | UI for card indicator badge/icon | Already in use |

### No New Packages Required

The allergen filtering chain demonstrated that equipment filtering can follow the same pure-JS pattern. `RecipeListItemSchema` already carries an `allergens` field. Adding an `equipment` field to `RecipeListItemSchema` so cards can show indicators requires zero new packages.

---

## Architecture Patterns

### Current State (what exists)

```
profile.equipment  ─────────────────────────────┐
                                                 │  NOT WIRED
recipes.equipment  ──── queryRecipesByFilter ────┘  (gap)
```

### Target State (after Phase 6)

```
profile.equipment ──► DiscoveryFilter.equipment
                              │
                              ▼
                    queryRecipesByFilter
                    (JS sort: compatible first, incompatible last)
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
             RecipeListItem        RecipeListItem
             (equipmentMatch=true) (equipmentMatch=false)
                    │                    │
                    ▼                    ▼
             RecipeCardGrid       RecipeCardGrid
             (no indicator)       (equipment warning icon)
```

### Recommended File Structure

Only these files need changes:

```
src/types/discovery.ts         # ADD equipment field to DiscoveryFilterSchema + RecipeListItemSchema
src/db/recipes.ts              # ADD equipment-awareness to queryRecipesByFilter + getAllRecipesForFeed + getAllRecipesForSearch
app/(tabs)/index.tsx           # PASS profile.equipment into filter/feed calls
app/(tabs)/search.tsx          # PASS profile.equipment into search calls
app/(tabs)/my-kitchen.tsx      # PASS profile.equipment into bookmark display calls
components/ui/recipe-card-grid.tsx  # ADD equipment-mismatch indicator badge
```

New test file:

```
__tests__/equipment-filter.test.ts  # Unit tests for equipment de-prioritization logic
```

### Pattern 1: Extend DiscoveryFilterSchema (src/types/discovery.ts)

Current `DiscoveryFilterSchema` (no equipment):
```typescript
export const DiscoveryFilterSchema = z.object({
  category: CategoryEnum.nullable().default(null),
  cookTimeBucket: z.enum(["under15", "15to30", "over30"]).nullable().default(null),
  skillLevel: SkillLevelEnum.nullable().default(null),
  cuisine: z.string().nullable().default(null),
});
```

After Phase 6:
```typescript
import { EquipmentEnum } from "./recipe";

export const DiscoveryFilterSchema = z.object({
  category: CategoryEnum.nullable().default(null),
  cookTimeBucket: z.enum(["under15", "15to30", "over30"]).nullable().default(null),
  skillLevel: SkillLevelEnum.nullable().default(null),
  cuisine: z.string().nullable().default(null),
  equipment: z.array(EquipmentEnum).default([]),  // user's declared equipment
});
```

Also extend `RecipeListItemSchema` to carry an equipment field for card indicators:
```typescript
export const RecipeListItemSchema = z.object({
  // ... existing fields ...
  equipment: z.array(z.string()),  // raw string array from DB JSON parse
});
```

### Pattern 2: Equipment De-prioritization in queryRecipesByFilter (src/db/recipes.ts)

The approach mirrors the existing skill-level sorting in `getFeedRecipes`: pure JS, no SQL changes required. Equipment data is already present in the `equipment` TEXT column of the recipes table.

**Step 1:** Include `equipment` column in `SELECT_LIST_COLUMNS`:
```typescript
// Change from:
const SELECT_LIST_COLUMNS = `
  id, title, cuisine, category, skill_level, prep_time, cook_time, cover_image, allergens
`;
// Change to:
const SELECT_LIST_COLUMNS = `
  id, title, cuisine, category, skill_level, prep_time, cook_time, cover_image, allergens, equipment
`;
```

**Step 2:** Update `mapRowToRecipeListItem` to parse equipment:
```typescript
function mapRowToRecipeListItem(row: RecipeRow): RecipeListItem {
  return {
    // ... existing fields ...
    equipment: JSON.parse(row.equipment ?? "[]"),
  };
}
```

**Step 3:** Add de-prioritization sort in `queryRecipesByFilter`:
```typescript
export async function queryRecipesByFilter(
  db: SQLiteDatabase,
  filter: DiscoveryFilter,
  userAllergens: string[]
): Promise<RecipeListItem[]> {
  // ... existing SQL query logic unchanged ...
  const rows = await db.getAllAsync<RecipeRow>(sql, params);
  const items = rows.map(mapRowToRecipeListItem);

  // Equipment de-prioritization: compatible recipes first, incompatible last
  if (filter.equipment.length > 0) {
    const userEquipment = new Set(filter.equipment);
    items.sort((a, b) => {
      const aCompatible = a.equipment.every((e) => userEquipment.has(e as Equipment));
      const bCompatible = b.equipment.every((e) => userEquipment.has(e as Equipment));
      if (aCompatible === bCompatible) return 0;
      return aCompatible ? -1 : 1;
    });
  }

  return items;
}
```

Apply the same sort to `getAllRecipesForFeed` and `getAllRecipesForSearch` (both need equipment awareness since Feed and Search are discovery surfaces).

**Why JS not SQL:** The `equipment` field is a JSON array in a TEXT column. Sorting by "does user have all required equipment" requires set-intersection logic that is deeply nested JSON in SQL (identical problem to ingredient matching in Phase 4 — the decision there was also "use JS"). With 30 recipes and the data already loaded for display, a JS sort is instant.

### Pattern 3: Equipment-Mismatch Indicator on RecipeCardGrid

The indicator should be small, non-intrusive, and clearly explanatory. A warning icon + short text badge in the card's meta row is the right placement — same row as skill badge and cook time.

```typescript
// In RecipeCardGrid props — add:
interface RecipeCardGridProps {
  recipe: RecipeListItem;
  isBookmarked: boolean;
  onBookmarkToggle: (id: string) => void;
  onPress: (id: string) => void;
  userEquipment: string[];  // NEW: pass from screen
}

// Compute in component:
const hasMissingEquipment = recipe.equipment.some(
  (e) => !userEquipment.includes(e)
);

// Render in metaRow (after skill badge):
{hasMissingEquipment && (
  <View style={styles.equipmentWarning}>
    <MaterialCommunityIcons name="alert-circle-outline" size={12} color="#D97706" />
    <Text style={styles.equipmentWarningText}>Ekipman eksik</Text>
  </View>
)}
```

Style consistent with existing skill badge:
```typescript
equipmentWarning: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 2,
},
equipmentWarningText: {
  color: '#D97706',  // amber — matches kahvaltı gradient tone
  fontSize: 10,
  fontWeight: '500',
},
```

### Pattern 4: Passing Equipment from Screens

All three discovery screens already read `profile` and pass `profile.allergens` to query functions. Adding `profile.equipment` follows the same pattern.

**Feed screen (app/(tabs)/index.tsx):**
```typescript
// In loadRecipes callback, change:
const allergenFiltered = await getAllRecipesForFeed(profile.allergens);
// To:
const allergenFiltered = await getAllRecipesForFeed(profile.allergens, profile.equipment);

// Pass to RecipeCardGrid:
<RecipeCardGrid
  recipe={item}
  isBookmarked={bookmarkedIds.has(item.id)}
  onBookmarkToggle={handleBookmarkToggle}
  onPress={handleRecipePress}
  userEquipment={profile.equipment}  // NEW
/>
```

**Search screen (app/(tabs)/search.tsx):**
```typescript
// In loadAll, change:
getAllRecipesForSearch(p.allergens),
// To:
getAllRecipesForSearch(p.allergens, p.equipment),

// Pass to each RecipeCardGrid in search results.
```

**My Kitchen screen (app/(tabs)/my-kitchen.tsx):**
The My Kitchen screen uses a raw `db.getAllAsync` batch query for bookmarks (not `getAllRecipesForFeed`). It needs to:
1. Include `equipment` in the SELECT columns
2. Pass `profile.equipment` to `RecipeCardGrid`

### Pattern 5: Compose Correctly with Allergen Filter

Allergen filtering is SQL-based (excludes recipes entirely before they reach JS). Equipment de-prioritization is JS-based (sorts after SQL fetch). They compose naturally — allergen exclusion runs first (in SQL), equipment sorting runs second (in JS). No conflict.

```
SQL query (allergen excluded) → [items returned] → JS sort (equipment incompatible last)
```

The allergen chain is unaffected: `ALLERGEN_EXCLUSION` clause is added before other conditions, equipment sorting is applied after. Both operate on different phases of the pipeline.

### Anti-Patterns to Avoid

- **DO NOT try to sort by equipment in SQL.** The `equipment` column is a JSON array in a TEXT column; writing a JSON set-intersection ORDER BY in SQLite is fragile and was explicitly rejected for ingredient matching in Phase 4. JS sort after fetch is the correct pattern.
- **DO NOT add an `equipment` WHERE clause that excludes recipes.** The requirement says "de-prioritize or flag" — it does not say "exclude." Users should still be able to see and cook recipes even if they lack equipment. Exclusion (like allergens) is too heavy-handed here.
- **DO NOT forget to update `RecipeCardRow` if equipment indicator is also needed there.** `RecipeCardRow` is used for recently viewed recipes in Search. Check if it needs the same treatment (low priority — recently viewed is a user-initiated lookup, not a discovery surface per se).
- **DO NOT hardcode `userEquipment` in the `INITIAL_FILTER` constant in Feed.** The `INITIAL_FILTER` should remain static; equipment is read from `profile` on focus and passed dynamically.
- **DO NOT update `DiscoveryFilterSchema` without updating `INITIAL_FILTER`** in `index.tsx` — both must add the `equipment: []` default or the DiscoveryFilter type will not validate.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Equipment set-intersection | Custom SQL json_each nested subquery | Pure JS `Array.every + Set.has` on already-loaded recipe items | Same rationale as ingredient matching in Phase 4; ~30 recipes, data already in memory |
| Equipment warning icon | Custom SVG warning component | `MaterialCommunityIcons` `"alert-circle-outline"` | Already installed, used throughout the app, correct size/color support |
| Equipment list type | Re-declare equipment string[] in discovery.ts | Import `EquipmentEnum` from `src/types/recipe.ts` | Single source of truth already exists; `EquipmentEnum.options` is the canonical list |

**Key insight:** The codebase already solved the identical architectural problem for allergens (SQL exclusion) and skill-level sorting (JS sort after fetch). Equipment de-prioritization is the same pattern as skill-level sorting. No new concepts are introduced.

---

## Common Pitfalls

### Pitfall 1: equipment field missing from SELECT_LIST_COLUMNS causes RecipeListItem.equipment to be undefined
**What goes wrong:** `SELECT_LIST_COLUMNS` currently omits `equipment`. After adding `equipment` to `RecipeListItemSchema`, parsing rows without the column will silently give `[]` (if default is set) or crash (if not).
**Why it happens:** Convenience — the column was omitted in Phase 4 because equipment wasn't needed for list display then.
**How to avoid:** Add `equipment` to `SELECT_LIST_COLUMNS` constant in `src/db/recipes.ts` at the same time as the schema change. Run existing discovery tests immediately after.
**Warning signs:** `recipe.equipment` is always `[]` even for recipes that require equipment — the indicator never shows.

### Pitfall 2: INITIAL_FILTER in Feed screen not updated
**What goes wrong:** `const INITIAL_FILTER: DiscoveryFilter` in `app/(tabs)/index.tsx` will not compile after `DiscoveryFilter` type gains `equipment: Equipment[]` if the constant doesn't include the field.
**Why it happens:** TypeScript will catch this at compile time, but only if TS is run before testing.
**How to avoid:** Update `INITIAL_FILTER` to `{ ..., equipment: [] }` in the same commit as the schema change.
**Warning signs:** TypeScript error: `Property 'equipment' is missing in type '...' but required in type 'DiscoveryFilter'`.

### Pitfall 3: RecipeCardGrid userEquipment prop not passed from My Kitchen's raw query path
**What goes wrong:** My Kitchen uses a raw `db.getAllAsync` batch query (not `getAllRecipesForFeed`) that currently doesn't SELECT `equipment`. The equipment indicator won't work there.
**Why it happens:** My Kitchen was built before equipment-awareness was needed; it has its own inline SELECT that bypasses `SELECT_LIST_COLUMNS`.
**How to avoid:** Add `equipment` to the inline SELECT in `my-kitchen.tsx` and parse it with `JSON.parse(row.equipment ?? '[]')` in the `ordered` map.
**Warning signs:** Equipment indicator shows on Feed and Search cards but not on saved recipe cards in My Kitchen.

### Pitfall 4: Composability break — equipment sort applied before allergen filter
**What goes wrong:** If equipment sort is applied before allergen exclusion, allergen-incompatible recipes temporarily appear in the sorted list, then get removed — wrong order of operations.
**Why it happens:** Incorrect placement of equipment sort in the pipeline.
**How to avoid:** Allergen exclusion is SQL (runs in DB query, never enters JS). Equipment sort runs after `db.getAllAsync` returns. The composition order is guaranteed by the architecture — no action needed, just don't insert equipment logic into the SQL WHERE clause.
**Warning signs:** This pitfall is impossible given the current architecture (SQL → JS pipeline). Mention in plan for clarity only.

### Pitfall 5: Equipment indicator shown for recipes with zero equipment requirements
**What goes wrong:** Recipes that require no equipment (empty `equipment: []`) show a "missing equipment" indicator when user has limited equipment, because `[].every(...)` always returns `true` — wait, actually `[].every(...)` returns `true` (vacuously true), so this is fine. But if the logic is inverted (checking `some` instead of `every`), recipes with no requirements would incorrectly trigger the warning.
**Why it happens:** Confusion between `every` (all required items must be present) and `some` (at least one required item is present).
**How to avoid:** Use `recipe.equipment.every(e => userEquipment.includes(e))` — empty `recipe.equipment` array vacuously satisfies this and correctly shows NO warning. Test with a recipe that has `equipment: []`.
**Warning signs:** Recipes that require no special equipment show a warning icon.

---

## Code Examples

Verified patterns from the existing codebase:

### Equipment JSON parse pattern (mirrors existing allergens pattern in mapRowToRecipeListItem)
```typescript
// Source: src/db/recipes.ts — existing allergens parse
allergens: JSON.parse(row.allergens ?? "[]"),
// Equipment follows same pattern:
equipment: JSON.parse(row.equipment ?? "[]"),
```

### Equipment compatibility check (mirrors getFeedRecipes skill sort pattern)
```typescript
// Source: src/db/recipes.ts — existing getFeedRecipes JS sort
const sorted = [...recipes].sort((a, b) => {
  const aOrder = order[aLevel] ?? 1;
  const bOrder = order[bLevel] ?? 1;
  return aOrder - bOrder;
});

// Equipment sort follows same JS-after-fetch pattern:
if (filter.equipment.length > 0) {
  const userEquipment = new Set(filter.equipment);
  items.sort((a, b) => {
    const aCompatible = a.equipment.every((e) => userEquipment.has(e));
    const bCompatible = b.equipment.every((e) => userEquipment.has(e));
    if (aCompatible === bCompatible) return 0;
    return aCompatible ? -1 : 1;
  });
}
```

### Passing equipment into getAllRecipesForFeed (mirrors allergen param pattern)
```typescript
// Source: src/db/recipes.ts — existing getAllRecipesForFeed signature
export async function getAllRecipesForFeed(
  db: SQLiteDatabase,
  userAllergens: string[]
): Promise<RecipeListItem[]>

// Extended signature:
export async function getAllRecipesForFeed(
  db: SQLiteDatabase,
  userAllergens: string[],
  userEquipment: string[] = []  // default to [] — backward compatible
): Promise<RecipeListItem[]>
```

### Equipment warning badge in RecipeCardGrid (mirrors skill badge style)
```typescript
// Source: components/ui/recipe-card-grid.tsx — existing skill badge
<View style={styles.skillBadge}>
  <Text style={styles.skillText}>{SKILL_LABELS[recipe.skillLevel]}</Text>
</View>

// Equipment warning badge (same metaRow, different color):
{hasMissingEquipment && (
  <View style={styles.equipmentWarning}>
    <MaterialCommunityIcons name="alert-circle-outline" size={12} color="#D97706" />
    <Text style={styles.equipmentWarningText}>Ekipman eksik</Text>
  </View>
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Equipment data siloed in profile only | Equipment data plumbed through discovery filter | Phase 6 | ONBRD-03 fully satisfied |
| Recipe card shows skill + time only | Recipe card shows skill + time + optional equipment warning | Phase 6 | User sees actionable equipment signal without leaving card |
| DiscoveryFilter has 4 fields (category, cookTimeBucket, skillLevel, cuisine) | DiscoveryFilter has 5 fields (+ equipment) | Phase 6 | Filter schema matches all user-declared preferences |

**No deprecated patterns introduced.** This phase follows the allergen/skill patterns already established.

---

## Open Questions

1. **Should RecipeCardRow (recently viewed) also show the equipment indicator?**
   - What we know: `RecipeCardRow` is used for recently viewed entries in Search idle state. It shows title, skill, and time.
   - What's unclear: Is recently viewed a "discovery surface" that should trigger the indicator? The requirement says "all discovery surfaces."
   - Recommendation: Yes — include it for completeness. It's a small addition (same prop + conditional render) and "recently viewed" is a discovery surface.

2. **Should the My Kitchen bookmarks grid respect equipment de-prioritization order?**
   - What we know: Bookmarks are sorted by recency (most recently saved first). Re-sorting by equipment compatibility would break the user's expected bookmark order.
   - What's unclear: Whether users want equipment sorting applied to their personal saved list.
   - Recommendation: Do NOT re-sort bookmarks by equipment compatibility — preserve recency order. Only show the equipment indicator badge. The sort is for uncontrolled feed/search surfaces; bookmark order is user-controlled.

3. **What icon and text label for equipment warning?**
   - What we know: `MaterialCommunityIcons` `"alert-circle-outline"` is available (no new install). `"tool"` and `"wrench"` are also available.
   - Recommendation: `"alert-circle-outline"` with text "Ekipman eksik" in amber (`#D97706`). This matches the amber kahvaltı category color and reads clearly. Claude's discretion per phase goal.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + jest-expo ~54.0.17 |
| Config file | `package.json` (`jest` key) |
| Quick run command | `npx jest --testPathPattern="equipment-filter" --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONBRD-03 | Equipment de-prioritization: incompatible recipes sort to end | unit | `npx jest --testPathPattern="equipment-filter" --no-coverage` | ❌ Wave 0 |
| ONBRD-03 | Equipment indicator: `hasMissingEquipment` true when recipe.equipment not subset of userEquipment | unit | `npx jest --testPathPattern="equipment-filter" --no-coverage` | ❌ Wave 0 |
| ONBRD-03 | Allergen + equipment compose: allergen-excluded recipes don't appear in equipment-sorted list | unit | `npx jest --testPathPattern="equipment-filter" --no-coverage` | ❌ Wave 0 |
| ONBRD-03 | Empty recipe.equipment array never triggers equipment warning | unit | `npx jest --testPathPattern="equipment-filter" --no-coverage` | ❌ Wave 0 |
| ONBRD-03 | Empty filter.equipment (user declared nothing specific) skips sorting | unit | `npx jest --testPathPattern="equipment-filter" --no-coverage` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="equipment-filter" --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/equipment-filter.test.ts` — covers all 5 ONBRD-03 unit behaviors above
- [ ] Extend `createMockDb()` factory in test file to return mock `equipment` column data (follow `discovery.test.ts` pattern)

*(Existing `discovery.test.ts` tests are unaffected and remain green — no modification to allergen/skill/category tests is needed)*

---

## Sources

### Primary (HIGH confidence)
- Direct inspection of `src/types/discovery.ts` — `DiscoveryFilterSchema` confirmed: no `equipment` field as of Phase 4 completion
- Direct inspection of `src/db/recipes.ts` — `queryRecipesByFilter`: no equipment condition; `SELECT_LIST_COLUMNS`: omits `equipment` column
- Direct inspection of `src/types/recipe.ts` — `EquipmentEnum` confirmed with 13 values; `RecipeSchema.equipment` is `z.array(EquipmentEnum)` stored as JSON in SQLite
- Direct inspection of `src/types/profile.ts` — `ProfileSchema.equipment` is `z.array(EquipmentEnum).default(["fırın", "tava"])`
- Direct inspection of `src/db/client.ts` — `DB_VERSION=4`; `profile` table has `equipment TEXT` column; `recipes` table has `equipment TEXT` column — no migration needed
- Direct inspection of `app/(tabs)/index.tsx`, `search.tsx`, `my-kitchen.tsx` — all load `profile.allergens` for filtering; none read `profile.equipment`
- Direct inspection of `components/ui/recipe-card-grid.tsx` — `metaRow` renders skill badge + cook time; no equipment indicator
- Direct inspection of `app/settings.tsx` — `EquipmentEnum.options` used directly; `toggleEquipment` saves via `persistProfileChange` — equipment saving already works
- Direct inspection of `.planning/v1.0-MILESTONE-AUDIT.md` — confirms exact gap: `queryRecipesByFilter` has no equipment condition; `DiscoveryFilterSchema` has no equipment field; no discovery surface filters based on equipment

### Secondary (MEDIUM confidence)
- Phase 4 RESEARCH.md (intra-project) — confirmed "JS-after-fetch" pattern for non-indexed JSON columns; allergen exclusion SQL pattern documented

### Tertiary (LOW confidence — flag for validation)
- None. All findings are verified directly from the live codebase.

---

## Metadata

**Confidence breakdown:**
- Gap identification: HIGH — audit report + direct code inspection confirm exactly what's missing
- Standard stack: HIGH — no new packages; all patterns are direct extensions of existing code
- Architecture: HIGH — based on direct inspection of all files that need modification; change surface is precisely bounded
- SQL/JS approach: HIGH — confirmed by Phase 4 precedent: JSON array columns are processed in JS, not SQL
- UI indicator design: MEDIUM — exact visual design is Claude's discretion; the location (metaRow) and icon library (MaterialCommunityIcons) are HIGH confidence; specific icon choice and label text are LOW-MEDIUM

**Research date:** 2026-03-14
**Valid until:** 2026-06-14 (stable ecosystem; no moving dependencies; internal codebase patterns are locked)
