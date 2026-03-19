# Feature Landscape

**Domain:** Recipe image system, feed navigation, cookbook tabs with ratings, UI micro-interactions for Turkish cooking companion app (v1.1)
**Researched:** 2026-03-19
**Builds on:** Existing v1.0 with 30 recipes, color gradient fallbacks, horizontal feed, cookbook (saved-only), cooking mode with star rating at completion

---

## Table Stakes

Features users expect once they see the app has recipe content. Missing any of these makes the product feel unfinished or prototype-grade.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Recipe cover images** | Every cooking app shows food photography. Gradient placeholders scream "unfinished." Users decide whether to cook based on how the dish looks. | Medium | YAML pipeline (`coverImage` field exists, currently all `null`), card components, expo-image | DB column `cover_image TEXT` already exists. YAML field `coverImage` already in schema. Need: actual images, asset bundling, Image component swap in cards. |
| **"See All" on feed sections** | Standard pattern in every app with horizontal scroll sections (App Store, Netflix, Uber Eats, YouTube). Users who scroll to the end of a horizontal list expect a way to see all items. Without it, content feels arbitrarily limited. | Low | Feed section component, new route/screen, existing `RecipeCardRow` component | FeedSection currently renders a title + FlatList. Add a "Tumunu Gor" pressable in the header row, navigate to a vertical list screen filtered by section key. |
| **Cookbook tabs: Saved + Cooked** | Users who finish cooking expect to find that recipe in their history. The cookbook currently only shows saved/bookmarked recipes. "Where did I cook that thing last week?" has no answer. | Medium | `cooking_history` table (exists, has `recipe_id`, `cooked_at`, `rating`), `useCookbookScreen` hook, tab/segment UI | cooking_history table already stores completions with optional rating. Need: query for cooked recipes, segment control UI, tab switching logic. |
| **Star ratings visible in cookbook** | Users rated recipes at completion but can never see those ratings again. The rating feels pointless if it disappears. Ratings should be visible on cooked recipe cards. | Low | `cooking_history.rating` column (exists), card component variant | Join cooking_history to recipe data, display stars on cooked-tab cards. Consider showing last rating and cook count. |
| **Dark mode card contrast** | Current dark theme uses `card: '#161614'` on `background: '#0C0C0A'` -- only ~3% luminance difference. Cards are invisible against the background. Every dark mode guide says use lighter surface shades for elevation. | Low | `theme.ts` constants, all card components | Increase dark card color to ~#1C1C1A or #1E1E1B. Possibly add subtle border (`rgba(255,255,255,0.06)`) for definition. WCAG minimum contrast for adjacent UI elements is 3:1. |
| **Horizontal scroll peek hint** | When a horizontal list shows no partial card at the right edge, users don't know there is more content. The last visible card should be cut off at ~60-70% width to signal scrollability. | Low | `FeedSection` card wrapper width, `contentContainerStyle` padding | Currently `cardWrapper` is 180px with `paddingHorizontal: 16`. On most screens, 2 cards fill the viewport with no peek. Adjust width or padding so a third card peeks ~30%. |

## Differentiators

Features that set the product apart from generic recipe apps. Not expected, but add perceived quality and craft.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Editable star rating in cookbook** | Most apps let you rate once and forget. Letting users tap to re-rate directly from the Cooked tab ("I made menemen again and it was better this time") makes the cookbook feel alive. | Medium | `cooking_history` table, new `updateRating` DB function, star component on card | Need an UPDATE query on cooking_history. UI: tappable stars on the cooked-tab card. Decide whether to show the most recent rating or an average across all cooks. Recommendation: show most recent rating, display cook count as secondary info. |
| **Bookmark heart animation with haptics** | A springy scale animation + haptic pulse when toggling the heart icon creates a satisfying moment. Instagram, Twitter, and every major app does this. Makes saving recipes feel intentional. | Low | `expo-haptics` (new dependency), Reanimated (already in stack), bookmark toggle handler | Reanimated v4 is already installed. Add `expo-haptics` for `impactAsync(ImpactFeedbackStyle.Light)`. Animate heart with `withSpring` scale 1 -> 1.3 -> 1. Total: ~30 lines of animation code. |
| **Section heading with count badge** | Showing "Sana Ozel (8)" next to section titles tells users how much content exists without scrolling. Builds trust that personalization is working. | Low | Feed section data length, style update | `data.length` is already available in FeedSection props. Add a styled count next to the title. |
| **Cook count on cooked recipes** | "3 kez pisirdin" on a recipe card shows the user their relationship with that recipe. Simple but emotionally resonant. | Low | `cooking_history` GROUP BY query, card UI | `SELECT recipe_id, COUNT(*) as cook_count, MAX(rating) as last_rating FROM cooking_history GROUP BY recipe_id`. Display on cooked-tab cards. |
| **Bottom sheet fade backdrop transition** | Current sheets (ingredients, Sef'im) slide up but the backdrop appears abruptly. A smooth fade-in/out of the semi-transparent overlay makes sheets feel polished. | Low | Sheet components (ingredients-sheet, sefim-sheet), Reanimated animated value for opacity | Interpolate sheet translateY position to backdrop opacity 0->0.5. Already using Reanimated for sheet animation, so this is an interpolation addition. |
| **Filter chip category images** | Category chips in the search strip currently show text only. Adding tiny food icons per category makes the strip more scannable. | Low | CategoryStrip component, icon mapping | Use MaterialCommunityIcons (already in the project). Map: `ana yemek` -> silverware, `kahvalti` -> egg-fried, `corba` -> bowl-mix, `tatli` -> cake-variant, `salata` -> leaf, `aperatif` -> food-variant. |
| **Image placeholder with blurhash** | Instead of gradient fallback, show a blurred preview of the actual image while it loads. expo-image supports blurhash natively. Makes image loading feel seamless. | Medium | expo-image `placeholder` prop, blurhash generation step in build pipeline, YAML field for blurhash string | Need to generate blurhash strings for each recipe image during build. Add `blurhash` field to YAML schema. expo-image renders it automatically during load. |
| **Card press feedback (scale down)** | When users press a recipe card, a subtle scale-down (0.97x) with spring release makes the card feel tappable and physical. | Low | Pressable + Reanimated `useAnimatedStyle` on card components | Wrap card content in Animated.View, use `onPressIn`/`onPressOut` with `withSpring(0.97)` and `withSpring(1)`. ~15 lines per card component, or extract as a shared `AnimatedPressable` wrapper. |

## Anti-Features

Features to explicitly NOT build in v1.1. Tempting but wrong for this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Image upload by users** | No user-generated content in scope. Curated content only. Adding upload means storage, moderation, and CDN complexity. | Bundle images locally with the app binary. YAML `coverImage` points to a local asset path. Cloud-ready means the field can hold a URL later -- no code change needed. |
| **Swipeable card stacks (Tinder-style)** | Horizontal scroll sections with "See All" are the established pattern for recipe discovery. Swipe-to-dismiss adds novelty but conflicts with the feed's browse-and-return mental model. | Keep horizontal FlatList with peek hint. "See All" navigates to vertical grid. |
| **Social ratings / community scores** | No social features in v1. Ratings are personal (your experience cooking this recipe). Average community ratings require user accounts, moderation, and gaming prevention. | Show only the user's own rating in the cookbook. |
| **Recipe image carousel (multiple images per recipe)** | Each recipe currently has one `coverImage` and one `stepImage` per step. A carousel adds swiping, dots, pagination -- complexity for zero user demand at 30 recipes. | One cover image per recipe. Step images remain as-is (planned for future content expansion). |
| **Complex rating system (half stars, thumbs, tags)** | The current 1-5 star system is already built in the completion screen. Adding half-stars or thumbs-up/down creates decision paralysis for a quick post-cook moment. | Keep 1-5 whole stars. Consistent between completion screen and cookbook re-rating. |
| **Animated page transitions between screens** | Expo Router's default transitions are adequate. Custom shared-element transitions (card -> detail) are fragile with React Navigation and rarely worth the maintenance cost. | Use default push/pop transitions. Focus animation budget on micro-interactions within screens. |
| **Pull-to-refresh on cookbook** | Cookbook data is local-only (SQLite). There is nothing to "refresh" from a server. Pull-to-refresh would be misleading. | Reload data on screen focus (already done via `useFocusEffect`). |

## Feature Dependencies

```
Recipe Images --> Card Components (both grid + row variants must handle images)
Recipe Images --> Build Pipeline (build-recipes.ts needs to validate image paths)
Recipe Images --> expo-image (new component dependency, replaces LinearGradient in image area)
Recipe Images --> Blurhash Generation (optional differentiator, but should be wired if doing images)

"See All" --> New Screen/Route (vertical list filtered by section)
"See All" --> FeedSection header modification (add pressable link)
"See All" --> RecipeCardRow component (already exists, used for vertical lists)

Cookbook Tabs --> cooking_history queries (getCookedRecipes, getRatingsForRecipes)
Cookbook Tabs --> Segment control UI component
Cookbook Tabs --> Editable Rating (builds on tab, needs UPDATE query)
Cookbook Tabs --> Cook Count (builds on cooking_history aggregation)

Bookmark Animation --> expo-haptics installation
Bookmark Animation --> Reanimated spring (already available)

Card Press Feedback --> AnimatedPressable wrapper (shared component, all cards benefit)
Card Press Feedback --> Reanimated (already available)

Dark Mode Contrast --> theme.ts color updates (affects all surfaces)

Bottom Sheet Fade --> Reanimated interpolation (existing sheet components)
```

## Build Order Implications

Based on dependencies:

1. **Recipe images first** -- Every other visual feature looks better with real images. Cards, "See All" screen, cookbook tabs -- all benefit from images being in place. Start with the YAML + build pipeline + asset bundling, then swap card components.

2. **"See All" navigation second** -- Simple routing addition. Creates the vertical list screen that reuses RecipeCardRow. Quick win that makes the feed feel complete.

3. **Cookbook tabs third** -- Requires new DB queries and segment control UI. Building this after images means the cooked-tab cards look good from day one.

4. **UI polish last** -- Micro-interactions (haptics, animations, dark mode contrast, peek hints) are independent of each other and can be done in any order. Group them into one polish phase to avoid context-switching.

## MVP Recommendation

Prioritize (must ship in v1.1):
1. **Recipe cover images** -- Single biggest visual upgrade. Transforms the app from "prototype" to "product."
2. **"See All" feed navigation** -- Completes the feed pattern. Users currently hit a dead end after scrolling.
3. **Cookbook Saved/Cooked tabs** -- Gives cooking_history a visible purpose. Users rated recipes but can't see them.
4. **Dark mode card contrast** -- Current dark mode is borderline unusable. 5-minute fix with outsized impact.

Defer to v1.2 if time-constrained:
- **Blurhash placeholders** -- Nice polish but requires build pipeline changes. Gradient fallback works fine if images load fast from local storage.
- **Filter chip category images** -- Incremental visual improvement, not a UX gap.
- **Editable star rating** -- The rating from completion is visible in the cooked tab. Re-rating is a convenience, not a necessity.

## Sources

- [Expo Image Documentation](https://docs.expo.dev/versions/latest/sdk/image/) -- expo-image features, caching, blurhash support, transition props (HIGH confidence)
- [Expo Assets Documentation](https://docs.expo.dev/develop/user-interface/assets/) -- Local vs remote asset bundling strategy (HIGH confidence)
- [Expo Haptics Documentation](https://docs.expo.dev/versions/latest/sdk/haptics/) -- Haptic feedback API for bookmark animation (HIGH confidence)
- [Horizontal Scrolling Lists in Mobile - Best Practices](https://blog.iamsuleiman.com/horizontal-scrolling-lists-mobile-best-practices/) -- "See All" pattern, peek hints, visual scroll cues (MEDIUM confidence)
- [Best Practices for Horizontal Lists in Mobile - UX Collective](https://uxdesign.cc/best-practices-for-horizontal-lists-in-mobile-21480b9b73e5) -- Nested scroll patterns, "See More" navigation (MEDIUM confidence)
- [Case Study: Perfect Recipes App - Tubik Studio](https://blog.tubikstudio.com/case-study-recipes-app-ux-design/) -- Cookbook UX patterns, saved/cooked organization (MEDIUM confidence)
- [Dark Mode UI Best Practices 2025 - Netguru](https://www.netguru.com/blog/tips-dark-mode-ui) -- Card elevation, contrast ratios, shadow alternatives in dark mode (MEDIUM confidence)
- [How to Design Dark Mode for Mobile Apps - Appinventiv](https://appinventiv.com/blog/guide-on-designing-dark-mode-for-mobile-app/) -- Surface color hierarchy, background shading (MEDIUM confidence)
- [React Native Reanimated Examples](https://docs.swmansion.com/react-native-reanimated/examples/) -- Animation patterns for scroll, bottom sheet, card interactions (HIGH confidence)
- [gorhom/react-native-bottom-sheet](https://gorhom.dev/react-native-bottom-sheet/) -- Bottom sheet fade backdrop pattern reference (MEDIUM confidence)
- [React Navigation Tab View](https://reactnavigation.org/docs/tab-view/) -- Swipeable segment control tab pattern (HIGH confidence)
- Existing codebase analysis: `cooking_history` table schema, `FeedSection` component, `RecipeCardGrid`/`RecipeCardRow` components, `CompletionScreen` star rating, `build-recipes.ts` pipeline, `theme.ts` color constants (HIGH confidence -- direct code inspection)
