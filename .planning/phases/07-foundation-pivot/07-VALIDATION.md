---
phase: 7
slug: foundation-pivot
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 with jest-expo ~54.0.17 |
| **Config file** | package.json "jest" section |
| **Quick run command** | `npx jest --testPathPattern="hard-filter\|cookbook\|hook" --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="hard-filter\|cookbook\|hook" --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 0 | DISC-05 | unit | `npx jest __tests__/hard-filter.test.ts -t "allergen exclusion on bookmarks" -x` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 0 | PROF-01 | unit | `npx jest __tests__/hard-filter.test.ts -t "skill level hard filter" -x` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 0 | PROF-02 | unit | `npx jest __tests__/hard-filter.test.ts -t "equipment hard filter" -x` | ❌ W0 | ⬜ pending |
| 07-01-04 | 01 | 0 | PROF-03 | unit | `npx jest __tests__/profile.test.ts -t "cuisine_preferences\|app_goals" -x` | ❌ W0 | ⬜ pending |
| 07-xx-xx | xx | x | NAV-01 | manual | Visual verification on device | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/hard-filter.test.ts` — stubs for DISC-05, PROF-01, PROF-02 (hard filter query logic)
- [ ] `__tests__/profile.test.ts` — extend with cuisine_preferences and app_goals column tests (PROF-03)
- [ ] `__tests__/migration.test.ts` — extend with DB_VERSION 5 migration test
- [ ] No new framework install needed — Jest already configured

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 4-tab navigation (Feed / Search / Cookbook / Profile) | NAV-01 | UI layout verified visually | 1. Launch app 2. Verify 4 tabs visible 3. Tap each tab confirms correct screen |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
