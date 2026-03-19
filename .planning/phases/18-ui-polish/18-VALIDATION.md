---
phase: 18
slug: ui-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 + jest-expo ~54.0.17 + @testing-library/react-native ^13.3.3 |
| **Config file** | package.json `jest` key + jest/setup.ts |
| **Quick run command** | `npx jest --testPathPattern="(animated-heart\|animated-pressable\|sheet-backdrop\|category-chip\|progress-bar)" --no-coverage -x` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="(animated-heart|animated-pressable|sheet-backdrop|category-chip|progress-bar)" --no-coverage -x`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 0 | UX-02 | unit | `npx jest __tests__/animated-heart.test.ts -x` | ❌ W0 | ⬜ pending |
| 18-01-02 | 01 | 0 | UX-03, UX-07 | unit | `npx jest __tests__/animated-pressable.test.ts -x` | ❌ W0 | ⬜ pending |
| 18-01-03 | 01 | 0 | UX-04 | unit | `npx jest __tests__/sheet-backdrop.test.ts -x` | ❌ W0 | ⬜ pending |
| 18-01-04 | 01 | 0 | UX-05 | unit | `npx jest __tests__/category-chip-icons.test.ts -x` | ❌ W0 | ⬜ pending |
| 18-01-05 | 01 | 0 | UX-06 | unit | `npx jest __tests__/progress-bar-animated.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/animated-heart.test.ts` — stubs for UX-02 (haptic mock + animation trigger)
- [ ] `__tests__/animated-pressable.test.ts` — stubs for UX-03, UX-07 (onPressIn/onPressOut scale callback)
- [ ] `__tests__/sheet-backdrop.test.ts` — stubs for UX-04 (no animationType="slide" in rendered output)
- [ ] `__tests__/category-chip-icons.test.ts` — stubs for UX-05 (icon renders next to label)
- [ ] `__tests__/progress-bar-animated.test.ts` — stubs for UX-06 (Animated.View used for segments)
- [ ] Mock for `expo-haptics` in relevant test files

*Existing infrastructure covers framework installation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Heart animation feels right visually | UX-02 | Spring physics tuning is subjective | Tap bookmark icon, verify pop-and-settle looks good |
| Haptic tap feels appropriate | UX-02 | Haptics cannot be tested in simulator | Run on physical device, verify Light impact feels right |
| Card press-down feels responsive | UX-03 | Spring feel is subjective | Tap recipe card, verify subtle scale-down before navigation |
| Sheet backdrop fade timing | UX-04 | Smooth transition is perceptual | Open/close bottom sheets, verify no flash or jump |
| Progress bar segment transition | UX-06 | Smooth color/width animation is perceptual | Navigate cooking steps, verify no jumping |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
