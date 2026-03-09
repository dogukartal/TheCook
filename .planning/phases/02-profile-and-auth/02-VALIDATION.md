---
phase: 2
slug: profile-and-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.7.0 + jest-expo ~54.0.17 |
| **Config file** | `TheCook/package.json` (jest key), `TheCook/jest/setup.ts` |
| **Quick run command** | `cd TheCook && npx jest --passWithNoTests` |
| **Full suite command** | `cd TheCook && npx jest` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd TheCook && npx jest --passWithNoTests`
- **After every plan wave:** Run `cd TheCook && npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 0 | ONBRD-01, ONBRD-02, ONBRD-03 | unit | `cd TheCook && npx jest __tests__/profile.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 0 | AUTH-01 | unit | `cd TheCook && npx jest __tests__/migration.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 0 | AUTH-02, AUTH-03 | unit (mock Supabase) | `cd TheCook && npx jest __tests__/sync.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 1 | AUTH-01 | unit | `cd TheCook && npx jest __tests__/migration.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 1 | ONBRD-01, ONBRD-02, ONBRD-03 | unit | `cd TheCook && npx jest __tests__/profile.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 2 | AUTH-02, AUTH-03 | unit (mock Supabase) | `cd TheCook && npx jest __tests__/sync.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `TheCook/__tests__/profile.test.ts` — stubs for ONBRD-01, ONBRD-02, ONBRD-03: ProfileSchema validation, default values, allergen opt-in constraint
- [ ] `TheCook/__tests__/migration.test.ts` — stubs for AUTH-01: DB_VERSION 2 creates profile + bookmarks tables; profile row seeded with defaults
- [ ] `TheCook/__tests__/sync.test.ts` — stubs for AUTH-02, AUTH-03: mock Supabase client; cloud wins upsert; sign-out leaves local data
- [ ] Environment setup: `npx expo install @supabase/supabase-js expo-apple-authentication expo-crypto react-native-url-polyfill @react-native-google-signin/google-signin`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Apple Sign In creates account and syncs profile | AUTH-02 | Requires native build + real Apple ID; not automatable in jest | Run `npx expo run:ios`, tap "Sign in with Apple", complete flow, verify profile synced in Supabase dashboard |
| Google Sign In creates account and syncs profile | AUTH-02 | Requires native build + real Google account; nonce issues in Expo Go | Run `npx expo run:ios`, tap "Sign in with Google", complete flow, verify profile synced in Supabase dashboard |
| Cross-device sync after sign-in | AUTH-02 | Requires two physical devices or device + simulator + same account | Sign in on device A, create profile, sign in on device B with same account, verify profile matches |
| Sign-out preserves local data | AUTH-03 | Requires native build; SQLite state verification | Sign in, sign out, verify profile still accessible locally without network |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
