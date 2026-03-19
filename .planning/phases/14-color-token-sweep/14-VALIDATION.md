---
phase: 14
slug: color-token-sweep
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 with jest-expo preset |
| **Config file** | `package.json` jest section |
| **Quick run command** | `npx jest --testPathPattern=theme --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage` + `bash scripts/audit-colors.sh`
- **Before `/gsd:verify-work`:** Full suite must be green + audit-colors returns 0
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | UX-01 | unit | `npx jest --testPathPattern=theme-tokens --no-coverage` | ❌ W0 | ⬜ pending |
| 14-01-02 | 01 | 1 | UX-01 | static analysis | `bash scripts/audit-colors.sh` | ❌ W0 | ⬜ pending |
| 14-02-01 | 02 | 1 | UX-01 | static analysis | `grep -r 'CATEGORY_GRADIENTS' TheCook/ --include="*.tsx" \| grep -v palette.ts \| grep -v node_modules` | ❌ W0 | ⬜ pending |
| 14-03-01 | 03 | 2 | UX-01 | visual | Manual dark mode card check | Manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/theme-tokens.test.ts` — token key parity between Colors.light and Colors.dark (UX-01-b)
- [ ] `scripts/audit-colors.sh` — grep-based static analysis that returns non-zero on hardcoded hex violations (UX-01-a, UX-01-d)

*These must be created before any sweep work begins.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Recipe cards distinguishable from background in dark mode | UX-01 | Visual contrast requires human judgment | 1. Open app in dark mode 2. Navigate to feed 3. Verify card edges are visible against background 4. Check both grid and row layouts |
| Recipe cards distinguishable from background in light mode | UX-01 | Visual contrast requires human judgment | 1. Open app in light mode 2. Navigate to feed 3. Verify cards have clear boundaries |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
