---
phase: 9
slug: search-category-redesign
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 + jest-expo ~54.0.17 |
| **Config file** | package.json jest config |
| **Quick run command** | `npx jest --testPathPattern=search --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=search --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 0 | DISC-03, DISC-01 | unit | `npx jest src/hooks/__tests__/useSearchScreen.test.ts --no-coverage` | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 1 | DISC-03 | unit | `npx jest --testPathPattern=search --no-coverage` | ❌ W0 | ⬜ pending |
| 09-02-02 | 02 | 1 | DISC-01 | unit | `npx jest --testPathPattern=search --no-coverage` | ❌ W0 | ⬜ pending |
| 09-03-01 | 03 | 1 | DISC-03 | unit | `npx jest --testPathPattern=search --no-coverage` | ❌ W0 | ⬜ pending |
| 09-03-02 | 03 | 1 | N/A | unit | `npx jest --testPathPattern=search --no-coverage` | ❌ W0 | ⬜ pending |
| 09-04-01 | 04 | 2 | DISC-01, DISC-03 | unit | `npx jest --testPathPattern=search --no-coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/__tests__/useSearchScreen.test.ts` — test stubs for category filtering, search composition, filter reset, dietary-only filtering
- [ ] Test helpers for mock recipe data with categories and ingredient_groups

*Existing jest infrastructure covers framework installation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Category strip horizontal scroll UX | DISC-03 | Visual scroll behavior, snap feel | Scroll category strip left/right, verify smooth scroll and tap selection |
| Filter panel expand/collapse animation | DISC-03 | Animation smoothness | Tap filter icon on category results, verify panel slides open/closed |
| Tab switch resets filters visually | N/A | Requires tab navigation simulation | Select category + filters, switch to Feed tab and back, verify reset |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
