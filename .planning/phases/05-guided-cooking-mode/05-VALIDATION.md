---
phase: 5
slug: guided-cooking-mode
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 + jest-expo ~54.0.17 |
| **Config file** | package.json `jest` section |
| **Quick run command** | `npx jest --testPathPattern="cooking" -x` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="cooking" -x`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 0 | COOK-01 | unit | `npx jest __tests__/cooking-session.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 0 | COOK-04 | unit | `npx jest __tests__/cooking-timer.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 0 | COOK-02, COOK-03 | unit | `npx jest __tests__/step-content.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/cooking-session.test.ts` — stubs for COOK-01: session CRUD, save/resume/clear
- [ ] `__tests__/cooking-timer.test.ts` — stubs for COOK-04: timestamp-based timer logic, pause/resume, background recalculation
- [ ] `__tests__/step-content.test.ts` — stubs for COOK-02, COOK-03: step content rendering (instruction, why, looksLikeWhenDone, commonMistake, recovery)
- [ ] DB migration test update in `__tests__/migration.test.ts` — add cooking_sessions table assertion

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Screen stays awake during cooking | COOK-04 | expo-keep-awake requires device | 1. Enter cooking mode 2. Leave phone idle 3. Verify screen stays on |
| Timer notification when app killed | COOK-04 | Notification delivery requires device | 1. Start timer 2. Kill app 3. Wait for timer end 4. Verify notification |
| Swipe between steps feels native | COOK-01 | Gesture feel is subjective | 1. Enter cooking mode 2. Swipe through steps 3. Verify smooth page transitions |
| Session resume after app kill | COOK-01 | Process death requires device test | 1. Start cooking 2. Force-kill app 3. Reopen 4. Verify same step shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
