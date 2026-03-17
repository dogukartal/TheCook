# Phase 8: Feed Redesign - Research

**Researched:** 2026-03-17
**Domain:** React Native horizontal-section feed layout, SQL query patterns, cooking history table
**Confidence:** HIGH

## Summary

Phase 8 replaces the current vertical 2-column grid feed (with "Kesfet" / "Sizin icin" tabs and a category filter) with a vertically scrollable feed containing 4 horizontal sections: "Su an trend", "30 dakikada bitir", "Sana ozel", "Denemediklerin". Each section scrolls horizontally showing recipe cards. All sections must respect the existing hard filter system (skill, equipment, allergens). Sections with zero results after filtering are hidden silently.

The existing codebase provides nearly everything needed. The `getAllRecipesForFeed` function already applies hard filters via SQL. The main work is: (1) creating a `cooking_history` (Gecmis) table via DB migration to support "Denemediklerin" exclusion, (2) adding new DB query functions for each section's data source, (3) rewriting `useFeedScreen` to manage 4 section datasets instead of a single list, and (4) replacing the feed UI with a `SectionList` or `ScrollView` containing horizontal `FlatList`/`FlashList` rows.

**Primary recommendation:** Use a vertical `ScrollView` with 4 horizontal `FlatList` sections. Each section fetches data independently through the existing `buildHardFilterClauses` infrastructure. Add `cooking_history` table at DB_VERSION 6. Keep the rule-based "Sana ozel" ranking using profile `cuisinePreferences` and `appGoals` fields (AI deferred).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISC-02 | User can browse a curated feed of recipes without ingredient input, ordered by skill level match | Feed sections provide browsable discovery; hard filters ensure skill-appropriate content |
| FEED-01 | Feed displays 4 horizontal sections (Su an trend, 30 dakikada bitir, Sana ozel, Denemediklerin) all respecting hard filters | Architecture patterns below define section data sources, hard filter reuse, and horizontal scroll layout |
| FEED-02 | Sections with zero results after filtering are hidden silently; if all sections empty, prompt to update profile | Section visibility logic and empty-all-sections fallback documented in patterns |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-sqlite | ~16.0.10 | Local DB for recipes, profile, cooking_history | Already used throughout; v2 API with SQLiteProvider |
| @shopify/flash-list | 2.0.2 | Performant list rendering | Already used in current feed; efficient for horizontal card lists |
| react-native-reanimated | ~4.1.1 | Animations | Already installed; can animate section headers if desired |
| expo-router | ~6.0.23 | Navigation | Already used; useFocusEffect for feed reload |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-linear-gradient | ~15.0.8 | Card gradient backgrounds | Already used in RecipeCardGrid |
| @expo/vector-icons | ^15.0.3 | Section header icons | MaterialCommunityIcons already used |

### No New Dependencies Needed
The feed redesign requires zero new npm packages. All UI patterns (horizontal FlatList, SectionList, ScrollView) are built into React Native core. FlashList supports horizontal mode natively.

## Architecture Patterns

### Recommended Structure Changes
```
src/
  db/
    recipes.ts          # ADD: getFeedTrending, getFeed30Min, getFeedPersonal, getFeedUntried
    cooking-session.ts  # EXISTS: cooking session CRUD
    client.ts           # MODIFY: DB_VERSION 5 -> 6, add cooking_history table
  hooks/
    useFeedScreen.ts    # REWRITE: 4-section data management replacing tab-based model
  types/
    discovery.ts        # MODIFY: add CookingHistoryEntry type, FeedSection type

app/(tabs)/
  index.tsx             # REWRITE: horizontal section layout replacing vertical grid

components/
  ui/
    recipe-card-grid.tsx    # REUSE as-is (or create smaller horizontal variant)
    feed-section.tsx         # NEW: reusable horizontal section component
```

### Pattern 1: Vertical ScrollView with Horizontal FlatList Sections
**What:** The feed is a vertical `ScrollView` containing N section blocks. Each section has a header (title) and a horizontal `FlatList` of recipe cards.
**When to use:** When you have a fixed small number of sections (4) with different data sources per section.
**Why not SectionList:** SectionList is designed for uniform sections with vertical items. For horizontal scrolling within sections, a manual ScrollView + FlatList composition is simpler and avoids the `renderItem` vs `renderSectionHeader` awkwardness with horizontal content.

```typescript
// Feed screen structure
<ScrollView>
  {sections.map((section) => (
    section.data.length > 0 && (
      <FeedSection
        key={section.key}
        title={section.title}
        data={section.data}
        onRecipePress={handleRecipePress}
        // ... other props
      />
    )
  ))}
  {allEmpty && <UpdateProfilePrompt />}
</ScrollView>
```

### Pattern 2: Section Data Loading in Hook
**What:** `useFeedScreen` loads all 4 section datasets in parallel on mount/focus. Each section has its own loading state initially but renders together.
**When to use:** Always for this feed pattern.

```typescript
interface FeedSection {
  key: 'trending' | 'quick' | 'personal' | 'untried';
  title: string;
  data: RecipeListItem[];
}

// In useFeedScreen:
const [sections, setSections] = useState<FeedSection[]>([]);

async function loadAllSections() {
  const hardFilter = buildHardFilter(profile);
  const allRecipes = await getAllRecipesForFeed(hardFilter);
  const historyIds = await getCookedRecipeIds(db);

  const trending = allRecipes; // rowid order (curated trending for v1)
  const quick = allRecipes.filter(r => (r.prepTime + r.cookTime) <= 30);
  const personal = rankByProfile(allRecipes, profile);
  const untried = allRecipes.filter(r => !historyIds.has(r.id));

  setSections([
    { key: 'trending', title: 'Su an trend', data: trending },
    { key: 'quick', title: '30 dakikada bitir', data: quick },
    { key: 'personal', title: 'Sana ozel', data: personal },
    { key: 'untried', title: 'Denemediklerin', data: untried },
  ].filter(s => s.data.length > 0));
}
```

### Pattern 3: Single SQL Fetch + JS Section Splitting
**What:** Fetch all hard-filtered recipes once, then split into sections in JS rather than making 4 separate SQL queries.
**When to use:** With 30-50 recipes, a single query is more efficient than 4. JS filtering is trivially fast at this scale.
**Why:** Reduces DB round trips from 4 to 1 (plus 1 for cooking_history). The dataset is small enough (30-50 recipes) that JS filtering adds negligible overhead.

### Pattern 4: Cooking History Table for "Denemediklerin"
**What:** A `cooking_history` table that logs completed cook sessions. "Denemediklerin" shows recipes NOT in this table.
**When to use:** Required for FEED-01.

```sql
-- DB_VERSION 6 migration
CREATE TABLE IF NOT EXISTS cooking_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id TEXT NOT NULL,
  cooked_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  rating INTEGER  -- nullable, 1-5 star rating (Phase 11 COOKX-03)
);
CREATE INDEX IF NOT EXISTS idx_cooking_history_recipe_id ON cooking_history (recipe_id);
```

**Key design decisions:**
- No UNIQUE on recipe_id: a user can cook the same recipe multiple times
- For "Denemediklerin", query `SELECT DISTINCT recipe_id FROM cooking_history` to get the exclusion set
- The `rating` column is nullable and unused until Phase 11 (COOKX-03) but adding it now avoids a future migration

### Pattern 5: Rule-Based "Sana Ozel" Ranking
**What:** AI ranking is deferred (per success criteria #5). Use profile data for rule-based ranking.
**When to use:** v1 implementation of "Sana ozel".

```typescript
function rankByProfile(recipes: RecipeListItem[], profile: Profile): RecipeListItem[] {
  // Parse cuisine preferences (stored as comma-separated or JSON string)
  const preferredCuisines = parseCuisinePreferences(profile.cuisinePreferences);

  return [...recipes].sort((a, b) => {
    // 1. Cuisine preference match (preferred cuisines first)
    const aMatch = preferredCuisines.includes(a.cuisine) ? 1 : 0;
    const bMatch = preferredCuisines.includes(b.cuisine) ? 1 : 0;
    if (bMatch !== aMatch) return bMatch - aMatch;

    // 2. Skill level proximity (closer to user level = more relevant)
    const skillOrder = { beginner: 1, intermediate: 2, advanced: 3 };
    const userLevel = skillOrder[profile.skillLevel ?? 'beginner'];
    const aDist = Math.abs(skillOrder[a.skillLevel] - userLevel);
    const bDist = Math.abs(skillOrder[b.skillLevel] - userLevel);
    return aDist - bDist;
  });
}
```

### Pattern 6: Horizontal Recipe Card
**What:** The existing `RecipeCardGrid` renders in a 2-column vertical grid. For horizontal sections, cards need a fixed width (not flex) to scroll horizontally.
**When to use:** Every section's horizontal list.

```typescript
// Option A: Create a new RecipeCardHorizontal with fixed width
const CARD_WIDTH = 200; // or calculated from screen width

// Option B: Wrap existing RecipeCardGrid in a fixed-width container
<View style={{ width: CARD_WIDTH }}>
  <RecipeCardGrid recipe={item} ... />
</View>
```

Option A is cleaner. The horizontal card can be narrower and taller, showing cover image prominently with title overlaid. This is a common pattern in food apps (similar to Instagram Explore, Netflix rows).

### Anti-Patterns to Avoid
- **Nested FlashList/FlatList virtualization conflicts:** Do NOT use a vertical FlatList/FlashList as the parent container when children are horizontal FlatLists. Use a plain `ScrollView` as the outer container. React Native does not virtualize nested lists well.
- **Separate SQL queries per section:** With only 30-50 recipes, 4 separate SQL calls is wasteful. Fetch once, split in JS.
- **Re-fetching on section scroll:** Load all section data upfront. Do not lazy-load sections as user scrolls down — the dataset is small enough.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Horizontal scrollable list | Custom scroll handler | `FlatList horizontal={true}` | Built-in snap, momentum, edge clamping |
| Section visibility | Manual show/hide logic | `.filter(s => s.data.length > 0)` before render | Simple conditional rendering |
| DB migration | Manual ALTER TABLE | Existing `migrateDb` pattern with `DB_VERSION` bump | Already established in client.ts |
| Hard filter SQL | New filter system | Existing `buildHardFilterClauses` | Already handles allergen, skill, equipment |

## Common Pitfalls

### Pitfall 1: Nested Virtualized List Warning
**What goes wrong:** Placing a horizontal `FlatList` inside a vertical `FlatList` or `ScrollView` with `nestedScrollEnabled` triggers a React Native performance warning and can cause scroll jank.
**Why it happens:** React Native's scroll responder system conflicts when both axes are virtualized.
**How to avoid:** Use a plain `ScrollView` (not FlatList/FlashList) as the outer vertical container. Only the horizontal lists within each section should be FlatList. Since we have exactly 4 sections (not hundreds), virtualization of the outer container is unnecessary.
**Warning signs:** Yellow box warning about VirtualizedList nested inside ScrollView.

### Pitfall 2: FlashList Horizontal Mode Requires estimatedItemSize
**What goes wrong:** FlashList in horizontal mode without `estimatedItemSize` renders blank or with layout jumps.
**Why it happens:** FlashList uses recycling and needs size estimation for off-screen items.
**How to avoid:** Either use plain `FlatList` for the horizontal sections (simpler, performant enough for 30-50 items) or set `estimatedItemSize` explicitly on FlashList.
**Recommendation:** Use `FlatList` for horizontal sections — the item count per section is small enough that FlashList's recycling provides no meaningful benefit.

### Pitfall 3: Empty Profile Cuisine Preferences
**What goes wrong:** "Sana ozel" section returns same order as trending because `cuisinePreferences` is null.
**Why it happens:** Cuisine preferences are optional profile fields (Phase 7, PROF-03). Many users may not set them.
**How to avoid:** When `cuisinePreferences` is null, fall back to skill-level proximity sort. Always produce a deterministic ordering even without preferences.

### Pitfall 4: Cooking History Table Not Populated Yet
**What goes wrong:** "Denemediklerin" shows ALL recipes because no cooking history exists.
**Why it happens:** The cooking_history table is new. Cooking mode completion (Phase 5) does not currently log to it.
**How to avoid:** This is expected behavior for new users and existing users upgrading. "Denemediklerin" will show all recipes initially, which is correct — they have not tried any. The section naturally becomes useful as the user cooks. Phase 11 (COOKX-03) will add the completion logging flow. For now, the table and exclusion query should be ready, and a manual `logCookingCompletion` function should exist for testing and future integration.

### Pitfall 5: Category Filter Removal
**What goes wrong:** The current feed has a `CategoryFilter` component. Removing it without updating the hook causes dead code.
**Why it happens:** The new feed design has horizontal sections, not category filtering.
**How to avoid:** Clean removal of `selectedCategory`, `filter`, `CategoryFilter` usage from both the hook and the screen. The category filter remains in the Search tab (Phase 9).

### Pitfall 6: useFocusEffect Reload Races
**What goes wrong:** Multiple rapid tab switches cause stale section data.
**Why it happens:** Already handled in current codebase with `cancelled` flag pattern.
**How to avoid:** Maintain the existing `useFocusEffect` + cancelled flag pattern from the current `useFeedScreen`.

## Code Examples

### DB Migration for cooking_history (client.ts)
```typescript
// In migrateDb, after existing migrations:
if (currentVersion < 6) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cooking_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id TEXT NOT NULL,
      cooked_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
      rating INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_cooking_history_recipe_id ON cooking_history (recipe_id);
  `);
}
// Update DB_VERSION to 6
```

### Cooking History DB Functions (recipes.ts or new cooking-history.ts)
```typescript
export async function logCookingCompletion(
  db: SQLiteDatabase,
  recipeId: string,
  rating?: number
): Promise<void> {
  await db.runAsync(
    "INSERT INTO cooking_history (recipe_id, cooked_at, rating) VALUES (?, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), ?)",
    [recipeId, rating ?? null]
  );
}

export async function getCookedRecipeIds(
  db: SQLiteDatabase
): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ recipe_id: string }>(
    "SELECT DISTINCT recipe_id FROM cooking_history"
  );
  return new Set(rows.map((r) => r.recipe_id));
}
```

### FeedSection Component
```typescript
interface FeedSectionProps {
  title: string;
  data: RecipeListItem[];
  bookmarkedIds: Set<string>;
  userEquipment: string[];
  onRecipePress: (id: string) => void;
  onBookmarkToggle: (id: string) => void;
}

function FeedSection({ title, data, ...props }: FeedSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ width: CARD_WIDTH, marginRight: 12 }}>
            <RecipeCardGrid
              recipe={item}
              isBookmarked={props.bookmarkedIds.has(item.id)}
              onBookmarkToggle={props.onBookmarkToggle}
              onPress={props.onRecipePress}
              userEquipment={props.userEquipment}
            />
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </View>
  );
}
```

### Updated useFeedScreen Hook Structure
```typescript
export interface FeedSection {
  key: string;
  title: string;
  data: RecipeListItem[];
}

export function useFeedScreen() {
  // ... existing profile/bookmark loading stays the same

  const [sections, setSections] = useState<FeedSection[]>([]);
  const [allEmpty, setAllEmpty] = useState(false);

  const loadSections = useCallback(async () => {
    if (!profileLoaded || !profile) return;
    setLoading(true);
    try {
      const hardFilter: HardFilter = {
        allergens: profile.allergens,
        skillLevel: profile.skillLevel,
        equipment: profile.equipment ?? [],
      };
      const allRecipes = await getAllRecipesForFeed(hardFilter);
      const cookedIds = await getCookedRecipeIds(db);

      const rawSections: FeedSection[] = [
        { key: 'trending', title: 'Su an trend', data: allRecipes },
        { key: 'quick', title: '30 dakikada bitir',
          data: allRecipes.filter(r => (r.prepTime + r.cookTime) <= 30) },
        { key: 'personal', title: 'Sana ozel',
          data: rankByProfile(allRecipes, profile) },
        { key: 'untried', title: 'Denemediklerin',
          data: allRecipes.filter(r => !cookedIds.has(r.id)) },
      ];

      const visible = rawSections.filter(s => s.data.length > 0);
      setSections(visible);
      setAllEmpty(visible.length === 0);
    } finally {
      setLoading(false);
    }
  }, [profileLoaded, profile]);

  // ... rest of hook
}
```

## State of the Art

| Old Approach (Current) | New Approach (Phase 8) | Impact |
|------------------------|------------------------|--------|
| Two tabs (Kesfet/Sizin icin) + category filter | 4 horizontal sections in vertical scroll | Better discovery UX, named sections build trust |
| Vertical 2-column FlashList grid | Horizontal FlatList per section | Each section independently scrollable |
| No cooking history tracking | cooking_history table | Enables "Denemediklerin" exclusion |
| Single data fetch + tab toggle | Single fetch + JS split into 4 sections | Same DB efficiency, richer presentation |

**Removed from feed:**
- Tab bar (trending/for-you) — replaced by named sections
- CategoryFilter component — moves to Search tab (Phase 9)
- 2-column grid layout — replaced by horizontal card rows

## Open Questions

1. **Section card limit per section**
   - What we know: With 30-50 total recipes after hard filtering, some sections may have many cards
   - What's unclear: Should each section cap at e.g. 10 cards with a "See all" link?
   - Recommendation: Show all cards per section for v1 (30-50 is not excessive in horizontal scroll). Add "See all" in a future iteration if recipe count grows.

2. **Trending order logic**
   - What we know: Currently uses `rowid ASC` (insertion order). There is no view/popularity tracking.
   - What's unclear: How to determine "trending" without analytics data.
   - Recommendation: Use curated order (rowid) for v1. This is effectively "editor's picks". True trending requires analytics infrastructure not yet built.

3. **Card visual variant for horizontal sections**
   - What we know: Current `RecipeCardGrid` is designed for 2-column vertical grid. Horizontal cards typically need fixed width.
   - What's unclear: Exact card dimensions and whether to reuse or create new component.
   - Recommendation: Create a `RecipeCardHorizontal` variant with fixed width (~180px) that keeps the gradient + title pattern but is optimized for horizontal scroll. Alternatively, wrap `RecipeCardGrid` in a fixed-width container initially.

4. **Turkish character encoding in section titles**
   - What we know: Phase 7 had issues with Unicode escapes vs UTF-8 Turkish characters (commit 85e7a5b).
   - What's unclear: Nothing unclear — use UTF-8 directly.
   - Recommendation: Use literal Turkish characters in section titles: "Su an trend", "30 dakikada bitir", "Sana ozel", "Denemediklerin". Follow Phase 7 decision to use UTF-8.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + jest-expo ~54.0.17 |
| Config file | package.json `jest` section |
| Quick run command | `npx jest --testPathPattern=feed-section --no-coverage -x` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FEED-01a | cooking_history table created at DB_VERSION 6 | unit | `npx jest --testPathPattern=migration -x` | Existing (needs update) |
| FEED-01b | getFeedTrending returns hard-filtered recipes in rowid order | unit | `npx jest --testPathPattern=feed-section -x` | Wave 0 |
| FEED-01c | getFeed30Min filters to recipes with totalTime <= 30 | unit | `npx jest --testPathPattern=feed-section -x` | Wave 0 |
| FEED-01d | getFeedPersonal sorts by cuisine preference match | unit | `npx jest --testPathPattern=feed-section -x` | Wave 0 |
| FEED-01e | getFeedUntried excludes recipes in cooking_history | unit | `npx jest --testPathPattern=feed-section -x` | Wave 0 |
| FEED-01f | All sections respect hard filters (reuses existing buildHardFilterClauses) | unit | `npx jest --testPathPattern=hard-filter -x` | Existing |
| FEED-02a | Sections with empty data are excluded from rendered output | unit | `npx jest --testPathPattern=feed-section -x` | Wave 0 |
| FEED-02b | All sections empty triggers profile update prompt | unit | `npx jest --testPathPattern=feed-section -x` | Wave 0 |
| DISC-02 | Feed provides browsable recipe discovery without ingredient input | integration | Manual — visual verification | Manual-only |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern=feed-section --no-coverage -x`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/feed-section.test.ts` -- covers FEED-01b through FEED-02b (new test file for section data logic)
- [ ] Update `__tests__/migration.test.ts` -- covers FEED-01a (DB_VERSION 6 migration with cooking_history)

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/db/recipes.ts`, `src/db/client.ts`, `src/hooks/useFeedScreen.ts`, `src/types/discovery.ts`, `app/(tabs)/index.tsx` -- current implementation fully inspected
- React Native FlatList horizontal mode -- core API, stable, well-documented
- Existing `buildHardFilterClauses` pattern -- proven in Phase 7, reusable for all section queries

### Secondary (MEDIUM confidence)
- FlashList horizontal mode: Based on @shopify/flash-list 2.0.2 installed in project. Horizontal mode supported but requires `estimatedItemSize`. Plain FlatList recommended for simplicity at this scale.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing libraries
- Architecture: HIGH -- patterns follow established codebase conventions (hook extraction, DB layer, hard filters)
- Pitfalls: HIGH -- based on direct codebase inspection and React Native horizontal list experience
- DB migration: HIGH -- follows established DB_VERSION pattern in client.ts (versions 1-5 already exist)
- "Sana ozel" ranking: MEDIUM -- rule-based approach is straightforward but cuisine preference data format needs verification during implementation

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable -- no fast-moving dependencies)
