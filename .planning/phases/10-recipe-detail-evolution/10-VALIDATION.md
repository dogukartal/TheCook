---
phase: 10
slug: recipe-detail-evolution
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 + jest-expo ~54.0.17 |
| **Config file** | package.json `jest` section |
| **Quick run command** | `npx jest --testPathPattern=adaptation --no-coverage -x` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=adaptation --no-coverage -x`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | ADAPT-01 | unit | `npx jest __tests__/recipe-adaptation.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | ADAPT-01 | unit | `npx jest __tests__/cooking-session.test.ts -x` | ✅ (extend) | ⬜ pending |
| 10-01-03 | 01 | 1 | ADAPT-02 | unit | `npx jest __tests__/recipe-adaptation.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-01-04 | 01 | 1 | ADAPT-02 | unit | `npx jest __tests__/recipe-adaptation.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-01-05 | 01 | 1 | ADAPT-03 | unit | `npx jest __tests__/recipe-adaptation.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-01-06 | 01 | 1 | ADAPT-03 | unit | `npx jest __tests__/recipe-adaptation.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/recipe-adaptation.test.ts` — stubs for ADAPT-01, ADAPT-02, ADAPT-03 (pure logic: scaling, swaps, variable resolution)
- [ ] Extend `__tests__/cooking-session.test.ts` — adapted servings/swaps persistence tests
- [ ] Extend `__tests__/schema.test.ts` — validate new `alternatives` and `scalable` fields

*Existing test infrastructure covers framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stepper visual disabled state | ADAPT-01 | Visual styling | Verify minus disabled at 1, plus disabled at max |
| Swap button only on alternatives | ADAPT-02 | UI conditional render | Check ingredients with/without alternatives array |
| Start Cooking from both locations | ADAPT-01 | Navigation flow | Tap from main screen and from ingredients bottom sheet |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
