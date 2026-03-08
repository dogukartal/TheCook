---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest-expo (Jest preset for Expo SDK 52) |
| **Config file** | `package.json` `"jest": { "preset": "jest-expo" }` — created in Wave 0 |
| **Quick run command** | `npx jest --testPathPattern="schema\|seed" --passWithNoTests` |
| **Full suite command** | `npx jest --passWithNoTests` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="schema\|seed" --passWithNoTests`
- **After every plan wave:** Run `npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-xx-01 | schema | 1 | CONT-02 | unit | `npx jest __tests__/schema.test.ts -t "validates complete recipe"` | ❌ W0 | ⬜ pending |
| 1-xx-02 | schema | 1 | CONT-02 | unit | `npx jest __tests__/schema.test.ts -t "rejects incomplete step"` | ❌ W0 | ⬜ pending |
| 1-xx-03 | schema | 1 | CONT-02 | unit | `npx jest __tests__/schema.test.ts -t "rejects invalid unit"` | ❌ W0 | ⬜ pending |
| 1-xx-04 | schema | 1 | CONT-02 | unit | `npx jest __tests__/schema.test.ts -t "rejects invalid allergen"` | ❌ W0 | ⬜ pending |
| 1-xx-05 | schema | 1 | CONT-02 | unit | `npx jest __tests__/schema.test.ts -t "rejects invalid equipment"` | ❌ W0 | ⬜ pending |
| 1-xx-06 | seed | 2 | CONT-02 | unit | `npx jest __tests__/seed.test.ts -t "seeds database on first launch"` | ❌ W0 | ⬜ pending |
| 1-xx-07 | seed | 2 | CONT-02 | unit | `npx jest __tests__/seed.test.ts -t "skips seed when version matches"` | ❌ W0 | ⬜ pending |
| 1-xx-08 | content | 1 | CONT-02 | integration | `npx jest __tests__/validator.test.ts` | ❌ W0 | ⬜ pending |
| 1-xx-09 | content | 1 | CONT-02 | integration | `npx jest __tests__/buildScript.test.ts` | ❌ W0 | ⬜ pending |
| 1-xx-10 | bootstrap | 0 | (bootstrap) | manual | `npx expo run:ios / npx expo run:android` | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/schema.test.ts` — stubs for CONT-02 schema shape, enum validation, safeParse behavior
- [ ] `__tests__/seed.test.ts` — covers seeding logic with in-memory SQLite mock
- [ ] `__tests__/validator.test.ts` — covers CLI validator exit codes
- [ ] `__tests__/buildScript.test.ts` — covers build-recipes output
- [ ] `package.json` jest config block — `"preset": "jest-expo"`
- [ ] Framework install: `npx expo install jest-expo jest @types/jest @testing-library/react-native --save-dev`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Expo app launches on iOS/Android without crash | (bootstrap) | Requires device/simulator, cannot automate in CI for Phase 1 | Run `npx expo run:ios` and `npx expo run:android`; verify app opens without red screen |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
