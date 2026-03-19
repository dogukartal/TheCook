---
phase: 16
slug: feed-see-all-discovery-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 |
| **Config file** | package.json (jest key) |
| **Quick run command** | `npx jest __tests__/feed-section.test.ts __tests__/see-all-screen.test.ts --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest __tests__/feed-section.test.ts __tests__/see-all-screen.test.ts --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | DISC-07 | unit | `npx jest __tests__/feed-section-peek.test.ts -x` | ❌ W0 | ⬜ pending |
| 16-01-02 | 01 | 1 | DISC-08 | manual | N/A — requires device observation | N/A | ⬜ pending |
| 16-01-03 | 01 | 1 | DISC-09 | unit | `npx jest __tests__/feed-section.test.ts -x` | ❌ W0 | ⬜ pending |
| 16-02-01 | 02 | 1 | DISC-06 | unit | `npx jest __tests__/see-all-screen.test.ts -x` | ❌ W0 | ⬜ pending |
| 16-02-02 | 02 | 1 | DISC-06 | unit | `npx jest __tests__/see-all-screen.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/see-all-screen.test.ts` — stubs for DISC-06 (hook data logic, invalid key handling)
- [ ] `__tests__/feed-section-peek.test.ts` — stubs for DISC-07 (card width calculation)
- [ ] `__tests__/feed-section.test.ts` — extend existing: add count display tests for DISC-09

*Existing infrastructure covers framework installation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Scroll hint animation fires once per mount | DISC-08 | Requires visual observation of animated scrollToOffset | 1. Open feed tab 2. Observe each section nudges right then back 3. Navigate away and return — animation should NOT replay |
| Partial 3rd card peek is visually clear | DISC-07 | Width calculation testable but visual result needs device check | 1. Open feed tab on iPhone SE and iPhone Pro Max 2. Verify ~30-40px of 3rd card visible at right edge |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
