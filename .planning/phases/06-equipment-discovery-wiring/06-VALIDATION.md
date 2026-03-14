---
phase: 6
slug: equipment-discovery-wiring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 + jest-expo ~54.0.17 |
| **Config file** | `package.json` (`jest` key) |
| **Quick run command** | `npx jest --testPathPattern="equipment-filter" --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="equipment-filter" --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 0 | ONBRD-03 | unit | `npx jest --testPathPattern="equipment-filter" --no-coverage` | ❌ W0 | ⬜ pending |
| 6-01-02 | 01 | 1 | ONBRD-03 | unit | `npx jest --testPathPattern="equipment-filter" --no-coverage` | ❌ W0 | ⬜ pending |
| 6-01-03 | 01 | 1 | ONBRD-03 | unit | `npx jest --testPathPattern="equipment-filter" --no-coverage` | ❌ W0 | ⬜ pending |
| 6-02-01 | 02 | 1 | ONBRD-03 | unit | `npx jest --testPathPattern="equipment-filter" --no-coverage` | ❌ W0 | ⬜ pending |
| 6-02-02 | 02 | 1 | ONBRD-03 | unit | `npx jest --testPathPattern="equipment-filter" --no-coverage` | ❌ W0 | ⬜ pending |
| 6-03-01 | 03 | 2 | ONBRD-03 | manual | Visual inspection — equipment badge visible on card | n/a | ⬜ pending |
| 6-03-02 | 03 | 2 | ONBRD-03 | manual | Visual inspection — no badge on compatible recipes | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/equipment-filter.test.ts` — stubs covering all 5 ONBRD-03 unit behaviors:
  - Equipment de-prioritization: incompatible recipes sort to end
  - Equipment indicator: `hasMissingEquipment` true when recipe.equipment not subset of userEquipment
  - Allergen + equipment compose: allergen-excluded recipes don't appear in equipment-sorted list
  - Empty `recipe.equipment` array never triggers equipment warning
  - Empty `filter.equipment` (user declared nothing) skips sorting

*Existing `discovery.test.ts` tests are unaffected — no modification needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Equipment warning badge visible on Feed card | ONBRD-03 | React Native UI rendering | Open Feed, ensure profile has limited equipment, verify badge shows on recipes requiring unlisted equipment |
| Equipment warning badge visible on Search results | ONBRD-03 | React Native UI rendering | Run search, verify badge on incompatible recipes |
| Equipment warning badge visible on My Kitchen cards | ONBRD-03 | React Native UI rendering | Open My Kitchen bookmarks, verify badge on incompatible saved recipes |
| Compatible recipes show no badge | ONBRD-03 | React Native UI rendering | Verify recipes where all equipment is declared show no warning |
| Allergen filter still works with equipment filter active | ONBRD-03 | Integration — requires live DB | Declare an allergen, verify allergen-excluded recipes don't appear; equipment badge functions independently |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
