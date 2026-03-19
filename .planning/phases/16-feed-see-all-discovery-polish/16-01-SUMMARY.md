---
phase: 16-feed-see-all-discovery-polish
plan: 01
subsystem: ui
tags: [react-native, flatlist, scroll-hint, card-peek, feed-section, see-all]

# Dependency graph
requires:
  - phase: 15-card-image-rendering
    provides: RecipeCardGrid with expo-image and cover rendering
provides:
  - "calculateCardWidth() pure function for dynamic ~2.3 card peek sizing"
  - "FeedSection with sectionKey, sectionIndex, isLast, count display, See All button"
  - "Scroll hint animation via FlatList scrollToOffset (staggered per section)"
  - "Visual separator between feed sections"
affects: [16-02-PLAN, feed-section, see-all-screen]

# Tech tracking
tech-stack:
  added: []
  patterns: [scrollToOffset-hint-animation, dynamic-card-width-calculation]

key-files:
  created:
    - "TheCook/__tests__/feed-section-peek.test.ts"
  modified:
    - "TheCook/components/ui/feed-section.tsx"
    - "TheCook/app/(tabs)/index.tsx"
    - "TheCook/__tests__/feed-section.test.ts"

key-decisions:
  - "scrollToOffset chosen over Reanimated translateX for scroll hint (native FlatList behavior, simpler)"
  - "Card width ~150px via formula (screenWidth - 2*16 + 12) / 2.3 - 12 for ~2.3 visible cards"
  - "AsyncStorage mock added per-test file (consistent with project pattern from Phase 15-03)"

patterns-established:
  - "calculateCardWidth(screenWidth): pure exported function for dynamic card sizing across all feed surfaces"
  - "FlatList scrollToOffset hint: staggered 600ms + index*600ms delay, scrolls 30px out and back"

requirements-completed: [DISC-07, DISC-08, DISC-09]

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 16 Plan 01: Feed Section UI Polish Summary

**Dynamic card peek sizing (~2.3 cards visible), scroll hint animation via scrollToOffset, recipe count in headings, "Tumunu Gor" See All button, and section separators**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-19T18:21:12Z
- **Completed:** 2026-03-19T18:24:55Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Card width dynamically calculated to show ~2.3 cards with clear 3rd card peek on all iPhone sizes (375-430px)
- Section headings display recipe count and "Tumunu Gor >" button for sections with >2 recipes
- Scroll hint animation fires once per section on mount with staggered delay
- Thin separator between sections using colors.separator token (none after last section)
- 13 tests pass (4 new peek tests + 1 new data.length test + 8 existing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add peek width calculation tests and extend feed-section tests** - `9ddbdbe` (test) [TDD RED]
2. **Task 2: Enhance FeedSection with peek, animation, count, separator, and See All button** - `72dbda3` (feat) [TDD GREEN]

## Files Created/Modified
- `TheCook/__tests__/feed-section-peek.test.ts` - Card width calculation tests for 3 iPhone sizes
- `TheCook/__tests__/feed-section.test.ts` - Extended with data.length accessibility test
- `TheCook/components/ui/feed-section.tsx` - Enhanced with peek sizing, scroll hint, count, See All, separator
- `TheCook/app/(tabs)/index.tsx` - Passes sectionKey, sectionIndex, isLast to FeedSection; skeleton uses dynamic width

## Decisions Made
- Used scrollToOffset for scroll hint instead of Reanimated translateX (simpler, uses native FlatList behavior, flashes scroll indicator naturally)
- Card width formula: Math.floor((screenWidth - 32 + 12) / 2.3 - 12) produces ~150px on iPhone 15, showing clear peek
- AsyncStorage mock added per-test (consistent with Phase 15-03 project pattern, not global setup)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- FeedSection now exposes sectionKey for "See All" navigation via router.push(/feed/${sectionKey})
- Plan 16-02 can build the /feed/[section] route knowing FeedSection already links to it
- calculateCardWidth exported and tested, reusable on See All screen if needed
- All pre-existing test failures and TS errors remain unchanged (not in scope)

---
*Phase: 16-feed-see-all-discovery-polish*
*Completed: 2026-03-19*
