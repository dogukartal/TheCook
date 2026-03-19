# Phase 18: UI Polish - Research

**Researched:** 2026-03-19
**Domain:** React Native micro-interactions (haptics, animations, visual feedback)
**Confidence:** HIGH

## Summary

Phase 18 adds six discrete micro-interaction polish items to an already-functional Expo/React Native app. Every requirement targets a specific component that already exists in the codebase. The project already has `react-native-reanimated` v4.1.1 and `expo-haptics` v15 installed and used in multiple places (sefim-pulse, circular-timer, skeleton-card, haptic-tab, sefim-sheet). No new dependencies are needed.

The two bottom sheet modals (IngredientsSheet, SefimSheet) currently use React Native's built-in `<Modal>` with `animationType="slide"`. The requirement (UX-04) asks for a fade-in/out backdrop rather than instant appear/disappear. This can be achieved by switching to `animationType="fade"` on the backdrop while keeping the sheet content's slide animation via Reanimated -- or more simply, by replacing the `animationType="slide"` with `"none"` and controlling both backdrop opacity and sheet translateY via Reanimated shared values. This avoids the @gorhom/bottom-sheet Reanimated v4 compatibility risk flagged in STATE.md.

The segmented progress bar (UX-06) is currently a static View that switches colors instantly. Wrapping each segment in `Animated.View` and animating `backgroundColor` via `withTiming` will create smooth transitions. The Chip component (UX-05) needs a small icon prepended -- MaterialCommunityIcons already provides suitable category icons used throughout the codebase.

**Primary recommendation:** Use Reanimated v4 shared values + `withSpring`/`withTiming` for all animations. Create a reusable `AnimatedPressable` wrapper for the scale-on-tap pattern (UX-03, UX-07). Keep `<Modal>` for sheets but control backdrop + sheet animations via Reanimated instead of `animationType`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UX-02 | Haptic feedback + heart animation on bookmark | expo-haptics `impactAsync(Light)` already in project; Reanimated `withSpring` scale+opacity on heart icon |
| UX-03 | Recipe cards show press-down scale on tap | Reanimated `useSharedValue` + `withSpring(0.96)` on `onPressIn`/`onPressOut` of card Pressable |
| UX-04 | Bottom sheet backdrop fades in/out smoothly | Replace `animationType="slide"` with Reanimated-driven backdrop opacity + sheet translateY |
| UX-05 | Search filter chips show category icon | MaterialCommunityIcons category icon map + Chip component `icon` prop |
| UX-06 | Progress bar animates between steps | Reanimated `useAnimatedStyle` with `withTiming` on segment backgroundColor or width |
| UX-07 | Buttons provide visual tap feedback | Reusable `AnimatedPressable` component with scale+opacity spring animation |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new packages)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-reanimated | ~4.1.1 | All animations (scale, opacity, translateY, color) | Already used in 4 components; runs on UI thread |
| expo-haptics | ~15.0.8 | Haptic feedback on bookmark and buttons | Already used in haptic-tab and sefim-sheet |
| @expo/vector-icons (MaterialCommunityIcons) | ^15.0.3 | Category icons for filter chips | Already used across 10+ components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reanimated for sheets | @gorhom/bottom-sheet v5.1.8+ | Adds dependency + had Reanimated v4 issues until recently; custom overlay is ~50 lines |
| Reanimated for button scale | react-native-pressable-scale | Extra dependency for something achievable in 20 lines with Reanimated |
| RN Animated API | Reanimated | Project already uses Reanimated; mixing APIs creates confusion |

**Installation:** None needed. All libraries already installed.

## Architecture Patterns

### Recommended Component Structure

The six requirements map to these component changes:

```
components/
  ui/
    animated-pressable.tsx     # NEW -- reusable scale-on-tap wrapper (UX-03, UX-07)
    animated-heart.tsx         # NEW -- heart icon with pop animation + haptic (UX-02)
    chip.tsx                   # MODIFY -- add optional icon prop (UX-05)
    recipe-card-grid.tsx       # MODIFY -- wrap in AnimatedPressable, use AnimatedHeart (UX-02, UX-03)
    recipe-card-row.tsx        # MODIFY -- wrap in AnimatedPressable (UX-03)
    recipe-card-row-cooked.tsx # MODIFY -- wrap in AnimatedPressable (UX-03)
    feed-section.tsx           # MODIFY -- cards already use grid, inherits from above
  cooking/
    progress-bar.tsx           # MODIFY -- animate segments with Reanimated (UX-06)
    ingredients-sheet.tsx      # MODIFY -- Reanimated backdrop + sheet animation (UX-04)
    sefim-sheet.tsx            # MODIFY -- Reanimated backdrop + sheet animation (UX-04)
  discovery/
    category-filter.tsx        # MODIFY -- pass icon to Chip (UX-05)
app/
  recipe/
    [id].tsx                   # MODIFY -- wrap bookmark button with AnimatedHeart (UX-02)
    cook/[id].tsx              # MODIFY -- buttons use AnimatedPressable (UX-07)
```

### Pattern 1: AnimatedPressable (Reusable Scale Feedback)
**What:** A drop-in replacement for Pressable that scales down on press and springs back on release.
**When to use:** Any tappable element that needs visual feedback (UX-03, UX-07).
**Example:**
```typescript
// components/ui/animated-pressable.tsx
import React from 'react';
import { PressableProps, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(
  require('react-native').Pressable
);

interface Props extends PressableProps {
  scaleValue?: number;  // default 0.96
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function ScalePressable({ scaleValue = 0.96, style, children, onPressIn, onPressOut, ...rest }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        scale.value = withSpring(scaleValue, { damping: 15, stiffness: 300 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
```

### Pattern 2: Animated Heart (Bookmark Feedback)
**What:** Heart icon that plays a pop scale animation + haptic tap when toggling to bookmarked state.
**When to use:** Bookmark toggle buttons (UX-02).
**Example:**
```typescript
// components/ui/animated-heart.tsx
import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  isBookmarked: boolean;
  onToggle: () => void;
  size?: number;
  color: string;
}

export function AnimatedHeart({ isBookmarked, onToggle, size = 20, color }: Props) {
  const scale = useSharedValue(1);

  function handlePress() {
    if (!isBookmarked) {
      // Only animate + haptic when bookmarking (adding), not removing
      scale.value = withSequence(
        withSpring(1.4, { damping: 8, stiffness: 400 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggle();
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={handlePress} hitSlop={8}>
      <Animated.View style={animatedStyle}>
        <MaterialCommunityIcons
          name={isBookmarked ? 'heart' : 'heart-outline'}
          size={size}
          color={color}
        />
      </Animated.View>
    </Pressable>
  );
}
```

### Pattern 3: Reanimated-Driven Modal Backdrop
**What:** Replace `animationType="slide"` on Modal with custom Reanimated animations for both backdrop fade and sheet slide.
**When to use:** IngredientsSheet, SefimSheet (UX-04).
**Example:**
```typescript
// Inside sheet component
const translateY = useSharedValue(SCREEN_HEIGHT);
const backdropOpacity = useSharedValue(0);

useEffect(() => {
  if (visible) {
    backdropOpacity.value = withTiming(1, { duration: 250 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
  } else {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
  }
}, [visible]);

// Modal uses animationType="none" -- Reanimated controls everything
<Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
  <Animated.View style={[styles.overlay, backdropAnimatedStyle]}>
    <Pressable style={styles.overlayDismiss} onPress={onClose} />
    <Animated.View style={[styles.sheetContainer, sheetAnimatedStyle]}>
      {/* sheet content */}
    </Animated.View>
  </Animated.View>
</Modal>
```

### Pattern 4: Animated Progress Bar Segments
**What:** Each segment animates its fill color/width smoothly when currentStep changes.
**When to use:** SegmentedProgressBar in cooking mode (UX-06).
**Example:**
```typescript
// Each segment uses Reanimated
function AnimatedSegment({ active, color, inactiveColor }: { active: boolean; color: string; inactiveColor: string }) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 300 });
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: progress.value > 0.5 ? color : inactiveColor,
    opacity: 0.3 + 0.7 * progress.value,
  }));

  return <Animated.View style={[styles.segment, animatedStyle]} />;
}
```

### Pattern 5: Category Icon Map for Chips
**What:** A mapping from category values to MaterialCommunityIcons names.
**When to use:** CategoryFilter chips in search screen (UX-05).
**Example:**
```typescript
const CATEGORY_ICONS: Record<string, string> = {
  'ana yemek': 'silverware-fork-knife',
  'kahvalti': 'coffee',
  'corba': 'bowl-mix',
  'tatli': 'cupcake',
  'salata': 'leaf',
  'aperatif': 'food-apple',
};
```

### Anti-Patterns to Avoid
- **Mixing RN Animated and Reanimated:** The project already uses both (category-filter uses `Animated.timing`). Convert category-filter arrow animation to Reanimated in the same change to avoid two animation systems coexisting.
- **Heavy animations on list items:** Keep card press animation lightweight (just scale transform on UI thread) -- no layout animations on FlatList items.
- **Haptics on every tap:** Only add haptics to meaningful state changes (bookmark toggle), not every button press. Over-haptics feels annoying.
- **Animating Modal visibility prop:** When using Reanimated to control sheet enter/exit, the Modal's `visible` prop must remain `true` during the exit animation. Use a separate `mounted` state that stays `true` until exit animation completes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spring physics | Custom spring math | `withSpring` from Reanimated | Battle-tested physics, runs on UI thread |
| Haptic feedback | Vibration API directly | `expo-haptics` | Cross-platform, correct intensity levels |
| Bottom sheet gestures | Custom pan responder | Keep current Modal + Reanimated overlay | Project sheets are simple; full gesture sheet is overkill |
| Icon set | Custom SVG icons | MaterialCommunityIcons (already used) | 7000+ icons, already bundled |

**Key insight:** Every animation in this phase is a simple property transition (scale, opacity, translateY, backgroundColor). Reanimated's `withSpring` and `withTiming` handle all of them without any custom animation logic.

## Common Pitfalls

### Pitfall 1: Modal Exit Animation Timing
**What goes wrong:** Setting `visible={false}` on Modal before the exit animation completes causes the content to vanish instantly.
**Why it happens:** React Native Modal unmounts its children immediately when `visible` becomes false.
**How to avoid:** Use a `mounted` boolean state that keeps Modal visible during exit. On close: start exit animation -> animation callback sets `mounted = false`.
**Warning signs:** Sheet disappears without fade-out animation.

### Pitfall 2: Reanimated Shared Value in Render
**What goes wrong:** Creating `useSharedValue` inside a callback or conditionally causes "hook rules" violations or stale values.
**Why it happens:** Hooks must be called at the top level of the component.
**How to avoid:** Always declare shared values at the top of the component body. For list items, extract animated segments into their own component.
**Warning signs:** "Invalid hook call" errors, animations not updating.

### Pitfall 3: AnimatedPressable Style Merging
**What goes wrong:** Passing an array style `[styles.card, animatedStyle]` to the animated pressable causes the animated transform to be overridden.
**Why it happens:** StyleSheet.flatten resolves styles left-to-right; if the base style has `transform`, it conflicts.
**How to avoid:** Put animatedStyle LAST in the style array. Ensure base styles don't set `transform`.
**Warning signs:** Scale animation doesn't play, or card snaps to wrong position.

### Pitfall 4: Over-Animating on Low-End Android
**What goes wrong:** Multiple simultaneous spring animations cause frame drops on budget devices.
**Why it happens:** Even UI-thread animations have a cost when many run in parallel.
**How to avoid:** Use `withTiming` (cheaper than `withSpring`) for subtle effects. Keep animations under 300ms. Test on Android emulator.
**Warning signs:** Jank on scroll, delayed tap response.

### Pitfall 5: Jest Test Failures with Reanimated
**What goes wrong:** Tests crash because Reanimated native modules aren't available in Jest.
**Why it happens:** Reanimated requires native bindings that don't exist in the test environment.
**How to avoid:** The project already handles this via jest-expo preset which includes Reanimated mock. For new animated components, mock them as plain View in tests (same pattern as existing tests). The `AnimatedPressable` wrapper should be testable via its `onPress` callback, not its animation.
**Warning signs:** "Cannot find module 'react-native-reanimated'" in test output.

## Code Examples

### expo-haptics Usage (verified from existing sefim-sheet.tsx)
```typescript
// Source: components/cooking/sefim-sheet.tsx line 96
import * as Haptics from 'expo-haptics';

// Light impact for UI toggles (bookmark, chip selection)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Available styles: Light, Medium, Heavy, Rigid, Soft
```

### Reanimated Scale Animation (verified from existing sefim-pulse.tsx)
```typescript
// Source: components/cooking/sefim-pulse.tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

const scale = useSharedValue(1);

// Pop animation: overshoot then settle
scale.value = withSequence(
  withSpring(1.4, { damping: 8, stiffness: 400 }),
  withSpring(1, { damping: 12, stiffness: 200 }),
);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));
```

### Animated.createAnimatedComponent Pattern (verified from circular-timer.tsx)
```typescript
// Source: components/cooking/circular-timer.tsx line 42
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// For Pressable:
const AnimatedPressable = Animated.createAnimatedComponent(
  require('react-native').Pressable
);
```

### Current Bottom Sheet Pattern (verified from ingredients-sheet.tsx)
```typescript
// Source: components/cooking/ingredients-sheet.tsx lines 110-117
<Modal
  visible={visible}
  transparent
  animationType="slide"      // <-- this becomes "none" after UX-04
  onRequestClose={onClose}
>
  <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
    {/* ... */}
  </View>
</Modal>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| RN Animated API | Reanimated v4 shared values | 2024 (v4 release) | UI thread animations, no bridge overhead |
| `animationType="slide"` on Modal | Reanimated-driven enter/exit | Common pattern 2024+ | Independent control of backdrop vs content |
| @gorhom/bottom-sheet | Custom Reanimated overlay | N/A for this project | Avoids dependency for simple sheet animations |
| Lottie for heart animation | Reanimated withSequence + withSpring | 2023+ | No extra asset files, <20 lines of code |

**Deprecated/outdated:**
- `Animated.timing` from React Native core: Still works but project should standardize on Reanimated. CategoryFilter currently uses RN Animated -- should be migrated.
- `animationType` prop on Modal: Still functional but limits control. Reanimated overlay is the modern pattern.

## Open Questions

1. **Exact spring config values for card press**
   - What we know: 0.96 scale is the industry standard for subtle press feedback
   - What's unclear: Exact damping/stiffness values that feel best on this app's cards
   - Recommendation: Start with `{ damping: 15, stiffness: 300 }`, tune by feel during implementation

2. **Heart animation: should unbookmark also animate?**
   - What we know: Requirement says "bookmarking a recipe plays a heart animation"
   - What's unclear: Whether removing bookmark should also have visual feedback
   - Recommendation: Only animate on add (the positive action). Remove is instant -- this matches iOS system behavior.

3. **Which buttons get UX-07 tap feedback?**
   - What we know: "Buttons across the app" -- but not every Pressable is a button
   - What's unclear: Exhaustive list of buttons vs. icon-only taps
   - Recommendation: Apply to primary action buttons (Start Cooking, Sonraki, Geri, filter toggles, See All). Do NOT apply to icon-only buttons (back arrow, close X) or list items that already have UX-03 card press.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + jest-expo ~54.0.17 + @testing-library/react-native ^13.3.3 |
| Config file | package.json `jest` key + jest/setup.ts |
| Quick run command | `npx jest --testPathPattern="ui-polish" --no-coverage -x` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UX-02 | Bookmark press calls Haptics.impactAsync and triggers scale animation | unit | `npx jest __tests__/animated-heart.test.ts -x` | No -- Wave 0 |
| UX-03 | Card press triggers scale change onPressIn | unit | `npx jest __tests__/animated-pressable.test.ts -x` | No -- Wave 0 |
| UX-04 | Sheet backdrop uses Reanimated opacity (not animationType="slide") | unit | `npx jest __tests__/sheet-backdrop.test.ts -x` | No -- Wave 0 |
| UX-05 | Category chip renders icon element | unit | `npx jest __tests__/category-chip-icons.test.ts -x` | No -- Wave 0 |
| UX-06 | Progress bar segments use Animated.View | unit | `npx jest __tests__/progress-bar-animated.test.ts -x` | No -- Wave 0 |
| UX-07 | Button press triggers scale animation callback | unit | Same as UX-03 test (shared AnimatedPressable) | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="(animated-heart|animated-pressable|sheet-backdrop|category-chip|progress-bar)" --no-coverage -x`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/animated-heart.test.ts` -- covers UX-02 (haptic mock + animation trigger)
- [ ] `__tests__/animated-pressable.test.ts` -- covers UX-03, UX-07 (onPressIn/onPressOut callback)
- [ ] `__tests__/sheet-backdrop.test.ts` -- covers UX-04 (no animationType="slide" in rendered output)
- [ ] `__tests__/category-chip-icons.test.ts` -- covers UX-05 (icon renders next to label)
- [ ] `__tests__/progress-bar-animated.test.ts` -- covers UX-06 (Animated.View used for segments)
- [ ] Mock for `expo-haptics` in relevant test files (pattern: `jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ... }))`)

## Sources

### Primary (HIGH confidence)
- Codebase analysis: components/cooking/sefim-pulse.tsx, circular-timer.tsx, skeleton-card.tsx (existing Reanimated v4 patterns)
- Codebase analysis: components/haptic-tab.tsx, cooking/sefim-sheet.tsx (existing expo-haptics usage)
- Codebase analysis: components/cooking/ingredients-sheet.tsx, sefim-sheet.tsx (current Modal + animationType="slide" approach)
- Codebase analysis: components/cooking/progress-bar.tsx (current static segment rendering)
- [expo-haptics official docs](https://docs.expo.dev/versions/latest/sdk/haptics/) - API reference for all haptic methods and ImpactFeedbackStyle enum
- [Reanimated withSpring docs](https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/) - Spring config parameters

### Secondary (MEDIUM confidence)
- [@gorhom/bottom-sheet GitHub issues](https://github.com/gorhom/react-native-bottom-sheet/issues/2546) - Reanimated v4 compatibility confirmed in v5.1.8+
- [React Native Modal docs](https://reactnative.dev/docs/modal) - animationType options (slide, fade, none)
- [Reanimated customizing animations](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/customizing-animation/) - withTiming and withSpring usage

### Tertiary (LOW confidence)
- [react-native-pressable-scale](https://github.com/mrousavy/react-native-pressable-scale) - Alternative approach (not recommended, adds dependency)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and used in the codebase. Verified versions from package.json.
- Architecture: HIGH - Patterns derived from existing project code (sefim-pulse, circular-timer, skeleton-card). Same Reanimated APIs.
- Pitfalls: HIGH - Modal exit timing and Jest mocking are well-documented issues verified against project's existing patterns.

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable libraries, no breaking changes expected)
