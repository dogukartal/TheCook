# Requirements: The Cook

**Defined:** 2026-03-19
**Core Value:** The shortest path between "I want to make something different tonight" and a finished meal you are proud of.

## v1.1 Requirements

Requirements for Visual Polish & Content Ready milestone. Each maps to roadmap phases.

### Images

- [x] **IMG-01**: User sees cover image on every recipe card across feed, search, and cookbook
- [x] **IMG-02**: User sees step-specific image during cooking mode for each step
- [x] **IMG-03**: User sees smooth blurhash placeholder while images load
- [x] **IMG-04**: Recipe images are optimized (WebP, <100KB) and bundled via build pipeline with static registry

### Discovery

- [ ] **DISC-06**: User can tap "See All" on any feed section to view all recipes in that section as a vertical scrollable list
- [ ] **DISC-07**: User sees a partial 3rd card peeking on feed sections, hinting at horizontal scrollability
- [ ] **DISC-08**: User sees a subtle auto-animation on feed sections suggesting horizontal swipe
- [ ] **DISC-09**: Feed section headings show recipe count and have elegant visual separators

### Cookbook

- [ ] **BOOK-01**: User sees two tabs in Cookbook: Saved (bookmarked) and Cooked (cooking history)
- [ ] **BOOK-02**: User sees star rating on each recipe in the Cooked tab
- [ ] **BOOK-03**: User can tap to re-rate a recipe directly from the Cooked tab
- [ ] **BOOK-04**: User sees cook count on cooked recipes (e.g. "3 kez pisirdin")

### UI Polish

- [x] **UX-01**: Recipe cards have visible contrast against background in both dark and light mode
- [ ] **UX-02**: User feels haptic feedback and sees heart animation when bookmarking a recipe
- [ ] **UX-03**: Recipe cards show subtle press-down scale feedback on tap
- [ ] **UX-04**: Bottom sheet backdrop (Malzemeler, Sefim) fades in/out smoothly instead of sliding
- [ ] **UX-05**: Search filter chips show small category icon/image
- [ ] **UX-06**: Progress bar animates smoothly when navigating between cooking steps
- [ ] **UX-07**: Buttons provide visual tap feedback
- [ ] **UX-08**: Cookbook uses single-recipe-per-row layout (matching Recently Seen style)

## v1.2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Profile

- **PROF-03**: User can set cuisine preferences and app goals via profile UI (DB columns ready from v1.0)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User image upload | Curated content only; no UGC storage/moderation |
| Swipeable card stacks (Tinder-style) | Conflicts with feed browse-and-return mental model |
| Social/community ratings | Ratings are personal; social features out of scope |
| Recipe image carousel (multiple per recipe) | One cover + one per step is sufficient for 30 recipes |
| Half-star / complex rating systems | 1-5 whole stars already built, keep it simple |
| Custom page transitions between screens | Default expo-router transitions adequate; animation budget on micro-interactions |
| Pull-to-refresh on cookbook | Data is local SQLite, nothing to refresh from server |
| Calorie / macro display | Cooking enabler, not health tracker |
| Meal planning / weekly schedules | Too much friction for target audience |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| IMG-01 | Phase 15 | Complete |
| IMG-02 | Phase 15 | Complete |
| IMG-03 | Phase 15 | Complete |
| IMG-04 | Phase 13 | Complete |
| DISC-06 | Phase 16 | Pending |
| DISC-07 | Phase 16 | Pending |
| DISC-08 | Phase 16 | Pending |
| DISC-09 | Phase 16 | Pending |
| BOOK-01 | Phase 17 | Pending |
| BOOK-02 | Phase 17 | Pending |
| BOOK-03 | Phase 17 | Pending |
| BOOK-04 | Phase 17 | Pending |
| UX-01 | Phase 14 | Complete |
| UX-02 | Phase 18 | Pending |
| UX-03 | Phase 18 | Pending |
| UX-04 | Phase 18 | Pending |
| UX-05 | Phase 18 | Pending |
| UX-06 | Phase 18 | Pending |
| UX-07 | Phase 18 | Pending |
| UX-08 | Phase 17 | Pending |

**Coverage:**
- v1.1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after roadmap creation*
