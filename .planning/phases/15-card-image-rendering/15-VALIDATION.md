---
phase: 15
slug: card-image-rendering
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.7.0 (jest-expo preset) |
| **Config file** | package.json `"jest"` section |
| **Quick run command** | `npx jest --testPathPattern="(recipe-card\|step-content\|image)" -x` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="(recipe-card|step-content|image)" -x`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | IMG-01a | unit | `npx jest __tests__/recipe-card-grid.test.ts -x` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | IMG-01b | unit | `npx jest __tests__/recipe-card-grid.test.ts -x` | ❌ W0 | ⬜ pending |
| 15-01-03 | 01 | 1 | IMG-01c | unit | `npx jest __tests__/recipe-card-row.test.ts -x` | ❌ W0 | ⬜ pending |
| 15-02-01 | 02 | 1 | IMG-02a | unit | `npx jest __tests__/step-content.test.ts -x` | ✅ (update) | ⬜ pending |
| 15-02-02 | 02 | 1 | IMG-02b | unit | `npx jest __tests__/step-content.test.ts -x` | ✅ | ⬜ pending |
| 15-03-01 | 03 | 1 | IMG-03a | unit | `npx jest __tests__/image-registry.test.ts -x` | ✅ (update) | ⬜ pending |
| 15-03-02 | 03 | 1 | IMG-03b | unit | `npx jest __tests__/recipe-card-grid.test.ts -x` | ❌ W0 | ⬜ pending |
| 15-04-01 | 01 | 1 | IMG-hero | unit | `npx jest __tests__/recipe-detail.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/recipe-card-grid.test.ts` — stubs for IMG-01a, IMG-01b, IMG-03b (card image + blurhash)
- [ ] `__tests__/recipe-card-row.test.ts` — stubs for IMG-01c (row thumbnail image)
- [ ] `__tests__/recipe-detail.test.ts` — stubs for IMG-hero (hero image rendering)
- [ ] Update `__tests__/step-content.test.ts` — update to test registry-based images (IMG-02a)
- [ ] Update `__tests__/image-registry.test.ts` — add blurhash field assertions (IMG-03a)
- [ ] Mock for expo-image in jest setup (expo-image needs native code mock)
- [ ] Framework install: `npm install --save-dev blurhash` — blurhash encoder not yet installed

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Blurhash placeholder visible during image load | IMG-03 | Visual timing; can't assert transition in unit test | Load recipe card on slow network; confirm gradient placeholder appears before image |
| Dark scrim readability over photo | IMG-01 | Visual quality judgment | View recipe card with image; confirm white text is legible over scrim |
| Hero image aspect ratio on detail screen | IMG-01 | Layout visual check | Open recipe detail; confirm hero fills width without distortion |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
