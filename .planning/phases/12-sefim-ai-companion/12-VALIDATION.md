---
phase: 12
slug: sefim-ai-companion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 + jest-expo ~54.0.17 |
| **Config file** | package.json `jest` section |
| **Quick run command** | `npx jest --testPathPattern=sefim -x` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=sefim -x`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | COOKX-04 | unit | `npx jest --testPathPattern=recipe.test -x` | ✅ (extend) | ⬜ pending |
| 12-01-02 | 01 | 1 | COOKX-04 | unit | `npx jest --testPathPattern=sefim -x` | ❌ W0 | ⬜ pending |
| 12-02-01 | 02 | 1 | COOKX-04 | unit | `npx jest --testPathPattern=sefim -x` | ❌ W0 | ⬜ pending |
| 12-02-02 | 02 | 1 | COOKX-04 | unit | `npx jest --testPathPattern=sefim -x` | ❌ W0 | ⬜ pending |
| 12-03-01 | 03 | 2 | COOKX-05 | unit | `npx jest --testPathPattern=sefim -x` | ❌ W0 | ⬜ pending |
| 12-03-02 | 03 | 2 | COOKX-05 | unit | `npx jest --testPathPattern=sefim -x` | ❌ W0 | ⬜ pending |
| 12-03-03 | 03 | 2 | COOKX-05 | manual | N/A | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/__tests__/useSefim.test.ts` — stubs for COOKX-04 (chip tap, open question) and COOKX-05 (context assembly, linger detection)
- [ ] Extend existing recipe schema tests for sefimQA field validation

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Off-topic question redirection | COOKX-05 | LLM behavior depends on system prompt; non-deterministic | Send off-topic question (e.g., "Hava nasıl?") via open text; verify Sef'im redirects to recipe |
| Voice input Turkish recognition | COOKX-04 | Requires real device microphone and OS speech engine | Use voice button on physical device; speak cooking question in Turkish; verify transcription accuracy |
| Pulse animation visual quality | COOKX-05 | Animation timing/feel is subjective | Linger on a step for 2+ minutes; verify chef-hat icon pulses visibly and stops on interaction |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
