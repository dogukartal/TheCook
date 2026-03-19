---
phase: 17
slug: cookbook-saved-cooked-tabs
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.7.0 + jest-expo ~54.0.17 + @testing-library/react-native ^13.3.3 |
| **Config file** | package.json `"jest"` section + `jest/setup.ts` |
| **Quick run command** | `npx jest --testPathPattern="cookbook" --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="cookbook" --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | BOOK-01 | unit (hook) | `npx jest __tests__/cookbook-tabs.test.ts -x` | ❌ W0 | ⬜ pending |
| 17-01-02 | 01 | 1 | BOOK-02 | unit (hook) | `npx jest __tests__/cookbook-tabs.test.ts -x` | ❌ W0 | ⬜ pending |
| 17-01-03 | 01 | 1 | BOOK-03 | unit (hook + db) | `npx jest __tests__/cookbook-tabs.test.ts -x` | ❌ W0 | ⬜ pending |
| 17-01-04 | 01 | 1 | BOOK-04 | unit (hook) | `npx jest __tests__/cookbook-tabs.test.ts -x` | ❌ W0 | ⬜ pending |
| 17-01-05 | 01 | 1 | UX-08 | unit (component) | `npx jest __tests__/cookbook-tabs.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/cookbook-tabs.test.ts` — stubs for BOOK-01, BOOK-02, BOOK-03, BOOK-04, UX-08
- [ ] `__tests__/cooking-history-queries.test.ts` — covers getCookedRecipesWithMeta, updateLatestRating DB functions
- [ ] AsyncStorage mock per-test file (consistent with project pattern)

*Existing infrastructure covers test framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tab switching feels instant | BOOK-01 (SC-1) | Performance perception is subjective | Switch between Saved and Cooked tabs; verify no visible loading skeleton or flicker |
| Star rating tap target feels natural | BOOK-03 | Touch target UX is visual | Tap each star in Cooked tab; verify tappable area is comfortable |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
