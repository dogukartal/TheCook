# Technology Stack: v1.1 Additions

**Project:** TheCook v1.1 -- Visual Polish & Content Ready
**Researched:** 2026-03-19
**Scope:** NEW libraries/patterns only. Existing stack (Expo 54, RN 0.81, expo-sqlite, expo-router, Zod v4, Supabase, Reanimated 4.1) is validated and not re-researched.

---

## Executive Summary

The v1.1 milestone needs surprisingly few new dependencies. Most capabilities (image loading, haptics, animations) are already installed but underutilized. The one significant addition is `@gorhom/bottom-sheet` to replace hand-rolled Modal-based sheets with proper gesture-driven bottom sheets. Everything else is about unlocking what is already in `package.json`.

---

## Recommended Stack Additions

### New Dependencies (1 library)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@gorhom/bottom-sheet` | ^5.2.8 | Gesture-driven bottom sheets for Sef'im, ingredients, future sheets | Current sheets use `<Modal animationType="slide">` with no swipe-to-dismiss, no snap points, no backdrop fade. Gorhom provides all of this with Reanimated-powered 60fps animations. v5.2.8 officially supports Reanimated v4 (`peerDependencies: "react-native-reanimated": ">=3.16.0 \|\| >=4.0.0-"`). Already depends on `react-native-gesture-handler` which is installed. |

**Confidence:** HIGH -- verified v5.2.8 peer dependencies via npm registry on 2026-03-19.

### Already Installed, Currently Underutilized

| Library | Installed Version | Current Usage | v1.1 Expansion |
|---------|-------------------|---------------|----------------|
| `expo-image` | 3.0.11 | Not used anywhere (step-content.tsx uses RN `Image`) | Replace all `<Image>` and `<LinearGradient>` placeholders with `<Image>` from expo-image. Use `placeholder` prop with category-gradient colors, `transition` for cross-dissolve, `cachePolicy: 'disk'`, `contentFit: 'cover'`, and `recyclingKey` for FlashList recycling. |
| `expo-haptics` | 15.0.8 | Used only in sefim-sheet.tsx chip tap | Add to bookmark toggle, star rating tap, cooking step swipe, timer completion, "Start Cooking" press. Use `ImpactFeedbackStyle.Light` for selections, `.Medium` for actions, `NotificationFeedbackType.Success` for completions. |
| `react-native-reanimated` | 4.1.6 | Used in skeleton-card, circular-timer, sefim-pulse, category-filter | Add `entering`/`exiting` layout animations (`FadeIn`, `FadeInDown`, `SlideInRight`), spring-based bookmark heart animation, sheet backdrop opacity animation. All built-in to Reanimated -- no additional install. |
| `react-native-gesture-handler` | ~2.28.0 | Installed as dependency, minimal direct use | Needed by `@gorhom/bottom-sheet`. No changes required. |
| `@shopify/flash-list` | 2.0.2 | Not observed in current screens | Use for "See All" vertical recipe list (potentially hundreds of items). FlashList with `recyclingKey` on expo-image prevents image flicker during scroll recycling. |

---

## Feature-to-Library Mapping

### 1. Recipe Image System

**What:** Replace LinearGradient color fallbacks with actual food photos on cards, recipe detail hero, cooking step headers.

**Stack decision:** Use `expo-image` (already installed v3.0.11) -- NOT React Native's built-in `<Image>`.

**Why expo-image over RN Image:**
- Built-in disk + memory caching (`cachePolicy: 'disk'` is default)
- `placeholder` prop accepts a color string for graceful gradient-to-photo transition
- `transition={{ duration: 200 }}` for cross-dissolve when image loads
- `recyclingKey={recipe.id}` prevents stale images in FlashList/FlatList recycled views
- `contentFit="cover"` (CSS-like, more intuitive than `resizeMode`)
- BlurHash support built-in for future cloud images (generate at build time)
- Prefetch API: `Image.prefetch(urls)` for preloading adjacent feed section images

**Image storage approach (v1.1 -- local bundled):**
- Store images in `assets/recipes/covers/` and `assets/recipes/steps/`
- Reference via `require()` in the build pipeline -- expo-image supports `require()` sources
- YAML `coverImage` field changes from `null` to a filename like `menemen.jpg`
- Build script resolves filenames to require paths in the bundled JSON
- This keeps the cloud-ready architecture: later swap `require()` for Supabase Storage URLs

**What NOT to add:**
- Do NOT add `react-native-fast-image` -- deprecated, unmaintained, expo-image supersedes it
- Do NOT add `expo-asset` separately -- expo-image handles asset loading internally
- Do NOT add `react-native-blurhash` -- expo-image has built-in blurhash support

**Confidence:** HIGH -- expo-image docs verified, already in package.json.

### 2. Bottom Sheet Transitions (Fade Backdrop, Swipe Dismiss)

**What:** Replace current `<Modal animationType="slide">` sheets (Sef'im, Ingredients) with gesture-driven bottom sheets that have backdrop fade, swipe-to-dismiss, and snap points.

**Stack decision:** Add `@gorhom/bottom-sheet@^5.2.8`.

**Why not keep current Modal approach:**
- Current `<Modal>` has no swipe-to-dismiss (only tap-backdrop or X button)
- `animationType="slide"` is a binary open/close with no partial states
- No backdrop opacity animation tied to gesture position
- No snap points for "peek" vs "full" sheet states
- Users expect iOS/Android-native sheet behavior (swipe down to dismiss)

**Why not build from scratch with Reanimated:**
- Reanimated docs themselves recommend @gorhom/bottom-sheet over hand-rolling
- Keyboard handling, ScrollView integration, and snap point math are non-trivial
- Gorhom provides `BottomSheetScrollView`, `BottomSheetTextInput` -- critical for Sef'im's chat input

**Integration pattern:**
```typescript
// Wrap app root in BottomSheetModalProvider (in _layout.tsx)
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

// Replace Modal-based sheets:
// Before: <Modal visible={visible} animationType="slide">
// After:  <BottomSheetModal ref={bottomSheetRef} snapPoints={['50%', '80%']}>
```

**Migration risk:** LOW. The two existing sheets (SefimSheet, IngredientsSheet) have clean prop interfaces. Swap inner Modal wrapper, keep all content components unchanged.

**Confidence:** HIGH -- peer dependencies verified via npm on 2026-03-19, Reanimated v4 support confirmed in peerDependencies field.

### 3. UI Animations (Entering/Exiting, Micro-interactions)

**What:** Card appear animations, feed section stagger, bookmark heart scale, "See All" list item entrance, swipe hint indicators.

**Stack decision:** Use `react-native-reanimated` (already installed v4.1.6) built-in layout animations. NO additional libraries.

**Specific animation patterns and their Reanimated APIs:**

| Animation | Reanimated API | Usage |
|-----------|---------------|-------|
| Card appear on feed load | `entering={FadeInDown.delay(index * 50)}` | Staggered card entrance per feed section |
| Bookmark heart pulse | `useAnimatedStyle` + `withSpring({ scale })` | Scale 1 -> 1.3 -> 1 on toggle |
| Recipe card press feedback | `useAnimatedStyle` + `withTiming({ scale: 0.97 })` | Subtle press-in shrink |
| "See All" list item entrance | `entering={FadeInRight.delay(index * 30)}` | Staggered list appearance |
| Sheet backdrop fade | Handled by `@gorhom/bottom-sheet` automatically | No manual code needed |
| Swipe hint arrow bounce | `useAnimatedStyle` + `withRepeat(withTiming)` | Horizontal arrow oscillation |
| Tab switch cross-fade | `entering={FadeIn.duration(150)}` | Cookbook Saved/Cooked tab content swap |
| Star rating scale | `useAnimatedStyle` + `withSpring` | Stars scale up on tap |

**What NOT to add:**
- Do NOT add `react-native-animatable` -- Reanimated v4 covers all needs natively
- Do NOT add `lottie-react-native` -- overkill for these micro-interactions, adds 2MB+ to bundle
- Do NOT add `moti` -- wrapper around Reanimated that adds abstraction without value here

**Confidence:** HIGH -- Reanimated v4 layout animations API verified via official docs.

### 4. Haptic Feedback Patterns

**What:** Tactile feedback on bookmark, star rating, timer events, cooking step transitions.

**Stack decision:** Use `expo-haptics` (already installed v15.0.8). NO additional libraries.

**Recommended haptic mapping:**

| User Action | Haptic Type | Method |
|-------------|-------------|--------|
| Bookmark toggle | Light impact | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` |
| Star rating tap | Light impact | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` |
| "Start Cooking" press | Medium impact | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` |
| Timer completion | Success notification | `Haptics.notificationAsync(NotificationFeedbackType.Success)` |
| Cooking step swipe | Selection change | `Haptics.selectionAsync()` |
| Bottom sheet snap | Light impact | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` |
| Long-press action | Heavy impact | `Haptics.impactAsync(ImpactFeedbackStyle.Heavy)` |

**What NOT to add:**
- Do NOT add `react-native-haptic-feedback` -- expo-haptics is the Expo-native solution, works identically
- Do NOT add `react-native-custom-haptics` -- custom patterns are unnecessary; system-standard patterns are what users recognize

**Confidence:** HIGH -- expo-haptics already used in sefim-sheet.tsx, API verified.

### 5. Star Rating Component (Cookbook Cooked Tab)

**What:** Editable star rating in Cookbook cooked history, reusing the pattern from completion-screen.tsx.

**Stack decision:** Build in-house. NO library needed.

**Rationale:**
- `completion-screen.tsx` already has a working `StarRating` component (lines 21-36)
- It uses `MaterialCommunityIcons` star/star-outline with Pressable handlers
- For v1.1: extract to `components/ui/star-rating.tsx`, add Reanimated spring scale on tap + haptic feedback
- Total effort: ~30 lines of code. No library justified.

**What NOT to add:**
- Do NOT add `react-native-ratings` -- 250KB for a component we already have
- Do NOT add `react-native-star-rating-widget` -- same reason

**Confidence:** HIGH -- existing implementation verified in codebase.

### 6. Tab Navigation Within Screens (Cookbook Saved/Cooked Tabs)

**What:** Saved vs Cooked tab switcher inside the Cookbook screen, not a navigation-level tab bar.

**Stack decision:** Build in-house with Pressable + Reanimated sliding indicator. NO library needed.

**Rationale:**
- This is a segmented control (2 tabs: "Kaydedilenler" / "Gecmis") inside a single screen
- Does NOT warrant `react-native-tab-view` (designed for swipeable multi-screen navigation)
- Implementation: a `<View>` row with two `<Pressable>` labels and an `Animated.View` underline that slides with `withTiming` on state change
- Content area switches between saved recipes grid and cooked history list via conditional render with `FadeIn` entering animation
- ~50 lines of UI code

**What NOT to add:**
- Do NOT add `react-native-tab-view` -- overkill for a 2-tab in-screen switcher
- Do NOT add `react-native-pager-view` for this -- it is installed but meant for cooking mode's step navigation, not a simple tab

**Confidence:** HIGH -- standard React Native pattern, no external dependency needed.

### 7. "See All" Vertical Recipe List

**What:** Tapping "See All" on a feed section navigates to a full vertical list of that section's recipes.

**Stack decision:** Use `@shopify/flash-list` (already installed v2.0.2) for the list, with expo-image + `recyclingKey` for card images.

**Why FlashList over FlatList:**
- Feed sections could have 30+ recipes (the full recipe catalog)
- FlashList's recycling is faster for image-heavy lists
- `recyclingKey` on expo-image coordinates with FlashList's view recycling to prevent image flash

**Route pattern:** `app/feed/[section].tsx` using expo-router dynamic segments.

**Confidence:** HIGH -- FlashList already installed, standard pattern.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Image loading | expo-image (installed) | react-native-fast-image | Deprecated/unmaintained since 2023; expo-image is the official Expo solution |
| Bottom sheets | @gorhom/bottom-sheet | Hand-rolled with Reanimated | Reanimated docs themselves recommend gorhom; keyboard + scroll handling is complex |
| Bottom sheets | @gorhom/bottom-sheet | expo-router modal presentation | `presentation: 'formSheet'` is iOS-only, not a bottom sheet on Android |
| Bottom sheets | @gorhom/bottom-sheet | Keep current `<Modal>` approach | No swipe-to-dismiss, no snap points, no gesture-tied backdrop fade |
| Animations | Reanimated entering/exiting | moti | Unnecessary wrapper; Reanimated API is direct and we already use it |
| Animations | Reanimated entering/exiting | react-native-animatable | Legacy library, not Reanimated-based, would add a second animation system |
| Animations | Reanimated entering/exiting | lottie-react-native | 2MB+ bundle cost for micro-interactions that Reanimated handles in 5 lines |
| Haptics | expo-haptics (installed) | react-native-haptic-feedback | Non-Expo library requiring manual native linking; expo-haptics is Expo-native |
| Star rating | In-house component | react-native-ratings | 250KB for 30 lines of code we already have |
| Tab switcher | In-house Pressable row | react-native-tab-view | Designed for swipeable multi-screen views; overkill for 2-state toggle |
| Tab switcher | In-house Pressable row | react-native-segmented-control | iOS-only native look; we want custom styling matching our design system |

---

## Installation

```bash
# Single new dependency
npx expo install @gorhom/bottom-sheet

# Verify peer dependencies are met (they should be, all are installed):
# - react-native-gesture-handler >=2.16.1  (installed: ~2.28.0)
# - react-native-reanimated >=3.16.0 || >=4.0.0-  (installed: 4.1.6)
```

**No other installs needed.** All other capabilities come from libraries already in `package.json`.

---

## Integration Points

### App Root Setup (`app/_layout.tsx`)

```typescript
// Add BottomSheetModalProvider wrapper
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Existing GestureHandlerRootView should already be present
// Add BottomSheetModalProvider inside it:
<GestureHandlerRootView style={{ flex: 1 }}>
  <BottomSheetModalProvider>
    {/* existing providers and Stack */}
  </BottomSheetModalProvider>
</GestureHandlerRootView>
```

### expo-image Migration (Recipe Cards)

```typescript
// Before (recipe-card-grid.tsx):
import { LinearGradient } from 'expo-linear-gradient';
<LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />

// After:
import { Image } from 'expo-image';
{recipe.coverImage ? (
  <Image
    source={recipe.coverImage}
    style={StyleSheet.absoluteFill}
    contentFit="cover"
    placeholder={{ thumbhash: recipe.thumbhash }}
    transition={200}
    recyclingKey={recipe.id}
  />
) : (
  <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />
)}
```

### Build Pipeline Image Wiring

The YAML `coverImage` field currently stores `null` for all 30 recipes. For v1.1:

1. Add images to `assets/recipes/covers/{recipe-id}.jpg`
2. Update YAML: `coverImage: menemen.jpg`
3. Build script generates a require map: `{ "menemen.jpg": require("../../assets/recipes/covers/menemen.jpg") }`
4. At runtime, resolve coverImage string to the require reference
5. expo-image handles the rest (caching, sizing, placeholder)

This approach is cloud-ready: when Supabase Storage URLs arrive later, simply swap the require map for URL strings. expo-image handles both source types identically.

---

## Version Compatibility Matrix

| Library | Installed | Required By | Compatible |
|---------|-----------|-------------|------------|
| expo-image | 3.0.11 | Expo SDK 54 | YES |
| expo-haptics | 15.0.8 | Expo SDK 54 | YES |
| react-native-reanimated | 4.1.6 | Expo SDK 54 | YES |
| react-native-gesture-handler | ~2.28.0 | @gorhom/bottom-sheet >=2.16.1 | YES |
| @gorhom/bottom-sheet | 5.2.8 (to install) | reanimated >=4.0.0- | YES |
| @shopify/flash-list | 2.0.2 | Expo SDK 54 | YES |

---

## What This Stack Does NOT Cover (Intentionally)

| Excluded | Reason |
|----------|--------|
| Cloud image hosting (Supabase Storage, CDN) | v1.1 uses bundled local images; cloud is a future milestone |
| Image compression/optimization tooling | Handle in content pipeline outside the app (e.g., `sharp` CLI) |
| Video playback | Out of scope per PROJECT.md |
| Advanced gesture library (react-native-gesture-handler v3) | v2.28 is sufficient and Expo SDK 54 compatible |
| State management library (Zustand, Jotai) | Existing React context + hooks pattern is sufficient |
| Navigation library changes | expo-router v6 handles all routing needs including new "See All" route |

---

## Risk: @gorhom/bottom-sheet and Reanimated v4

**Status:** Open GitHub issues report compatibility problems between @gorhom/bottom-sheet and Reanimated v4 (issues #2546, #2547, #2600). However, v5.2.8's `peerDependencies` explicitly lists `>=4.0.0-` as supported.

**Mitigation plan:**
1. Install v5.2.8 and test with a minimal BottomSheet before migrating existing sheets
2. If broken: fall back to upgrading the current `<Modal>` approach with Reanimated-powered custom backdrop fade + swipe gesture (the Reanimated docs show a ~50-line example)
3. The current Modal sheets work -- this is a polish improvement, not a blocker

**Confidence on this risk:** MEDIUM -- peer deps say yes, some users report issues. Test early.

---

## Sources

- [expo-image documentation](https://docs.expo.dev/versions/latest/sdk/image/) -- props, caching, placeholder, transition API
- [expo-haptics documentation](https://docs.expo.dev/versions/latest/sdk/haptics/) -- impact, notification, selection feedback types
- [Reanimated entering/exiting animations](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/entering-exiting-animations/) -- FadeIn, SlideIn, duration, delay, springify
- [Reanimated v4 guide](https://www.freecodecamp.org/news/how-to-create-fluid-animations-with-react-native-reanimated-v4/) -- CSS animations, backward compatibility
- [@gorhom/bottom-sheet npm](https://www.npmjs.com/package/@gorhom/bottom-sheet) -- v5.2.8 peer dependencies verified
- [@gorhom/bottom-sheet docs](https://gorhom.dev/react-native-bottom-sheet/) -- BottomSheetModal, snap points, backdrop
- [Expo assets documentation](https://docs.expo.dev/develop/user-interface/assets/) -- require() for bundled images
- [React Navigation Tab View](https://reactnavigation.org/docs/tab-view/) -- considered and rejected for in-screen tabs
- [@gorhom/bottom-sheet Reanimated v4 issues](https://github.com/gorhom/react-native-bottom-sheet/issues/2546) -- compatibility investigation
- [Reanimated bottom sheet example](https://docs.swmansion.com/react-native-reanimated/examples/bottomsheet/) -- fallback approach if gorhom fails
