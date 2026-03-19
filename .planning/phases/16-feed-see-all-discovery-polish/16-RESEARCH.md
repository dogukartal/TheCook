# Phase 16: Feed "See All" + Discovery Polish - Research

**Researched:** 2026-03-19
**Domain:** React Native feed UX -- navigation, scroll hinting, section polish
**Confidence:** HIGH

## Summary

Phase 16 enhances the existing feed screen with four distinct improvements: (1) a "See All" route that shows all recipes in a given feed section as a vertical scrollable list, (2) a partial third card peek at the right edge of horizontal sections to hint at scrollability, (3) a subtle auto-animation on first appearance to suggest horizontal swiping, and (4) polished section headings with recipe counts and visual separators.

The existing codebase provides a strong foundation. The feed screen (`app/(tabs)/index.tsx`) renders `FeedSection` components via `useFeedScreen` hook which builds four typed sections (`trending`, `quick`, `personal`, `untried`). Each section is a horizontal `FlatList` with 180px-wide `RecipeCardGrid` cards. The `FeedSection` type includes `key`, `title`, and `data` (array of `RecipeListItem`). All required dependencies (expo-router, react-native-reanimated 4.1, @shopify/flash-list 2.0) are already installed.

**Primary recommendation:** Add a dynamic route `app/feed/[section].tsx` for the "See All" screen, modify `FeedSection` component for peek/animation/heading polish, and reuse `buildFeedSections` logic to reconstruct section data on the detail screen.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISC-06 | User can tap "See All" on any feed section to view all recipes in that section as a vertical scrollable list | New route `app/feed/[section].tsx` with section key param; reuse `buildFeedSections` + `getAllRecipesForFeed`; FlashList vertical grid |
| DISC-07 | User sees a partial 3rd card peeking on feed sections, hinting at horizontal scrollability | Reduce card width from 180 to ~160 or adjust container padding so 2.3 cards visible within screen width |
| DISC-08 | User sees a subtle auto-animation on feed sections suggesting horizontal swipe | Reanimated `withTiming` translateX nudge on first mount via `useAnimatedStyle` + `useSharedValue`; FlatList ref `scrollToOffset` alternative |
| DISC-09 | Feed section headings show recipe count and have elegant visual separators | Modify `FeedSection` title rendering to include `(count)` and add separator `View` between sections |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-router | ~6.0.23 | File-based routing for "See All" screen | Already used for all navigation; `useLocalSearchParams` for section key |
| react-native-reanimated | ~4.1.1 | Scroll hint animation | Already installed; `withTiming` + `useAnimatedStyle` for nudge effect |
| @shopify/flash-list | 2.0.2 | Vertical grid on "See All" screen | Already used on search screen for 2-column recipe grid |
| expo-image | ~3.0.11 | Image rendering on cards | Already used in RecipeCardGrid and RecipeCardRow |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native FlatList | built-in | Horizontal section list | Already used in FeedSection; has `scrollToOffset` for hint animation |
| expo-linear-gradient | ~15.0.8 | Gradient fallbacks on cards | Already used in card components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| FlatList scrollToOffset for hint | Reanimated translateX wrapper | scrollToOffset is simpler for a nudge-and-return; Reanimated wrapper needed if animating individual cards |
| FlashList for See All | FlatList | FlashList already proven on search screen with numColumns=2; better performance |
| New route for See All | Modal overlay | Route is better for deep linking and back navigation consistency |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
app/
  feed/
    [section].tsx        # "See All" vertical list (DISC-06)
components/
  ui/
    feed-section.tsx     # Modified: peek sizing, heading polish, hint animation
src/
  hooks/
    useFeedScreen.ts     # Unchanged: buildFeedSections already exported
    useSeeAllScreen.ts   # New hook: loads section data by key
```

### Pattern 1: Dynamic Route for "See All" (DISC-06)
**What:** A new screen at `app/feed/[section].tsx` receives the section key as a URL parameter, reconstructs that section's recipe data, and displays it as a vertical scrollable grid.
**When to use:** When navigating from a feed section "See All" button.
**Example:**
```typescript
// app/feed/[section].tsx
import { useLocalSearchParams } from 'expo-router';

export default function SeeAllScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  // section will be 'trending' | 'quick' | 'personal' | 'untried'
  // Use useSeeAllScreen(section) hook to fetch data
}
```

**Navigation from FeedSection:**
```typescript
// In feed-section.tsx
import { router } from 'expo-router';

// "See All" button press:
router.push(`/feed/${section.key}`);
```

**Data reconstruction approach:** The `useSeeAllScreen` hook calls `getAllRecipesForFeed` with the profile's hard filters, then applies the same section-specific filtering logic that `buildFeedSections` uses. This avoids prop drilling large arrays through navigation params.

### Pattern 2: Card Peek via Width Calculation (DISC-07)
**What:** Adjust card width so that approximately 2.3 cards are visible within the screen, showing a clear partial third card.
**When to use:** In `FeedSection` card sizing.
**Example:**
```typescript
// Current: cardWrapper width is hardcoded 180px
// Screen width ~393 (iPhone 15) with 16px padding on each side = 361 usable
// 2 cards at 180px + 12px gap = 372px -> barely any peek

// Fix: calculate card width based on screen width
import { Dimensions } from 'react-native';
const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 16;
const CARD_GAP = 12;
// Show ~2.3 cards: (screenWidth - 2*padding + gap) / 2.3 - gap
const CARD_WIDTH = Math.floor(
  (SCREEN_WIDTH - 2 * HORIZONTAL_PADDING + CARD_GAP) / 2.3 - CARD_GAP
);
// On iPhone 15 (393px): (393-32+12)/2.3 - 12 = ~150px -> shows ~2.3 cards
```

**Key consideration:** The current 180px width leaves almost no peek on a 393px screen. Reducing to ~150-155px creates a clear ~40px visible slice of the third card. The imageArea height should be proportionally adjusted from 140px down to ~120px to maintain card aspect ratio.

### Pattern 3: Scroll Hint Animation (DISC-08)
**What:** On first render of each FeedSection, programmatically scroll the FlatList a small distance right and back to show users the list is horizontally scrollable.
**When to use:** When a FeedSection first appears in the viewport.

**Approach A -- FlatList scrollToOffset (simpler, recommended):**
```typescript
const flatListRef = useRef<FlatList>(null);
const hasAnimated = useRef(false);

useEffect(() => {
  if (!hasAnimated.current && data.length > 2) {
    hasAnimated.current = true;
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 30, animated: true });
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 300);
    }, 500); // delay after mount
    return () => clearTimeout(timer);
  }
}, [data.length]);
```

**Approach B -- Reanimated translateX (more control):**
```typescript
const translateX = useSharedValue(0);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: translateX.value }],
}));

useEffect(() => {
  translateX.value = withSequence(
    withDelay(500, withTiming(-20, { duration: 300 })),
    withTiming(0, { duration: 300 })
  );
}, []);
```

**Recommendation:** Use Approach A (scrollToOffset) because it scrolls the actual FlatList content (not just a wrapper) and provides the most natural-looking scroll indicator appearance. It also works with `showsHorizontalScrollIndicator` to momentarily flash the indicator.

### Pattern 4: Section Heading with Count and Separator (DISC-09)
**What:** Display recipe count in parentheses next to the section title and add a horizontal line or spacing separator between sections.
**When to use:** In `FeedSection` component header rendering.
**Example:**
```typescript
// Title: "Sana ozel (8)"
<View style={styles.headerRow}>
  <Text style={[styles.title, { color: colors.text }]}>
    {title}
  </Text>
  <Text style={[styles.count, { color: colors.textSub }]}>
    ({data.length})
  </Text>
  <View style={{ flex: 1 }} />
  <Pressable onPress={() => router.push(`/feed/${sectionKey}`)}>
    <Text style={[styles.seeAll, { color: colors.tint }]}>
      Tumunu Gor
    </Text>
  </Pressable>
</View>
// Separator between sections
<View style={[styles.separator, { backgroundColor: colors.separator }]} />
```

### Anti-Patterns to Avoid
- **Passing recipe arrays as navigation params:** Never serialize large data arrays into navigation params. Always re-query from the database on the "See All" screen using the section key.
- **Using Animated API from react-native core for scroll hint:** Reanimated is already installed and is more performant. But even simpler: use FlatList's built-in `scrollToOffset`.
- **Fixed card widths without considering screen size:** The current 180px hardcoded width breaks the peek requirement on most iPhone screens. Use `Dimensions.get('window').width` for calculation.
- **Animating ALL sections simultaneously on feed load:** Only animate sections as they become visible, or stagger the animations. Animating 4 sections at once is distracting.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Vertical scrollable grid | Custom scroll + manual layout | FlashList with numColumns=2 | Already proven pattern on search screen; handles recycling, estimation |
| Navigation with back button | Custom stack management | expo-router Stack + useLocalSearchParams | File-based routing handles back navigation, deep links automatically |
| Scroll hint animation | Custom PanResponder or Gesture | FlatList scrollToOffset | Built-in, handles scroll indicator flash, native-feeling |
| Section data reconstruction | Cache or prop-drill from feed | Re-query from SQLite via buildFeedSections | SQLite queries are <10ms for 30 recipes; simpler than caching |

**Key insight:** The existing codebase has strong patterns for everything this phase needs. The search screen already uses FlashList with 2-column grid layout, recipe detail already uses useLocalSearchParams for dynamic routes, and feed-section already has the horizontal FlatList that just needs width/animation tweaks.

## Common Pitfalls

### Pitfall 1: Section Key Not Matching FeedSection Type
**What goes wrong:** The `FeedSection.key` is a union type `"trending" | "quick" | "personal" | "untried"`. If the "See All" route receives an arbitrary string, type checking breaks.
**Why it happens:** expo-router's `useLocalSearchParams` returns `string | string[]`, not the typed union.
**How to avoid:** Validate the section param against the known keys before using it. Redirect or show error for invalid keys.
**Warning signs:** TypeScript complains about string not assignable to union type.

### Pitfall 2: Card Width Calculation on Different Devices
**What goes wrong:** Using a fixed calculated width that works on one device but shows too much or too little peek on others.
**Why it happens:** iOS devices range from 375px (SE) to 430px (Pro Max) width.
**How to avoid:** Use `Dimensions.get('window').width` at component level (not module level) or `useWindowDimensions` hook. Calculate card width as a function of available space.
**Warning signs:** Cards are perfectly edge-to-edge on one device, clipped on another.

### Pitfall 3: Scroll Hint Fires on Every Re-render
**What goes wrong:** The nudge animation replays every time the feed re-renders (e.g., after pull-to-refresh).
**Why it happens:** useEffect without proper guard or dependency tracking.
**How to avoid:** Use a `useRef(false)` flag that persists across renders. Set it to `true` after first animation. Reset only on explicit user action.
**Warning signs:** Users see the nudge animation every time they return to the feed tab.

### Pitfall 4: "See All" Screen Shows Stale Data
**What goes wrong:** If user changes allergens/equipment in settings and then navigates to a cached "See All" screen, they see recipes that should be filtered out.
**Why it happens:** If section data is passed via params or cached.
**How to avoid:** Always re-query from SQLite on the "See All" screen mount. Use `useFocusEffect` to refresh on screen focus.
**Warning signs:** Recipes that should be excluded by hard filters still appear.

### Pitfall 5: Separator Between Sections Creates Visual Clutter
**What goes wrong:** Heavy borders/lines between sections make the feed feel rigid rather than flowing.
**Why it happens:** Using border or thick divider when a simple spacing increase would suffice.
**How to avoid:** Use a combination of increased `marginBottom` on sections and a thin 1px separator line with low opacity. Test both approaches.
**Warning signs:** Feed feels "boxy" instead of scrollable/fluid.

### Pitfall 6: Stack Screen Not Registered in Root Layout
**What goes wrong:** The new `app/feed/[section].tsx` route works in dev but crashes in production.
**Why it happens:** expo-router v6 with file-based routing should auto-discover the route, but if there are custom Stack.Screen entries that restrict routes, the new one may be missed.
**How to avoid:** Verify the root `_layout.tsx` Stack does not explicitly whitelist screens (it currently does not -- it uses `<Stack>` with named screens but does not restrict others). The `app/feed/` directory will be auto-discovered.
**Warning signs:** "No route named 'feed/trending'" error in production build.

## Code Examples

### "See All" Hook Pattern
```typescript
// src/hooks/useSeeAllScreen.ts
// Reconstructs a specific feed section's data by key

import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useProfileDb } from '@/src/db/profile';
import { getAllRecipesForFeed } from '@/src/db/recipes';
import { getCookedRecipeIds } from '@/src/db/cooking-history';
import { buildFeedSections } from '@/src/hooks/useFeedScreen';
import type { RecipeListItem, FeedSection } from '@/src/types/discovery';

type SectionKey = FeedSection['key'];

const VALID_KEYS: SectionKey[] = ['trending', 'quick', 'personal', 'untried'];

export function useSeeAllScreen(sectionKey: string) {
  const db = useSQLiteContext();
  const { getProfile, getBookmarks, addBookmark, removeBookmark } = useProfileDb();
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const isValid = VALID_KEYS.includes(sectionKey as SectionKey);

  useFocusEffect(
    useCallback(() => {
      if (!isValid) return;
      let cancelled = false;
      async function load() {
        const profile = await getProfile();
        const hardFilter = {
          allergens: profile.allergens,
          skillLevel: profile.skillLevel,
          equipment: profile.equipment ?? [],
        };
        const allRecipes = await getAllRecipesForFeed(db, hardFilter);
        const cookedIds = await getCookedRecipeIds(db);
        const { sections } = buildFeedSections(allRecipes, cookedIds, profile);
        const section = sections.find((s) => s.key === sectionKey);
        if (!cancelled && section) {
          setRecipes(section.data);
          setTitle(section.title);
        }
        const bookmarks = await getBookmarks();
        if (!cancelled) {
          setBookmarkedIds(new Set(bookmarks.map((b) => b.recipeId)));
          setLoading(false);
        }
      }
      load();
      return () => { cancelled = true; };
    }, [sectionKey])
  );

  return { recipes, title, loading, bookmarkedIds, isValid };
}
```

### FeedSection with Peek, Count, and "See All" Button
```typescript
// Modified FeedSection component structure
<View style={styles.container}>
  <View style={styles.headerRow}>
    <Text style={[styles.title, { color: colors.text }]}>
      {title}
    </Text>
    <Text style={[styles.count, { color: colors.textSub }]}>
      {' '}({data.length})
    </Text>
    <View style={{ flex: 1 }} />
    {data.length > 2 && (
      <Pressable onPress={onSeeAll}>
        <Text style={[styles.seeAllText, { color: colors.tint }]}>
          Tumunu Gor
        </Text>
      </Pressable>
    )}
  </View>
  <FlatList
    ref={flatListRef}
    data={data}
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.listContent}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => (
      <View style={[styles.cardWrapper, { width: cardWidth }]}>
        <RecipeCardGrid ... />
      </View>
    )}
  />
</View>
```

### Scroll Hint with FlatList scrollToOffset
```typescript
// Inside FeedSection component
const flatListRef = useRef<FlatList>(null);
const hasHinted = useRef(false);

useEffect(() => {
  if (!hasHinted.current && data.length > 2) {
    hasHinted.current = true;
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: 30,
        animated: true,
      });
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: 0,
          animated: true,
        });
      }, 350);
    }, 600);
    return () => clearTimeout(timer);
  }
}, [data.length]);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded card width | Dynamic width based on screen | Always best practice | Cards peek correctly on all devices |
| No scroll hint | scrollToOffset nudge animation | Common pattern since RN 0.60+ | Users discover horizontal scrolling |
| Navigation params for data | Re-query on destination screen | expo-router v5+ (file-based routing) | Cleaner, no serialization, always fresh data |
| FlatList for grids | FlashList for recycled grids | @shopify/flash-list 1.0+ (2023) | Better scroll perf for vertical grid |

**Deprecated/outdated:**
- None relevant to this phase. All target APIs are current and stable.

## Open Questions

1. **Card width exact value**
   - What we know: Current 180px does not leave enough peek. Calculation suggests ~150-155px.
   - What's unclear: Exact visual weight -- too small may make card text unreadable.
   - Recommendation: Start at 155px, visually test on device, adjust +/- 5px.

2. **Scroll hint stagger timing**
   - What we know: We want each section to hint, but not all at once.
   - What's unclear: Whether to use intersection observer pattern (visibility detection) or simple stagger delay.
   - Recommendation: Use incremental delay per section index (section 0: 600ms, section 1: 1200ms, etc.). Simpler than visibility detection, good enough for 4 sections.

3. **Section separator style**
   - What we know: Need visual separation between sections (DISC-09).
   - What's unclear: Whether a thin line or increased spacing alone is sufficient.
   - Recommendation: Use a thin 1px separator with `colors.separator` token between sections, centered horizontally with 16px margin on each side.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 |
| Config file | package.json (jest key) |
| Quick run command | `npx jest __tests__/feed-section.test.ts --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISC-06 | "See All" navigates to vertical list showing section recipes | unit (hook logic) | `npx jest __tests__/see-all-screen.test.ts -x` | Wave 0 |
| DISC-06 | Invalid section key handled gracefully | unit (hook logic) | `npx jest __tests__/see-all-screen.test.ts -x` | Wave 0 |
| DISC-07 | Card width creates visible peek of 3rd card | unit (calculation) | `npx jest __tests__/feed-section-peek.test.ts -x` | Wave 0 |
| DISC-08 | Scroll hint animation fires once per mount | manual-only | N/A -- requires device/simulator observation | N/A |
| DISC-09 | Section heading includes recipe count | unit (render output) | `npx jest __tests__/feed-section.test.ts -x` | Existing (needs extension) |

### Sampling Rate
- **Per task commit:** `npx jest __tests__/feed-section.test.ts __tests__/see-all-screen.test.ts --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/see-all-screen.test.ts` -- covers DISC-06 (hook data logic, invalid key handling)
- [ ] `__tests__/feed-section.test.ts` -- extend existing: add count display, peek width calculation tests

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `app/(tabs)/index.tsx`, `components/ui/feed-section.tsx`, `src/hooks/useFeedScreen.ts`, `src/types/discovery.ts` -- current feed architecture
- Codebase inspection: `app/(tabs)/search.tsx` -- existing FlashList 2-column grid pattern
- Codebase inspection: `app/recipe/[id].tsx` -- existing dynamic route + useLocalSearchParams pattern
- Codebase inspection: `app/_layout.tsx` -- Stack navigator does not restrict routes
- Codebase inspection: `constants/theme.ts` -- separator token exists in both light/dark

### Secondary (MEDIUM confidence)
- [Expo Router navigation docs](https://docs.expo.dev/router/basics/navigation/) -- dynamic route segments and useLocalSearchParams
- [React Native Reanimated docs](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/customizing-animation/) -- withTiming, withSequence, withDelay
- [React Native FlatList docs](https://reactnative.dev/docs/flatlist) -- scrollToOffset API
- [FreeCodeCamp Reanimated v4 guide](https://www.freecodecamp.org/news/how-to-create-fluid-animations-with-react-native-reanimated-v4/) -- Reanimated v4 backward compat with v3 APIs

### Tertiary (LOW confidence)
- None. All findings verified against codebase or official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and proven in codebase
- Architecture: HIGH -- patterns directly mirror existing search screen and recipe detail
- Pitfalls: HIGH -- derived from direct codebase inspection and React Native documentation

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable -- no fast-moving dependencies)
