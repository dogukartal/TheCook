---
phase: 8
slug: feed-redesign
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 + jest-expo ~54.0.17 |
| **Config file** | package.json `jest` section |
| **Quick run command** | `npx jest --testPathPattern=feed-section --no-coverage -x` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=feed-section --no-coverage -x`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | FEED-01a | unit | `npx jest --testPathPattern=migration -x` | ✅ (needs update) | ⬜ pending |
| 08-01-02 | 01 | 1 | FEED-01b | unit | `npx jest --testPathPattern=feed-section -x` | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 1 | FEED-01c | unit | `npx jest --testPathPattern=feed-section -x` | ❌ W0 | ⬜ pending |
| 08-01-04 | 01 | 1 | FEED-01d | unit | `npx jest --testPathPattern=feed-section -x` | ❌ W0 | ⬜ pending |
| 08-01-05 | 01 | 1 | FEED-01e | unit | `npx jest --testPathPattern=feed-section -x` | ❌ W0 | ⬜ pending |
| 08-01-06 | 01 | 1 | FEED-01f | unit | `npx jest --testPathPattern=hard-filter -x` | ✅ | ⬜ pending |
| 08-02-01 | 02 | 2 | FEED-02a | unit | `npx jest --testPathPattern=feed-section -x` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 2 | FEED-02b | unit | `npx jest --testPathPattern=feed-section -x` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 2 | DISC-02 | manual | Manual — visual verification | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/feed-section.test.ts` — stubs for FEED-01b, FEED-01c, FEED-01d, FEED-01e, FEED-02a, FEED-02b
- [ ] Update `__tests__/migration.test.ts` — covers FEED-01a (DB_VERSION 6 migration with cooking_history)

*Existing infrastructure covers hard filter testing (FEED-01f).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Feed provides browsable recipe discovery without ingredient input | DISC-02 | Visual/UX verification of horizontal sections and scroll behavior | 1. Open feed tab 2. Verify 4 named sections visible 3. Scroll each section horizontally 4. Verify no ingredient input required |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
