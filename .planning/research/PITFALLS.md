# Domain Pitfalls: The Cook v1.1 — Visual Polish & Content Ready

**Domain:** Adding recipe images, UI polish animations, cookbook tabs, and feed navigation to existing React Native cooking companion
**Researched:** 2026-03-19
**Milestone:** v1.1 Visual Polish & Content Ready
**Existing stack:** Expo 54, React Native 0.81, expo-sqlite, expo-router, Reanimated v4, expo-image (installed, unused)

---

## Critical Pitfalls

Mistakes that cause rewrites, performance regressions, or broken existing features.

---

### Pitfall 1: Recipe Image Bundle Bloat Kills App Install Size

**What goes wrong:** Adding cover images and step images for 30 recipes (each with 3-7 steps) means 30 cover images + ~150 step images = ~180 images. If bundled via `require()` at average 200KB each (compressed JPEG), that is 36MB added to the app binary. Combined with the existing ~185KB recipes.json and app binary, this pushes the IPA/APK from manageable to over 100MB. Users on metered Turkish mobile data (the primary persona's reality) will abandon the download. Apple flags apps over 200MB for cellular download warnings.

**Why it happens:** The YAML content pipeline currently has `coverImage: null` and `stepImage: null` on every recipe. The tempting path is to change these to `require('./images/menemen-cover.jpg')` and bundle everything statically. This works perfectly in development but the bundle size penalty is invisible until a production build.

**Consequences:**
- App store rejection risk (Apple cellular download warning at 200MB)
- 30-50% install abandonment on metered connections
- Slower app startup as the JS bundle grows
- Cannot add more recipes without re-releasing the entire binary

**Prevention:**
1. Use optimized images: WebP format, max 800px width for covers, 600px for step images. Target 30-80KB per image.
2. Bundle ONLY cover images (30 images, ~1.5MB total). Step images can be deferred to cloud delivery in a future phase.
3. Use expo-image (already in package.json but unused) instead of React Native `Image` -- it has built-in caching, blurhash placeholders, and progressive loading.
4. Run `npx expo-optimize` or use `sharp` in the build pipeline to auto-compress images before bundling.
5. Track bundle size in CI -- add a check that fails if the binary exceeds a threshold.

**Detection:** Build the production binary early (Phase 1 of milestone) and measure. If IPA > 50MB, images need further optimization or cloud migration.

**Confidence:** HIGH -- verified via Expo documentation on asset bundling and React Native image docs.

---

### Pitfall 2: 119 Hardcoded Hex Colors Break Dark Mode Polish

**What goes wrong:** The codebase has 119 hardcoded hex color values across 17 component files (measured). Many components use inline hex values like `'#F0EDE8'`, `'#1A1A18'`, `'rgba(26,26,24,0.5)'` directly in StyleSheet.create or inline styles, bypassing the `colors` object from `useAppTheme()`. When dark mode contrast fixes are applied by updating `Colors.dark` in `theme.ts`, these hardcoded values remain unchanged, creating a patchwork of correct and incorrect contrast.

**Why it happens:** During v1.0's rapid 11-day development across 12 phases, hardcoded values crept in where `colors.textSub` or `colors.card` should have been used. The pattern is especially visible in:
- `recipe-card-grid.tsx`: 17 hardcoded hex values (skill text, cook time text, gradients)
- `recipe-card-row.tsx`: 16 hardcoded hex values (same duplication)
- `sefim-sheet.tsx`: 12 hardcoded hex values (bubble colors, handle bar)
- `step-content.tsx`: 20 hardcoded hex values (pastel palette, callout backgrounds)
- `completion-screen.tsx`: 5 hardcoded hex values (star colors, title)

**Consequences:**
- Dark mode contrast fixes in `theme.ts` only partially propagate
- Some text becomes invisible on dark backgrounds (white text on light surface, or dark text on dark background)
- WCAG contrast ratio violations -- Turkish Gen Z users may use dark mode by default
- Regression whack-a-mole: fixing one component reveals another

**Prevention:**
1. Before any dark mode contrast work, sweep ALL 17 component files and replace hardcoded hex values with `colors.*` tokens from `useAppTheme()`. This is a prerequisite task, not an optional polish item.
2. Add missing semantic color tokens to `Colors` in `theme.ts` (e.g., `chipBackground`, `calloutGreen`, `calloutAmber`, `starActive`, `starInactive`).
3. Use a lint rule or grep check: `grep -rn '#[0-9A-Fa-f]\{6\}' components/ app/` should return zero matches outside of `theme.ts` and gradient palettes.
4. Category gradient colors are intentionally hardcoded (brand-level decision) -- exclude these from the sweep but ensure text overlaid on gradients always uses white with sufficient contrast.

**Detection:** After the color token sweep, toggle dark mode on every screen. Any remaining hardcoded value will be visually obvious as a wrong-color element.

**Confidence:** HIGH -- verified by direct codebase analysis (119 occurrences counted).

---

### Pitfall 3: Cookbook Tabs State Loss on Tab Switch

**What goes wrong:** Adding Saved/Cooked tabs inside the Cookbook screen using local state (e.g., `useState<'saved' | 'cooked'>('saved')`) causes the selected tab to reset to 'saved' every time the user navigates away from the Cookbook bottom tab and returns. This is because expo-router's tab navigator unmounts or re-renders the screen component on focus changes, and `useFocusEffect` (already used in `useCookbookScreen`) triggers a full data reload.

**Why it happens:** The current `useCookbookScreen` hook calls `loadData()` inside `useFocusEffect`, which sets `loading: true` and re-renders the entire screen. If the inner tab state is local to the component, it resets. Additionally, if the Cooked tab has its own data fetch (cooking history with ratings), a naive implementation will fetch both Saved and Cooked data on every focus, even when only one tab is visible.

**Consequences:**
- User switches to Cooked tab, navigates to a recipe, returns -- lands on Saved tab instead of Cooked
- Double data fetches slow down the Cookbook screen
- Star rating edits on the Cooked tab get "lost" visually because the tab resets

**Prevention:**
1. Persist the active inner tab in the hook state (not just the component) or use a simple ref that survives re-renders.
2. Use lazy loading for tab content: only fetch Cooked data when the user actually taps the Cooked tab for the first time.
3. Avoid full `setLoading(true)` on tab switch -- use stale-while-revalidate pattern (show existing data, fetch in background, swap when ready).
4. Consider `react-native-pager-view` (already installed in package.json) for swipeable tabs with preserved state, but measure whether it adds complexity.

**Detection:** Test cycle: Cookbook -> Cooked tab -> tap a recipe -> back button -> verify Cooked tab is still selected. If it resets, the state management is broken.

**Confidence:** HIGH -- verified by examining `useCookbookScreen` hook which uses `useFocusEffect(useCallback(() => { loadData(); }, [loadData]))`.

---

### Pitfall 4: Feed "See All" Route Creates Navigation Stack Confusion

**What goes wrong:** Adding a "See All" button to each feed section that navigates to a vertical list of recipes creates ambiguity about where the user "is" in the navigation stack. If the See All screen is pushed onto the tab's stack, pressing the back button or switching tabs and returning has inconsistent behavior. If the user taps a recipe from the See All list, the back stack becomes: Feed -> See All (trending) -> Recipe Detail. The user expects "back" from Recipe Detail to go to the See All list, not the Feed.

**Why it happens:** expo-router uses file-based routing. The See All route needs to be defined as a new route (e.g., `app/feed/[section].tsx` or `app/see-all/[section].tsx`). If placed outside the `(tabs)` group, it becomes a full-screen stack push that hides the tab bar. If placed inside `(tabs)`, it conflicts with the bottom tab structure. The existing `_layout.tsx` does not define any routes inside tabs beyond the 4 tab screens.

**Consequences:**
- Tab bar disappears on See All screen (if routed outside tabs)
- Back navigation returns to wrong screen
- Deep linking to a specific section's See All page fails
- See All -> Recipe Detail -> back -> unexpected screen

**Prevention:**
1. Define the See All route as a stack screen inside the root layout (outside tabs), which intentionally hides the tab bar -- this is the standard pattern for "drill-down" screens.
2. Pass the section key and title as route params: `/feed/see-all?section=trending&title=Su%20an%20trend`.
3. The See All screen should receive its own data-fetching hook (`useSeeAllScreen`) that accepts the section key and applies the same hard filters as the feed.
4. Do NOT try to reuse `FeedSection` data from the feed hook -- the feed hook's data is already in memory but passing it via route params is fragile. Fetch fresh from the DB.
5. Add a header with a back button and the section title on the See All screen.

**Detection:** Navigate Feed -> See All -> Recipe -> Back -> Back -> verify landing on Feed tab with correct scroll position. Test all 4 sections.

**Confidence:** HIGH -- verified by examining existing route structure (`app/_layout.tsx`, `app/(tabs)/_layout.tsx`).

---

## Moderate Pitfalls

---

### Pitfall 5: Reanimated v4 Animation Performance on Low-End Android

**What goes wrong:** Adding micro-interactions (card press scale, bookmark heart animation, swipe peek hints, sheet backdrop fade) to every card in horizontal FlatLists creates dozens of simultaneous animated components on screen. On low-end Android devices (common in Turkey's 18-30 demographic), this causes frame drops below 60fps, making the app feel janky rather than polished.

**Why it happens:** Reanimated v4 on the New Architecture (enabled by default in Expo SDK 53+) has known performance regressions with many simultaneous animated components. The recommendation is no more than 100 animated components for low-end Android. A single feed screen with 4 sections of 5-8 cards each, where each card has a scale animation + bookmark animation = 40-64 animated components, which is within limits individually but combined with sheet backdrop animations and scroll-based effects can breach the threshold.

**Prevention:**
1. Only animate transform and opacity properties -- never width, height, margin, or padding. Layout-affecting animations are 3-5x more expensive.
2. Use `useAnimatedStyle` sparingly -- one per component, not multiple. Combine animations into a single style object.
3. For card press feedback, use React Native's built-in `Pressable` opacity/scale rather than Reanimated for simple press effects. Reserve Reanimated for complex animations like peek hints and sheet transitions.
4. Use `withSpring` with reduced `damping` for snappy feel, not `withTiming` with long durations -- shorter animations mean fewer frames to render.
5. Profile on a real low-end Android device (not just simulator). Use Flipper's performance panel or React Native's built-in performance monitor.
6. Batch animation triggers -- debounce scroll-driven animations to avoid per-frame worklet execution.

**Detection:** Run the app on a sub-$200 Android device with performance monitor enabled. If frames consistently drop below 55fps during scroll, animations need culling.

**Confidence:** MEDIUM -- based on Reanimated v4 GitHub issues (#8250) about New Architecture performance and official performance docs. Exact thresholds depend on device.

**Sources:**
- [Reanimated Performance Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- [Reanimated New Architecture Issue #8250](https://github.com/software-mansion/react-native-reanimated/issues/8250)

---

### Pitfall 6: Bottom Sheet Backdrop Animation Timing Mismatch

**What goes wrong:** The existing Sefim Sheet and Ingredients Sheet use React Native's `<Modal>` component with `animationType="slide"` and a manual `rgba(0,0,0,0.4)` overlay. When upgrading to smoother backdrop transitions (fade in/out synchronized with sheet open/close), the backdrop appears after the sheet animation completes, not simultaneously. This creates a jarring "flash" effect.

**Why it happens:** React Native's `Modal` component has limited animation control -- `animationType` only supports 'none', 'slide', and 'fade', and there is no way to coordinate backdrop opacity with sheet position. The current overlay is a static `rgba(0,0,0,0.4)` Pressable that appears instantly when `visible={true}`, which means the backdrop "pops" rather than fading.

**Consequences:**
- Sheet open: dark overlay appears instantly, then sheet slides up = feels disconnected
- Sheet close: sheet slides down, then backdrop disappears instantly = flash of un-darkened background
- On slow devices, the timing gap is more noticeable

**Prevention:**
1. Replace `<Modal>` with a custom animated overlay approach: use `Animated.View` for the backdrop with `withTiming` opacity animation, and `Animated.View` with `translateY` for the sheet content.
2. Alternatively, adopt `@gorhom/bottom-sheet` which handles backdrop synchronization natively. However, this adds a dependency and requires rewriting both sheets -- weigh the cost.
3. If keeping `<Modal>`, switch `animationType` to `'fade'` and add a separate slide animation for the sheet content using Reanimated. The fade will handle the backdrop naturally.
4. The simplest fix: wrap the overlay `Pressable` in an `Animated.View` and animate its opacity from 0 to 1 over 300ms when `visible` changes.

**Detection:** Record a screen capture at 60fps and step through frames. The backdrop and sheet should start animating on the same frame.

**Confidence:** MEDIUM -- based on examining the current Modal implementation in `sefim-sheet.tsx` and `ingredients-sheet.tsx`, plus known Modal animation limitations.

---

### Pitfall 7: Image Placeholder-to-Image Flash on Recipe Cards

**What goes wrong:** Currently, recipe cards show a `LinearGradient` in the image area (since `coverImage` is null for all 30 recipes). When images are added, the transition from "no image" state to "image loaded" will cause a visible flash/pop as the gradient disappears and the image appears. This is especially noticeable in horizontal FlatList scrolling where cards enter the viewport.

**Why it happens:** Standard `<Image>` loading is async -- the component renders with no source, then the source loads and triggers a re-render. Without a placeholder strategy, the card layout jumps or the image area flashes from gradient to photo. The existing gradient serves as a meaningful color-coded visual (category-based), so removing it entirely for images loses information.

**Prevention:**
1. Use `expo-image` with `placeholder` prop -- pass a blurhash string generated at build time. The blurhash displays instantly, then crossfades to the real image.
2. Generate blurhash strings in the `build-recipes.ts` script: for each image, compute a 4x3 blurhash and store it in the YAML/JSON as `coverImageBlurHash`.
3. Keep the category gradient as the fallback for recipes that genuinely have no image (future-proofing for community-submitted recipes).
4. Set `transition={{ duration: 300 }}` on `expo-image` for smooth crossfade from placeholder to loaded image.
5. Set explicit `width` and `height` on the image container (already done: `height: 140` on `imageArea`) to prevent layout shifts.

**Detection:** Slow network simulation (React Native's network throttling) should show a smooth blurhash-to-image transition, not a flash.

**Confidence:** HIGH -- `expo-image` with blurhash is the documented approach per Expo image documentation.

**Sources:**
- [expo-image Documentation](https://docs.expo.dev/versions/latest/sdk/image/)

---

### Pitfall 8: Star Rating Touch Targets Too Small in Cookbook Row Layout

**What goes wrong:** Adding inline star ratings to the Cooked tab's recipe list rows (80px tall, per `recipe-card-row.tsx`) squeezes 5 star icons into a small horizontal space. If each star is the same 36px size as in `CompletionScreen`, the touch targets overlap or fall below the 44x44pt minimum recommended by Apple's HIG and Android's 48dp guideline. Users tap the wrong star or miss entirely.

**Why it happens:** The completion screen has generous space (full-screen centered layout), but the cookbook row has only ~80px height with title + meta already competing for space. Fitting 5 tappable stars with proper spacing requires at minimum 5 * 44px = 220px width of touch area, which competes with the recipe title on a narrow phone screen.

**Consequences:**
- Users rate 3 when they meant 4 (frustrating for a "rate your cooking" feature)
- VoiceOver/TalkBack cannot distinguish individual stars
- Repeated mis-taps erode trust in the rating feature

**Prevention:**
1. Do NOT put editable star ratings inline on cookbook row cards. Instead, show the rating as read-only (small stars, no tap handler) and open an edit sheet or use the recipe detail screen for rating changes.
2. If inline editing is required, use a compact rating display: show the numeric value (e.g., "4/5") with a single star icon, tap to open a bottom sheet with full-size editable stars.
3. For the read-only display, use 14-16px star icons with `accessibilityLabel="4 out of 5 stars"` as a single element, not 5 separate touchable elements.
4. Ensure minimum 44x44pt hit area on any interactive star element, using `hitSlop` if needed.

**Detection:** Test with VoiceOver enabled. Each star should be independently selectable and announced. If stars merge into one accessible element, the interaction model is wrong.

**Confidence:** HIGH -- based on Apple HIG touch target guidelines and examination of existing `recipe-card-row.tsx` (80px row height).

---

### Pitfall 9: Filter Chips with Images Cause Scroll Jank in Category Strip

**What goes wrong:** Adding small category images to filter chips (e.g., a tiny food photo next to "Ana Yemek") in the search category strip creates async image loads inside a horizontal ScrollView. As chips scroll into view, images load and the chip width changes (text + image vs text-only), causing layout jumps. On slow devices, the scroll stutters as images decode.

**Why it happens:** The existing `Chip` component is text-only with a fixed `paddingHorizontal: 14`. Adding an image changes the chip's intrinsic width depending on whether the image has loaded. If image width is not pre-specified, the chip expands when the image loads, pushing adjacent chips and causing the scroll position to shift.

**Consequences:**
- Category strip jumps horizontally as images load
- User tapping a chip hits the wrong one because positions shifted
- Visual flicker as chips resize

**Prevention:**
1. Use fixed-size chip layouts: define explicit width for chips with images, or use a fixed image placeholder size (24x24) that is present whether or not the image has loaded.
2. Pre-load category images at app startup (only 6 categories = 6 tiny images) using `expo-image`'s `Image.prefetch()`.
3. Use the `contentFit="cover"` prop on `expo-image` with a fixed container to prevent layout shifts.
4. Consider using SF Symbols or MaterialCommunityIcons instead of photos for category chips -- icons load instantly and convey category meaning without network dependency.

**Detection:** Scroll the category strip rapidly on a slow connection. If chips visibly resize or the strip jumps, the layout is not fixed-size.

**Confidence:** MEDIUM -- based on general React Native image-in-list patterns. Exact impact depends on image size and count.

---

### Pitfall 10: YAML-to-DB Image Path Resolution Breaks on Production Builds

**What goes wrong:** The YAML content pipeline (`build-recipes.ts`) currently outputs `coverImage: null` and `stepImage: null` into `recipes.json`. When images are added, the YAML will reference image paths (e.g., `coverImage: "menemen-cover.webp"`). The build script writes this string into `recipes.json`, which gets seeded into SQLite. At runtime, the app needs to resolve `"menemen-cover.webp"` to an actual asset reference. But in production builds, bundled assets accessed via `require()` return numeric IDs at compile time, not string paths. A string path stored in SQLite cannot be resolved to a bundled asset at runtime.

**Why it happens:** React Native's Metro bundler resolves `require('./assets/menemen-cover.webp')` at compile time to a numeric asset ID. This ID is what `<Image source={require(...)} />` actually receives. But if the image path is a string stored in the database, there is no way to call `require()` dynamically at runtime -- `require()` must be statically analyzable.

**Consequences:**
- Images work in development (Metro dev server serves files by path) but fail silently in production builds
- All recipe images show as broken/missing in the released app
- Debugging is painful because the issue only manifests in release mode

**Prevention:**
1. Create a static image registry: a TypeScript file that maps recipe IDs to `require()` calls:
   ```typescript
   export const RECIPE_IMAGES: Record<string, number> = {
     'menemen': require('../assets/images/recipes/menemen-cover.webp'),
     'kofte': require('../assets/images/recipes/kofte-cover.webp'),
     // ...
   };
   ```
2. At runtime, look up the image by recipe ID from this registry, not from the database string.
3. The YAML `coverImage` field becomes a flag/filename for the build script to verify the image exists, but the runtime lookup uses the registry.
4. For step images (if bundled), use a nested registry: `STEP_IMAGES[recipeId][stepIndex]`.
5. Alternative: store images in the app's local filesystem using `expo-file-system` and reference by file URI. This works for cloud-downloaded images but adds complexity for bundled ones.
6. The build script should validate that every non-null `coverImage` in YAML has a corresponding entry in the image registry.

**Detection:** Build a production release (`expo build` or `eas build`) early in the milestone and verify images load on a real device. Do not rely on Expo Go or dev builds for image verification.

**Confidence:** HIGH -- this is a well-documented React Native limitation. The `require()` static analysis constraint is in the official React Native image docs.

**Sources:**
- [React Native Images Documentation](https://reactnative.dev/docs/images)

---

## Minor Pitfalls

---

### Pitfall 11: Card Peek Hint Animation Conflicts with FlatList Scroll

**What goes wrong:** Adding a "peek" animation (where the next card in a horizontal list slightly peeks into view to indicate scrollability) requires modifying the FlatList's `contentContainerStyle` padding or using `snapToInterval`. If the peek amount is miscalculated, the last card either clips or leaves awkward empty space. Worse, if the peek animation uses Reanimated scroll offset tracking, it can conflict with FlatList's internal scroll handling.

**Prevention:**
1. Use CSS-only peek: set `contentContainerStyle={{ paddingRight: 40 }}` on the FlatList and constrain card width to `screenWidth - 40 - 16` (16 for left padding). This reveals a sliver of the next card without any animation.
2. Do NOT use `snapToInterval` with variable-width content -- it causes bounce-back glitches.
3. If using scroll-driven animations for the peek, use `useAnimatedScrollHandler` but limit to opacity changes on edge cards, not position transforms.

**Confidence:** MEDIUM -- standard FlatList pattern.

---

### Pitfall 12: Cooking History Rating Column Allows Unbounded Values

**What goes wrong:** The `cooking_history` table has `rating INTEGER` with no constraints. When adding editable star ratings in the Cookbook Cooked tab, a bug could insert a rating of 0, 6, or -1. The existing `logCookingCompletion` function in `cooking-history.ts` accepts `rating?: number` without validation.

**Prevention:**
1. Add Zod validation at the hook level: `z.number().int().min(1).max(5).nullable()`.
2. Add a CHECK constraint in the next migration: `ALTER TABLE cooking_history ADD CONSTRAINT chk_rating CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))`. Note: SQLite supports CHECK constraints but only on table creation, not ALTER. Add it to a new migration that recreates the table or validates in application code.
3. The `updateRating` function (to be created) should validate before writing.

**Confidence:** HIGH -- verified by reading `cooking-history.ts` and `client.ts` migration code.

---

### Pitfall 13: Section Title Duplication Between Feed and See All

**What goes wrong:** Feed section titles ("Su an trend", "30 dakikada bitir", "Sana ozel", "Denemediklerin") are hardcoded in `buildFeedSections()` in `useFeedScreen.ts`. The See All screen will need these same titles. If the See All screen derives the title from the URL param, it needs to match exactly. Any mismatch (e.g., URL-safe encoding of Turkish characters) causes a blank or wrong title.

**Prevention:**
1. Extract section metadata (key, title, icon) into a shared constant:
   ```typescript
   export const FEED_SECTIONS = {
     trending: { title: 'Su an trend', icon: 'fire' },
     quick: { title: '30 dakikada bitir', icon: 'clock-fast' },
     personal: { title: 'Sana ozel', icon: 'account-heart' },
     untried: { title: 'Denemediklerin', icon: 'food-variant-off' },
   } as const;
   ```
2. Both `useFeedScreen` and `useSeeAllScreen` reference this constant.
3. Pass only the section key in the route param, never the title string.

**Confidence:** HIGH -- verified by reading `useFeedScreen.ts` `buildFeedSections()`.

---

### Pitfall 14: Haptic Feedback Overuse Creates Annoyance

**What goes wrong:** Adding haptic feedback to every micro-interaction (card press, bookmark toggle, tab switch, chip selection, star tap, timer button, swipe) results in constant device vibration that users perceive as a buzzing, broken phone rather than premium feedback.

**Prevention:**
1. Limit haptics to meaningful state changes: bookmark toggle (add/remove), cooking step completion, timer start/finish, rating submission.
2. Use `ImpactFeedbackStyle.Light` for most interactions, `Medium` only for significant actions (start cooking), `Heavy` never.
3. Do NOT add haptics to scroll events, card presses (navigation is feedback enough), or tab switches.
4. Provide a setting to disable haptics entirely (respect user preference).

**Confidence:** HIGH -- UX best practice, not technology-specific.

---

### Pitfall 15: Dual Data Fetch on Cookbook Tab Initialization

**What goes wrong:** The Cookbook screen with Saved/Cooked tabs may fetch both bookmarked recipes AND cooking history on mount, even though only one tab is visible. With 30 recipes and growing cooking history, this doubles the SQLite queries on every Cookbook focus.

**Prevention:**
1. Fetch only the active tab's data on mount. Defer the other tab's data until the user switches to it.
2. Cache the fetched data in the hook state so switching back does not re-fetch unless the data is stale.
3. Use a `dataLoaded` flag per tab to avoid redundant fetches.

**Confidence:** HIGH -- standard lazy loading pattern.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Severity |
|-------------|---------------|------------|----------|
| Recipe image system | Bundle size bloat (#1) | WebP compression, cover-only bundling, measure binary early | Critical |
| Recipe image system | Path resolution in production (#10) | Static require() registry, test with release build | Critical |
| Recipe image system | Placeholder-to-image flash (#7) | expo-image + blurhash at build time | Moderate |
| Dark mode contrast | Hardcoded hex colors (#2) | Sweep all 17 component files before any contrast work | Critical |
| Cookbook Saved/Cooked tabs | Tab state resets on navigation (#3) | Persist active tab in hook, lazy-load tab data | Critical |
| Cookbook Saved/Cooked tabs | Star rating touch targets (#8) | Read-only inline, edit in sheet or detail screen | Moderate |
| Cookbook Saved/Cooked tabs | Dual data fetch (#15) | Lazy load per tab | Minor |
| Cookbook Saved/Cooked tabs | Unbounded rating values (#12) | Zod validation, range check | Minor |
| Feed "See All" navigation | Navigation stack confusion (#4) | Stack route outside tabs, fresh data fetch | Critical |
| Feed "See All" navigation | Title duplication (#13) | Shared constant, key-based lookup | Minor |
| UI animations | Reanimated perf on low-end Android (#5) | Transform/opacity only, limit count, real device testing | Moderate |
| UI animations | Card peek scroll conflicts (#11) | CSS-only peek via padding, avoid snapToInterval | Minor |
| UI animations | Haptic overuse (#14) | Limit to state changes, Light feedback only | Minor |
| Bottom sheet transitions | Backdrop timing mismatch (#6) | Replace Modal with Reanimated overlay, or adopt @gorhom/bottom-sheet | Moderate |
| Filter chips with images | Scroll jank (#9) | Fixed chip sizes, prefetch, consider icons over photos | Moderate |

## Ordering Implications

Based on these pitfalls, the milestone phases should be ordered as follows:

1. **Image infrastructure first** -- Solve the build pipeline (image registry, compression, YAML wiring) before any UI work touches images. Pitfalls #1 and #10 are showstoppers that are invisible until production build.
2. **Color token sweep second** -- Replace 119 hardcoded hex values before any dark mode contrast adjustments. Pitfall #2 makes all subsequent dark mode work fragile if not addressed first.
3. **Cookbook tabs and See All routes third** -- These require new routes and hook restructuring (Pitfalls #3, #4) that touch shared infrastructure.
4. **Animation polish last** -- Micro-interactions, peek hints, and sheet transitions are additive and can be tuned without affecting data flow. Pitfalls #5, #6, #11 are performance tuning issues best addressed when the feature set is stable.

## Sources

- [Expo Image Documentation](https://docs.expo.dev/versions/latest/sdk/image/)
- [Expo Assets Guide](https://docs.expo.dev/develop/user-interface/assets/)
- [React Native Images Documentation](https://reactnative.dev/docs/images)
- [Reanimated Performance Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- [Reanimated New Architecture Issue #8250](https://github.com/software-mansion/react-native-reanimated/issues/8250)
- [BottomSheet Backdrop Timing Issue #857](https://github.com/gorhom/react-native-bottom-sheet/issues/857)
- [Apple HIG Touch Target Guidelines](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [WCAG 2.2 Contrast Requirements](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)
- Direct codebase analysis of TheCook v1.0 (17 component files, 119 hardcoded hex values, 2 Modal-based sheets, 30 YAML recipes with null images)
