# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — The Cook MVP

**Shipped:** 2026-03-19
**Phases:** 12 | **Plans:** 47 | **Timeline:** 11 days

### What Was Built
- Offline-first Turkish cooking companion with 30 curated recipes
- Full onboarding + profile with hard filters (skill, equipment, allergens)
- 4-tab app: Feed (4 horizontal sections), Search (category strip + filters), Cookbook, Profile
- Guided cooking mode with step-by-step PagerView, timers, session persistence
- Recipe adaptation: serving scaler, ingredient substitution, dynamic variables in step copy
- Sef'im AI companion: per-step Q&A chips (instant), live AI via Edge Function, voice input, linger pulse

### What Worked
- Wave-based parallel execution let independent plans run simultaneously (Phases 8+9 in parallel)
- Screen data hooks pattern enabled clean separation — screens are thin rendering shells
- YAML → JSON → SQLite pipeline made content authoring independent from development
- TDD approach caught schema issues early (Zod validation at build time, not runtime)
- Checkpoint-based verification at end of each phase prevented gap accumulation

### What Was Inefficient
- Phase 6 (equipment wiring) was a gap closure that should have been part of Phase 4 — equipment was in profile but never consumed by queries
- PROF-03 (cuisine preferences UI) was mapped to Phase 7 but only DB columns shipped — requirement text implied full UI but phase scope said "no UI yet"
- Dead code accumulated (settings.tsx, unused cookbook hook exports) when Phase 7 restructured tabs — should have cleaned up in same phase
- seed.test.ts version assertions went stale after Phase 12 bumped SEED_VERSION — no automated check for test/source version sync

### Patterns Established
- Screen hook extraction: every screen has a `use{Screen}Screen` hook that owns all state, effects, and handlers
- Hard filter composition: skill ceiling + equipment exclusion + allergen exclusion all compose via `buildHardFilterClauses`
- Steps JSON column: new per-step fields (sefimQA, checkpoint, warning) added to StepSchema without DB migrations
- Content pipeline: YAML (human edits) → Zod validation → recipes.json → SQLite seed

### Key Lessons
1. Map requirements to phases precisely — "DB columns ready, no UI yet" is not the same as "user can declare preferences"
2. Clean up dead code in the same phase that creates it — orphaned routes and unused exports accumulate silently
3. Wave-based execution with gap closure plans is effective for fixing verification failures without re-planning entire phases
4. Pre-loaded + AI hybrid pattern (Sef'im) gives instant UX for common cases while keeping the door open for complex queries

### Cost Observations
- Model mix: ~70% opus, ~25% sonnet (verifiers), ~5% haiku
- Sessions: ~15 across 11 days
- Notable: Parallel agent execution (research, planning, execution) significantly reduced wall-clock time per phase

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Timeline | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 11 days | 12 | Established GSD workflow with wave-based parallel execution |

### Cumulative Quality

| Milestone | Req Satisfied | Tech Debt Items | Gap Closures |
|-----------|--------------|-----------------|--------------|
| v1.0 | 30/31 (97%) | 9 | 2 (Phase 6, Plan 12-04) |

### Top Lessons (Verified Across Milestones)

1. Screen data hooks pattern scales well — every new screen follows the same extraction pattern
2. YAML content pipeline decouples content creation from development effectively
