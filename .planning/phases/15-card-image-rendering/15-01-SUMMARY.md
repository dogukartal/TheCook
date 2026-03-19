---
phase: 15-card-image-rendering
plan: 01
subsystem: build-pipeline
tags: [blurhash, sharp, expo-image, image-registry, jest-mock]

# Dependency graph
requires:
  - phase: 13-image-pipeline
    provides: build-images.ts script, image-registry.ts, sharp devDependency
provides:
  - Blurhash generation in build-images.ts via blurhash encode
  - RecipeImages interface with coverBlurhash and stepBlurhashes fields
  - expo-image jest mock for downstream component tests
affects: [15-card-image-rendering, 16-cooking-mode-v2]

# Tech tracking
tech-stack:
  added: [blurhash ^2.0.5]
  patterns: [blurhash-at-build-time, expo-image-jest-mock]

key-files:
  created: []
  modified:
    - TheCook/scripts/build-images.ts
    - TheCook/app/assets/image-registry.ts
    - TheCook/__tests__/image-registry.test.ts
    - TheCook/jest/setup.ts
    - TheCook/package.json

key-decisions:
  - "Blurhash generated at build time (32x32 resize, 4x3 components) to avoid runtime cost"
  - "expo-image mocked as View for jest (Image and ImageBackground both map to View)"

patterns-established:
  - "Blurhash at build time: all placeholder strings pre-computed and embedded in registry"

requirements-completed: [IMG-03]

# Metrics
duration: 4min
completed: 2026-03-19
---

# Phase 15 Plan 01: Blurhash Pipeline & Registry Schema Summary

**Build-time blurhash generation via sharp+blurhash encode, registry schema extended with coverBlurhash/stepBlurhashes, expo-image jest mock for downstream tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-19T16:05:47Z
- **Completed:** 2026-03-19T16:09:46Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Installed blurhash as devDependency and added generateBlurhash helper (32x32 resize, 4x3 components)
- Extended RecipeImages interface with coverBlurhash and stepBlurhashes fields, regenerated registry with menemen blurhash string
- Added expo-image jest mock (Image/ImageBackground -> View) enabling downstream component test rendering
- Added 4 new test cases validating blurhash presence in generated registry (7 total, all green)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install blurhash and add expo-image jest mock** - `c1d4920` (chore)
2. **Task 2: Add blurhash generation to build-images.ts and update registry schema** - `4faee4f` (feat)

## Files Created/Modified
- `TheCook/scripts/build-images.ts` - Added blurhash import, generateBlurhash helper, blurhash generation for cover and step images, updated registry generation with blurhash fields
- `TheCook/app/assets/image-registry.ts` - Auto-regenerated with coverBlurhash and stepBlurhashes fields, menemen has real blurhash string
- `TheCook/__tests__/image-registry.test.ts` - Added 4 new test cases for blurhash field validation (coverBlurhash, stepBlurhashes, non-null check, fallback)
- `TheCook/jest/setup.ts` - Added expo-image jest mock (Image/ImageBackground -> View)
- `TheCook/package.json` - Added blurhash ^2.0.5 to devDependencies

## Decisions Made
- Blurhash generated at build time with 32x32 resize and 4x3 component dimensions -- balances quality vs string length
- expo-image mocked as plain View for jest -- sufficient for rendering without native module crashes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Registry now has blurhash fields ready for expo-image placeholder rendering in Plans 02/03
- expo-image jest mock in place for all downstream component tests
- All 7 image-registry tests green, full suite stable (3 pre-existing failures in unrelated step-content tests)

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 15-card-image-rendering*
*Completed: 2026-03-19*
