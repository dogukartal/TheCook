# Phase 7: Foundation Pivot - Research

**Researched:** 2026-03-17
**Domain:** React Native app restructuring (hooks extraction, navigation changes, hard filters, DB schema extension)
**Confidence:** HIGH

## Summary

Phase 7 is a structural refactoring phase, not a feature-building phase. The codebase currently has three tab screens (Feed/Search/My Kitchen) where each screen file mixes data orchestration (useEffect, fetch, state management) with JSX rendering. This phase extracts data logic into dedicated hooks (`useFeedScreen`, `useSearchScreen`, `useCookbookScreen`), renames/reorganizes tabs to a 4-tab layout (Feed/Search/Cookbook/Profile), converts skill level and equipment from soft-sort to hard-filter, applies allergen exclusion to Cookbook bookmarks (DISC-05), and extends the profile DB schema with two new nullable columns.

The work is entirely within the existing tech stack (Expo Router, expo-sqlite, Zod, React Native). No new libraries are needed. The primary risk is regression during the extraction refactor -- each screen has complex data loading patterns with useFocusEffect, cancellation tokens, and multiple interleaved state updates. The refactor must preserve exact behavior while splitting files.

**Primary recommendation:** Execute as incremental, testable steps -- extract hooks first (pure refactor, no behavior change), then change navigation/naming, then upgrade filter logic, then fix DISC-05, then extend DB schema. Each step should be independently verifiable.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISC-05 | Allergen-incompatible recipes are automatically filtered out from all discovery surfaces | Currently Feed and Search apply allergen exclusion via SQL `ALLERGEN_EXCLUSION` clause, but Cookbook (my-kitchen.tsx) uses raw `SELECT ... WHERE id IN (?)` with NO allergen filtering. Fix requires adding allergen exclusion to the bookmarks query in the Cookbook hook. |
</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-router | ~4.x (Expo 54) | File-based routing, tabs | Already used for all navigation |
| expo-sqlite | v2 API | Local DB, SQLiteProvider + useSQLiteContext | All data persistence |
| zod | v4 | Schema validation, type inference | All types derived from Zod schemas |
| @shopify/flash-list | 2.0.2 | Performant lists | Feed and Search screens |

### No New Libraries Needed

This phase is purely structural refactoring within the existing stack. No new npm installs required.

## Architecture Patterns

### Current Project Structure (Relevant Files)
```
app/
  (tabs)/
    _layout.tsx          # 3-tab layout: Feed / Search / My Kitchen
    index.tsx            # Feed screen (~367 lines, mixes data + JSX)
    search.tsx           # Search screen (~428 lines, mixes data + JSX)
    my-kitchen.tsx       # My Kitchen screen (~431 lines, mixes data + JSX)
  settings.tsx           # Settings sub-screen (standalone route)
  _layout.tsx            # Root layout with SQLiteProvider + SessionProvider
src/
  db/
    recipes.ts           # Recipe DB queries + useRecipesDb hook
    profile.ts           # Profile DB queries + useProfileDb hook
    client.ts            # DB migrations (DB_VERSION=4)
    cooking-session.ts   # Cooking session persistence
  types/
    profile.ts           # ProfileSchema, BookmarkSchema
    recipe.ts            # RecipeSchema, all enums
    discovery.ts         # RecipeListItem, DiscoveryFilter
  auth/
    sync.ts              # Cloud sync (Supabase)
    useSession.tsx       # Auth session context
```

### Target Project Structure After Phase 7
```
app/
  (tabs)/
    _layout.tsx          # 4-tab layout: Feed / Search / Cookbook / Profile
    index.tsx            # Feed screen (thin shell: calls useFeedScreen + renders)
    search.tsx           # Search screen (thin shell: calls useSearchScreen + renders)
    cookbook.tsx          # Cookbook screen (thin shell, renamed from my-kitchen.tsx)
    profile.tsx          # Profile screen (new, extracts account/settings from my-kitchen)
  settings.tsx           # Settings sub-screen (unchanged)
  _layout.tsx            # Root layout (unchanged)
src/
  hooks/
    useFeedScreen.ts     # All Feed data orchestration
    useSearchScreen.ts   # All Search data orchestration
    useCookbookScreen.ts # All Cookbook data orchestration
  db/
    recipes.ts           # Recipe DB queries (+ inline SQL extracted from my-kitchen.tsx)
    profile.ts           # Profile DB queries (+ new columns support)
    client.ts            # DB migrations (DB_VERSION=5, new columns)
  types/
    profile.ts           # ProfileSchema extended with cuisine_preferences, app_goals
```

### Pattern 1: Screen Data Hook Extraction
**What:** Move all useState, useEffect, useFocusEffect, and data-fetching logic from screen files into a custom hook that returns typed state and action handlers.
**When to use:** Every tab screen in this phase.
**Example:**
```typescript
// src/hooks/useFeedScreen.ts
export interface FeedScreenState {
  profile: Profile | null;
  profileLoaded: boolean;
  recipes: RecipeListItem[];
  loading: boolean;
  activeTab: FeedTab;
  selectedCategory: Category | null;
  bookmarkedIds: Set<string>;
  refreshing: boolean;
  resumeSession: CookingSession | null;
  resumeRecipeName: string;
  resumeTotalSteps: number;
}

export interface FeedScreenActions {
  setActiveTab: (tab: FeedTab) => void;
  setSelectedCategory: (cat: Category | null) => void;
  handleBookmarkToggle: (id: string) => Promise<void>;
  handleRefresh: () => Promise<void>;
  handleResume: () => void;
  handleDismissResume: () => Promise<void>;
}

export function useFeedScreen(): FeedScreenState & FeedScreenActions {
  // All existing useState, useFocusEffect, useCallback logic moves here
  // Screen file becomes: const state = useFeedScreen(); return <JSX using state />;
}
```

### Pattern 2: Hard Filter Implementation
**What:** Change skill level and equipment from soft-sort to hard exclusion in SQL WHERE clauses.
**When to use:** Feed and Search queries.
**Current behavior:**
- Equipment: JS sort (`sortByEquipmentCompatibility`) -- compatible recipes first, incompatible still shown
- Skill level: JS sort (`getFeedRecipes`) -- sorted by skill proximity, all shown

**Target behavior:**
- Equipment: SQL WHERE excludes recipes requiring equipment user doesn't have
- Skill level: SQL WHERE excludes recipes above user's skill ceiling (beginner sees only beginner; intermediate sees beginner + intermediate; advanced sees all)

**SQL approach for skill level hard filter:**
```sql
-- Skill level ordering: beginner < intermediate < advanced
-- User at 'intermediate' sees beginner + intermediate only
WHERE r.skill_level IN ('beginner', 'intermediate')
```

**SQL approach for equipment hard filter:**
```sql
-- Exclude recipes that require equipment user doesn't own
-- A recipe with equipment=[] always passes (vacuous truth)
WHERE NOT EXISTS (
  SELECT 1 FROM json_each(r.equipment) AS re
  WHERE re.value NOT IN (SELECT value FROM json_each(?))
)
```
Note: This reverses the current soft-sort pattern. The `sortByEquipmentCompatibility` function can be removed from Feed/Search paths (keep for any remaining soft-sort use).

### Pattern 3: Safe Tab Rename (Expo Router)
**What:** Rename `my-kitchen.tsx` to `cookbook.tsx` and add `profile.tsx` as 4th tab.
**When to use:** Tab navigation restructure.
**Critical ordering (from Phase 4 decision):**
1. Create new route files first (`cookbook.tsx`, `profile.tsx`)
2. Update `_layout.tsx` to reference new routes
3. Delete old route files (`my-kitchen.tsx`)
This prevents 404 route errors during transition.

### Anti-Patterns to Avoid
- **Changing filter logic and extracting hooks simultaneously:** Do these in separate plans -- extract first (pure refactor, test behavior unchanged), then modify filter logic in the hooks.
- **Moving account/settings UI into Profile tab without extracting first:** The my-kitchen.tsx has account card, profile summary, and saved recipes interleaved. Extract the hook first so the data layer is stable, then split the UI.
- **Forgetting the inline SQL in my-kitchen.tsx:** Lines 80-115 of my-kitchen.tsx contain raw SQL for bookmark recipe hydration. This MUST move to `src/db/recipes.ts` as a named function (e.g., `getBookmarkRecipes`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skill level ordering | Custom comparator in every query | Lookup table or CASE expression | Already exists as `order` map in `getFeedRecipes`; convert to SQL |
| Equipment compatibility check | Complex JS filtering | SQLite json_each NOT IN subquery | The `ALLERGEN_EXCLUSION` pattern already demonstrates this exact approach |
| Tab navigation | Custom navigator | Expo Router `<Tabs>` with file-based routes | Already in use, just needs route files added |

## Common Pitfalls

### Pitfall 1: useFocusEffect Cancellation Token Pattern
**What goes wrong:** Extracted hooks lose the `cancelled` flag pattern, causing state updates on unmounted components.
**Why it happens:** The current screens use `let cancelled = false; return () => { cancelled = true; }` inside useFocusEffect. When extracting to hooks, this pattern must be preserved exactly.
**How to avoid:** Copy the exact useFocusEffect blocks into hooks; don't simplify the cancellation pattern.
**Warning signs:** "Can't perform a React state update on an unmounted component" warning.

### Pitfall 2: Circular Hook Dependencies
**What goes wrong:** `useFeedScreen` needs both `useRecipesDb()` and `useProfileDb()` which both call `useSQLiteContext()`. If the hook is placed outside the SQLiteProvider tree, it crashes.
**Why it happens:** Custom hooks that call other hooks must be within the same provider tree.
**How to avoid:** Screen data hooks go in `src/hooks/`, called from screen files which are already inside SQLiteProvider. The hooks can call `useSQLiteContext()` directly or receive db as parameter.
**Recommendation:** Call `useSQLiteContext()` inside the hook (simpler API for screen files). All tab screens are already children of SQLiteProvider in `_layout.tsx`.

### Pitfall 3: DISC-05 -- Bookmark Query Missing Allergen Filter
**What goes wrong:** Cookbook/My Kitchen shows bookmarked recipes that contain user allergens.
**Why it happens:** The current `my-kitchen.tsx` (line 82-97) does `SELECT ... WHERE id IN (${placeholders})` with NO allergen exclusion. Feed and Search both use `ALLERGEN_EXCLUSION` SQL, but bookmarks bypass it.
**How to avoid:** Add the same `ALLERGEN_EXCLUSION` WHERE clause to the bookmarks recipe hydration query. This is the DISC-05 fix.
**SQL fix:**
```sql
SELECT id, title, ... FROM recipes r
WHERE r.id IN (?, ?, ...)
AND NOT EXISTS (
  SELECT 1 FROM json_each(r.allergens) AS ra
  WHERE ra.value IN (SELECT value FROM json_each(?))
)
```

### Pitfall 4: DB Migration Version Bump
**What goes wrong:** Adding columns to profile table without incrementing DB_VERSION means existing installs never get the new columns.
**Why it happens:** Forgetting to add a migration block in client.ts.
**How to avoid:** Add `if (currentVersion < 5)` block with `ALTER TABLE profile ADD COLUMN cuisine_preferences TEXT DEFAULT NULL` and `ALTER TABLE profile ADD COLUMN app_goals TEXT DEFAULT NULL`. Bump `DB_VERSION` to 5.
**Important:** SQLite ALTER TABLE ADD COLUMN is safe for nullable columns with DEFAULT NULL -- no data migration needed.

### Pitfall 5: Profile Screen Content Split
**What goes wrong:** My Kitchen currently serves dual purpose (account management + saved recipes). Splitting into Cookbook + Profile requires careful decision on what goes where.
**How to avoid:**
- **Cookbook tab:** Only saved recipes (bookmarks list). No account card, no profile summary.
- **Profile tab:** Account card, sign in/out, profile summary row, settings link. Essentially the top half of current my-kitchen.tsx.
- **Settings screen:** Remains as standalone route (unchanged).

### Pitfall 6: Search Screen -- Hard Filters vs. Discovery Intent
**What goes wrong:** Applying hard skill/equipment filters to Search results removes recipes the user explicitly searched for.
**Per product pivot notes:** "Search results NOT filtered by skill/tools (deliberate). Only dietary restrictions as hard filter on search."
**How to avoid:** Hard skill/equipment filters apply to Feed and Cookbook only. Search keeps only allergen hard filter (already implemented). Do NOT add skill/equipment hard filters to Search.

## Code Examples

### DB Migration for New Profile Columns
```typescript
// In client.ts, add before the final PRAGMA user_version update:
if (currentVersion < 5) {
  await db.execAsync(`
    ALTER TABLE profile ADD COLUMN cuisine_preferences TEXT DEFAULT NULL;
    ALTER TABLE profile ADD COLUMN app_goals TEXT DEFAULT NULL;
  `);
}
// Update: const DB_VERSION = 5;
```

### ProfileSchema Extension
```typescript
// In src/types/profile.ts:
export const ProfileSchema = z.object({
  allergens: z.array(AllergenTagEnum).default([]),
  skillLevel: SkillLevelEnum.nullable().default(null),
  equipment: z.array(EquipmentEnum).default(["firin", "tava"]),
  onboardingCompleted: z.boolean().default(false),
  accountNudgeShown: z.boolean().default(false),
  cuisinePreferences: z.array(z.string()).nullable().default(null), // NEW -- no UI yet
  appGoals: z.array(z.string()).nullable().default(null),           // NEW -- no UI yet
});
```

### Extracted Bookmark Recipes Query (Fix for DISC-05 + Inline SQL Extraction)
```typescript
// In src/db/recipes.ts -- new function:
export async function getBookmarkRecipes(
  db: SQLiteDatabase,
  recipeIds: string[],
  userAllergens: string[],
  userEquipment: string[]
): Promise<RecipeListItem[]> {
  if (recipeIds.length === 0) return [];

  const placeholders = recipeIds.map(() => '?').join(', ');
  const params: (string | number)[] = [...recipeIds];

  let sql = `SELECT ${SELECT_LIST_COLUMNS} FROM recipes r WHERE r.id IN (${placeholders})`;

  // DISC-05: Apply allergen exclusion to bookmarked recipes
  if (userAllergens.length > 0) {
    sql += ` AND ${ALLERGEN_EXCLUSION}`;
    params.push(JSON.stringify(userAllergens));
  }

  const rows = await db.getAllAsync<RecipeRow>(sql, params);

  // Preserve bookmark order
  const rowMap = new Map(rows.map((r) => [r.id, r]));
  return recipeIds
    .map((id) => rowMap.get(id))
    .filter((r): r is RecipeRow => r !== undefined)
    .map(mapRowToRecipeListItem);
}
```

### Skill Level Hard Filter SQL Helper
```typescript
// In src/db/recipes.ts:
function getSkillLevelCeiling(userLevel: string | null): string[] {
  switch (userLevel) {
    case 'beginner': return ['beginner'];
    case 'intermediate': return ['beginner', 'intermediate'];
    case 'advanced': return ['beginner', 'intermediate', 'advanced'];
    default: return ['beginner']; // null defaults to beginner ceiling
  }
}

const SKILL_LEVEL_FILTER = (levels: string[]) =>
  `r.skill_level IN (${levels.map(() => '?').join(', ')})`;
```

### Equipment Hard Filter SQL
```typescript
// In src/db/recipes.ts:
const EQUIPMENT_HARD_FILTER = `
  NOT EXISTS (
    SELECT 1 FROM json_each(r.equipment) AS re
    WHERE re.value NOT IN (SELECT value FROM json_each(?))
  )
`;
// Pass JSON.stringify(userEquipment) as parameter
// Note: recipes with empty equipment array always pass (json_each returns 0 rows)
```

### 4-Tab Layout
```typescript
// In app/(tabs)/_layout.tsx:
<Tabs screenOptions={{ ... }}>
  <Tabs.Screen name="index" options={{ title: 'Kesfet', tabBarIcon: ... }} />
  <Tabs.Screen name="search" options={{ title: 'Ara', tabBarIcon: ... }} />
  <Tabs.Screen name="cookbook" options={{ title: 'Tarif Defterim', tabBarIcon: ... }} />
  <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ... }} />
</Tabs>
```

## State of the Art

| Old Approach (Current) | New Approach (Phase 7) | Impact |
|------------------------|------------------------|--------|
| Equipment soft-sort (JS) | Equipment hard-filter (SQL WHERE) | Incompatible recipes never shown on Feed/Cookbook |
| Skill level soft-sort (JS) | Skill level hard-filter (SQL WHERE) | Over-ceiling recipes never shown on Feed/Cookbook |
| Data + JSX in screen files | Hook + thin shell pattern | Enables parallel frontend/backend development |
| 3 tabs (Feed/Search/My Kitchen) | 4 tabs (Feed/Search/Cookbook/Profile) | Cleaner separation of concerns |
| Inline SQL in my-kitchen.tsx | Named function in recipes.ts | Testable, reusable, consistent with rest of DB layer |

## Open Questions

1. **Profile tab content scope**
   - What we know: Account card and profile summary move from My Kitchen to Profile tab. Settings link should be accessible from Profile.
   - What's unclear: Should Profile tab also display a quick view of allergens/skill/equipment, or only link to Settings?
   - Recommendation: Minimal Profile tab for Phase 7 -- account card, settings link. Additional profile display is a future enhancement.

2. **Cookbook tab naming -- Turkish label**
   - What we know: Product pivot says "Cookbook replaces My Kitchen". Current My Kitchen label is "Mutfagim".
   - What's unclear: Whether the Turkish tab label should be "Tarif Defterim" (My Recipe Book) or "Kitaplik" or another term.
   - Recommendation: Use "Tarif Defterim" as it aligns with the Cookbook concept and feels natural in Turkish.

3. **Hard filter on Cookbook bookmarks -- skill and equipment**
   - What we know: Success criteria says "recipes above skill ceiling or requiring missing tools never surface on any screen". DISC-05 specifically adds allergen exclusion to bookmarks.
   - What's unclear: Should skill/equipment hard filters also apply to bookmarked recipes? A user may have bookmarked a recipe before changing their skill level.
   - Recommendation: Apply all hard filters (allergen + skill + equipment) to Cookbook query. If a bookmarked recipe is now filtered out, it simply doesn't show. This matches "never surface on any screen" success criterion.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + jest-expo ~54.0.17 |
| Config file | package.json (jest section) or jest.config.js |
| Quick run command | `npx jest --testPathPattern=<file> --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISC-05 | Allergen-excluded bookmarks | unit | `npx jest __tests__/discovery.test.ts -x --no-coverage` | Partial (discovery.test.ts exists but no bookmark allergen test) |
| SC-1 | useFeedScreen hook returns correct state | unit | `npx jest __tests__/hooks/useFeedScreen.test.ts -x --no-coverage` | Wave 0 |
| SC-2 | Cookbook tab renders + renamed | smoke | Manual -- verify tab label and route | Manual-only (navigation test) |
| SC-3 | Skill hard filter excludes over-ceiling | unit | `npx jest __tests__/equipment-filter.test.ts -x --no-coverage` | Partial (equipment-filter.test.ts exists, skill filter test needed) |
| SC-4 | Equipment hard filter excludes missing tools | unit | `npx jest __tests__/equipment-filter.test.ts -x --no-coverage` | Partial (exists but tests soft-sort, not hard-filter) |
| SC-5 | Profile schema has new columns | unit | `npx jest __tests__/migration.test.ts -x --no-coverage` | Partial (migration.test.ts exists, needs v5 migration test) |
| SC-6 | Inline SQL extracted to recipes.ts | unit | `npx jest __tests__/discovery.test.ts -x --no-coverage` | Partial (needs getBookmarkRecipes test) |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern=<changed-module> --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/hooks/useFeedScreen.test.ts` -- covers SC-1 (hook extraction correctness)
- [ ] Add bookmark allergen filter test case to `__tests__/discovery.test.ts` -- covers DISC-05
- [ ] Add skill hard filter test cases to `__tests__/equipment-filter.test.ts` or new `__tests__/hard-filters.test.ts`
- [ ] Add DB migration v5 test case to `__tests__/migration.test.ts`
- [ ] Add `getBookmarkRecipes` test to `__tests__/discovery.test.ts` -- covers SC-6

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of all screen files, DB layer, types, and migrations
- Product pivot memory notes (`project_v1_pivot.md`, `feedback_parallel_work.md`)
- Phase 4 decisions on safe tab rename order
- Phase 6 decisions on equipment filter patterns (every vs some, JS sort vs SQL WHERE)

### Secondary (MEDIUM confidence)
- expo-sqlite v2 API patterns (verified in codebase usage)
- SQLite ALTER TABLE ADD COLUMN behavior (well-documented, nullable with DEFAULT NULL is safe)
- json_each subquery pattern (already proven in ALLERGEN_EXCLUSION constant)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, all patterns already in codebase
- Architecture: HIGH - hook extraction is a well-understood refactor, codebase fully inspected
- Pitfalls: HIGH - identified from direct code inspection of current behavior gaps
- Filter logic: HIGH - SQL patterns already proven (ALLERGEN_EXCLUSION), just need extension

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable -- no external dependency changes expected)
