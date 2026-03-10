---
phase: 3
slug: content-library
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 + jest-expo ~54.0.17 |
| **Config file** | `TheCook/package.json` (`"jest": { "preset": "jest-expo" }`) |
| **Quick run command** | `cd TheCook && npx jest --testPathPattern="schema|validator|buildScript|seed" --no-coverage` |
| **Full suite command** | `cd TheCook && npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every recipe authored:** Run `npm run validate-recipes` (Hira runs as QA gate)
- **After every plan wave:** Run `cd TheCook && npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green + all 30+ recipes pass validate-recipes
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | CONT-01 | unit | `cd TheCook && npx jest __tests__/seed.test.ts --no-coverage` | ✅ | ⬜ pending |
| 3-01-02 | 01 | 1 | CONT-01 | integration | `cd TheCook && npm run build-recipes` | ✅ | ⬜ pending |
| 3-02-01 | 02 | 1 | CONT-01 | integration | `cd TheCook && npm run validate-recipes` | ✅ | ⬜ pending |
| 3-02-02 | 02 | 1 | CONT-01 | integration | `cd TheCook && npm run validate-recipes` | ✅ | ⬜ pending |
| 3-02-03 | 02 | 1 | CONT-01 | integration | `cd TheCook && npm run validate-recipes` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `TheCook/__tests__/seed.test.ts` — add test: "seeds new version when SEED_VERSION bumped (version mismatch triggers re-seed)" — covers version bump path critical to Phase 3 delivery

*Severity: LOW — existing "seeds on first launch" test covers same code path; version mismatch check (`existing?.version !== SEED_VERSION`) is true in both cases.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 30+ recipes visible in app after fresh install | CONT-01 | Requires device/simulator | Install fresh build, open app, count recipes shown in list |
| All categories have at least 1 recipe (no empty state) | CONT-01 | UI verification | Tap each category filter, verify results appear |
| Recipe step fields all populated (instruction, why, looks-like-when-done, common-mistake) | CONT-01 | Content QA | Spot-check 3 recipes across skill levels for missing fields |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
