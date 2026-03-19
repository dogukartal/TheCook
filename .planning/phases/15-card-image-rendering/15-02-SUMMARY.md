---
phase: 15-card-image-rendering
plan: 02
subsystem: ui
tags: [expo-image, blurhash, recipe-card, recipe-detail, image-rendering, gradient-fallback]

# Dependency graph
requires:
  - phase: 15-card-image-rendering
    provides: Blurhash pipeline, RecipeImages interface with coverBlurhash, expo-image jest mock
  - phase: 14-color-token-sweep
    provides: Theme tokens, palette-exempt hero overlay rgba backgrounds
provides:
  - expo-image cover rendering on RecipeCardGrid with blurhash placeholder and dark scrim
  - expo-image thumbnail rendering on RecipeCardRow with blurhash placeholder
  - expo-image hero rendering on recipe detail with dark scrim overlay
  - Gradient fallback preserved for all recipes without images
  - 7 tests covering image/gradient conditional rendering
affects: [16-cooking-mode-v2, 15-card-image-rendering]

# Tech tracking
tech-stack:
  added: []
  patterns: [conditional-image-gradient-fallback, dark-scrim-over-photo]

key-files:
  created:
    - TheCook/__tests__/recipe-card-grid.test.ts
    - TheCook/__tests__/recipe-card-row.test.ts
    - TheCook/__tests__/recipe-detail.test.ts
  modified:
    - TheCook/components/ui/recipe-card-grid.tsx
    - TheCook/components/ui/recipe-card-row.tsx
    - TheCook/app/recipe/[id].tsx

key-decisions:
  - "Dark scrim gradient on grid card covers bottom 50% for title readability over photos"
  - "Hero scrim uses rgba(0,0,0,0.15) to rgba(0,0,0,0.65) gradient for text readability"
  - "No scrim on row thumbnail since title is beside the image, not overlaid"

patterns-established:
  - "Conditional image/gradient: check images.cover, render Image+scrim or LinearGradient fallback"
  - "testID convention: card-cover-image, row-cover-image, hero-cover-image for image surfaces"

requirements-completed: [IMG-01, IMG-03]

# Metrics
duration: 4min
completed: 2026-03-19
---

# Phase 15 Plan 02: Card & Detail Image Rendering Summary

**expo-image wired into RecipeCardGrid, RecipeCardRow, and recipe detail hero with blurhash placeholders, dark scrims for text readability, and gradient fallback for imageless recipes**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-19T16:12:35Z
- **Completed:** 2026-03-19T16:16:49Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Wired expo-image into all three card/detail surfaces with conditional rendering: cover photo when available, category gradient fallback when not
- Blurhash placeholder passed to all Image components for smooth loading transitions
- Dark scrim gradients added on grid card (bottom 50%) and detail hero (full overlay) for white text readability over photos
- 7 new tests covering image-present and gradient-fallback paths for all three components, all green

## Task Commits

Each task was committed atomically:

1. **Task 1: Create test files for card and detail image rendering** - `774e648` (test)
2. **Task 2: Wire expo-image into RecipeCardGrid, RecipeCardRow, and recipe detail hero** - `96c7924` (feat)

## Files Created/Modified
- `TheCook/__tests__/recipe-card-grid.test.ts` - Tests for grid card image rendering with/without cover, blurhash placeholder
- `TheCook/__tests__/recipe-card-row.test.ts` - Tests for row thumbnail image rendering with/without cover
- `TheCook/__tests__/recipe-detail.test.ts` - Tests for hero image rendering with/without cover
- `TheCook/components/ui/recipe-card-grid.tsx` - Added expo-image + registry lookup, conditional cover/gradient, dark scrim
- `TheCook/components/ui/recipe-card-row.tsx` - Added expo-image + registry lookup, conditional cover/gradient thumbnail
- `TheCook/app/recipe/[id].tsx` - Restructured hero to support image+scrim or gradient, added expo-image + registry lookup

## Decisions Made
- Dark scrim on grid card covers bottom 50% (transparent to rgba(0,0,0,0.55)) -- enough for title/bookmark readability without darkening the full image
- Hero scrim uses full overlay with rgba(0,0,0,0.15) to rgba(0,0,0,0.65) -- stronger at bottom where title sits
- No scrim needed on row card thumbnail -- title text is positioned beside the image, not overlaid on it
- Hero restructured from LinearGradient-as-container to View-with-absolute-layers to support conditional image/gradient behind overlay content

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- jest.mock factories cannot reference out-of-scope variables like `React` -- fixed by using `require('react')` inside mock factories (standard jest pattern)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All three card/detail surfaces now render expo-image when cover exists in registry
- Gradient fallback preserved for the 29 recipes without images
- Ready for Plan 03 (step image rendering in cooking mode)
- 7 new tests + all existing tests green (pre-existing seed/completion-screen failures unchanged)

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 15-card-image-rendering*
*Completed: 2026-03-19*
