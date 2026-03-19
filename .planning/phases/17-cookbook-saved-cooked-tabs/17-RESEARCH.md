# Phase 17: Cookbook Saved/Cooked Tabs - Research

**Researched:** 2026-03-19
**Domain:** React Native tab UI, SQLite cooking history queries, star rating UX
**Confidence:** HIGH

## Summary

Phase 17 transforms the existing Cookbook screen from a single bookmarks list into a tabbed layout with **Saved** (bookmarked recipes) and **Cooked** (cooking history with ratings) tabs. The codebase already has all the foundational pieces: the `cooking_history` table (DB version 6), the `logCookingCompletion` function, the `RecipeCardRow` component (single-recipe-per-row layout), and the `StarRating` internal component in `completion-screen.tsx`. The work is primarily UI composition and a few new DB query functions.

The cookbook screen currently lives at `app/(tabs)/cookbook.tsx` with its data logic extracted into `src/hooks/useCookbookScreen.ts` (following the project's hook-extraction pattern). It shows bookmarked recipes in a 2-column grid layout using `RecipeCardGrid`. Phase 17 changes this to: (1) add tab switching between Saved and Cooked views, (2) switch both tabs to single-recipe-per-row layout using `RecipeCardRow` (UX-08), (3) add star ratings and cook count metadata to the Cooked tab rows, and (4) allow re-rating from the Cooked tab.

**Primary recommendation:** Build tab switching with plain React state + `Pressable` tab bar (no new dependencies), extend `cooking-history.ts` with aggregate queries, and create a `RecipeCardRowCooked` variant that shows star rating + cook count metadata alongside the existing row layout.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BOOK-01 | Two tabs in Cookbook: Saved (bookmarked) and Cooked (cooking history) | Tab switching via React state; existing `useCookbookScreen` hook extended with `activeTab` state and cooked recipe data loading |
| BOOK-02 | Star rating shown on each recipe in the Cooked tab | `cooking_history` table already stores `rating INTEGER`; new aggregate query returns latest rating per recipe; `STAR_RATING_COLOR` constant already defined |
| BOOK-03 | User can tap to re-rate a recipe from the Cooked tab | New `updateLatestRating(db, recipeId, rating)` function in `cooking-history.ts`; inline star row component (extracted from `completion-screen.tsx` StarRating pattern) |
| BOOK-04 | Cook count on cooked recipes (e.g., "3 kez pisirdin") | New aggregate query: `SELECT recipe_id, COUNT(*) as cook_count, ... FROM cooking_history GROUP BY recipe_id`; displayed as metadata text on row card |
| UX-08 | Single-recipe-per-row layout (matching Recently Seen style) | Replace `RecipeCardGrid` with `RecipeCardRow` in both Saved and Cooked tabs; `RecipeCardRow` already exists at `components/ui/recipe-card-row.tsx` |
</phase_requirements>

## Standard Stack

### Core (already installed, no new dependencies needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native | 0.81.5 | Core framework | Already in project |
| expo-sqlite | ~16.0.10 | SQLite for cooking_history queries | Already used for all DB operations |
| expo-router | ~6.0.23 | Navigation + useFocusEffect | Already used in useCookbookScreen |
| @expo/vector-icons | ^15.0.3 | MaterialCommunityIcons for star icons | Already used throughout |
| expo-image | ~3.0.11 | Recipe thumbnails in row cards | Already used in RecipeCardRow |

### No New Dependencies Required
This phase requires zero new npm packages. All UI patterns (tabs, star ratings, row cards) can be built from existing components and primitives.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React state tabs | react-native-pager-view (already installed) | PagerView adds swipe-to-switch but is overkill for two tabs; state toggle is simpler and gives instant switching (SC-1 requirement) |
| React state tabs | @react-navigation/material-top-tabs | Would require new dependency; project already uses bottom tabs only |
| Custom star row | Third-party rating library | Unnecessary -- StarRating pattern already exists in completion-screen.tsx |

## Architecture Patterns

### Recommended Project Structure (changes only)
```
src/
  db/
    cooking-history.ts      # ADD: getCookedRecipesWithMeta, updateLatestRating
  hooks/
    useCookbookScreen.ts    # MODIFY: add activeTab, cooked recipes data, re-rate action
  types/
    discovery.ts            # ADD: CookedRecipeItem type (extends RecipeListItem with rating + cookCount)
components/
  ui/
    recipe-card-row-cooked.tsx  # NEW: RecipeCardRow variant with star rating + cook count
    star-rating-inline.tsx      # NEW: reusable inline star rating (extracted from completion-screen pattern)
app/
  (tabs)/
    cookbook.tsx             # MODIFY: add tab bar, switch between Saved/Cooked views, use RecipeCardRow
```

### Pattern 1: Tab Switching via React State (no new dependencies)
**What:** Two Pressable tab buttons that toggle `activeTab` state between 'saved' and 'cooked'. Content renders conditionally based on active tab.
**When to use:** When there are only 2 tabs and instant switching is required (SC-1).
**Example:**
```typescript
// In useCookbookScreen.ts
const [activeTab, setActiveTab] = useState<'saved' | 'cooked'>('saved');

// In cookbook.tsx
<View style={styles.tabBar}>
  <Pressable onPress={() => setActiveTab('saved')}>
    <Text style={activeTab === 'saved' ? styles.tabActive : styles.tabInactive}>
      Kaydedilenler
    </Text>
  </Pressable>
  <Pressable onPress={() => setActiveTab('cooked')}>
    <Text style={activeTab === 'cooked' ? styles.tabActive : styles.tabInactive}>
      Pisirilmis
    </Text>
  </Pressable>
</View>

{activeTab === 'saved' ? <SavedContent /> : <CookedContent />}
```

### Pattern 2: Aggregate Cooking History Query
**What:** Single SQL query that returns recipe_id, cook_count, latest_rating, and last_cooked_at for all cooked recipes, grouped by recipe_id.
**When to use:** Loading Cooked tab data.
**Example:**
```typescript
// In cooking-history.ts
interface CookedRecipeMeta {
  recipeId: string;
  cookCount: number;
  latestRating: number | null;
  lastCookedAt: string;
}

export async function getCookedRecipesWithMeta(
  db: SQLiteDatabase
): Promise<CookedRecipeMeta[]> {
  const rows = await db.getAllAsync<{
    recipe_id: string;
    cook_count: number;
    latest_rating: number | null;
    last_cooked_at: string;
  }>(`
    SELECT
      recipe_id,
      COUNT(*) as cook_count,
      (SELECT rating FROM cooking_history ch2
       WHERE ch2.recipe_id = ch.recipe_id
       ORDER BY cooked_at DESC LIMIT 1) as latest_rating,
      MAX(cooked_at) as last_cooked_at
    FROM cooking_history ch
    GROUP BY recipe_id
    ORDER BY MAX(cooked_at) DESC
  `);
  return rows.map(row => ({
    recipeId: row.recipe_id,
    cookCount: row.cook_count,
    latestRating: row.latest_rating,
    lastCookedAt: row.last_cooked_at,
  }));
}
```

### Pattern 3: Re-rating with UPDATE on Latest Row
**What:** Updates the rating on the most recent cooking_history entry for a given recipe_id.
**When to use:** When user taps to change rating from the Cooked tab (BOOK-03).
**Example:**
```typescript
export async function updateLatestRating(
  db: SQLiteDatabase,
  recipeId: string,
  rating: number
): Promise<void> {
  await db.runAsync(
    `UPDATE cooking_history SET rating = ?
     WHERE id = (
       SELECT id FROM cooking_history
       WHERE recipe_id = ?
       ORDER BY cooked_at DESC LIMIT 1
     )`,
    [rating, recipeId]
  );
}
```

### Pattern 4: Hook Extension (project convention)
**What:** Extend `useCookbookScreen` with tab state and cooked data rather than creating a separate hook.
**When to use:** The project convention is one hook per screen (useFeedScreen, useSearchScreen, useCookbookScreen). The cookbook is still one screen, just with tabs.
**Example:**
```typescript
// Extended state in useCookbookScreen
export interface CookbookScreenState {
  // ... existing fields ...
  activeTab: 'saved' | 'cooked';
  cookedRecipes: CookedRecipeDisplayItem[];
  cookedLoading: boolean;
}

export interface CookbookScreenActions {
  // ... existing actions ...
  setActiveTab: (tab: 'saved' | 'cooked') => void;
  handleReRate: (recipeId: string, rating: number) => Promise<void>;
}
```

### Anti-Patterns to Avoid
- **Using PagerView for 2 tabs:** Adds unnecessary swipe gesture handling complexity. The requirement says "switching between them is instant" -- a state toggle achieves this.
- **Fetching cooked data on every tab switch:** Load both saved and cooked data on screen focus, cache in state, switch between them instantly.
- **Creating a separate route for Cooked:** This is still the Cookbook screen, just tabbed. Keep it as `app/(tabs)/cookbook.tsx`.
- **Duplicating the RecipeCardRow component entirely:** Create a thin wrapper `RecipeCardRowCooked` that composes `RecipeCardRow` props with additional rating/count metadata, or extend the existing component with optional props.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Row card layout | Custom card layout | Existing `RecipeCardRow` component | Already has thumbnail, title, metadata pattern; just needs rating/count metadata added |
| Star rating UI | Custom star component from scratch | Extract pattern from `completion-screen.tsx` `StarRating` | Already built and tested; same `STAR_RATING_COLOR` constant |
| Tab indicator styling | Custom underline animation | Simple `borderBottom` or `backgroundColor` on active tab | Two tabs, no animation needed; matches minimal UI philosophy |
| Cook count text | Complex pluralization logic | Simple ternary: `count > 1 ? 'X kez pisirdin' : null` | Only shown when count > 1 per SC-4 |
| SQLite aggregation | JS-side grouping | SQL `GROUP BY recipe_id` with `COUNT(*)` and `MAX(cooked_at)` | More efficient; SQLite handles this natively |

## Common Pitfalls

### Pitfall 1: Loading Both Tabs Data on Every Focus
**What goes wrong:** Loading only the active tab's data and triggering a re-fetch on every tab switch causes visible flicker.
**Why it happens:** Naive implementation ties data loading to tab state.
**How to avoid:** Load both saved and cooked recipe data in parallel during `useFocusEffect`. Cache both in state. Tab switching is purely a UI toggle.
**Warning signs:** Flicker or loading skeleton when switching tabs.

### Pitfall 2: Rating State Desync After Re-Rating
**What goes wrong:** User re-rates a recipe in the Cooked tab but the displayed rating doesn't update.
**Why it happens:** The cooked recipes state isn't updated optimistically after the DB write.
**How to avoid:** After `updateLatestRating`, update the local `cookedRecipes` state immediately (optimistic update pattern used throughout the project).
**Warning signs:** Rating visually reverting or requiring tab switch to show new value.

### Pitfall 3: Missing Recipes in Cooked Tab Due to Hard Filters
**What goes wrong:** User cooks a recipe, then changes their allergen profile, and the recipe disappears from Cooked tab.
**Why it happens:** Applying hard filters to cooking history would hide recipes the user has already cooked.
**How to avoid:** Do NOT apply hard filters (allergen/skill/equipment exclusion) to the Cooked tab. The user already cooked these -- hiding them is confusing. Hard filters should still apply to the Saved tab (consistent with current behavior).
**Warning signs:** "I cooked this recipe but it's not in my history."

### Pitfall 4: Cook Count Off-by-One
**What goes wrong:** Recipe cooked once shows "1 kez pisirdin" when it should show nothing.
**Why it happens:** Not checking the count > 1 threshold per SC-4.
**How to avoid:** Only render cook count text when `cookCount > 1`. SC-4 says "when cooked more than once."
**Warning signs:** Cook count showing for single-cook recipes.

### Pitfall 5: RecipeCardRow Missing Bookmark Toggle in Saved Tab
**What goes wrong:** User can't unbookmark from the Saved tab when switching from RecipeCardGrid to RecipeCardRow.
**Why it happens:** `RecipeCardRow` doesn't have a bookmark toggle prop (it was designed for search results / recently viewed). `RecipeCardGrid` has `onBookmarkToggle`.
**How to avoid:** Either (a) add an optional bookmark toggle prop to `RecipeCardRow` for the Saved tab, or (b) add a swipe-to-remove gesture. Option (a) is simpler and consistent -- add a small heart icon on the right side of the row.
**Warning signs:** No way to unbookmark from the Saved tab after layout change.

### Pitfall 6: Empty State Differences Between Tabs
**What goes wrong:** Both tabs show the same empty state message.
**Why it happens:** Using a generic empty state for both.
**How to avoid:** Saved tab empty state: existing heart-outline icon + "Henuz kaydedilmis tarifiniz yok" message. Cooked tab empty state: cooking-related icon + "Henuz bir tarif pisirmediniz" message.
**Warning signs:** Confusing empty state text.

## Code Examples

### Existing cooking_history Table Schema (DB version 6)
```sql
-- Source: src/db/client.ts, migration version 6
CREATE TABLE IF NOT EXISTS cooking_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id TEXT NOT NULL,
  cooked_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  rating INTEGER
);
CREATE INDEX IF NOT EXISTS idx_cooking_history_recipe_id ON cooking_history (recipe_id);
```

### Existing logCookingCompletion (called on cook screen finish)
```typescript
// Source: src/db/cooking-history.ts
export async function logCookingCompletion(
  db: SQLiteDatabase,
  recipeId: string,
  rating?: number
): Promise<void> {
  await db.runAsync(
    "INSERT INTO cooking_history (recipe_id, rating) VALUES (?, ?)",
    [recipeId, rating ?? null]
  );
}
```

### Existing StarRating Pattern (to extract/reuse)
```typescript
// Source: components/cooking/completion-screen.tsx
function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)} accessibilityRole="button" accessibilityLabel={`${star} yildiz`}>
          <MaterialCommunityIcons
            name={star <= value ? 'star' : 'star-outline'}
            size={36}
            color={star <= value ? STAR_RATING_COLOR : colors.disabledIcon}
          />
        </Pressable>
      ))}
    </View>
  );
}
```

### Existing RecipeCardRow Layout (UX-08 reference)
```typescript
// Source: components/ui/recipe-card-row.tsx
// Card: height 80, borderRadius 14
// Thumbnail: width 80, height 80
// Content: flex 1, title + metaRow (skill badge, equipment warning, cook time)
// Already supports cover images with blurhash via expo-image
```

### Fetching Cooked Recipes with Recipe Details
```typescript
// Pattern: get cooking meta from cooking_history, then join with recipe data
// Similar to getBookmarkedRecipes pattern in src/db/recipes.ts
export async function getCookedRecipeDetails(
  db: SQLiteDatabase,
  cookedMeta: CookedRecipeMeta[]
): Promise<RecipeListItem[]> {
  const ids = cookedMeta.map(m => m.recipeId);
  if (ids.length === 0) return [];

  const placeholders = ids.map(() => '?').join(', ');
  const rows = await db.getAllAsync<RecipeRow>(
    `SELECT ${SELECT_LIST_COLUMNS} FROM recipes r WHERE r.id IN (${placeholders})`,
    ids
  );
  // Preserve cooking recency order using rowMap pattern (same as getBookmarkedRecipes)
  const rowMap = new Map(rows.map(r => [r.id, mapRowToRecipeListItem(r)]));
  return ids.map(id => rowMap.get(id)).filter(Boolean) as RecipeListItem[];
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cookbook shows grid (RecipeCardGrid) | Switch to row layout (RecipeCardRow) per UX-08 | Phase 17 | Matches "Recently Seen" style in search |
| Cookbook shows only saved recipes | Two tabs: Saved + Cooked | Phase 17 | Users can revisit cooking history |
| Rating only on completion screen | Re-ratable from Cooked tab | Phase 17 | Persistent ratings with edit capability |

**No deprecated/outdated patterns:**
- expo-sqlite v16 API (useSQLiteContext, getAllAsync, runAsync) is current and stable
- RecipeCardRow component is current (updated in Phase 15 with image support)
- cooking_history table schema is current (DB version 6/7)

## Open Questions

1. **Bookmark Toggle in Row Layout**
   - What we know: `RecipeCardRow` does not have a bookmark/heart icon. `RecipeCardGrid` does.
   - What's unclear: Should Saved tab rows show a heart icon for unbookmarking? Or is the expectation that users go to the recipe detail to unbookmark?
   - Recommendation: Add an optional `onBookmarkToggle` prop to `RecipeCardRow` (or create a variant) for the Saved tab. This is more discoverable and matches current behavior. Keep it as a trailing icon (right side of row).

2. **Tab Label Text**
   - What we know: Requirements say "Saved" and "Cooked" in English.
   - What's unclear: App is in Turkish throughout. Need Turkish labels.
   - Recommendation: Use "Kaydedilenler" (Saved) and "Pisirilmis" (Cooked/History). These are consistent with existing Turkish UI.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | jest 29.7.0 + jest-expo ~54.0.17 + @testing-library/react-native ^13.3.3 |
| Config file | package.json `"jest"` section + `jest/setup.ts` |
| Quick run command | `npx jest --testPathPattern="cookbook" --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BOOK-01 | Cookbook has Saved and Cooked tabs; switching is instant | unit (hook) | `npx jest __tests__/cookbook-tabs.test.ts -x` | No - Wave 0 |
| BOOK-02 | Star rating shown on cooked recipes | unit (hook) | `npx jest __tests__/cookbook-tabs.test.ts -x` | No - Wave 0 |
| BOOK-03 | Re-rating updates DB and local state | unit (hook + db) | `npx jest __tests__/cookbook-tabs.test.ts -x` | No - Wave 0 |
| BOOK-04 | Cook count shown when > 1 | unit (hook) | `npx jest __tests__/cookbook-tabs.test.ts -x` | No - Wave 0 |
| UX-08 | Row layout used (not grid) | unit (component) | `npx jest __tests__/cookbook-tabs.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="cookbook" --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/cookbook-tabs.test.ts` -- covers BOOK-01 through BOOK-04, UX-08 (hook behavior + tab switching)
- [ ] `__tests__/cooking-history-queries.test.ts` -- covers getCookedRecipesWithMeta, updateLatestRating DB functions
- [ ] AsyncStorage mock per-test file (consistent with project pattern from Phase 15-03, Phase 16-01)

## Sources

### Primary (HIGH confidence)
- **Project codebase** -- all findings based on direct code inspection:
  - `src/db/cooking-history.ts` -- existing DB functions
  - `src/db/client.ts` -- migration history, cooking_history schema (DB version 6)
  - `src/hooks/useCookbookScreen.ts` -- current hook structure
  - `app/(tabs)/cookbook.tsx` -- current screen implementation
  - `components/ui/recipe-card-row.tsx` -- row card component
  - `components/cooking/completion-screen.tsx` -- StarRating pattern
  - `constants/palette.ts` -- STAR_RATING_COLOR (#F59E0B)
  - `constants/theme.ts` -- all color tokens (disabledIcon, textSub, etc.)
  - `src/types/discovery.ts` -- CookingHistoryEntry type, RecipeListItem

### Secondary (MEDIUM confidence)
- expo-sqlite API patterns verified against installed version (~16.0.10)
- react-native-pager-view (6.9.1) -- confirmed installed but NOT recommended for this use case

### Tertiary (LOW confidence)
- None -- all findings verified from project source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies; all components and patterns already exist in codebase
- Architecture: HIGH -- follows established project patterns (hook extraction, DB module separation, useFocusEffect for data loading)
- Pitfalls: HIGH -- identified from actual codebase patterns (hard filter application, optimistic updates, component prop gaps)

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable -- no external dependency changes expected)
