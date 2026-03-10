# Deferred Items — Phase 02 Profile and Auth

## Pre-existing TypeScript Errors (Out of Scope for 02-05)

### src/db/profile.ts — TS2769 unknown[] not assignable to SQLiteBindParams
- **Lines:** 56, 125 (saveProfile functions in both hook and standalone variants)
- **Error:** `unknown[]` type for `values` array is not assignable to `SQLiteBindParams` / `SQLiteBindValue[]`
- **Root cause:** The `values: unknown[]` type is too wide; SQLite bind params require `SQLiteBindValue[]`
- **Fix:** Cast `values` to `SQLiteBindValue[]` or type the array as `SQLiteBindValue[]` from the start
- **Discovered during:** 02-05 TypeScript compile check
- **Introduced in:** Plan 02-03

### src/auth/useSession.ts — Multiple TS1005/TS1136/TS1109/TS1161 errors
- **Lines:** 45-49
- **Error:** JSX/generic syntax errors suggesting the file extension may be `.ts` instead of `.tsx`
- **Root cause:** File appears to contain JSX but has `.ts` extension (confirmed: `useSession.tsx` exists separately)
- **Fix:** Confirm correct file is `useSession.tsx` and remove/rename `.ts` version
- **Discovered during:** 02-05 TypeScript compile check
- **Introduced in:** Plan 02-04
