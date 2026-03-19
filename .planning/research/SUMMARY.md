# Project Research Summary

**Project:** TheCook v1.1 — Visual Polish & Content Ready
**Domain:** React Native cooking companion app (Turkish market, Expo SDK 54)
**Researched:** 2026-03-19
**Confidence:** HIGH

## Executive Summary

TheCook v1.1 is a visual upgrade milestone, not an architectural one. The v1.0 codebase already has the right structure: screen hooks that encapsulate all data logic, Zod schemas as the source of type truth, SQLite with WAL mode, and expo-image and Reanimated v4 installed but unused. The entire v1.1 stack requires only one new package (`@gorhom/bottom-sheet`) — every other capability (image loading, haptics, animations, FlashList) is already in `package.json`. The research conclusion is clear: stop installing and start enabling what is already there.

The recommended approach works in four sequential dependency layers. Image pipeline infrastructure comes first because it is a prerequisite for every visual feature. Before any dark mode polish, 119 hardcoded hex values must be swept from 17 component files and replaced with theme tokens — otherwise dark mode fixes in `theme.ts` only partially propagate. The Cookbook tab expansion and See All navigation are independent mid-tier features that can be built in parallel after images are in place. Animation and micro-interaction polish comes last, touching many files but changing no data flow.

Two non-obvious risks deserve special attention. First, image bundling can silently balloon the app binary: the menemen reference PNGs in `content/images/MENEMEN/` are 1.8MB each, and naively bundling 180 recipe images at that size produces a 36MB binary increase that will trigger App Store cellular download warnings. WebP at 30-80KB per image keeps the total under 5MB. Second, `require()` in Metro is statically analyzed at compile time — image path strings stored in SQLite cannot be resolved to bundled assets in production builds. A static TypeScript registry mapping recipe IDs to `require()` calls is mandatory, and this must be verified with an actual release build early in the milestone, not at the end.

## Key Findings

### Recommended Stack

The v1.0 stack (Expo 54, RN 0.81, expo-sqlite, expo-router, Zod v4, Reanimated 4.1, Supabase) is fully validated and unchanged for v1.1. Only one new runtime dependency is justified: `@gorhom/bottom-sheet@^5.2.8`, which replaces hand-rolled `<Modal animationType="slide">` sheets with gesture-driven, snap-point-aware bottom sheets. Its peer dependency on Reanimated `>=4.0.0-` is officially satisfied by the installed v4.1.6, though real-world compatibility issues have been reported in GitHub issues #2546-#2600.

**Core technologies:**
- `expo-image@3.0.11` (installed, unused): Replace all `<Image>` and gradient placeholders — provides disk caching, blurhash placeholders, cross-dissolve transitions, and `recyclingKey` for FlashList compatibility. Supports both `require()` local sources and URL strings, making cloud migration a source swap rather than a code change.
- `react-native-reanimated@4.1.6` (installed, underused in cards/navigation): Use `FadeInDown`, `SlideInRight`, and `useAnimatedStyle` for staggered card entrances, press feedback, and bookmark heart animations. No additional install.
- `expo-haptics@15.0.8` (installed, single usage in sefim-sheet): Expand to bookmark toggle, star rating, timer completion, and cooking step transitions using Light/Medium/Success feedback patterns.
- `@shopify/flash-list@2.0.2` (installed, unused): Use for "See All" vertical lists with `recyclingKey` coordinated with expo-image to prevent stale image flicker on scroll.
- `@gorhom/bottom-sheet@^5.2.8` (to install): Replace current Modal sheets; requires `BottomSheetModalProvider` wrapper in `app/_layout.tsx`. Fallback is a Reanimated-powered custom overlay (~50 lines, documented in Reanimated examples).

**Do not add:** `react-native-fast-image` (deprecated/unmaintained), `lottie-react-native` (2MB+ bundle cost for what Reanimated handles in 5 lines), `react-native-tab-view` (overkill for a 2-state in-screen toggle), `react-native-ratings` (250KB for a component already implemented in `completion-screen.tsx`), `moti` (unnecessary wrapper around Reanimated).

### Expected Features

**Must have (table stakes):**
- Recipe cover images — gradient placeholders signal "prototype"; food photography is the primary purchase signal in cooking apps. `cover_image TEXT` column and `coverImage` YAML field already exist; all 30 recipes currently set to `null`.
- "See All" feed navigation — standard pattern in every horizontal-scroll content app (App Store, Netflix, Uber Eats); users hit a dead end without it.
- Cookbook Saved/Cooked tabs — `cooking_history` table exists with ratings logged at cooking completion, but the data is invisible to users; the rating at completion feels pointless with no place to revisit it.
- Star ratings visible in Cookbook — users rated recipes at completion; those ratings must be findable.
- Dark mode card contrast fix — `card: '#161614'` on `background: '#0C0C0A'` is ~3% luminance difference; cards are effectively invisible in dark mode.
- Horizontal scroll peek hint — without a partial card visible at the right edge, users do not know the feed section is scrollable.

**Should have (differentiators):**
- Editable star rating in Cookbook cooked tab — re-rating from the cooked list makes the cookbook feel alive rather than archival.
- Bookmark heart animation with haptics — springy scale + haptic pulse on heart toggle; ~30 lines using existing Reanimated + expo-haptics.
- Cook count display ("3 kez pisirdin") — emotionally resonant relationship indicator, simple `GROUP BY` query on `cooking_history`.
- Blurhash placeholders — eliminates gradient-to-photo flash on image load; requires a build-time blurhash generation step added to `build-recipes.ts`.
- Section heading with count badge ("Sana Ozel (8)") — builds trust that personalization is working; `data.length` already available in FeedSection props.
- Card press feedback (0.97x scale spring) — tactile-feeling tap response using existing Reanimated.
- Filter chip category icons — MaterialCommunityIcons (already installed) mapped to categories; instant, no async loading.

**Defer to v1.2+:**
- Blurhash placeholders (requires build pipeline change; gradient fallback works acceptably for locally-bundled images that load fast).
- Editable star rating (the post-completion rating is visible in the Cooked tab; re-rating is a convenience, not a gap).
- Filter chip category icons (incremental improvement, not a UX gap).
- Cloud image hosting (Supabase Storage / CDN) — architecture is cloud-ready via expo-image; wait until recipe count justifies it.
- User image upload, social ratings, image carousels, animated page transitions — explicitly out of scope per v1.1 definition.

### Architecture Approach

The v1.0 layered architecture (YAML → build pipeline → recipes.json → SQLite → DB functions → screen hooks → UI components) is extended, not replaced. Images add a parallel data channel: a build-time auto-generated `image-manifest.ts` maps recipe IDs to `require()` calls, which is merged with SQLite data at the hook/component level. SQLite stores the image path string (or null) for reference; the manifest handles the actual asset resolution.

The Cookbook screen adds a controlled `activeTab: 'saved' | 'cooked'` state variable inside the existing `useCookbookScreen` hook — not nested expo-router tabs, which would create tab-in-tab navigation confusion and URL structure complexity. The See All screen becomes a stack route registered in the root layout (outside `(tabs)`) that intentionally hides the tab bar, which is the standard drill-down pattern in expo-router.

**New components:**
1. `scripts/optimize-images.ts` — build-time WebP compression, runs as a separate `prebuild` script before `build-recipes.ts`.
2. `app/assets/image-manifest.ts` — auto-generated static require() registry; the production-safe resolution bridge between YAML paths and bundled assets.
3. `app/feed/[section].tsx` + `src/hooks/useSeeAllScreen.ts` — vertical recipe list screen reusing the existing `buildFeedSections()` pure function export from `useFeedScreen.ts`.
4. `components/cookbook/tab-bar.tsx`, `cooked-recipe-card.tsx`, `editable-star-rating.tsx` — Cookbook cooked tab UI. `EditableStarRating` is extracted from `CompletionScreen`'s internal component.
5. New DB functions in `src/db/cooking-history.ts`: `getCookingHistoryWithRecipes()` (JOIN with recipes) and `updateCookingRating()` — no schema migration needed; all columns exist.

**Patterns to follow strictly:**
- Every image render has a working gradient fallback. The image system is additive — removing all images must reproduce the v1.0 experience exactly.
- Screen hooks contain all data logic; screen components are pure render.
- Build-time image processing only; no runtime downloading for content that ships with the app.
- Reuse `buildFeedSections()` pure function in `useSeeAllScreen` rather than duplicating section filtering logic.
- No nested expo-router tabs for the Cookbook toggle; use controlled state.

### Critical Pitfalls

1. **Image bundle bloat kills install size** — 180 recipe images at 1.8MB each (current menemen PNGs) = 36MB added to binary. Prevention: WebP at 30-80KB per image; bundle only cover images (30 images, ~1.5MB total) in v1.1; defer step images to cloud. Measure the production binary immediately after Phase 1, not at the end.

2. **Metro require() static analysis breaks production** — strings stored in SQLite cannot be resolved to bundled assets at runtime; `require()` must appear literally in source code. Prevention: generate `image-manifest.ts` with hardcoded `require()` calls at build time; look up by recipe ID at runtime. Verify with an actual release build (`eas build`) in Phase 1 before touching card components.

3. **119 hardcoded hex values in 17 component files** — dark mode fixes in `theme.ts` only partially propagate until these are replaced with `colors.*` theme tokens. Prevention: complete a color token sweep as a prerequisite before any dark mode contrast work. Verification: `grep -rn '#[0-9A-Fa-f]\{6\}' components/ app/` returns zero matches outside `theme.ts` and intentional gradient palettes.

4. **Cookbook tab state resets on navigation** — local `useState` for the active tab resets to 'saved' on every `useFocusEffect` reload cycle when users navigate away and return. Prevention: persist active tab in hook state; lazy-load per-tab data (only fetch Cooked data when user taps the Cooked tab for the first time); avoid `setLoading(true)` on tab switch.

5. **See All navigation stack confusion** — placing the route inside `(tabs)` creates tab-in-tab confusion; the route must be defined in the root layout Stack. Prevention: define `app/feed/[section].tsx` in root layout, pass only the section key in route params (not title string), use a shared `FEED_SECTIONS` constant for key-to-title lookup in both `useFeedScreen` and `useSeeAllScreen`.

## Implications for Roadmap

The phase structure is dictated by hard dependencies. Three things must be done before downstream work can build on them safely: image infrastructure (the require() registry must exist before any component references images), color token sweep (must precede dark mode contrast tuning), and routing/tab architecture decisions (must be settled before feature screens are built).

### Phase 1: Image Pipeline Foundation

**Rationale:** Every visual feature depends on images. More critically, the production Metro require() issue (Pitfall #2) is a silent showstopper that is invisible in development and only manifests in release builds. Catching it in Phase 1 costs hours; catching it in Phase 5 costs days of rework.

**Delivers:** `scripts/optimize-images.ts` (WebP compression using `sharp`), `content/images/{recipe-id}/cover.webp` convention established, `app/assets/image-manifest.ts` auto-generated by `build-recipes.ts`, YAML `coverImage` fields populated for initial recipe set, `SEED_VERSION` bumped to `"5.0.0"`, production binary measured for size.

**Addresses:** Recipe cover images (table stake foundation); bundle size constraint.

**Avoids:** Pitfalls #1 (bundle bloat) and #2 (require() static analysis break in production).

**Research flag:** No additional research needed. Metro require() registry is well-documented in React Native image docs. expo-image API verified against official documentation.

### Phase 2: Color Token Sweep

**Rationale:** The 119 hardcoded hex values create a moving target. Any dark mode contrast work applied before this sweep will only partially propagate, requiring another sweep later. This is a prerequisite task, not optional polish.

**Delivers:** Zero hardcoded hex values outside `theme.ts` and intentional category gradient palettes. New semantic tokens in `Colors` (e.g., `chipBackground`, `calloutGreen`, `starActive`). Dark card color corrected (`#161614` → `#1C1C1A` or similar). Stale overridden values in `RecipeCardGrid`, `FeedSection`, and `StepContent` StyleSheets cleaned up.

**Addresses:** Dark mode card contrast (table stake).

**Avoids:** Pitfall #2 (hardcoded hex patchwork that resists theme changes).

**Research flag:** No research needed. Mechanical sweep with grep-based verification.

### Phase 3: Card Image Rendering

**Rationale:** Builds directly on Phase 1's image manifest. The most visible user-facing change in the milestone — transforms the app from prototype to product. Benefits from Phase 2's clean theme tokens for gradient scrim colors.

**Delivers:** expo-image integrated in `RecipeCardGrid`, `RecipeCardRow`, recipe detail hero (`app/recipe/[id].tsx`), and `StepContent`. Gradient scrim overlay on image-backed cards for title readability. Gradient fallback preserved for recipes without images. `recyclingKey={recipe.id}` set on expo-image for FlashList compatibility.

**Addresses:** Recipe cover images (table stake — completion), step images in cooking mode.

**Avoids:** Pitfall #7 (placeholder-to-image flash) — expo-image `transition` prop and blurhash placeholder if generated.

**Research flag:** No research needed. expo-image API fully verified.

### Phase 4: Feed "See All" Navigation

**Rationale:** Independent of Cookbook tabs. Can be built in parallel with Phase 3 by a second developer. Closes the dead-end users encounter when scrolling horizontal feed sections to their end.

**Delivers:** `app/feed/[section].tsx` stack route registered in root layout, `src/hooks/useSeeAllScreen.ts` reusing `buildFeedSections()`, "Tumunu Gor" pressable in FeedSection header, `FEED_SECTIONS` shared constant for key-to-title lookup, section count badge in header.

**Addresses:** "See All" feed navigation (table stake), section heading count badge (differentiator).

**Avoids:** Pitfalls #4 (navigation stack confusion — route outside tabs is correct) and #13 (section title duplication — shared constant, key-only in route params).

**Research flag:** No research needed. expo-router stack-outside-tabs pattern is documented and consistent with existing `app/recipe/[id].tsx` structure.

### Phase 5: Cookbook Saved/Cooked Tabs

**Rationale:** Benefits from Phase 3 (cooked cards show recipe images). Requires new DB query functions and hook state expansion but no schema migration — all columns already exist in `cooking_history`. Self-contained feature.

**Delivers:** `components/cookbook/tab-bar.tsx` (Pressable-based segmented control), `components/cookbook/cooked-recipe-card.tsx` (row with thumbnail, date, read-only stars), `components/cookbook/editable-star-rating.tsx` (extracted from CompletionScreen), `getCookingHistoryWithRecipes()` and `updateCookingRating()` added to `src/db/cooking-history.ts`, `useCookbookScreen` expanded with lazy tab data loading and active tab persistence.

**Addresses:** Cookbook Saved/Cooked tabs (table stake), star ratings visible in Cookbook (table stake), cook count ("3 kez pisirdin") (differentiator), editable star rating (differentiator).

**Avoids:** Pitfalls #3 (tab state resets — active tab in hook state, lazy load), #8 (star rating touch targets — read-only inline display; tap opens edit context with proper spacing), #12 (unbounded rating values — Zod validation at hook level), #15 (dual data fetch — lazy load per tab).

**Research flag:** No research needed. All DB columns exist; established hook patterns apply directly.

### Phase 6: UI Polish — Animations, Haptics, Bottom Sheets

**Rationale:** Last because it touches many files but changes no data flow. Each item is independent of the others. Animation choices are easier to tune once the feature set is stable and testable on real devices, including low-end Android.

**Delivers:** Card press scale animation (Reanimated `withSpring(0.96)`) on `RecipeCardGrid` and `RecipeCardRow`, horizontal scroll peek gradient at right edge of FeedSection FlatList, staggered section heading entrance (`FadeInDown` with delay), `@gorhom/bottom-sheet` replacing Modal in `SefimSheet` and `IngredientsSheet` (or Reanimated-powered custom overlay as fallback), haptic feedback on bookmark toggle / star rating tap / timer completion, bookmark heart spring scale animation.

**Addresses:** Bookmark heart animation (differentiator), card press feedback (differentiator), bottom sheet fade backdrop transition (differentiator), horizontal scroll peek hint (table stake — polish).

**Avoids:** Pitfalls #5 (Reanimated perf on low-end Android — animate only transform/opacity; one `useAnimatedStyle` per component), #6 (backdrop timing mismatch — @gorhom handles synchronization natively), #11 (peek scroll conflicts — CSS-only via `contentContainerStyle` padding, no snapToInterval), #14 (haptic overuse — limit to meaningful state changes, Light feedback only).

**Research flag:** @gorhom/bottom-sheet Reanimated v4 compatibility needs a smoke test before committing to sheet migration. Install and test with a minimal `BottomSheet` first. If broken, use the documented Reanimated custom overlay fallback (~50 lines). The current Modal sheets work — this is polish, not a blocker.

### Phase Ordering Rationale

- Image pipeline before card rendering: Metro's static require() analysis means the image registry must exist in source before any component references it.
- Color token sweep before dark mode polish: the 119 hardcoded values create a moving target; sweeping first means subsequent contrast adjustments in `theme.ts` fully propagate.
- Phases 4 and 5 can run in parallel after Phase 3 is complete (or Phase 4 can run in parallel with Phase 3 for a two-developer team, since it touches different files).
- UI polish is last: most file-scattered work with no data flow impact; should not add code review noise while feature work is in flight.
- `SEED_VERSION` bump happens in Phase 1, consolidating all data pipeline changes in one place so downstream phases do not trigger additional re-seeds.

### Research Flags

Phases needing deeper validation during implementation:
- **Phase 6 (@gorhom/bottom-sheet):** Confirm Reanimated v4 compatibility with a minimal BottomSheet before committing to full sheet migration. GitHub issues #2546, #2547, #2600 indicate real-world problems despite official peer dependency claim of support. Document the fallback plan in the Phase 6 task card.

Phases with standard patterns (safe to skip additional research):
- **Phase 1:** Metro require() image registry — well-documented React Native pattern. expo-image API verified.
- **Phase 2:** Color token sweep — mechanical task with grep verification. No unknowns.
- **Phase 3:** expo-image integration — API fully documented, library already installed and version-verified.
- **Phase 4:** expo-router stack route outside tabs — consistent with existing `app/recipe/[id].tsx` structure.
- **Phase 5:** Cookbook DB functions and hook expansion — all DB columns exist; no migration needed; hook pattern established.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All libraries verified via npm registry and official docs on 2026-03-19. Single new dependency (@gorhom/bottom-sheet) has a MEDIUM compatibility caveat — peer deps claim support, field reports say MAYBE. |
| Features | HIGH | Table stakes validated via direct codebase analysis of existing components, DB schema, and YAML content pipeline. Feature priorities are opinionated and grounded in code inspection. |
| Architecture | HIGH | Based on direct inspection of every integration point in the actual codebase. All file paths, function names, and DB columns verified. Component boundaries follow established v1.0 patterns. |
| Pitfalls | HIGH | Critical pitfalls verified: 119 hardcoded hex values counted directly; require() static analysis constraint documented in React Native image docs; bundle size math confirmed via Expo asset bundling docs; cookbook useFocusEffect pattern verified in `useCookbookScreen.ts`. |

**Overall confidence:** HIGH

### Gaps to Address

- **@gorhom/bottom-sheet Reanimated v4 compatibility:** Peer dependencies claim support, but open issues suggest real-world problems on some setups. Resolution: smoke test in Phase 6 before rewriting both sheets. The fallback (Reanimated custom overlay) is documented and approximately 50 lines.
- **WebP target file sizes:** The 30-80KB per image target is an estimate. Actual sizes depend on image complexity. Phase 1 must include a release build binary size check before Phase 3 begins.
- **SEED_VERSION bump impact on existing user data:** Bumping to `"5.0.0"` forces a full re-seed on all user devices on update. Test case: install v1.0, create bookmarks and cooking history, upgrade to v1.1, verify all user data is preserved. The existing migration logic handles this, but the test must be explicit.
- **Turkish character URL encoding in route params:** Feed section titles with Turkish characters should not appear in route params. The `FEED_SECTIONS` shared constant (key-only routing) eliminates this risk; verify with real device navigation that the key routing works correctly.

## Sources

### Primary (HIGH confidence)
- [expo-image documentation](https://docs.expo.dev/versions/latest/sdk/image/) — placeholder, transition, recyclingKey, cachePolicy, prefetch API
- [expo-haptics documentation](https://docs.expo.dev/versions/latest/sdk/haptics/) — ImpactFeedbackStyle, NotificationFeedbackType, selectionAsync
- [Reanimated entering/exiting animations](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/entering-exiting-animations/) — FadeIn, SlideIn, delay, springify
- [Reanimated Performance Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/) — animated component count thresholds
- [React Native Images Documentation](https://reactnative.dev/docs/images) — require() static analysis constraint
- [Expo Assets Guide](https://docs.expo.dev/develop/user-interface/assets/) — bundling strategy
- [@gorhom/bottom-sheet npm](https://www.npmjs.com/package/@gorhom/bottom-sheet) — v5.2.8 peer dependencies verified 2026-03-19
- Direct codebase analysis — all file paths, component APIs, DB schema, hook patterns, and color counts verified in `/Users/sado/Documents/Projects/TheCook/TheCook/TheCook/`

### Secondary (MEDIUM confidence)
- [@gorhom/bottom-sheet docs](https://gorhom.dev/react-native-bottom-sheet/) — BottomSheetModal, snap points, backdrop configuration
- [Dark Mode UI Best Practices 2025 — Netguru](https://www.netguru.com/blog/tips-dark-mode-ui) — card elevation, contrast ratios in dark surfaces
- [React Navigation Tab View](https://reactnavigation.org/docs/tab-view/) — evaluated and rejected for in-screen 2-state toggle
- UX pattern research — "See All" / horizontal scroll peek conventions (UX Collective, Tubik Studio case study, App Store / Netflix pattern analysis)
- [Apple HIG Touch Target Guidelines](https://developer.apple.com/design/human-interface-guidelines/accessibility) — 44x44pt minimum, star rating layout implications

### Tertiary (MEDIUM-LOW confidence)
- [Reanimated New Architecture Issue #8250](https://github.com/software-mansion/react-native-reanimated/issues/8250) — low-end Android perf regressions (real-world reports, not benchmarks)
- [@gorhom/bottom-sheet issues #2546, #2547, #2600](https://github.com/gorhom/react-native-bottom-sheet/issues/2546) — Reanimated v4 compatibility field reports (peer deps say YES, some users say MAYBE)

---
*Research completed: 2026-03-19*
*Ready for roadmap: yes*
