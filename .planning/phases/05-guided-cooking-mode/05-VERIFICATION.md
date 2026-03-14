---
phase: 05-guided-cooking-mode
verified: 2026-03-14T00:00:00Z
status: human_needed
score: 13/13 must-haves verified
re_verification: false
human_verification:
  - test: "Enter cooking mode from any recipe and verify one step at a time"
    expected: "Full-screen cooking view opens at step 1 showing PagerView with exactly one step visible; full recipe list is not shown"
    why_human: "PagerView single-page rendering and navigation gesture behavior requires device testing"
  - test: "Timer countdown on a step with timerSeconds set"
    expected: "Circular ring starts counting down on play tap; MM:SS updates every second; ring arc shrinks proportionally"
    why_human: "SVG animation and real-time countdown display cannot be verified without running the app"
  - test: "Background timer survival — lock screen then return"
    expected: "Timer continues correctly (no reset or freeze) after phone lock/unlock; remaining time is recalculated from timestamp"
    why_human: "AppState background/active transitions require real device testing"
  - test: "Session persistence across app kill"
    expected: "After killing the app and reopening, the feed shows a resume banner with recipe name and step number"
    why_human: "Full process kill and restart is a device-only test scenario"
  - test: "Keep-awake during active cooking"
    expected: "Screen does not dim or lock while actively on a cooking step"
    why_human: "expo-keep-awake effect requires physical device testing; simulators do not replicate screen dimming"
---

# Phase 5: Guided Cooking Mode — Verification Report

**Phase Goal:** Users can enter cooking mode for any recipe and be guided through each step with timers, mistake warnings, and why annotations
**Verified:** 2026-03-14
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Cooking sessions table exists in SQLite after DB v4 migration | VERIFIED | `client.ts` line 77-89: `if (currentVersion < 4)` creates `cooking_sessions` table; DB_VERSION = 4 |
| 2 | Session can be saved, loaded, and cleared via CRUD functions | VERIFIED | `cooking-session.ts`: `saveSession` (INSERT OR REPLACE id=1), `getActiveSession` (SELECT WHERE id=1 + JSON parse), `clearSession` (DELETE); 5 passing tests |
| 3 | Timer hook calculates remaining time from timestamps, not interval counting | VERIFIED | `useCookingTimer.ts` lines 77-79: `const elapsed = (Date.now() - startTimestamp) / 1000; const remaining = Math.max(0, duration - elapsed)` |
| 4 | Notification permission is requested with Turkish explanation before system prompt | VERIFIED | `notifications.ts` lines 35-54: Alert.alert with Turkish title "Bildirim izni" and body before `requestPermissionsAsync` |
| 5 | Recipe detail screen shows hero, metadata, ingredients, steps preview, and Start Cooking button | VERIFIED | `app/recipe/[id].tsx` (629 lines): contains hero gradient, metadata, steps preview with STEP_PASTEL_COLORS, "Pismek Baslat" / "Devam Et" button routing to `/recipe/cook/${id}` |
| 6 | StepContent renders instruction, why (tap-to-reveal), looks-like-when-done, and common mistake sections | VERIFIED | `step-content.tsx`: instruction, Gormeli (looksLikeWhenDone), tap-to-reveal Neden?, Dikkat section with commonMistake + recovery; 7 passing tests confirm all sections |
| 7 | Circular timer component displays countdown ring with play/pause | VERIFIED | `circular-timer.tsx`: SVG Circle with strokeDashoffset, AnimatedCircle via reanimated, play/pause/resume/complete states |
| 8 | Ingredients sheet shows all recipe ingredients with checkboxes and swap buttons | VERIFIED | `ingredients-sheet.tsx`: Modal with flatItems, checkbox-marked/blank-outline icons, "Degistir" button with coming-soon Alert |
| 9 | Progress bar shows segmented step indicators with current position highlighted | VERIFIED | `progress-bar.tsx`: segments array, `idx <= currentStep ? '#E07B39' : '#E5E7EB'` coloring |
| 10 | User enters cooking mode and sees exactly one step at a time via PagerView | VERIFIED (automated) | `cook/[id].tsx` lines 386-422: `PagerView` with `recipe.steps.map` rendering one `StepContent` per page; floating `TimerIndicator` when on different step |
| 11 | Session is saved to SQLite on every step change and timer event | VERIFIED | `cook/[id].tsx`: `handlePageSelected` calls `saveSession`, `handleTimerStart/Pause/Resume` call `persistSession`, `handleIngredientToggle` calls `saveSession` |
| 12 | Killing the app and reopening shows resume banner on feed | VERIFIED (automated) | `app/(tabs)/index.tsx`: `useFocusEffect` calls `getActiveSession` on every focus; `ResumeBanner` rendered when `resumeSession` is non-null with `onResume`→`router.push(/recipe/cook/...)` |
| 13 | Completing all steps shows Afiyet olsun celebration with total cooking time | VERIFIED | `cook/[id].tsx` lines 327-341 and 413-421: `showCompletion` triggered at `recipe.steps.length` page, `CompletionScreen` renders "Afiyet olsun!", recipe name, elapsed minutes |

**Score:** 13/13 truths verified (automated checks)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `TheCook/src/db/cooking-session.ts` | Session CRUD (save, get, clear) | VERIFIED | 84 lines; exports `CookingSession`, `saveSession`, `getActiveSession`, `clearSession` |
| `TheCook/src/hooks/useCookingTimer.ts` | Timestamp-based timer with background survival | VERIFIED | 239 lines; exports `useCookingTimer`; AppState listener at line 216-236; timestamp-based calculation confirmed |
| `TheCook/src/services/notifications.ts` | Notification permission + timer scheduling | VERIFIED | 87 lines; exports `ensureNotificationPermission`, `scheduleTimerNotification`, `cancelTimerNotification`; Turkish Alert confirmed |
| `TheCook/src/db/client.ts` | DB_VERSION 4 migration with cooking_sessions table | VERIFIED | Line 3: `DB_VERSION = 4`; lines 77-89: `CREATE TABLE IF NOT EXISTS cooking_sessions` |
| `TheCook/app/recipe/cook/[id].tsx` | Full-screen step-by-step cooking view | VERIFIED | 576 lines (exceeds 200 min); PagerView, useCookingTimer, saveSession/clearSession, keep-awake all wired |
| `TheCook/app/(tabs)/index.tsx` | Feed screen with resume banner integration | VERIFIED | 365 lines; `ResumeBanner` imported line 20, rendered line 195; `getActiveSession` called in `useFocusEffect` |
| `TheCook/components/cooking/step-content.tsx` | Single step layout with all COOK-02/COOK-03 content | VERIFIED | 249 lines; exports `StepContent`; instruction, Gormeli, Neden, Dikkat sections present |
| `TheCook/components/cooking/circular-timer.tsx` | Circular countdown ring with play/pause button | VERIFIED | 183 lines; exports `CircularTimer`; react-native-svg + reanimated |
| `TheCook/components/cooking/ingredients-sheet.tsx` | Bottom sheet with ingredient checkboxes and swap placeholders | VERIFIED | 231 lines; exports `IngredientsSheet`; Modal, checkboxes, Degistir coming-soon |
| `TheCook/components/cooking/progress-bar.tsx` | Segmented progress bar | VERIFIED | 55 lines; exports `SegmentedProgressBar` |
| `TheCook/components/cooking/timer-indicator.tsx` | Floating timer indicator | VERIFIED | 90 lines; exports `TimerIndicator`; conditional render when on different step |
| `TheCook/components/cooking/completion-screen.tsx` | Afiyet olsun celebration screen | VERIFIED | 93 lines; exports `CompletionScreen`; "Afiyet olsun!" title, recipe name, dakika display |
| `TheCook/components/cooking/resume-banner.tsx` | Resume cooking banner for feed screen | VERIFIED | 103 lines; exports `ResumeBanner`; "Devam Et" and "Kapat" buttons |
| `TheCook/__tests__/step-content.test.ts` | Render tests for StepContent (7 assertions) | VERIFIED | 135 lines; 7 tests covering instruction, why tap-to-reveal, looksLikeWhenDone, commonMistake, recovery, timer absent/present |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `useCookingTimer.ts` | `notifications.ts` | `scheduleTimerNotification` on timer start | WIRED | Lines 138-144: `ensureNotificationPermission().then(() => scheduleTimerNotification(...))` in `start()` |
| `cooking-session.ts` | `client.ts` | `cooking_sessions` table created by migration | WIRED | `client.ts` line 79: `CREATE TABLE IF NOT EXISTS cooking_sessions`; `cooking-session.ts` references the table |
| `cook/[id].tsx` | `useCookingTimer.ts` | `useCookingTimer` hook for timer state | WIRED | Line 63: `const { timer, displaySeconds, start, pause, resume, reset } = useCookingTimer()` |
| `cook/[id].tsx` | `cooking-session.ts` | `saveSession` on step change, `clearSession` on completion | WIRED | `handlePageSelected` (line 188), `handleTimerStart/Pause/Resume` (lines 210-223), completion (line 180) |
| `cook/[id].tsx` | `react-native-pager-view` | `PagerView` for step swiping | WIRED | Line 12: `import PagerView from 'react-native-pager-view'`; used at line 386 |
| `app/(tabs)/index.tsx` | `cooking-session.ts` | `getActiveSession` to check for resume | WIRED | Line 16: import; line 82: `getActiveSession(db)` in `useFocusEffect` |
| `app/recipe/[id].tsx` | `cook/[id].tsx` | `router.push` on Start Cooking tap | WIRED | Line 357: `router.push(\`/recipe/cook/${id}\` as never)` |
| `step-content.tsx` | `types/recipe.ts` | `RecipeStep` type for step data | WIRED | Line 12: `import type { RecipeStep } from '@/src/types/recipe'` |

All 8 key links: WIRED

---

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|---------|
| COOK-01 | 05-02, 05-03 | User can enter cooking mode; one step at a time displayed | SATISFIED | `cook/[id].tsx` PagerView single-step display; Start Cooking button in `app/recipe/[id].tsx`; full recipe not visible during cooking |
| COOK-02 | 05-02, 05-03 | Each step shows: what to do, why, looks/smells/feels when done | SATISFIED | `step-content.tsx`: instruction text, Gormeli section (looksLikeWhenDone), tap-to-reveal Neden? (why); 3 passing tests confirm |
| COOK-03 | 05-02, 05-03 | Each step flags common mistake and recovery | SATISFIED | `step-content.tsx` Dikkat section: `commonMistake` and `recovery` with alert-circle icon; 2 passing tests confirm |
| COOK-04 | 05-01, 05-03 | Steps requiring timing trigger countdown timer; timer visible at a glance | SATISFIED (automated) / needs human for real-time behavior | `useCookingTimer.ts` timestamp-based countdown; `CircularTimer` SVG ring; `TimerIndicator` floating pill when on other steps; 10 passing timer tests |

No orphaned requirements found. All 4 COOK requirements claimed in plans are mapped and verified.

---

### Anti-Patterns Found

None. Scanned all Phase 5 files for TODO/FIXME/PLACEHOLDER, empty implementations, and console.log stubs. No blockers or warnings found.

Note: The `return null` in `cooking-session.ts` line 66 is semantically correct (no active session = return null), not a stub.

Note: The summary mentions a pre-existing TypeScript issue in `notifications.ts` (`shouldShowBanner`/`shouldShowList` missing from `NotificationBehavior` type). These fields are present in the file (lines 13-14) and the app functions correctly — this is a type definition version mismatch in the expo-notifications types, not a functional issue.

---

### Human Verification Required

All automated checks pass. The following items require device testing to confirm the complete user experience:

#### 1. Step-by-step single-step display

**Test:** Open any recipe, tap "Pismek Baslat", then swipe between steps
**Expected:** Exactly one step is visible at a time via PagerView swipe; the full recipe list is never shown while in cooking mode; progress bar updates on each swipe
**Why human:** PagerView rendering, gesture recognition, and visual single-page constraint require device verification

#### 2. Timer countdown and circular ring animation

**Test:** Navigate to a step with a timer (timerSeconds > 0), tap the play button
**Expected:** Circular ring begins counting down with smooth arc animation; MM:SS counter decrements every second; timer floating indicator appears when navigating to other steps
**Why human:** SVG strokeDashoffset animation, real-time display updates, and the floating indicator positioning require visual device verification

#### 3. Background timer survival

**Test:** Start a timer on a step, then lock the screen or switch to another app for 30+ seconds, then return
**Expected:** Timer shows correctly reduced remaining time (not reset, not frozen); app recalculates from stored timestamp via AppState "active" event
**Why human:** AppState transitions and timestamp-based recalculation require real device testing — cannot be simulated in tests

#### 4. Session persistence across app kill

**Test:** Start cooking a recipe, advance 2-3 steps, check an ingredient, then force-kill the app entirely. Reopen the app.
**Expected:** Feed screen shows a resume banner displaying the recipe name and step number (e.g., "Adım 3/8"); tapping "Devam Et" opens the cooking view at the saved step with ingredient checks preserved
**Why human:** Full process kill requires a physical device; SQLite persistence and useFocusEffect re-check on cold start cannot be verified programmatically

#### 5. Keep-awake during cooking

**Test:** Leave the cooking view open without interaction for 2+ minutes (longer than the device's screen timeout)
**Expected:** Screen remains lit and does not dim or auto-lock while the cooking view is active
**Why human:** expo-keep-awake behavior requires physical device testing; simulators do not replicate screen dimming

---

### Gaps Summary

No gaps. All 13 automated truths verified, all 14 artifacts are substantive and wired, all 8 key links confirmed, all 4 COOK requirements satisfied in code. Five items require human device verification to confirm the complete runtime experience — these are behavioral and visual characteristics that cannot be checked statically.

---

_Verified: 2026-03-14_
_Verifier: Claude (gsd-verifier)_
