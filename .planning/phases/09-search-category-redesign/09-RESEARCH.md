# Phase 9: Search & Category Redesign - Research

**Researched:** 2026-03-17
**Domain:** React Native search UX, category browsing, filter state management
**Confidence:** HIGH

## Summary

Phase 9 redesigns the Search tab to add a category strip for browsing, split filtering behavior (dietary-only on search results vs. skill/tool filters on category results), and compose category + search query together. The existing codebase already has all the DB infrastructure needed (`getAllRecipesForSearch`, `queryRecipesByFilter`, `buildHardFilterClauses`), a well-established hook-owns-state pattern (`useSearchScreen`), and reusable UI components (`RecipeCardGrid`, `FlashList`). The main work is restructuring the search screen UI and hook to support two modes (search vs. category browse) with distinct filter capabilities.

A critical design tension exists between the success criteria's category list (Pasta, Burgers, Breakfast, Desserts, Chicken, Soups, Rice & Grains, Meat) and the existing `CategoryEnum` (ana yemek, kahvalti, corba, tatli, salata, aperatif). The success criteria categories are more like dish-type tags, while the DB has 6 Turkish category values. The implementation must either: (a) map the success criteria labels to existing categories, or (b) introduce a new category-strip taxonomy. Given the 30-recipe corpus, **mapping to existing categories is the practical choice** -- the success criteria labels should be treated as display-level aspirational guidance, and the strip should use the actual `CategoryEnum` values with Turkish labels.

**Primary recommendation:** Rewrite `useSearchScreen` hook to manage a `selectedCategory` state alongside existing search state, add a `CategoryStrip` component using horizontal `FlatList`/`ScrollView`, and add a collapsible `FilterPanel` component for skill/tool filtering on category results only. No new dependencies needed.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISC-03 | User can filter recipes by craving/mood (cuisine type, cooking time, dish type) | Category strip with horizontal cards maps to dish-type filtering; existing `queryRecipesByFilter` and `CategoryEnum` provide DB layer; filter panel adds skill/tool refinement on category results |
| DISC-01 | User can input available ingredients and receive recipe recommendations that match | Already implemented in current `useSearchScreen` via `searchRecipesByIngredients`; this phase preserves and extends it with dietary-only filtering on results and composition with active category |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native (ScrollView/FlatList) | 0.81.5 | Horizontal category strip | Already in project; no external dependency needed for simple horizontal scroll |
| @shopify/flash-list | 2.0.2 | Recipe result grid | Already used in current search screen for 2-column grid |
| expo-sqlite | v2 | Recipe queries with hard filters | Already provides `getAllRecipesForSearch`, `queryRecipesByFilter` |
| react-native-reanimated | ~4.1.1 | Filter panel expand/collapse animation | Already in project; `useAnimatedStyle` + `withTiming` for smooth height transitions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-linear-gradient | existing | Category card gradients | Reuse CATEGORY_GRADIENTS palette from RecipeCardGrid |
| @expo/vector-icons (MaterialCommunityIcons) | existing | Filter/search icons | Consistent with rest of app |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom horizontal ScrollView | @shopify/flash-list horizontal | Only 6-8 categories; ScrollView is simpler, no virtualization needed |
| Reanimated LayoutAnimation | RN LayoutAnimation | Reanimated already in project; more control over filter panel animation |
| External filter library | Custom FilterPanel component | Only 2 filter dimensions (skill + equipment); custom is simpler |

## Architecture Patterns

### Recommended Project Structure
```
src/
  hooks/
    useSearchScreen.ts          # REWRITE: add category state, split filter logic
  components/
    search/
      CategoryStrip.tsx          # NEW: horizontal scrolling category cards
      FilterPanel.tsx            # NEW: skill level + equipment filter (category results only)
  types/
    discovery.ts                 # EXTEND: add SearchFilterState type
TheCook/app/(tabs)/
  search.tsx                     # REWRITE: integrate CategoryStrip, FilterPanel, mode switching
```

### Pattern 1: Hook-Owns-State (Established Project Pattern)
**What:** Screen hooks own all state, effects, handlers; screens are pure rendering shells
**When to use:** Every screen in this project (established in Phase 7)
**Example:**
```typescript
// useSearchScreen returns everything the screen needs
export function useSearchScreen(): SearchScreenState & SearchScreenActions {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [skillFilter, setSkillFilter] = useState<SkillLevel | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string[]>([]);
  // ... all logic lives here
}
```

### Pattern 2: Category + Search Composition
**What:** When a category is selected AND user types a search query, results are filtered by both
**When to use:** Success criterion 6 requires this
**Example:**
```typescript
const displayResults = useMemo(() => {
  let base = selectedCategory
    ? allRecipes.filter(r => r.category === selectedCategory)
    : allRecipes;

  if (lowerQuery) {
    base = base.filter(r =>
      r.title.toLocaleLowerCase('tr').includes(lowerQuery) ||
      extractIngredientNames(r.ingredient_groups).some(name => name.includes(lowerQuery))
    );
  }
  return base;
}, [selectedCategory, query, allRecipes]);
```

### Pattern 3: Session-Only Filter State
**What:** Filter state (skill, equipment on category results) lives in useState only -- no persistence
**When to use:** Success criterion 4 requires filters reset on app close or tab switch
**Example:**
```typescript
// Reset filters on tab blur
useFocusEffect(
  useCallback(() => {
    return () => {
      // Cleanup on blur -- reset session filters
      setSkillFilter(null);
      setEquipmentFilter([]);
      setShowFilters(false);
    };
  }, [])
);
```

### Pattern 4: Dietary-Only vs. Full Filter Split
**What:** Search results get dietary filtering (allergens via hard filters at DB level, already done). Category results additionally get an optional skill/tool filter panel.
**When to use:** Success criteria 2 and 3 create this asymmetry
**Implementation:** The `getAllRecipesForSearch` already applies hard filters (allergens, skill ceiling, equipment). For category results with the optional filter panel, apply additional JS-level filtering for the user-chosen skill preference and tool subset.

### Anti-Patterns to Avoid
- **Nested FlatList inside ScrollView:** Category strip is a sibling of results, not nested. Use `ListHeaderComponent` on FlashList or separate Views.
- **Persisting filter state:** Filters are session-only. Do NOT save to SQLite or AsyncStorage.
- **Fetching per category:** All 30 recipes are already loaded via `getAllRecipesForSearch`. Category filtering is pure JS `Array.filter` -- no additional DB call.
- **Re-inventing hard filters:** Allergen/skill/equipment hard filters already run at SQL level in `buildHardFilterClauses`. Do not duplicate this logic.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Recipe filtering by category | Custom SQL query per category | JS `Array.filter` on already-loaded `allRecipes` | Only 30 recipes; in-memory filter is instant |
| Hard filter exclusion | Manual allergen/skill/equipment checks | Existing `buildHardFilterClauses` + `getAllRecipesForSearch` | Already battle-tested in Phases 7-8 |
| Ingredient name extraction | New parser | Existing `extractIngredientNames` in recipes.ts | Already handles both `items` and `ingredients` shapes |
| Horizontal scroll with snap | Custom gesture handler | React Native `ScrollView` with `horizontal` + `showsHorizontalScrollIndicator={false}` | Simple enough for 6-8 items |

## Common Pitfalls

### Pitfall 1: Category Taxonomy Mismatch
**What goes wrong:** Success criteria list categories (Pasta, Burgers, etc.) that don't match existing CategoryEnum values
**Why it happens:** Success criteria were written aspirationally; actual data has 6 Turkish categories
**How to avoid:** Use existing CategoryEnum values as the source of truth. Map to display labels: "ana yemek" -> "Ana Yemek", "kahvalti" -> "Kahvalti", "corba" -> "Corbalar", "tatli" -> "Tatlilar", "salata" -> "Salatalar", "aperatif" -> "Aperatifler"
**Warning signs:** Category strip shows items with zero recipes

### Pitfall 2: Search Matching Only Title (Missing Ingredients)
**What goes wrong:** Success criterion 5 requires search to match against recipe names AND ingredient lists, but current `displayResults` only checks `r.title`
**Why it happens:** Current implementation has separate paths for ingredient chips (which do ingredient matching) vs. text query (title only)
**How to avoid:** When no ingredient chips are active, text query should match against both `title` and ingredient names from `ingredient_groups` JSON
**Warning signs:** User searches "domates" and doesn't find recipes containing tomato

### Pitfall 3: Filter Panel Visible on Search Results
**What goes wrong:** Filter panel (skill + equipment) appears on search results, violating criterion 2
**Why it happens:** Not properly gating filter panel visibility on `selectedCategory !== null`
**How to avoid:** `showFilterButton` = `selectedCategory !== null`; filter panel only renders when a category is active
**Warning signs:** Filter icon visible when user is typing a search query without category selected

### Pitfall 4: Stale Filter State After Tab Switch
**What goes wrong:** User switches to Feed tab and back, filter state persists from previous session
**Why it happens:** React state survives tab navigation in expo-router (tabs are kept mounted)
**How to avoid:** Use `useFocusEffect` cleanup to reset `skillFilter`, `equipmentFilter`, `selectedCategory` on blur
**Warning signs:** Returning to Search tab shows filtered results from previous browsing session

### Pitfall 5: FlashList Inside ScrollView
**What goes wrong:** Performance issues or layout bugs from nesting scrollable inside scrollable
**Why it happens:** CategoryStrip (horizontal scroll) + FilterPanel + FlashList (vertical) all in one screen
**How to avoid:** Use a non-scrolling container for CategoryStrip and FilterPanel above FlashList. CategoryStrip is horizontal (separate scroll axis, no conflict). FilterPanel is fixed height. FlashList handles vertical scrolling.
**Warning signs:** FlashList height collapses to 0 or scroll doesn't work

### Pitfall 6: Turkish Locale in Search Matching
**What goes wrong:** Case-insensitive search fails for Turkish characters (I/i vs I/i dotted)
**Why it happens:** `toLowerCase()` instead of `toLocaleLowerCase('tr')`
**How to avoid:** Already established pattern in codebase -- use `toLocaleLowerCase('tr')` everywhere. Maintain consistency.
**Warning signs:** Searching "Ic" doesn't match "icecek" style words

## Code Examples

### CategoryStrip Component
```typescript
// Source: Project patterns (CATEGORY_GRADIENTS from recipe-card-grid.tsx)
import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Category } from '@/src/types/recipe';

const CATEGORIES: { key: Category; label: string; gradient: [string, string] }[] = [
  { key: 'ana yemek', label: 'Ana Yemek', gradient: ['#E07B39', '#C05F20'] },
  { key: 'kahvaltı', label: 'Kahvaltı', gradient: ['#F59E0B', '#D97706'] },
  { key: 'çorba', label: 'Çorbalar', gradient: ['#0891B2', '#0E7490'] },
  { key: 'tatlı', label: 'Tatlılar', gradient: ['#EC4899', '#DB2777'] },
  { key: 'salata', label: 'Salatalar', gradient: ['#16A34A', '#15803D'] },
  { key: 'aperatif', label: 'Aperatifler', gradient: ['#7C3AED', '#6D28D9'] },
];

interface CategoryStripProps {
  selected: Category | null;
  onSelect: (category: Category | null) => void;
}

export function CategoryStrip({ selected, onSelect }: CategoryStripProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
    >
      {CATEGORIES.map((cat) => (
        <Pressable
          key={cat.key}
          onPress={() => onSelect(selected === cat.key ? null : cat.key)}
          style={[styles.card, selected === cat.key && styles.cardSelected]}
        >
          <LinearGradient colors={cat.gradient} style={styles.cardGradient}>
            <Text style={styles.cardLabel}>{cat.label}</Text>
          </LinearGradient>
        </Pressable>
      ))}
    </ScrollView>
  );
}
```

### Extended Search Matching (Title + Ingredients)
```typescript
// Source: Existing extractIngredientNames in recipes.ts
const displayResults = useMemo(() => {
  const lowerQuery = query.length >= 2 ? query.toLocaleLowerCase('tr') : '';
  let base = selectedCategory
    ? allRecipes.filter(r => r.category === selectedCategory)
    : allRecipes;

  if (ingredientChips.length > 0) {
    // Ingredient chip mode: existing searchRecipesByIngredients logic
    base = results; // already filtered by chips
    if (lowerQuery) {
      base = base.filter(r => r.title.toLocaleLowerCase('tr').includes(lowerQuery));
    }
    return base;
  }

  if (lowerQuery) {
    return base.filter(r => {
      const titleMatch = r.title.toLocaleLowerCase('tr').includes(lowerQuery);
      if (titleMatch) return true;
      // Also match against ingredient names
      const ingredientNames = extractIngredientNames(r.ingredient_groups);
      return ingredientNames.some(name => name.includes(lowerQuery));
    });
  }

  // No query, category selected: show all in category
  if (selectedCategory) return base;

  return [];
}, [results, query, ingredientChips, allRecipes, selectedCategory]);
```

### FilterPanel for Category Results
```typescript
// Source: Project patterns (immediate-save UX from Phase 2)
interface FilterPanelProps {
  visible: boolean;
  skillFilter: SkillLevel | null;
  equipmentFilter: string[];
  userEquipment: string[]; // from profile
  onSkillChange: (skill: SkillLevel | null) => void;
  onEquipmentChange: (equipment: string[]) => void;
}

export function FilterPanel({
  visible, skillFilter, equipmentFilter, userEquipment,
  onSkillChange, onEquipmentChange,
}: FilterPanelProps) {
  if (!visible) return null;
  return (
    <View style={styles.panel}>
      {/* Skill level chips */}
      <Text style={styles.filterLabel}>Seviye</Text>
      <View style={styles.chipRow}>
        {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
          <Pressable
            key={level}
            style={[styles.chip, skillFilter === level && styles.chipActive]}
            onPress={() => onSkillChange(skillFilter === level ? null : level)}
          >
            <Text>{SKILL_LABELS[level]}</Text>
          </Pressable>
        ))}
      </View>
      {/* Equipment toggle chips */}
      <Text style={styles.filterLabel}>Ekipman</Text>
      <View style={styles.chipRow}>
        {userEquipment.map(eq => (
          <Pressable
            key={eq}
            style={[styles.chip, equipmentFilter.includes(eq) && styles.chipActive]}
            onPress={() => {
              onEquipmentChange(
                equipmentFilter.includes(eq)
                  ? equipmentFilter.filter(e => e !== eq)
                  : [...equipmentFilter, eq]
              );
            }}
          >
            <Text>{eq}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Ingredient chips only search | Category strip + text search + ingredient chips | Phase 9 | Search tab becomes primary discovery surface alongside Feed |
| No category browsing | Horizontal category cards | Phase 9 | DISC-03 satisfied |
| Title-only text search | Title + ingredient matching | Phase 9 | DISC-01 enhanced; criterion 5 |
| Unified filter on all results | Dietary-only on search, skill/tool on categories | Phase 9 | Cleaner UX; criteria 2 + 3 |

## Open Questions

1. **Category label mapping**
   - What we know: Existing CategoryEnum has 6 Turkish values; success criteria list 8 English labels (Pasta, Burgers, etc.)
   - What's unclear: Whether user expects the exact 8 listed categories or Turkish equivalents of existing 6
   - Recommendation: Use the existing 6 CategoryEnum values with Turkish display labels. The success criteria list is aspirational -- actual data only supports 6 categories. Document the mapping clearly.

2. **"Real-time results" definition (criterion 5)**
   - What we know: Current search debounces at 2-character minimum; all data is in memory
   - What's unclear: Whether "real-time" means keystroke-by-keystroke or short debounce is acceptable
   - Recommendation: Filter on every keystroke after 2-char minimum (current useMemo approach). With 30 recipes in memory, this is instant with no performance concern.

3. **Category strip card design**
   - What we know: Success criteria say "horizontal scrolling category cards"
   - What's unclear: Card height, whether to show recipe count, icon vs. gradient
   - Recommendation: Use gradient cards (reusing existing CATEGORY_GRADIENTS palette) with category name. Keep cards compact (height ~80px, width ~120px). Optionally show recipe count badge.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + jest-expo ~54.0.17 |
| Config file | package.json jest config |
| Quick run command | `npx jest --testPathPattern=search --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISC-03 | Category strip filters recipes by category | unit | `npx jest src/hooks/useSearchScreen.test.ts -x` | No -- Wave 0 |
| DISC-03 | Filter panel applies skill/equipment filters on category results | unit | `npx jest src/hooks/useSearchScreen.test.ts -x` | No -- Wave 0 |
| DISC-01 | Search matches recipe names and ingredient lists | unit | `npx jest src/hooks/useSearchScreen.test.ts -x` | No -- Wave 0 |
| DISC-01 | Category + search query compose together | unit | `npx jest src/hooks/useSearchScreen.test.ts -x` | No -- Wave 0 |
| N/A | Filter state resets on tab switch | unit | `npx jest src/hooks/useSearchScreen.test.ts -x` | No -- Wave 0 |
| N/A | Search results have dietary-only filtering (no skill/tool panel) | unit | `npx jest src/hooks/useSearchScreen.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern=search --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/__tests__/useSearchScreen.test.ts` -- covers DISC-03, DISC-01, filter reset, composition
- [ ] Test helpers for mock recipe data with categories and ingredient_groups

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/hooks/useSearchScreen.ts`, `src/db/recipes.ts`, `src/types/recipe.ts`, `src/types/discovery.ts` -- full existing implementation reviewed
- Codebase analysis: `app/(tabs)/search.tsx` -- current UI structure understood
- Codebase analysis: `components/ui/recipe-card-grid.tsx` -- CATEGORY_GRADIENTS palette, card patterns

### Secondary (MEDIUM confidence)
- STATE.md accumulated decisions -- confirmed hook-owns-state pattern, hard filter SQL pattern, Turkish locale handling

### Tertiary (LOW confidence)
- None -- all findings are based on direct codebase analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in project, no new dependencies
- Architecture: HIGH - follows established hook-owns-state pattern from Phase 7
- Pitfalls: HIGH - directly derived from codebase analysis and success criteria review
- Category mapping: MEDIUM - success criteria labels don't match existing enum; recommendation is practical but needs user confirmation

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable -- no external dependencies or fast-moving APIs)
