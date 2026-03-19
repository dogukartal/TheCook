---
phase: 13
slug: image-pipeline-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.7.0 (jest-expo preset) |
| **Config file** | package.json `"jest"` section |
| **Quick run command** | `npx jest --testPathPattern="image" -x` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="image" -x`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 0 | IMG-04 | unit | `npx jest __tests__/build-images.test.ts -x` | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 0 | IMG-04 | unit | `npx jest __tests__/image-registry.test.ts -x` | ❌ W0 | ⬜ pending |
| 13-01-03 | 01 | 1 | IMG-04 | unit | `npx jest __tests__/build-images.test.ts -x` | ❌ W0 | ⬜ pending |
| 13-01-04 | 01 | 1 | IMG-04 | unit | `npx jest __tests__/image-registry.test.ts -x` | ❌ W0 | ⬜ pending |
| 13-01-05 | 01 | 1 | IMG-04 | smoke | `npx expo export --platform ios && ls dist/assets/` | ❌ manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/build-images.test.ts` — stubs for IMG-04 (build script produces WebP under 100KB, YAML coverImage validated)
- [ ] `__tests__/image-registry.test.ts` — stubs for IMG-04 (registry maps recipe IDs to require() calls)
- [ ] `npm install --save-dev sharp @types/sharp` — sharp not yet installed

*Wave 0 must complete before any implementation tasks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Production build resolves images | IMG-04 | EAS/expo export requires full build environment | Run `npx expo export --platform ios`, verify `dist/assets/` contains WebP files, open in simulator to confirm image rendering |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
