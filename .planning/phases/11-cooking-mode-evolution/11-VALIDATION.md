---
phase: 11
slug: cooking-mode-evolution
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 + jest-expo ~54.0.17 |
| **Config file** | TheCook/jest.config.js (or package.json jest section) |
| **Quick run command** | `npx jest --testPathPattern="(step-content|schema|cooking-history|completion)" --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="(step-content|schema|cooking-history|completion)" --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 0 | COOKX-02 | unit | `npx jest __tests__/schema.test.ts --no-coverage` | ✅ (needs new cases) | ⬜ pending |
| 11-01-02 | 01 | 1 | COOKX-01 | unit | `npx jest __tests__/step-content.test.ts --no-coverage` | ✅ (needs new cases) | ⬜ pending |
| 11-01-03 | 01 | 1 | COOKX-02 | unit | `npx jest __tests__/step-content.test.ts --no-coverage` | ✅ (needs new cases) | ⬜ pending |
| 11-02-01 | 02 | 1 | COOKX-03 | unit | `npx jest __tests__/completion-screen.test.ts --no-coverage` | ❌ W0 | ⬜ pending |
| 11-02-02 | 02 | 1 | COOKX-03 | unit | `npx jest __tests__/cooking-history.test.ts --no-coverage` | ❌ W0 | ⬜ pending |
| 11-02-03 | 02 | 1 | COOKX-03 | integration | Manual verification | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] New test cases in `__tests__/schema.test.ts` — stubs for COOKX-02 (checkpoint/warning schema validation)
- [ ] New test cases in `__tests__/step-content.test.ts` — stubs for COOKX-01 (image rendering) and COOKX-02 (checkpoint/warning rendering)
- [ ] `__tests__/cooking-history.test.ts` — stubs for COOKX-03 (logCookingCompletion with rating)
- [ ] `__tests__/completion-screen.test.ts` — stubs for COOKX-03 (star rating widget, celebration screen)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Completing final step navigates to celebration screen | COOKX-03 | Navigation flow requires running app | 1. Open a recipe in cooking mode 2. Swipe through all steps 3. Verify celebration screen appears |
| Exit triggers confirmation modal | COOKX-03 | Modal interaction requires running app | 1. Enter cooking mode 2. Press back/close 3. Verify Alert.alert confirmation appears |
| Nav bar hidden during cooking | COOKX-03 | Visual layout check | 1. Enter cooking mode 2. Verify bottom tab bar is not visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
