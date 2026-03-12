# Phase 4: Recipe Discovery - Research

**Researched:** 2026-03-12
**Domain:** React Native / Expo — list rendering, SQLite filtering, tab navigation restructure, search UX
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Navigation:** Replace (Home, Explore, Settings) tabs with (Feed, Search, My Kitchen). Rename files: `settings.tsx` → `my-kitchen.tsx`, `explore.tsx` → `search.tsx`; `index.tsx` → Feed screen
- **Feed tab:** "Trending" and "For You" top tabs; horizontal scrollable category filter chips; 2-column recipe grid
- **Trending:** Curated display order baked into the app. Works fully offline, no server needed
- **For You:** Order by user skill level match (beginner-first for beginner users). Null skill level → treat as beginner, no empty state, no prompt
- **Recipe card — Feed:** Category gradient placeholder (no cover photos in v1, all `coverImage` null); title overlay on image area; ♡ bookmark icon top-right; below image: truncated description + skill badge + cook time
- **Recipe card — Search:** Same 2-column grid style as Feed cards
- **Recipe card — Recently viewed:** Row card (image left, title + skill + cook time right); shown in Search tab when search bar is idle
- **Search UX:** Single smart search bar — no mode toggle. Autocomplete shows both ingredient names AND recipe names from DB. Selecting ingredient → pinned chip (with × cancel); selecting recipe → navigate to detail. Multiple chips = AND logic first; fallback to partial matches ranked by overlap count
- **Turkish morphology:** Resolved via canonical DB names — autocomplete built from actual ingredient names in recipes SQLite table (no NLP library needed)
- **Filter presentation:** Scrollable chip row: Hepsi, Kahvaltı, Çorba, Ana Yemek, Tatlı, Salata, Aperatif. ▼ arrow opens advanced panel: Cuisine (Türk/Dünya), Cook time (< 15 dk / 15–30 dk / 30+ dk), Skill level (Başlangıç / Orta / İleri)
- **Allergen filtering:** Automatic and silent. Recipes whose `allergens` array intersects user's declared allergens are excluded from all surfaces
- **Bookmarks:** ♡ toggle on every card; saved section in My Kitchen tab; uses existing `bookmarks` SQLite table; available offline; Phase 2 sync already handles cloud sync
- **Reusable components:** `Chip` (`components/ui/chip.tsx`), all enums from `src/types/recipe.ts`, `Profile` type from `src/types/profile.ts`, `useProfileDb` from `src/db/profile.ts`, `useSQLiteContext` pattern from existing code

### Claude's Discretion
- Exact gradient/color palette per category (consistent with terracotta `#E07B39`)
- Empty state designs (no results, empty bookmarks)
- Exact character limit for truncated description on feed cards
- Loading skeleton / shimmer approach
- Animation and transition details between screens
- Recent views storage mechanism (new SQLite table or AsyncStorage)

### Deferred Ideas (OUT OF SCOPE)
- Recipe cooking mode (step-by-step guidance) — Phase 5
- Cover photos for recipe cards — deferred beyond v1

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISC-01 | User can input available ingredients and receive recipe recommendations that match | SQLite ingredient extraction from JSON + chip UI + AND/overlap query logic |
| DISC-02 | User can browse a curated feed of recipes without ingredient input, ordered by skill level match | ORDER BY skill_level SQL pattern + FlatList/FlashList 2-column grid |
| DISC-03 | User can filter recipes by category, cuisine, cook time, dish type | SQL WHERE clauses on indexed category/skill_level columns + filter chip UI |
| DISC-04 | User can bookmark recipes and return to them later; persists across restarts, available offline | Existing bookmarks SQLite table + useProfileDb add/remove/get bookmark methods |
| DISC-05 | Allergen-incompatible recipes are automatically excluded from all discovery surfaces | SQLite json_each() allergen intersection query |
</phase_requirements>

---

## Summary

Phase 4 is a UI-heavy phase built almost entirely on infrastructure already in place from Phases 1–3. The SQLite schema, profile system, bookmark CRUD, and all enum types are complete. The primary implementation work is: (1) building new screen files to replace the placeholder tabs, (2) implementing SQL query logic for feed ordering, filtering, allergen exclusion, and ingredient matching, and (3) wiring together the search/autocomplete UX.

The most technically novel piece is the ingredient autocomplete, which requires a one-time extraction of unique ingredient names from the `ingredient_groups` JSON column. This is solved by a query-time aggregation rather than a separate lookup table, which keeps the schema clean. Allergen filtering uses SQLite's `json_each()` function to perform set-intersection exclusion directly in SQL, which is supported in Expo SDK 50+ (project is on SDK 54).

For list rendering, FlashList v2 (`@shopify/flash-list`) is strongly preferred over FlatList for the 2-column grid because the project already has New Architecture enabled (`newArchEnabled: true` in app.json). FlashList v2 was rebuilt for the New Architecture, eliminates `estimatedItemSize`, and avoids the blank-cell issues FlatList grids are prone to. Three new packages need installing: `@shopify/flash-list`, `expo-linear-gradient` (for category gradient placeholders), and `@react-native-async-storage/async-storage` (for recent views, unless SQLite is chosen instead).

**Primary recommendation:** Use FlashList v2 for all grid views, SQLite json_each() for allergen exclusion, and a single `useMemo`-built autocomplete suggestion set derived from the recipes table at load time.

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| expo-sqlite | ~16.0.10 | Feed queries, filter queries, ingredient extraction, bookmark reads | Already in use; `useSQLiteContext` pattern established |
| expo-router | ~6.0.23 | File-based tab routing; new tab files created via new `.tsx` files in `(tabs)/` | Already in use |
| react-native-reanimated | ~4.1.1 | Shimmer/skeleton animation for loading states | Already installed; New Architecture compatible |
| expo-image | ~3.0.11 | Image component with built-in placeholder/transition support | Already installed |
| @expo/vector-icons | ^15.0.3 | Bookmark heart icon (`MaterialCommunityIcons`) | Already installed, used in settings.tsx |

### New Packages Required
| Library | Version | Purpose | Install Command |
|---------|---------|---------|-----------------|
| @shopify/flash-list | latest | High-performance 2-column recipe grid with New Architecture support | `npx expo install @shopify/flash-list` |
| expo-linear-gradient | latest | Category color gradient placeholders on recipe cards | `npx expo install expo-linear-gradient` |
| @react-native-async-storage/async-storage | latest | Recent views storage (if SQLite approach not chosen) | `npx expo install @react-native-async-storage/async-storage` |

**Installation:**
```bash
npx expo install @shopify/flash-list expo-linear-gradient @react-native-async-storage/async-storage
```

> Note on recent views: using AsyncStorage avoids a DB migration but adds a new package. Using SQLite (a `recent_views` table added via DB_VERSION bump to 3) keeps everything in one storage layer. Both are valid; SQLite is more consistent with the established pattern.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| FlashList | FlatList (built-in) | FlatList is simpler but has blank-cell flicker on Android grids and worse recycling. With ~30 recipes and New Arch enabled, FlashList v2 is a clear upgrade |
| expo-linear-gradient | Solid color backgrounds | Solid colors are simpler (zero dependencies) and work for v1 given coverImage is null for all recipes. Gradient is more polished but optional |
| AsyncStorage for recent views | SQLite recent_views table | AsyncStorage: no migration needed, but adds dependency. SQLite table: zero new deps, consistent pattern, trivially queryable |
| Custom autocomplete | react-native-autocomplete-dropdown | Third-party autocomplete library adds 35KB+ dependency. The project's search requirements are simple enough that a TextInput + FlatList dropdown is ~50 lines of code and fully controllable |

---

## Architecture Patterns

### Recommended File Structure

```
app/(tabs)/
├── _layout.tsx          # UPDATE: rename tabs (Feed/Search/My Kitchen), new icons
├── index.tsx            # REPLACE: Feed screen (was "coming soon" placeholder)
├── search.tsx           # RENAME from explore.tsx: Search + autocomplete + chips
└── my-kitchen.tsx       # RENAME from settings.tsx: profile section + saved recipes

app/
├── recipe/
│   └── [id].tsx         # NEW: Recipe detail screen (navigated to from any card tap)

src/db/
├── client.ts            # DB_VERSION bump to 3 (if recent_views table added)
├── profile.ts           # Existing — already has bookmark CRUD
└── recipes.ts           # NEW: useRecipesDb hook — feed, search, filter, ingredient queries

src/types/
└── discovery.ts         # NEW: Zod schemas for DiscoveryFilter, RecentView, AutocompleteSuggestion

components/
├── ui/
│   ├── chip.tsx              # Existing — reuse directly
│   ├── recipe-card-grid.tsx  # NEW: 2-column grid card (feed + search)
│   ├── recipe-card-row.tsx   # NEW: Row card (recently viewed)
│   └── skeleton-card.tsx     # NEW: Loading placeholder card
└── discovery/
    ├── category-filter.tsx   # NEW: Scrollable chip row + advanced panel
    └── ingredient-chips.tsx  # NEW: Pinned ingredient chips area below search bar
```

### Pattern 1: Feed Query with Allergen Exclusion + Skill Ordering

The core SQL pattern that powers DISC-02 and DISC-05:

```sql
-- For You feed: beginner user, no allergens (simple case)
SELECT id, title, category, skill_level, prep_time, cook_time, cover_image, allergens
FROM recipes
WHERE skill_level = 'beginner'
ORDER BY rowid ASC
LIMIT 50;

-- For You feed: with allergen exclusion (user has allergens = '["gluten","dairy"]')
-- Exclude recipes where ANY allergen in user's list exists in recipe's allergens array
SELECT DISTINCT r.id, r.title, r.category, r.skill_level, r.prep_time, r.cook_time
FROM recipes r
WHERE NOT EXISTS (
  SELECT 1
  FROM json_each(r.allergens) AS ra
  WHERE ra.value IN (
    SELECT value FROM json_each(?) -- user allergens as JSON string, e.g. '["gluten","dairy"]'
  )
)
ORDER BY
  CASE r.skill_level
    WHEN 'beginner' THEN 1
    WHEN 'intermediate' THEN 2
    WHEN 'advanced' THEN 3
  END ASC;
```

**Why NOT EXISTS over JOIN:** A JOIN with json_each produces multiple rows per recipe (one per matching allergen), requiring DISTINCT. NOT EXISTS is cleaner and uses the indexes more predictably.

### Pattern 2: Category + Advanced Filter Query

```sql
-- Category filter + cook time + skill filter + allergen exclusion
SELECT DISTINCT r.id, r.title, r.category, r.skill_level, r.prep_time, r.cook_time
FROM recipes r
WHERE
  -- Category filter (null = 'Hepsi' / show all)
  (? IS NULL OR r.category = ?)
  -- Cook time bucket
  AND (? IS NULL OR (
    CASE ?
      WHEN 'under15' THEN (r.prep_time + r.cook_time) < 15
      WHEN '15to30'  THEN (r.prep_time + r.cook_time) BETWEEN 15 AND 30
      WHEN 'over30'  THEN (r.prep_time + r.cook_time) > 30
      ELSE 1
    END
  ))
  -- Skill filter
  AND (? IS NULL OR r.skill_level = ?)
  -- Cuisine filter
  AND (? IS NULL OR r.cuisine = ?)
  -- Allergen exclusion (same NOT EXISTS subquery as above)
  AND NOT EXISTS (
    SELECT 1 FROM json_each(r.allergens) ra
    WHERE ra.value IN (SELECT value FROM json_each(?))
  )
ORDER BY r.rowid ASC;
```

> Note: SQLite's `json_each` with a JSON string parameter like `'["gluten"]'` is supported in Expo SDK 50+ (project is SDK 54). The `json_each(?)` subquery style requires binding a JSON-stringified array.

### Pattern 3: Ingredient Autocomplete Data Extraction

Ingredients are stored as JSON in `ingredient_groups` TEXT column. Extract all unique names at screen mount:

```typescript
// In useRecipesDb hook or standalone function:
async function getAllIngredientNames(db: SQLiteDatabase): Promise<string[]> {
  // Extract ingredient group items from the JSON column
  const rows = await db.getAllAsync<{ ingredient_groups: string }>(
    'SELECT ingredient_groups FROM recipes'
  );
  const namesSet = new Set<string>();
  for (const row of rows) {
    const groups = JSON.parse(row.ingredient_groups) as Array<{
      label: string | null;
      items: Array<{ name: string }>;
    }>;
    for (const group of groups) {
      for (const item of group.items) {
        namesSet.add(item.name);
      }
    }
  }
  return Array.from(namesSet).sort();
}
```

With ~30 recipes this is fast enough to run once on mount and memoize. No need for a derived lookup table.

### Pattern 4: Ingredient Search Query (AND logic + fallback)

```typescript
// Phase 1: AND logic — all chips must be present
async function searchByIngredients(
  db: SQLiteDatabase,
  ingredients: string[], // e.g. ["domates", "soğan"]
  userAllergens: string[]
): Promise<Recipe[]> {
  if (ingredients.length === 0) return [];

  // Build a query that counts how many of the requested ingredients each recipe has
  const placeholders = ingredients.map(() => '?').join(', ');
  const rows = await db.getAllAsync<{ id: string; match_count: number; ingredient_groups: string }>(
    `SELECT r.id, r.ingredient_groups,
      (SELECT COUNT(DISTINCT ji.value)
       FROM json_each(r.ingredient_groups) AS jg,
            json_each(json_extract(jg.value, '$.items')) AS ji_obj,
            json_each(json_extract(ji_obj.value, '$.name')) AS ji
       WHERE ji.value IN (${placeholders})
      ) AS match_count
     FROM recipes r
     WHERE NOT EXISTS (
       SELECT 1 FROM json_each(r.allergens) ra
       WHERE ra.value IN (SELECT value FROM json_each(?))
     )
     ORDER BY match_count DESC`,
    [...ingredients, JSON.stringify(userAllergens)]
  );
  // AND logic: require match_count === ingredients.length
  const allMatch = rows.filter(r => r.match_count === ingredients.length);
  if (allMatch.length > 0) return parseRecipes(allMatch);
  // Fallback: partial matches ranked by overlap
  return parseRecipes(rows.filter(r => r.match_count > 0));
}
```

> Note: The nested json_each for ingredient_groups JSON structure (array of groups, each with items array, each item with a name) is complex. A simpler and more reliable approach for ~30 recipes: load all recipes into JS memory, filter in-process with Array methods. This avoids deep-nested JSON SQL and is fast enough for this dataset size.

**Recommended approach for ingredient search:** Load recipe titles + ingredient_groups JSON client-side once, parse in JS memory, filter/rank with Array. SQLite for structured column filters (category, skill_level), JS for JSON content matching.

### Pattern 5: FlashList 2-Column Grid

```typescript
// Source: shopify.github.io/flash-list/docs/usage
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={recipes}
  numColumns={2}
  renderItem={({ item }) => <RecipeCardGrid recipe={item} />}
  keyExtractor={(item) => item.id}
  // No estimatedItemSize needed in FlashList v2
  ListEmptyComponent={<EmptyState />}
/>
```

> Do NOT pass explicit `key` prop inside `renderItem` — FlashList manages recycling internally.

### Pattern 6: Tabs Restructure

```typescript
// app/(tabs)/_layout.tsx — updated tab configuration
// File renames required first:
//   explore.tsx  → search.tsx
//   settings.tsx → my-kitchen.tsx

<Tabs>
  <Tabs.Screen
    name="index"           // file: index.tsx (Feed)
    options={{
      title: 'Keşfet',
      tabBarIcon: ({ color }) => <IconSymbol name="house.fill" color={color} />,
    }}
  />
  <Tabs.Screen
    name="search"          // file: search.tsx (new file, replaces explore.tsx)
    options={{
      title: 'Ara',
      tabBarIcon: ({ color }) => <IconSymbol name="magnifyingglass" color={color} />,
    }}
  />
  <Tabs.Screen
    name="my-kitchen"      // file: my-kitchen.tsx (replaces settings.tsx)
    options={{
      title: 'Mutfağım',
      tabBarIcon: ({ color }) => <IconSymbol name="fork.knife" color={color} />,
    }}
  />
</Tabs>
```

**File rename strategy:** Create the new file (`my-kitchen.tsx`, `search.tsx`), copy content from old file, then delete old file. This avoids Expo Router complaining about unregistered routes during a mid-state rename.

### Anti-Patterns to Avoid

- **DO NOT use json_each for ingredient matching** in the nested IngredientGroup structure — the path is three levels deep and brittle. Load ingredient_groups into JS and filter in-process for the 30-recipe dataset.
- **DO NOT use FlatList with numColumns for the recipe grid** — blank cells appear on Android when item count is not evenly divisible by column count. FlashList handles this correctly.
- **DO NOT build a separate ingredient index table** — the dataset is small enough that extracting unique names into a JS Set at screen mount is ~10ms and requires no schema change.
- **DO NOT fetch full recipe rows (including steps JSON)** for list screens — steps can be 2–5KB per recipe. SELECT only display columns (id, title, category, skill_level, prep_time, cook_time, cover_image, allergens) for list queries; fetch full record only on recipe detail navigation.
- **DO NOT call getProfile() and getRecipes() independently inside each tab** — profile allergens must be available before filtering. Lift profile load to a context provider or fetch once at tab layout level and pass down.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| High-performance 2-col grid | Custom FlatList numColumns grid | `@shopify/flash-list` numColumns=2 | FlatList has blank-cell bugs on Android; FlashList v2 is the project's New Architecture list component |
| Category gradient card backgrounds | Custom View with backgroundColor per category | `expo-linear-gradient` LinearGradient | Gradient requires native blending; pure View + solid color is simpler and may be sufficient |
| Autocomplete dropdown | Third-party autocomplete library | TextInput + controlled FlatList suggestion list | For a fixed ~200-item list derived from DB, a custom component is 50 lines and eliminates a 30–50KB dependency |
| Allergen set-intersection | JS-side filtering after full table fetch | SQLite `NOT EXISTS (SELECT 1 FROM json_each(r.allergens) ...)` | Server-side filtering means only valid rows are returned; JS filtering requires full table round-trip |

**Key insight:** With only 30 recipes, the "performance vs. simplicity" tradeoff strongly favors simplicity in JS-land. Use SQLite for structured column filtering (category, skill_level, cook_time ranges) where indexes help, but don't fight SQLite's JSON model for complex nested JSON parsing — do that in JS.

---

## Common Pitfalls

### Pitfall 1: Forgetting to SELECT-limit columns on list queries
**What goes wrong:** Selecting `steps` (2–5KB JSON per recipe) on every feed render unnecessarily multiplies data transfer and parse time.
**Why it happens:** Convenience — `SELECT *` is easy.
**How to avoid:** All list-screen queries must explicitly name only display columns. Only recipe detail screen loads full `SELECT *`.
**Warning signs:** List feels slow to load on first render; memory usage spikes.

### Pitfall 2: json_each() with user allergens as JS Array (not JSON string)
**What goes wrong:** `db.getAllAsync(query, [userAllergens])` where `userAllergens` is a JS `string[]` — SQLite receives `[object Array]` not `'["gluten","dairy"]'`.
**Why it happens:** Forgetting to `JSON.stringify()` the array before binding.
**How to avoid:** Always bind allergens as `JSON.stringify(profile.allergens)`. The established pattern in `profile.ts` uses `JSON.stringify` for all array columns.
**Warning signs:** Allergen filter appears to exclude nothing (or throws SQLite error).

### Pitfall 3: FlashList key prop on renderItem children
**What goes wrong:** Adding `key={item.id}` inside `renderItem` breaks FlashList's cell recycling — components get remounted instead of recycled.
**Why it happens:** Habit from FlatList.
**How to avoid:** Use `keyExtractor={(item) => item.id}` on the FlashList itself. Remove all explicit `key` props from inside `renderItem`.
**Warning signs:** FlashList shows warning in console about key props.

### Pitfall 4: Tab file rename causes 404 route
**What goes wrong:** Renaming `settings.tsx` to `my-kitchen.tsx` and updating `_layout.tsx` in the same commit causes a brief state where the old route still appears referenced.
**Why it happens:** Expo Router picks up file names from the filesystem; the name prop must match the filename exactly.
**How to avoid:** Create the new file first, confirm it renders, then update `_layout.tsx`, then delete the old file. Never leave both files present simultaneously.
**Warning signs:** Tab bar renders but tapping opens blank screen or 404 error.

### Pitfall 5: Allergen filter not applied to Trending tab
**What goes wrong:** Trending tab shows manually curated order but forgets to apply allergen WHERE clause.
**Why it happens:** "Trending is just a sort order" thinking — but allergen exclusion must apply to all surfaces.
**How to avoid:** Every recipe list query, including the Trending curated order query, must include the allergen NOT EXISTS clause. Write a shared `buildAllergenExclusionClause(userAllergens)` SQL fragment helper.
**Warning signs:** DISC-05 verification fails: recipe with user's allergen appears in Trending.

### Pitfall 6: Profile allergens not available when recipe list renders
**What goes wrong:** Race condition between `getProfile()` (async) and the recipe list query — list renders with empty allergens array before profile loads.
**Why it happens:** Component-level `useEffect` with unguarded `getAllAsync` for recipes.
**How to avoid:** Load profile first (in a single `useEffect` with a loading gate), then query recipes. Or use a React context that provides profile and gates rendering on `profileLoaded` flag.
**Warning signs:** App briefly shows allergen-conflicting recipes on first render, then re-filters.

### Pitfall 7: Autocomplete suggestion flicker on every keypress
**What goes wrong:** Building the suggestion list from DB on every keystroke causes visible lag/flicker.
**Why it happens:** Calling `getAllIngredientNames()` inside the `onChangeText` handler.
**How to avoid:** Extract all ingredient names ONCE on Search screen mount, store in `useState`. Filter in JS on keypress using `Array.filter()` — this is synchronous and instant for ~200 items.
**Warning signs:** Autocomplete feels sluggish on first letters typed.

---

## Code Examples

### Allergen Exclusion SQL Fragment
```typescript
// Source: sqlite.org/json1.html — json_each() table-valued function
// Bind allergenJson as JSON.stringify(profile.allergens)

const ALLERGEN_EXCLUSION = `
  NOT EXISTS (
    SELECT 1 FROM json_each(r.allergens) AS ra
    WHERE ra.value IN (
      SELECT value FROM json_each(?)
    )
  )
`;
// Usage:
const rows = await db.getAllAsync(
  `SELECT id, title, category, skill_level, prep_time, cook_time
   FROM recipes r
   WHERE ${ALLERGEN_EXCLUSION}
   ORDER BY rowid ASC`,
  [JSON.stringify(profile.allergens)]
);
```

### Category Gradient Palette
```typescript
// Claude's Discretion — suggested palette anchored to brand terracotta #E07B39
const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  'ana yemek':  ['#E07B39', '#C05F20'],   // terracotta — primary brand
  'kahvaltı':   ['#F59E0B', '#D97706'],   // amber — morning warmth
  'çorba':      ['#0891B2', '#0E7490'],   // cyan — warming broth
  'tatlı':      ['#EC4899', '#DB2777'],   // pink — sweet
  'salata':     ['#16A34A', '#15803D'],   // green — fresh
  'aperatif':   ['#7C3AED', '#6D28D9'],   // purple — snack/social
};

// Default fallback
const DEFAULT_GRADIENT: [string, string] = ['#9CA3AF', '#6B7280'];
```

### FlashList 2-Column Grid (Feed)
```typescript
// Source: shopify.github.io/flash-list/docs/usage
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={recipes}
  numColumns={2}
  renderItem={({ item }) => (
    <RecipeCardGrid
      recipe={item}
      isBookmarked={bookmarkedIds.has(item.id)}
      onBookmarkToggle={handleBookmarkToggle}
    />
  )}
  keyExtractor={(item) => item.id}
  ListEmptyComponent={<EmptyFeedState />}
  contentContainerStyle={{ padding: 8 }}
/>
```

### Ingredient Chip Pinning Pattern
```typescript
// Search screen state — ingredient chips
const [ingredientChips, setIngredientChips] = useState<string[]>([]);
const [searchQuery, setSearchQuery] = useState('');

function handleSelectIngredient(name: string) {
  if (!ingredientChips.includes(name)) {
    setIngredientChips(prev => [...prev, name]);
  }
  setSearchQuery(''); // Clear bar immediately — user builds basket
}

function handleRemoveChip(name: string) {
  setIngredientChips(prev => prev.filter(n => n !== name));
}
```

### Recent Views — SQLite Table Approach (Recommended)
```sql
-- DB migration (version 3 addition)
CREATE TABLE IF NOT EXISTS recent_views (
  recipe_id TEXT PRIMARY KEY NOT NULL,
  viewed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Max 10 entries: enforce in application layer
-- (DELETE FROM recent_views WHERE recipe_id NOT IN
--  (SELECT recipe_id FROM recent_views ORDER BY viewed_at DESC LIMIT 10))
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FlatList numColumns for grids | FlashList v2 numColumns | FlashList v2: 2025, New Arch default in SDK 54 | No blank cells, recycling works correctly, no size estimates needed |
| AsyncStorage for all app state | expo-sqlite for structured data, AsyncStorage only for simple KV | SDK 50+ (expo-sqlite v2 API) | Recent views can live in SQLite alongside other app data |
| json_extract for array checks | json_each() for set-intersection | SQLite 3.38+ (shipped in Expo SDK 50+) | Allergen filtering is a pure SQL operation, no JS round-trip |

**Deprecated/outdated:**
- `openDatabase()` API of expo-sqlite: replaced by `SQLiteProvider` + `useSQLiteContext`. The project already uses the correct v2 API.
- `estimatedItemSize` on FlashList: required in v1, not needed in v2 (New Architecture enabled = synchronous layout measurements).

---

## Open Questions

1. **Recent views: AsyncStorage vs SQLite table**
   - What we know: AsyncStorage is not installed; SQLite is already the app's storage layer; DB_VERSION is at 2
   - What's unclear: Whether the added complexity of a DB migration (bump to version 3) is worth the consistency benefit
   - Recommendation: Use SQLite `recent_views` table — consistent with the "everything in one place" principle, no new dependency, trivially queryable for the row-card display

2. **Solid color vs. gradient placeholders for recipe cards**
   - What we know: `coverImage` is null for all v1 recipes; `expo-linear-gradient` needs a new install
   - What's unclear: Whether gradient polish is worth the dependency cost
   - Recommendation: Install `expo-linear-gradient` — it is an Expo first-party package, lightweight, and the visual result is significantly better for a food app

3. **Trending display order encoding**
   - What we know: "Hira decides a curated display order baked into the app"
   - What's unclear: How exactly to encode this — a hardcoded ordered array of recipe IDs? A `display_order` column on the recipes table? An ORDER BY on an existing field?
   - Recommendation: Add a `display_order INTEGER` column in the DB migration (version 3) populated from a seed array. Alternatively (simpler for 30 recipes): hardcode a `TRENDING_ORDER: string[]` array of recipe IDs in a constants file and use `ORDER BY CASE id WHEN ? THEN 0 ... END`. The constants approach avoids a schema change.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + jest-expo ~54.0.17 |
| Config file | `package.json` (`jest` key) |
| Quick run command | `npx jest --testPathPattern="__tests__/(discovery|profile|schema)" --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISC-01 | Ingredient search returns matching recipes; AND logic; fallback to partial | unit | `npx jest --testPathPattern="discovery" --no-coverage` | ❌ Wave 0 |
| DISC-02 | Feed query orders by skill level; beginner-first for null skill | unit | `npx jest --testPathPattern="discovery" --no-coverage` | ❌ Wave 0 |
| DISC-03 | Category filter + cook time filter returns correct subset | unit | `npx jest --testPathPattern="discovery" --no-coverage` | ❌ Wave 0 |
| DISC-04 | addBookmark / removeBookmark / getBookmarks roundtrip | unit | `npx jest --testPathPattern="profile" --no-coverage` | ✅ (profile.test.ts has BookmarkSchema tests; DB roundtrip test needed) |
| DISC-05 | Allergen exclusion removes correct recipes from all surfaces | unit | `npx jest --testPathPattern="discovery" --no-coverage` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="discovery" --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/discovery.test.ts` — covers DISC-01 (ingredient search logic), DISC-02 (feed ordering), DISC-03 (filter queries), DISC-05 (allergen exclusion SQL)
- [ ] DB mock or in-memory SQLite needed for discovery tests — follow the pattern in `migration.test.ts` if available

*(DISC-04 bookmark schema is tested in `profile.test.ts` but a DB-level roundtrip test for add/remove/list should be added to `discovery.test.ts` or a new `bookmark.test.ts`)*

---

## Sources

### Primary (HIGH confidence)
- [expo-sqlite official docs](https://docs.expo.dev/versions/latest/sdk/sqlite/) — useSQLiteContext pattern, getAllAsync, json_each support in SDK 50+
- [SQLite json1 official docs](https://sqlite.org/json1.html) — json_each() table-valued function, NOT EXISTS subquery pattern for set intersection
- [expo-router tabs docs](https://docs.expo.dev/router/advanced/tabs/) — screen name = filename, title = display label, file rename procedure
- [FlashList usage docs](https://shopify.github.io/flash-list/docs/usage/) — numColumns support, key prop behavior, v2 eliminates estimatedItemSize
- [expo.dev/blog FlashList v2 announcement](https://shopify.engineering/flashlist-v2) — New Architecture requirement confirmed
- Project source code examined: `src/db/client.ts`, `src/db/profile.ts`, `src/types/recipe.ts`, `src/types/profile.ts`, `components/ui/chip.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/settings.tsx`, `app.json`

### Secondary (MEDIUM confidence)
- [expo-linear-gradient npm](https://www.npmjs.com/package/expo-linear-gradient) — separate install required (not bundled with Expo SDK)
- [FlashList vs FlatList comparison](https://medium.com/whitespectre/flashlist-vs-flatlist-understanding-the-key-differences-for-react-native-performance-15f59236a39c) — recycling behavior differences, grid blank-cell issue
- Expo blog: New Architecture enabled by default in SDK 54; FlashList v2 targets New Architecture

### Tertiary (LOW confidence — flag for validation)
- AsyncStorage size limit of 6MB on Android — from community sources; not likely to matter for recent views (10 recipe IDs)
- Reanimated v4 `createAnimatedComponent` has a known issue in Expo 54 — if shimmer uses this, switch to `useAnimatedStyle` + interpolation pattern instead

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against official Expo docs and project's package.json
- Architecture: HIGH — based on direct inspection of existing codebase patterns
- SQL patterns: HIGH — verified against SQLite official json1 docs and expo-sqlite docs
- Pitfalls: MEDIUM — derived from code inspection + community sources; some not tested against this exact version combination
- FlashList v2 specifics: HIGH — official FlashList docs + Shopify engineering post confirmed New Arch support and API changes

**Research date:** 2026-03-12
**Valid until:** 2026-06-12 (stable ecosystem; FlashList v2 API locked; SQLite json1 is stable)
