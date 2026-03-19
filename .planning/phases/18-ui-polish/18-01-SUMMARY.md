---
phase: 18-ui-polish
plan: 01
subsystem: ui
tags: [reanimated, expo-haptics, animation, pressable, spring, haptic]

# Dependency graph
requires:
  - phase: 15-card-image-rendering
    provides: Recipe card components (grid, row, row-cooked) that needed animation wrapping
provides:
  - ScalePressable reusable scale-on-tap component
  - AnimatedHeart heart icon with pop animation and haptic feedback
  - Visual press feedback on all recipe cards and cooking mode buttons
affects: [18-02-ui-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [Animated.View wrapper for scale transform, Pressable inside for interaction, haptic on positive action only]

key-files:
  created:
    - TheCook/components/ui/animated-pressable.tsx
    - TheCook/components/ui/animated-heart.tsx
    - TheCook/__tests__/animated-pressable.test.ts
    - TheCook/__tests__/animated-heart.test.ts
  modified:
    - TheCook/components/ui/recipe-card-grid.tsx
    - TheCook/components/ui/recipe-card-row.tsx
    - TheCook/components/ui/recipe-card-row-cooked.tsx
    - TheCook/app/recipe/[id].tsx
    - TheCook/app/recipe/cook/[id].tsx

key-decisions:
  - "Animated.View wrapper + inner Pressable instead of Animated.createAnimatedComponent(Pressable) for clean TypeScript types"
  - "Haptic fires only on bookmark add (not remove) matching iOS system behavior"
  - "Icon-only buttons (back, close, chef-hat) excluded from scale feedback per research anti-pattern guidance"

patterns-established:
  - "ScalePressable pattern: Animated.View with style+transform wrapping Pressable with interaction handlers"
  - "AnimatedHeart pattern: pop animation via withSequence(withSpring) + haptic on positive state transition only"

requirements-completed: [UX-02, UX-03, UX-07]

# Metrics
duration: 8min
completed: 2026-03-19
---

# Phase 18 Plan 01: Tap Feedback & Bookmark Animation Summary

**ScalePressable and AnimatedHeart components with Reanimated spring animations wired into all recipe cards and cooking mode buttons**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-19T20:28:23Z
- **Completed:** 2026-03-19T20:36:23Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Created ScalePressable reusable component providing scale-down-on-press feedback via Reanimated withSpring
- Created AnimatedHeart component with pop animation (withSequence) and expo-haptics feedback on bookmark add
- Wired ScalePressable into all 3 card types (grid, row, row-cooked) and 4 action buttons (Start Cooking, Malzemeler, Geri, Sonraki/Bitir)
- Wired AnimatedHeart into RecipeCardGrid bookmark and recipe detail hero bookmark

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ScalePressable and AnimatedHeart with tests (TDD RED)** - `e3130d0` (test)
2. **Task 1: Create ScalePressable and AnimatedHeart with tests (TDD GREEN)** - `d172192` (feat)
3. **Task 2: Wire into cards and buttons** - `31aefa5` (feat)

_Note: Task 1 used TDD flow with separate RED and GREEN commits._

## Files Created/Modified
- `TheCook/components/ui/animated-pressable.tsx` - ScalePressable: Animated.View wrapper with spring scale transform
- `TheCook/components/ui/animated-heart.tsx` - AnimatedHeart: heart icon with pop animation and haptic on add
- `TheCook/__tests__/animated-pressable.test.ts` - Tests for children rendering, onPress, onPressIn/Out, style application
- `TheCook/__tests__/animated-heart.test.ts` - Tests for onToggle, haptic on add only, accessibility labels
- `TheCook/components/ui/recipe-card-grid.tsx` - Root Pressable replaced with ScalePressable, bookmark replaced with AnimatedHeart
- `TheCook/components/ui/recipe-card-row.tsx` - Root Pressable replaced with ScalePressable
- `TheCook/components/ui/recipe-card-row-cooked.tsx` - Root Pressable replaced with ScalePressable
- `TheCook/app/recipe/[id].tsx` - Hero bookmark replaced with AnimatedHeart, Start Cooking button wrapped in ScalePressable
- `TheCook/app/recipe/cook/[id].tsx` - Malzemeler, Geri, Sonraki/Bitir buttons wrapped in ScalePressable

## Decisions Made
- Used Animated.View wrapper + inner Pressable instead of Animated.createAnimatedComponent(Pressable) to avoid TypeScript children type issues with Reanimated's animated component factory
- Haptic fires only on bookmark add (not remove) matching iOS system behavior and research recommendation
- Icon-only buttons (back arrow, close X, chef-hat) excluded from scale feedback per research anti-pattern guidance
- Row card bookmark button (remove action) kept as plain Pressable since it only removes -- no animation needed for negative action

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Changed from AnimatedPressable to Animated.View wrapper pattern**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** `Animated.createAnimatedComponent(Pressable)` loses TypeScript `children` type, causing TS2322 errors across all usage sites
- **Fix:** Restructured ScalePressable to use `Animated.View` as outer wrapper (with style + animated transform) and plain `Pressable` inside (with interaction handlers + children)
- **Files modified:** TheCook/components/ui/animated-pressable.tsx
- **Verification:** `npx tsc --noEmit` shows zero source file errors
- **Committed in:** 31aefa5 (included in Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Architectural adjustment for type safety. Same visual behavior, better TypeScript integration. No scope creep.

## Issues Encountered
None beyond the TypeScript issue documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ScalePressable and AnimatedHeart components ready for any future tappable elements
- Phase 18 Plan 02 (sheet backdrop animations, chip icons, progress bar) can proceed independently
- All existing tests pass (pre-existing failures in seed.test.ts and completion-screen.test.ts are unrelated)

---
## Self-Check: PASSED

- All 9 created/modified files verified on disk
- All 3 task commits verified in git log (e3130d0, d172192, 31aefa5)

---
*Phase: 18-ui-polish*
*Completed: 2026-03-19*
