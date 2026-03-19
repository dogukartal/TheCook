---
phase: 13-image-pipeline-foundation
plan: 01
subsystem: build-pipeline
tags: [sharp, webp, image-optimization, metro, static-require, build-script]

# Dependency graph
requires: []
provides:
  - "Build-time image pipeline (scripts/build-images.ts) converting raw PNG/JPG to optimized WebP"
  - "Auto-generated image-registry.ts with static require() calls for Metro bundling"
  - "getRecipeImages() API with null-safe lookup for all 30 recipes"
  - "Prebuild chain: build-images -> build-recipes"
  - "First real recipe image: menemen-cover.webp (81KB)"
affects: [15-recipe-card-images, 14-image-content-expansion]

# Tech tracking
tech-stack:
  added: [sharp@0.34.5, "@types/sharp@0.31.1"]
  patterns: [build-time-image-pipeline, auto-generated-registry, static-require-map]

key-files:
  created:
    - TheCook/scripts/build-images.ts
    - TheCook/app/assets/image-registry.ts
    - TheCook/app/assets/images/menemen-cover.webp
    - TheCook/content/images/raw/menemen-cover.png
    - TheCook/__tests__/build-images.test.ts
    - TheCook/__tests__/image-registry.test.ts
    - TheCook/app/assets/images/.gitkeep
  modified:
    - TheCook/package.json
    - TheCook/content/recipes/menemen.yaml
    - TheCook/app/assets/recipes.json

key-decisions:
  - "sharp@0.34.5 as devDependency only -- Metro cannot bundle native bindings"
  - "First MENEMEN ChatGPT image (alphabetically) chosen as menemen-cover.png"
  - "Registry uses ImageSource = number type since Metro require() returns asset IDs"
  - "Prebuild chain: build-images runs before build-recipes to ensure registry freshness"

patterns-established:
  - "Image naming convention: {recipe-id}-cover.{ext} and {recipe-id}-step-{NN}.{ext}"
  - "Auto-generated registry: DO NOT EDIT pattern with generated timestamp"
  - "Build-time validation: YAML coverImage references checked against disk"
  - "CLI flags for testability: --raw-dir, --out-dir, --registry-path, --recipes-dir"

requirements-completed: [IMG-04]

# Metrics
duration: 4min
completed: 2026-03-19
---

# Phase 13 Plan 01: Image Pipeline Foundation Summary

**Build-time sharp pipeline converting raw PNGs to WebP (<100KB) with auto-generated TypeScript registry mapping 30 recipe IDs to static require() calls**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-19T13:46:19Z
- **Completed:** 2026-03-19T13:50:41Z
- **Tasks:** 2 (TDD + integration)
- **Files modified:** 11

## Accomplishments
- Build-time image pipeline using sharp: resizes to 800px max width, converts to WebP quality 75, produces files under 100KB
- Auto-generated image-registry.ts with static require() calls that Metro can resolve at bundle time
- getRecipeImages() API with null-safe fallback ({ cover: null, steps: [] }) for all 30 recipes
- First real recipe image (menemen-cover) flowing through the complete pipeline: raw PNG (1.9MB) to optimized WebP (81KB)
- Prebuild chain (build-images -> build-recipes) ensures images and registry are always current
- 9 tests covering WebP conversion, graceful skip, registry generation, error validation, and lookup

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing tests** - `058e341` (test)
2. **Task 1 GREEN: Image pipeline + registry implementation** - `f161f87` (feat)
3. **Task 2: YAML wiring + prebuild integration** - `ae76dad` (feat)

_TDD task had separate RED/GREEN commits as per protocol._

## Files Created/Modified
- `TheCook/scripts/build-images.ts` - Build-time image optimization pipeline and registry generator (~200 lines)
- `TheCook/app/assets/image-registry.ts` - Auto-generated static require() map for all 30 recipes
- `TheCook/app/assets/images/menemen-cover.webp` - Optimized cover image (81KB from 1.9MB source)
- `TheCook/content/images/raw/menemen-cover.png` - Standardized source image (migrated from ChatGPT naming)
- `TheCook/__tests__/build-images.test.ts` - 5 tests: WebP conversion, graceful skip, registry output, error on missing ref, summary output
- `TheCook/__tests__/image-registry.test.ts` - 4 tests: registry file existence, null fallback, cover lookup, type exports
- `TheCook/app/assets/images/.gitkeep` - Placeholder for images output directory
- `TheCook/package.json` - Added sharp devDep, build-images script, updated prebuild chain
- `TheCook/content/recipes/menemen.yaml` - Set coverImage: menemen-cover.webp
- `TheCook/app/assets/recipes.json` - Rebuilt with menemen coverImage value

## Decisions Made
- **sharp@0.34.5 as devDependency:** Metro would crash trying to bundle sharp's native C++ bindings if it were in dependencies. Build-time only.
- **First ChatGPT image chosen alphabetically:** Any of the 6 MENEMEN images works; picked the first sorted by filename for determinism.
- **ImageSource = number type:** Metro's require() returns a numeric asset ID, not a string or object. Type alias makes this clear.
- **Prebuild ordering:** build-images must run before build-recipes so the registry file exists when recipe validation checks coverImage references.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **Pre-existing test failures (3):** completion-screen.test.ts and step-content.test.ts fail due to AsyncStorage NativeModule mock issue; seed.test.ts fails due to stale seed version. All are unrelated to image pipeline changes and pre-date this plan. Not addressed per scope boundary rules.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Image pipeline is fully functional and tested
- Registry provides null-safe lookup for all 30 recipes (only menemen has actual images currently)
- Plan 13-02 can build on this foundation to add more recipe images or extend the pipeline
- Phase 15 (recipe card images) can consume getRecipeImages() directly

## Self-Check: PASSED

All 7 created files verified on disk. All 3 commit hashes found in git log.

---
*Phase: 13-image-pipeline-foundation*
*Completed: 2026-03-19*
