# Phase 7: Foundation Pivot - Research

**Researched:** 2026-03-17
**Domain:** React Native / Expo app restructuring, SQLite schema migration, data hook extraction, hard filter architecture
**Confidence:** HIGH

## Summary

Phase 7 is a structural refactoring phase, not a feature-building phase. The codebase has three tab screens (Feed/Search/My Kitchen) with data orchestration embedded directly in screen components. This phase extracts that orchestration into typed hooks, renames My Kitchen to Cookbook, adds a Profile tab (4th), converts equipment and skill level from soft sort/badge to hard SQL-level filters, applies allergen exclusion to bookmark queries (DISC-05), extends the profile schema with two new nullable columns, and extracts inline SQL from my-kitchen.tsx into recipes.ts.

The technical risk is low -- all changes are within the existing Expo/SQLite/Zod stack. The highest-impact change is converting equipment from JS-sort-after-fetch to SQL WHERE exclusion, which affects every query function in recipes.ts. The hooks extraction is mechanical but touches all three screen files and creates three new files in src/hooks/.

**Primary recommendation:** Start with DB migration (version 5) and hard filter SQL changes, then extract screen hooks, then restructure tabs -- this order prevents double-touching files.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISC-05 | Allergen-incompatible recipes filtered from all discovery surfaces | Currently missing from bookmark query in my-kitchen.tsx (lines 81-97 do batch SELECT with no allergen exclusion). Add ALLERGEN_EXCLUSION WHERE clause to bookmark hydration query. |
| PROF-01 | Skill level is a hard filter -- recipes above ceiling never surface | Currently skill is only used for sort order in getFeedRecipes(). Must add SQL WHERE clause: `r.skill_level IN (?)` based on allowed levels at or below user's level. |
| PROF-02 | Kitchen tools are a hard filter -- recipes requiring unselected tools never surface | Currently equipment is JS-sort only (sortByEquipmentCompatibility). Must convert to SQL-level JSON exclusion or JS hard filter (remove, not sort). |
| PROF-03 | Cuisine preferences and app goals stored in profile | New nullable columns `cuisine_preferences TEXT` and `app_goals TEXT` on profile table. No UI needed -- schema-only change for future phases. |
| NAV-01 | App has 4 tabs: Feed, Search, Cookbook, Profile | Current _layout.tsx has 3 tabs (index/search/my-kitchen). Rename my-kitchen to cookbook, add profile tab. Move account/settings content from my-kitchen.tsx to profile screen. |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-sqlite | ~16.0.10 | Local DB, all queries | Already wired, SQLiteProvider + useSQLiteContext pattern |
| expo-router | ~6.0.23 | Tab navigation, file-based routing | Already wired, Tabs component in _layout.tsx |
| zod | ^4.3.6 | Schema validation, type inference | z.infer pattern used throughout for Profile, Recipe, etc. |
| react-native | 0.81.5 | UI framework | Current version |
| expo | ~54.0.33 | Build toolchain | Current version |

### No New Dependencies Required

This phase requires zero new npm packages. All changes use existing expo-sqlite, expo-router, and zod.

## Architecture Patterns

### Recommended Project Structure (after Phase 7)
```
src/
  hooks/
    useFeedScreen.ts       # NEW - data orchestration for Feed tab
    useSearchScreen.ts     # NEW - data orchestration for Search tab
    useCookbookScreen.ts   # NEW - data orchestration for Cookbook tab
    useCookingTimer.ts     # existing
  db/
    client.ts              # MODIFIED - DB_VERSION 4 -> 5
    recipes.ts             # MODIFIED - hard filters, bookmark allergen exclusion
    profile.ts             # MODIFIED - cuisine_preferences, app_goals
    cooking-session.ts     # unchanged
    seed.ts                # unchanged
    schema.sql             # UPDATED reference
  types/
    recipe.ts              # unchanged
    profile.ts             # MODIFIED - new fields
    discovery.ts           # unchanged
app/
  (tabs)/
    _layout.tsx            # MODIFIED - 4 tabs
    index.tsx              # MODIFIED - thin shell calling useFeedScreen
    search.tsx             # MODIFIED - thin shell calling useSearchScreen
    cookbook.tsx            # NEW (renamed from my-kitchen.tsx, thin shell)
    profile.tsx            # NEW - profile/settings screen as tab
  settings.tsx             # REMOVED or repurposed (content moves to profile tab)
```

### Pattern 1: Screen Data Hook Extraction
**What:** Move all useState, useEffect, useFocusEffect, data fetching, and state management from screen files into a dedicated hook. Screen becomes a thin rendering shell.
**When to use:** Every tab screen in the app.
**Why:** Enables parallel frontend/backend development. Backend developer owns src/hooks/ and src/db/. Frontend developer owns components/ and screen JSX.

**Before (current index.tsx pattern):**
```typescript
// Screen file has 15+ state variables, multiple useEffects, data loading, etc.
export default function FeedScreen() {
  const db = useSQLiteContext();
  const { getAllRecipesForFeed, getFeedRecipes, filterRecipesByCategory } = useRecipesDb();
  const { getProfile, getBookmarks, addBookmark, removeBookmark } = useProfileDb();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  // ... 10+ more state variables, multiple useEffects, callbacks
  return <SafeAreaView>...</SafeAreaView>;
}
```

**After (extracted hook pattern):**
```typescript
// src/hooks/useFeedScreen.ts
export interface FeedScreenState {
  profile: Profile | null;
  recipes: RecipeListItem[];
  loading: boolean;
  activeTab: FeedTab;
  selectedCategory: Category | null;
  bookmarkedIds: Set<string>;
  resumeSession: CookingSession | null;
  resumeRecipeName: string;
  resumeTotalSteps: number;
  refreshing: boolean;
  profileLoaded: boolean;
}

export interface FeedScreenActions {
  setActiveTab: (tab: FeedTab) => void;
  setSelectedCategory: (cat: Category | null) => void;
  handleBookmarkToggle: (id: string) => Promise<void>;
  handleRefresh: () => Promise<void>;
  handleResume: () => void;
  handleDismissResume: () => Promise<void>;
  handleRecipePress: (id: string) => void;
}

export function useFeedScreen(): FeedScreenState & FeedScreenActions {
  // All state, effects, data loading, callbacks live here
}

// app/(tabs)/index.tsx — thin shell
export default function FeedScreen() {
  const state = useFeedScreen();
  return <FeedScreenView {...state} />;
}
```

### Pattern 2: Hard Filter SQL Architecture
**What:** Skill level and equipment filtering at the SQL query level, not JS post-processing.
**When to use:** All recipe query functions (getAllRecipesForFeed, getAllRecipesForSearch, queryRecipesByFilter, bookmark hydration).

**Skill level hard filter approach:**
```typescript
// Map user skill to allowed levels
const SKILL_CEILING: Record<string, string[]> = {
  beginner: ['beginner'],
  intermediate: ['beginner', 'intermediate'],
  advanced: ['beginner', 'intermediate', 'advanced'],
};

// SQL: WHERE r.skill_level IN (?, ?, ?)
// Use json_each or explicit IN clause with allowed levels
```

**Equipment hard filter approach:**
Equipment is stored as JSON array in the recipe row. A recipe should be excluded if it requires ANY equipment the user does not have. SQLite json_each can check this:
```sql
-- Exclude recipes requiring equipment user doesn't have
NOT EXISTS (
  SELECT 1 FROM json_each(r.equipment) AS re
  WHERE re.value NOT IN (SELECT value FROM json_each(?))
)
```
This is the same pattern already used for ALLERGEN_EXCLUSION but inverted -- allergens check for overlap (any match = exclude), equipment checks for requirement not met (any missing = exclude).

**Alternative (JS hard filter):** Filter in JS after fetch -- simpler but less efficient. Given the dataset size (30-50 recipes), JS filter is acceptable. However, SQL is preferred for consistency with the allergen pattern and to establish the pattern for future scaling.

**Recommendation:** Use SQL WHERE clause for both, matching the existing ALLERGEN_EXCLUSION pattern. This is consistent and performant.

### Pattern 3: Expo Router Tab Rename
**What:** Safe tab rename following the established decision from Phase 4.
**Safe order:**
1. Create new tab file (cookbook.tsx) with content
2. Update _layout.tsx to reference new tab name
3. Delete old tab file (my-kitchen.tsx)
4. Never have a state where _layout.tsx references a non-existent route file

### Anti-Patterns to Avoid
- **Mixing data and UI in screen hooks:** The extracted hook should NOT return JSX or style objects. It returns typed state and action callbacks only.
- **Re-exporting db functions from hooks:** Screen hooks should call db functions internally and manage state. They should NOT simply re-export the db layer.
- **Breaking bookmark order in Cookbook:** Current my-kitchen.tsx preserves bookmark recency order via rowMap pattern. This must be maintained when extracting to hook.
- **Forgetting null skillLevel:** Profile skillLevel can be null (not set). Hard filter with null skill should show all recipes (no ceiling applied). Same for empty equipment array.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON array querying in SQLite | Custom parsing/joins | `json_each()` with NOT EXISTS | Already proven in ALLERGEN_EXCLUSION pattern |
| Tab navigation | Custom tab bar | expo-router Tabs component | Already wired, just add/rename screens |
| Schema migration | Custom migration runner | PRAGMA user_version pattern | Already in client.ts, just bump to 5 |
| Type-safe profile fields | Manual type definitions | z.infer<typeof ProfileSchema> | Existing Zod pattern |

## Common Pitfalls

### Pitfall 1: Equipment JSON Query Edge Cases
**What goes wrong:** Empty equipment array in recipe (`[]`) or user (`[]`) causes unexpected filter behavior.
**Why it happens:** `NOT EXISTS (SELECT 1 FROM json_each('[]'))` returns TRUE (no rows to check), which is correct -- a recipe requiring no equipment is always compatible. But if user equipment is empty, ALL recipes should still show (no hard filter applied).
**How to avoid:** Guard the equipment WHERE clause: only add it when user has equipment declared. If user equipment is empty/null, skip the clause entirely (show all recipes).
**Warning signs:** Recipes disappearing for users who haven't completed equipment onboarding.

### Pitfall 2: Skill Level NULL Handling
**What goes wrong:** User has null skillLevel (never set during onboarding). Hard filter with null excludes all recipes.
**Why it happens:** `WHERE r.skill_level IN (SELECT value FROM json_each(null))` returns no matches.
**How to avoid:** When profile.skillLevel is null, skip the skill level WHERE clause entirely. Null means "no ceiling" -- show all recipes.
**Warning signs:** Blank feed after onboarding if user skipped skill selection.

### Pitfall 3: Route Name Mismatch During Tab Rename
**What goes wrong:** 404 error when navigating to tab after renaming.
**Why it happens:** _layout.tsx references a route name that doesn't match any file in (tabs)/.
**How to avoid:** Follow the safe rename order: create new file first, update _layout.tsx, delete old file last. Established decision from Phase 4.
**Warning signs:** White screen or "Route not found" error on tab press.

### Pitfall 4: Profile Tab Duplicating Settings Content
**What goes wrong:** Profile tab and settings.tsx both show account/preferences, creating two places to edit.
**Why it happens:** Current my-kitchen.tsx has account card + profile summary that overlaps with settings.tsx content.
**How to avoid:** Profile tab absorbs the settings content. Remove or repurpose settings.tsx. The Profile tab IS the settings screen.
**Warning signs:** User confusion about where to change preferences.

### Pitfall 5: Breaking Existing Test Mocks
**What goes wrong:** Changing function signatures in recipes.ts breaks mock patterns in discovery.test.ts and equipment-filter.test.ts.
**Why it happens:** Tests mock db.getAllAsync return values. Adding new WHERE clauses changes what parameters are passed.
**How to avoid:** Update test mocks to expect new parameters. Add new test cases for hard filter behavior. Keep backward compatibility where possible.
**Warning signs:** Test failures after changing query functions.

### Pitfall 6: Bookmark Allergen Query Performance
**What goes wrong:** Adding allergen exclusion to bookmark hydration query with batch SELECT IN and json_each causes slow queries.
**Why it happens:** Combining `WHERE id IN (?, ?, ...)` with `NOT EXISTS (SELECT 1 FROM json_each(r.allergens)...)` on each row.
**How to avoid:** With 30-50 recipes and max ~50 bookmarks, this is not a real performance concern. The query will remain fast. If needed, do JS filter after fetch (allergens are already parsed in mapRowToRecipeListItem).
**How to avoid (preferred):** Use SQL for consistency. The dataset is small enough that performance is not a concern.

## Code Examples

### DB Migration v4 to v5 (add profile columns)
```typescript
// In client.ts, add after the currentVersion < 4 block:
if (currentVersion < 5) {
  await db.execAsync(`
    ALTER TABLE profile ADD COLUMN cuisine_preferences TEXT;
    ALTER TABLE profile ADD COLUMN app_goals TEXT;
  `);
}
// Then update DB_VERSION to 5
```

### Equipment Hard Filter SQL
```typescript
const EQUIPMENT_EXCLUSION = `
  NOT EXISTS (
    SELECT 1 FROM json_each(r.equipment) AS re
    WHERE re.value NOT IN (SELECT value FROM json_each(?))
  )
`;

// Usage in getAllRecipesForFeed:
if (userEquipment.length > 0) {
  conditions.push(EQUIPMENT_EXCLUSION);
  params.push(JSON.stringify(userEquipment));
}
```

### Skill Level Hard Filter SQL
```typescript
const SKILL_CEILING_MAP: Record<string, string[]> = {
  beginner: ['beginner'],
  intermediate: ['beginner', 'intermediate'],
  advanced: ['beginner', 'intermediate', 'advanced'],
};

// Build the clause dynamically:
if (userSkillLevel) {
  const allowed = SKILL_CEILING_MAP[userSkillLevel] ?? ['beginner', 'intermediate', 'advanced'];
  const placeholders = allowed.map(() => '?').join(', ');
  conditions.push(`r.skill_level IN (${placeholders})`);
  params.push(...allowed);
}
```

### Bookmark Allergen Exclusion (DISC-05 fix)
```typescript
// In the bookmark hydration query (currently in my-kitchen.tsx, to be moved to recipes.ts):
export async function getBookmarkedRecipes(
  db: SQLiteDatabase,
  bookmarkIds: string[],
  userAllergens: string[],
  userSkillLevel: string | null,
  userEquipment: string[]
): Promise<RecipeListItem[]> {
  if (bookmarkIds.length === 0) return [];

  const placeholders = bookmarkIds.map(() => '?').join(', ');
  const conditions: string[] = [`r.id IN (${placeholders})`];
  const params: (string | number)[] = [...bookmarkIds];

  // Allergen hard filter
  if (userAllergens.length > 0) {
    conditions.push(ALLERGEN_EXCLUSION);
    params.push(JSON.stringify(userAllergens));
  }

  // Skill hard filter
  if (userSkillLevel) {
    const allowed = SKILL_CEILING_MAP[userSkillLevel] ?? ['beginner', 'intermediate', 'advanced'];
    conditions.push(`r.skill_level IN (${allowed.map(() => '?').join(', ')})`);
    params.push(...allowed);
  }

  // Equipment hard filter
  if (userEquipment.length > 0) {
    conditions.push(EQUIPMENT_EXCLUSION);
    params.push(JSON.stringify(userEquipment));
  }

  const sql = `SELECT ${SELECT_LIST_COLUMNS} FROM recipes r WHERE ${conditions.join(' AND ')}`;
  const rows = await db.getAllAsync<RecipeRow>(sql, params);

  // Preserve bookmark order
  const rowMap = new Map(rows.map((r) => [r.id, r]));
  return bookmarkIds
    .map((id) => rowMap.get(id))
    .filter((r): r is RecipeRow => r !== undefined)
    .map(mapRowToRecipeListItem);
}
```

### Screen Hook Shape (useCookbookScreen example)
```typescript
// src/hooks/useCookbookScreen.ts
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useProfileDb } from '../db/profile';
import { getBookmarkedRecipes } from '../db/recipes';
import { useSession } from '../auth/useSession';
import type { Profile } from '../types/profile';
import type { RecipeListItem } from '../types/discovery';

export interface CookbookScreenState {
  profile: Profile | null;
  savedRecipes: RecipeListItem[];
  bookmarkedIds: Set<string>;
  loading: boolean;
}

export interface CookbookScreenActions {
  handleBookmarkToggle: (id: string) => Promise<void>;
  handleRecipePress: (id: string) => void;
}

export function useCookbookScreen(): CookbookScreenState & CookbookScreenActions {
  // All state, effects, loading logic here
  // Returns typed state + action callbacks
}
```

## State of the Art

| Old Approach (Phases 1-6) | New Approach (Phase 7+) | Impact |
|---------------------------|-------------------------|--------|
| Equipment as soft sort (JS sort after fetch) | Equipment as hard filter (SQL WHERE exclusion) | Incompatible recipes never appear |
| Skill level as sort order only | Skill level as hard ceiling filter | Recipes above ceiling never appear |
| 3 tabs (Feed/Search/My Kitchen) | 4 tabs (Feed/Search/Cookbook/Profile) | Dedicated profile editing space |
| Inline SQL in screen files | All SQL in src/db/recipes.ts | Single source of truth for queries |
| Data logic embedded in screens | Extracted to src/hooks/use*Screen.ts | Parallel dev enabled |
| No allergen filter on bookmarks | Allergen exclusion on bookmark query | DISC-05 closed |

## Open Questions

1. **Profile tab content scope**
   - What we know: My-kitchen.tsx currently has account card, profile summary, and saved recipes. Settings.tsx has full allergen/skill/equipment editing.
   - What's unclear: Should Profile tab show just the editable preferences (like settings.tsx) or also include account management? Should settings.tsx be deleted entirely?
   - Recommendation: Profile tab absorbs ALL content from both my-kitchen.tsx (account card section) and settings.tsx (preference editing). Cookbook tab shows only saved recipes. Settings.tsx route is removed. This aligns with the 4-tab nav spec: Profile = identity/preferences, Cookbook = personal recipe space.

2. **Hard filter function signature changes**
   - What we know: getAllRecipesForFeed currently takes `(userAllergens, userEquipment)`. Adding skill level means a third parameter.
   - What's unclear: Whether to pass individual params or a filter object.
   - Recommendation: Pass a filter object `{ allergens: string[], skillLevel: string | null, equipment: string[] }` to all query functions. This is cleaner than 3+ individual params and future-proof for adding more filters.

3. **sortByEquipmentCompatibility removal**
   - What we know: This function currently soft-sorts recipes by equipment compatibility.
   - What's unclear: Whether to keep it as an additional sort within compatible recipes or remove entirely.
   - Recommendation: Remove it. Hard filter means incompatible recipes are already excluded. No need to sort by compatibility within the filtered set. Simplifies the code.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 with jest-expo ~54.0.17 |
| Config file | package.json "jest" section |
| Quick run command | `npx jest --testPathPattern="hard-filter\|cookbook\|hook" --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISC-05 | Allergen exclusion on bookmarks | unit | `npx jest __tests__/hard-filter.test.ts -t "allergen exclusion on bookmarks" -x` | No - Wave 0 |
| PROF-01 | Skill level hard filter | unit | `npx jest __tests__/hard-filter.test.ts -t "skill level hard filter" -x` | No - Wave 0 |
| PROF-02 | Equipment hard filter | unit | `npx jest __tests__/hard-filter.test.ts -t "equipment hard filter" -x` | No - Wave 0 |
| PROF-03 | Profile schema has cuisine_preferences, app_goals | unit | `npx jest __tests__/profile.test.ts -t "cuisine_preferences\|app_goals" -x` | No - Wave 0 |
| NAV-01 | 4-tab navigation | manual-only | Visual verification on device | N/A (UI layout) |

### Sampling Rate
- **Per task commit:** `npx jest --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/hard-filter.test.ts` -- covers DISC-05, PROF-01, PROF-02 (hard filter query logic)
- [ ] `__tests__/profile.test.ts` -- extend with cuisine_preferences and app_goals column tests (PROF-03)
- [ ] `__tests__/migration.test.ts` -- extend with DB_VERSION 5 migration test
- [ ] No new framework install needed -- Jest already configured

## Sources

### Primary (HIGH confidence)
- Codebase inspection: all src/db/*.ts, src/types/*.ts, app/(tabs)/*.tsx, app/settings.tsx, app/_layout.tsx
- Codebase inspection: __tests__/*.test.ts (test patterns, mock patterns)
- .planning/PROJECT.md, REQUIREMENTS.md, ROADMAP.md (product decisions)
- .planning/features/profile.md, navigation.md, cookbook.md (feature specs)
- Memory files: project_v1_pivot.md, feedback_parallel_work.md (user decisions)

### Secondary (MEDIUM confidence)
- SQLite json_each() function behavior with empty arrays -- verified against existing ALLERGEN_EXCLUSION usage in recipes.ts

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all patterns established in codebase
- Architecture: HIGH -- hooks extraction is mechanical, hard filter SQL follows proven ALLERGEN_EXCLUSION pattern
- Pitfalls: HIGH -- identified from direct codebase inspection (null handling, route rename order, test mock breakage)

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable -- no dependency changes, internal refactoring only)
