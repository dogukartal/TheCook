---
phase: 12-sefim-ai-companion
plan: 01
subsystem: ai
tags: [openai, supabase-edge-functions, speech-recognition, zod, react-hooks]

# Dependency graph
requires:
  - phase: 11-cooking-mode-evolution
    provides: StepSchema with checkpoint/warning fields
  - phase: 10-recipe-detail-evolution
    provides: Recipe adaptation hooks (swaps, servings)
provides:
  - SefimQA field on StepSchema for pre-loaded Q&A chips
  - useSefim hook with chip handling, AI calls, context assembly, linger detection
  - buildSefimContext and getLingerThreshold pure functions
  - sefim-ask Supabase Edge Function for live AI answers
  - expo-speech-recognition configured for voice input
affects: [12-02-sefim-ui]

# Tech tracking
tech-stack:
  added: ["@jamsch/expo-speech-recognition"]
  patterns: ["Edge Function proxying to OpenAI", "Linger detection via setTimeout with step-change cleanup"]

key-files:
  created:
    - TheCook/src/hooks/useSefim.ts
    - TheCook/src/hooks/__tests__/useSefim.test.ts
    - supabase/functions/sefim-ask/index.ts
  modified:
    - TheCook/src/types/recipe.ts
    - TheCook/app.json
    - TheCook/package.json

key-decisions:
  - "SefimQASchema defined as named const before StepSchema for reuse and type export"
  - "Turkish system prompt constrains AI to cooking-only scope with friendly redirect"
  - "Linger threshold: 1.5x timerSeconds for timed steps, 120s for untimed"
  - "Chip taps are instant (no network) while open questions route through Edge Function"

patterns-established:
  - "Edge Function pattern: Deno.serve + OpenAI fetch with fallback error responses"
  - "Hook linger detection: setTimeout in useEffect keyed on stepIndex with cleanup"

requirements-completed: [COOKX-04, COOKX-05]

# Metrics
duration: 4min
completed: 2026-03-17
---

# Phase 12 Plan 01: Sefim Core Hook and Schema Summary

**StepSchema extended with sefimQA, useSefim hook with chip/AI/linger logic, and sefim-ask Edge Function for OpenAI proxy**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-17T20:35:32Z
- **Completed:** 2026-03-17T20:39:32Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Extended StepSchema with sefimQA field (array of {question, answer}) with backward-compatible .default([])
- Built useSefim hook with chip handling, open question AI calls, context assembly, and linger detection
- Created sefim-ask Supabase Edge Function with Turkish system prompt and OpenAI gpt-4o-mini integration
- Installed and configured expo-speech-recognition with Turkish permission strings
- 12 passing tests covering schema, pure functions, and hook behaviors

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema extension + test stubs + install expo-speech-recognition** - `36300db` (feat)
2. **Task 2: useSefim hook + buildSefimContext + Supabase Edge Function** - `9c0b8fd` (feat)

## Files Created/Modified
- `TheCook/src/types/recipe.ts` - Added SefimQASchema and sefimQA field on StepSchema
- `TheCook/src/hooks/useSefim.ts` - Core hook with chip handling, AI calls, context assembly, linger detection
- `TheCook/src/hooks/__tests__/useSefim.test.ts` - 12 tests for schema, pure functions, and hook
- `supabase/functions/sefim-ask/index.ts` - Edge Function proxying to OpenAI with Turkish system prompt
- `TheCook/app.json` - Added expo-speech-recognition config plugin with Turkish permissions
- `TheCook/package.json` - Added @jamsch/expo-speech-recognition dependency

## Decisions Made
- SefimQASchema defined as named const before StepSchema for reuse and SefimQA type export
- Turkish system prompt constrains Sef'im to cooking-only scope, redirecting off-topic with friendly message
- Linger threshold: 1.5x timerSeconds for timed steps, 120 seconds for untimed steps
- Chip taps are instant (no network call) while open questions route through Supabase Edge Function
- Error fallback message in Turkish: "Baglanti sorunu, tekrar dene"

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required. OPENAI_API_KEY must be set in Supabase Edge Function secrets before deployment.

## Next Phase Readiness
- useSefim hook ready for consumption by Plan 02 UI components
- Edge Function ready for deployment via `supabase functions deploy sefim-ask`
- All exports (useSefim, buildSefimContext, getLingerThreshold, SefimMessage, SefimContext) available for UI integration

## Self-Check: PASSED

All files verified present. Both task commits (36300db, 9c0b8fd) confirmed in git log. Full test suite green (19 suites, 197 tests).

---
*Phase: 12-sefim-ai-companion*
*Completed: 2026-03-17*
