---
phase: 4
slug: recipe-discovery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 + jest-expo ~54.0.17 |
| **Config file** | `package.json` (`jest` key) |
| **Quick run command** | `npx jest --testPathPattern="__tests__/(discovery|profile|schema)" --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="discovery" --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 0 | DISC-01, DISC-02, DISC-03, DISC-05 | unit | `npx jest --testPathPattern="discovery" --no-coverage` | ❌ W0 | ⬜ pending |
| 4-xx-xx | TBD | TBD | DISC-04 | unit | `npx jest --testPathPattern="profile" --no-coverage` | ✅ partial | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/discovery.test.ts` — stubs for DISC-01 (ingredient search logic), DISC-02 (feed ordering), DISC-03 (filter queries), DISC-05 (allergen exclusion SQL)
- [ ] DB mock or in-memory SQLite setup — follow pattern in `migration.test.ts`
- [ ] DISC-04 bookmark DB roundtrip test — add to `discovery.test.ts` or new `bookmark.test.ts`

*Note: `profile.test.ts` already has BookmarkSchema tests but DB-level add/remove/list roundtrip is missing.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tab rename renders correctly (Feed, Search, My Kitchen labels) | DISC-02 | UI visual check | Open app, verify bottom tab bar shows correct labels and icons |
| Category gradient placeholders display per category | DISC-02 | Visual/aesthetic | Browse feed, confirm each category has distinct gradient color |
| Autocomplete dropdown shows both ingredient and recipe names | DISC-01 | Interactive UX | Type partial ingredient name, verify both ingredients and recipe suggestions appear |
| Allergen exclusion on all surfaces | DISC-05 | Cross-surface audit | Set allergen profile, browse feed + search + filter — confirm no conflicting recipes appear anywhere |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
