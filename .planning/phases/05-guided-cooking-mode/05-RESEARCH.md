# Phase 5: Guided Cooking Mode - Research

**Researched:** 2026-03-13
**Domain:** Step-by-step cooking UI, countdown timers, session persistence, local notifications
**Confidence:** HIGH

## Summary

Phase 5 builds a guided cooking experience on top of the existing recipe detail screen infrastructure. The core challenge is threefold: (1) a swipeable step-by-step UI with rich content layout, (2) a countdown timer that survives app backgrounding and screen lock via timestamp-based calculation plus scheduled local notifications, and (3) session persistence to SQLite so users can resume interrupted cooking sessions.

The existing codebase already has `react-native-gesture-handler` ~2.28.0 and `react-native-reanimated` ~4.1.1 installed, so swipe gestures are ready. For page-level swiping between steps, `react-native-pager-view` (already in the Expo SDK 54 ecosystem) provides a native pager component. Timer background survival uses a timestamp-based approach (store `Date.now()` at start, recalculate remaining on foreground via `AppState`) combined with `expo-notifications` for the completion alert. Session persistence follows the existing `expo-sqlite` migration pattern (bump `DB_VERSION` to 4, add `cooking_sessions` table).

**Primary recommendation:** Use `react-native-pager-view` for step swiping, timestamp-based timer with `AppState` listener for background survival, `expo-notifications` for timer completion alerts, and SQLite `cooking_sessions` table for session persistence.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Replace current recipe detail screen** (`app/recipe/[id].tsx`) with a new cooking preview screen showing hero, metadata, ingredients, Steps Preview section, and "Start Cooking" button
- **Swipe left/right** between steps AND prev/next buttons at bottom; sequential navigation only (no step list overlay for jumping)
- **Segmented progress bar** at top showing current position
- **Step content layout**: pastel placeholder image at top, step title left + circular timer right at image/text boundary, instruction text, "Gormeli" (You should see), tap-to-reveal "Neden?" (Why), "Dikkat" (Watch out) at bottom
- **Timer**: circular countdown ring, manual start (play/pause), one active timer at a time, background running via scheduled local notification, floating indicator on other steps when timer active, completion alert (sound + visual, NO vibration)
- **Notification permission prompt** on first timer start with sincere Turkish language
- **Ingredients overlay**: bottom sheet with ALL recipe ingredients, checkboxes (greying out), "Degistir" swap button (v1: coming soon placeholder)
- **Completion screen**: "Afiyet olsun!" with recipe name, total cooking time, "Back to recipes" button
- **Session persistence**: full state saved to SQLite on every step change (recipe_id, current_step, timer_remaining, timer_start_timestamp, ingredient_checks, session_started_at)
- **Resume banner** on feed/home screen when active session exists
- Only one active cooking session at a time

### Claude's Discretion
- Exact pastel color palette for step image placeholders
- Segmented progress bar visual design
- Swipe gesture implementation details (react-native-gesture-handler vs PanResponder)
- Cooking session SQLite table schema
- Animation/transitions between steps
- Exact "coming soon" tooltip design for Ask Chef and Swap buttons
- Completion screen illustration/animation
- Timer alert sound selection

### Deferred Ideas (OUT OF SCOPE)
- Ask Chef AI chat (AICOOK-01, AICOOK-02) -- button placed with "coming soon" state only
- Ingredient swap (AIPER-03) -- button placed but non-functional
- Step-level images -- pastel placeholders only
- Multiple concurrent timers -- one timer at a time in v1
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COOK-01 | User can enter cooking mode for any recipe; mode displays one step at a time -- no full recipe visible while cooking | react-native-pager-view for step-by-step swiping; separate route (`app/recipe/cook/[id].tsx`) for full-screen cooking view |
| COOK-02 | Each step displays: what to do, why you're doing it, and what it should look/smell/feel like when correctly done | StepSchema already has `instruction`, `why`, `looksLikeWhenDone` fields; layout pattern documented below |
| COOK-03 | Each step flags the most common mistake at that point and what to do if it happens | StepSchema has `commonMistake` and `recovery` fields; "Dikkat" section at bottom of step content |
| COOK-04 | Steps that require timing automatically trigger a countdown timer; timer runs in foreground and is visible at a glance | Timestamp-based timer with `AppState` listener; `expo-notifications` for background completion alert; circular ring UI component |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-pager-view | ~6.9.1 | Native horizontal pager for step swiping | Part of Expo SDK 54; provides native ViewPager on Android / UIPageViewController on iOS; handles swipe gestures natively with no custom gesture code |
| expo-notifications | ~0.31.x (SDK 54) | Schedule local notification when timer completes | Official Expo module for local/push notifications; handles iOS permission prompts, background delivery, and notification sounds |
| expo-sqlite | ~16.0.10 | Session persistence table | Already in use (DB_VERSION=3); add cooking_sessions table in migration 4 |
| react-native-reanimated | ~4.1.1 | Circular timer animation, progress bar, transitions | Already installed; used for SkeletonCard shimmer in Phase 4 |
| react-native-gesture-handler | ~2.28.0 | Pan gesture for swipe (pager-view uses internally) | Already installed; pager-view depends on it |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-keep-awake | ~14.0.x | Prevent screen dimming during active cooking | Activate when cooking mode is entered; deactivate on exit |
| AppState (react-native) | built-in | Detect foreground/background transitions for timer recalculation | Subscribe in cooking view to recalculate timer remaining on app resume |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-native-pager-view | Custom PanGestureHandler + Animated.FlatList | PagerView is simpler, native performance, handles edge-cases (overscroll, velocity); custom approach adds ~150 lines of gesture math |
| expo-notifications | react-native-background-timer | background-timer has known issues on iOS when screen locks; expo-notifications is officially supported and handles the "timer done" alert use case perfectly |
| expo-keep-awake | No keep-awake | Screen dims during cooking which is bad UX; keep-awake is minimal cost |

**Installation:**
```bash
npx expo install react-native-pager-view expo-notifications expo-keep-awake
```

**app.json plugin addition:**
```json
"plugins": [
  "expo-notifications"
]
```

## Architecture Patterns

### Recommended Project Structure
```
app/
  recipe/
    [id].tsx              # Cooking PREVIEW screen (replaces current detail)
    cook/
      [id].tsx            # Step-by-step COOKING VIEW (full-screen)
src/
  db/
    client.ts             # DB_VERSION bump to 4, add cooking_sessions table
    cooking-session.ts    # CRUD for cooking session persistence
  hooks/
    useCookingTimer.ts    # Timer state management (timestamp-based)
    useCookingSession.ts  # Session persistence hook
  services/
    notifications.ts      # Notification permission + scheduling helpers
components/
  cooking/
    step-content.tsx       # Single step layout (instruction, why, looks-like, mistake)
    circular-timer.tsx     # Circular countdown ring with play/pause
    progress-bar.tsx       # Segmented progress bar
    ingredients-sheet.tsx  # Bottom sheet overlay with checkboxes
    timer-indicator.tsx    # Floating indicator when timer runs on another step
    completion-screen.tsx  # "Afiyet olsun!" celebration
    resume-banner.tsx      # Banner for feed screen
```

### Pattern 1: Timestamp-Based Timer (Background Survival)
**What:** Instead of decrementing a counter every second (which stops when app backgrounds), store the absolute timestamp when the timer was started and the total duration. On every render tick, calculate `remaining = duration - (Date.now() - startTimestamp)`.
**When to use:** Any timer that must survive app backgrounding.
**Example:**
```typescript
// src/hooks/useCookingTimer.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface TimerState {
  stepIndex: number | null;   // which step owns this timer
  duration: number;           // total seconds
  startTimestamp: number | null; // Date.now() when started
  pausedRemaining: number | null; // seconds left when paused
  isRunning: boolean;
}

export function useCookingTimer() {
  const [timer, setTimer] = useState<TimerState>({
    stepIndex: null, duration: 0, startTimestamp: null,
    pausedRemaining: null, isRunning: false,
  });
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Recalculate on foreground resume
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && timer.isRunning && timer.startTimestamp) {
        // Timer auto-recalculates because displaySeconds derives from Date.now()
      }
    });
    return () => sub.remove();
  }, [timer.isRunning, timer.startTimestamp]);

  // Tick every second when running
  useEffect(() => {
    if (timer.isRunning && timer.startTimestamp) {
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - timer.startTimestamp!) / 1000;
        const remaining = Math.max(0, timer.duration - elapsed);
        setDisplaySeconds(Math.ceil(remaining));
        if (remaining <= 0) {
          clearInterval(intervalRef.current!);
          setTimer(prev => ({ ...prev, isRunning: false }));
          // Trigger completion callback
        }
      }, 200); // 200ms for smooth display
      return () => clearInterval(intervalRef.current!);
    }
  }, [timer.isRunning, timer.startTimestamp, timer.duration]);

  const start = useCallback((stepIndex: number, durationSeconds: number) => {
    setTimer({
      stepIndex, duration: durationSeconds,
      startTimestamp: Date.now(), pausedRemaining: null, isRunning: true,
    });
  }, []);

  const pause = useCallback(() => {
    setTimer(prev => ({
      ...prev, isRunning: false,
      pausedRemaining: displaySeconds,
    }));
  }, [displaySeconds]);

  const resume = useCallback(() => {
    if (timer.pausedRemaining != null) {
      setTimer(prev => ({
        ...prev, isRunning: true,
        startTimestamp: Date.now(),
        duration: prev.pausedRemaining!,
        pausedRemaining: null,
      }));
    }
  }, [timer.pausedRemaining]);

  return { timer, displaySeconds, start, pause, resume };
}
```

### Pattern 2: Session Persistence on Step Change
**What:** Save full cooking state to SQLite every time the user navigates to a different step. On app relaunch, check for an active session and offer resume.
**When to use:** Must survive app kill.
**Example:**
```typescript
// src/db/cooking-session.ts
import { SQLiteDatabase } from 'expo-sqlite';

export interface CookingSession {
  recipeId: string;
  currentStep: number;
  timerRemaining: number | null;
  timerStartTimestamp: number | null;
  ingredientChecks: number[];
  sessionStartedAt: string; // ISO 8601
}

export async function saveSession(
  db: SQLiteDatabase,
  session: CookingSession
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO cooking_sessions
     (id, recipe_id, current_step, timer_remaining, timer_start_timestamp,
      ingredient_checks, session_started_at)
     VALUES (1, ?, ?, ?, ?, ?, ?)`,
    [
      session.recipeId,
      session.currentStep,
      session.timerRemaining,
      session.timerStartTimestamp,
      JSON.stringify(session.ingredientChecks),
      session.sessionStartedAt,
    ]
  );
}

export async function getActiveSession(
  db: SQLiteDatabase
): Promise<CookingSession | null> {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM cooking_sessions WHERE id = 1'
  );
  if (!row) return null;
  return {
    recipeId: row.recipe_id as string,
    currentStep: row.current_step as number,
    timerRemaining: row.timer_remaining as number | null,
    timerStartTimestamp: row.timer_start_timestamp as number | null,
    ingredientChecks: JSON.parse(row.ingredient_checks as string),
    sessionStartedAt: row.session_started_at as string,
  };
}

export async function clearSession(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM cooking_sessions');
}
```

### Pattern 3: Notification Permission with Deferred Prompt
**What:** Request notification permission only when the user first starts a timer, not on app launch. Show a sincere Turkish-language explanation before the system prompt.
**When to use:** First timer start ever (track permission-asked flag in AsyncStorage or SQLite profile).
**Example:**
```typescript
// src/services/notifications.ts
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

// Must call this on app startup to handle foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowInForeground: true,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  // Show sincere Turkish explanation before system prompt
  return new Promise((resolve) => {
    Alert.alert(
      'Bildirim izni',
      'Yemeklerin hazir oldugunda sana haber verebilmemiz icin bildirim iznine ihtiyacimiz var. Boylece baska islerinle ilgilenirken biz sana zamanlayicin bittigini soyleyebiliriz.',
      [
        { text: 'Simdi degil', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Izin ver',
          onPress: async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            resolve(status === 'granted');
          },
        },
      ]
    );
  });
}

export async function scheduleTimerNotification(seconds: number): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Zamanlayici bitti!',
      body: 'Yemegin icin zamanlayici tamamlandi. Bir sonraki adima gecebilirsin.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });
}

export async function cancelTimerNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}
```

### Pattern 4: PagerView for Step Navigation
**What:** Use `react-native-pager-view` as the native swipe container, with programmatic page changes via ref for prev/next buttons.
**When to use:** Step-by-step cooking view.
**Example:**
```typescript
import PagerView from 'react-native-pager-view';
import { useRef } from 'react';

const pagerRef = useRef<PagerView>(null);

// Programmatic navigation
const goToStep = (index: number) => {
  pagerRef.current?.setPage(index);
};

<PagerView
  ref={pagerRef}
  style={{ flex: 1 }}
  initialPage={initialStep}
  onPageSelected={(e) => {
    const newStep = e.nativeEvent.position;
    setCurrentStep(newStep);
    saveSession(db, { ...session, currentStep: newStep });
  }}
>
  {recipe.steps.map((step, idx) => (
    <View key={idx}>
      <StepContent step={step} stepIndex={idx} totalSteps={recipe.steps.length} />
    </View>
  ))}
</PagerView>
```

### Anti-Patterns to Avoid
- **setInterval-only timer:** Never use a pure `setInterval` counter that decrements state -- it drifts and stops when the app backgrounds. Always use timestamp-based calculation.
- **Storing timer "remaining" without timestamp:** If you store only `timerRemaining: 45` to SQLite without `timerStartTimestamp`, you cannot recalculate how much time passed between save and resume.
- **Requesting notification permission at app launch:** Users will deny it because they do not understand why a cooking app needs notifications. Defer to first timer start with explanation.
- **Using ScrollView with horizontal paging:** Does not handle velocity, overscroll, or native page snapping correctly. Use PagerView.
- **Multiple useEffect timers:** One timer hook should own the single interval. Do not create competing intervals across components.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Horizontal page swiping | Custom PanGestureHandler + Animated.View carousel | `react-native-pager-view` | Native ViewPager handles velocity, overscroll damping, accessibility, RTL; custom implementation is ~200 lines of tricky gesture math |
| Local notification scheduling | Custom background task + push notification | `expo-notifications` `scheduleNotificationAsync` | Handles iOS/Android notification channels, permission flow, background delivery; rolling your own requires native modules |
| Circular progress animation | Canvas-based drawing or SVG manipulation | `react-native-reanimated` with `useSharedValue` + `withTiming` + SVG arc or `react-native-svg` Circle with `strokeDashoffset` | Reanimated drives 60fps animation on UI thread; manual Animated.timing is JS-thread bound |
| Bottom sheet | Custom Animated.View with PanGestureHandler | Simple Modal or basic animated View (scope is simple ingredient list, not a complex bottom sheet) | For this use case a simple slide-up modal is sufficient; a full bottom sheet library (like @gorhom/bottom-sheet) is overkill for a static list |

**Key insight:** The timer is the most complex piece -- it must survive backgrounding, app kill, and screen lock. The timestamp-based approach with notification fallback is the only reliable pattern. Everything else (pager, session persistence, UI layout) follows established patterns in the existing codebase.

## Common Pitfalls

### Pitfall 1: Timer Stops When App Backgrounds
**What goes wrong:** `setInterval` callbacks stop executing when the app is backgrounded on iOS. Timer shows wrong remaining time on resume.
**Why it happens:** iOS suspends JS execution for backgrounded apps. The interval never fires.
**How to avoid:** Store `startTimestamp = Date.now()` and `duration` (total seconds). On every tick and on AppState "active" event, calculate `remaining = duration - (Date.now() - startTimestamp) / 1000`. Schedule an `expo-notifications` local notification for the exact completion time so users are alerted even if the app is killed.
**Warning signs:** Timer shows "frozen" value after returning from another app; timer shows negative or zero unexpectedly.

### Pitfall 2: Notification Permission Denied Silently
**What goes wrong:** On iOS, the system permission prompt appears only once per app install. If denied, subsequent calls to `requestPermissionsAsync()` return "denied" without showing a prompt.
**Why it happens:** iOS policy -- one-shot permission prompt.
**How to avoid:** (1) Show a pre-permission alert in Turkish explaining why notifications matter for cooking timers. (2) If permission is denied, still let the timer work in-app -- just warn that background alerts won't fire. (3) Optionally guide users to Settings if they want to enable later.
**Warning signs:** Timer works but no alert fires when app is backgrounded.

### Pitfall 3: PagerView onPageSelected Fires on Mount
**What goes wrong:** `onPageSelected` may fire when the PagerView first mounts with `initialPage`, causing an unnecessary session save or state update.
**Why it happens:** React Native PagerView fires the event to report initial state.
**How to avoid:** Use a `mountedRef` flag: skip the first `onPageSelected` callback, or compare `newStep === currentStep` before saving.
**Warning signs:** Session overwrites or unnecessary DB writes on screen mount.

### Pitfall 4: Session Resume with Stale Timer
**What goes wrong:** User resumes a session where a timer was running. The timer shows the remaining time from when the session was saved, not accounting for elapsed time since save.
**Why it happens:** Session stores `timer_remaining` and `timer_start_timestamp` separately. On resume, code reads `timer_remaining` but ignores that time has passed.
**How to avoid:** On session resume, if `timer_start_timestamp` is not null and timer was running, calculate `newRemaining = timerRemaining - ((Date.now() - timerStartTimestamp) / 1000)`. If <= 0, timer already completed while app was killed.
**Warning signs:** Timer shows impossibly high remaining time after long app absence.

### Pitfall 5: DB Migration Breaks on Fresh Install
**What goes wrong:** The `if (currentVersion < 4)` block references tables created in earlier migrations. On a fresh install, `currentVersion === 0` and all migrations run sequentially -- but if migration 4 depends on a table from migration 2, the order matters.
**Why it happens:** Migrations must be strictly additive and ordered.
**How to avoid:** Follow existing pattern: each `if (currentVersion < N)` block is self-contained. The cooking_sessions table has no foreign keys to other tables (recipe_id is a logical reference, not a SQL FK).
**Warning signs:** App crashes on first install with "no such table" error.

### Pitfall 6: expo-notifications Plugin Missing from app.json
**What goes wrong:** `scheduleNotificationAsync` works in development but fails in production builds.
**Why it happens:** `expo-notifications` requires a config plugin entry in app.json for EAS Build / prebuild.
**How to avoid:** Add `"expo-notifications"` to the `plugins` array in app.json alongside existing plugins.
**Warning signs:** "Unregistered notification category" errors in release builds.

## Code Examples

### SQLite Migration for cooking_sessions
```typescript
// In src/db/client.ts, bump DB_VERSION to 4 and add:
if (currentVersion < 4) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cooking_sessions (
      id INTEGER PRIMARY KEY NOT NULL DEFAULT 1,
      recipe_id TEXT NOT NULL,
      current_step INTEGER NOT NULL DEFAULT 0,
      timer_remaining REAL,
      timer_start_timestamp REAL,
      ingredient_checks TEXT NOT NULL DEFAULT '[]',
      session_started_at TEXT NOT NULL
    );
  `);
}
```

### Segmented Progress Bar
```typescript
// components/cooking/progress-bar.tsx
import { View, StyleSheet } from 'react-native';

interface Props {
  totalSteps: number;
  currentStep: number;
}

export function SegmentedProgressBar({ totalSteps, currentStep }: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <View
          key={i}
          style={[
            styles.segment,
            i <= currentStep ? styles.active : styles.inactive,
            i < totalSteps - 1 && styles.gap,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  active: { backgroundColor: '#E07B39' },
  inactive: { backgroundColor: '#E5E7EB' },
  gap: { marginRight: 4 },
});
```

### Circular Timer Ring (Reanimated + SVG)
```typescript
// components/cooking/circular-timer.tsx
// Uses react-native-svg Circle with strokeDasharray/strokeDashoffset
// animated by reanimated useSharedValue

import Animated, { useSharedValue, withTiming, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// progress: 0 (full) to 1 (empty)
function CircularTimer({ progress, displayText }: { progress: number; displayText: string }) {
  const animatedProgress = useSharedValue(progress);
  animatedProgress.value = withTiming(progress, { duration: 300 });

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * animatedProgress.value,
  }));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={96} height={96} viewBox="0 0 96 96">
        <Circle cx={48} cy={48} r={RADIUS} stroke="#E5E7EB" strokeWidth={6} fill="none" />
        <AnimatedCircle
          cx={48} cy={48} r={RADIUS}
          stroke="#E07B39" strokeWidth={6} fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={animatedProps}
          transform="rotate(-90 48 48)"
        />
      </Svg>
      <Text style={styles.timerText}>{displayText}</Text>
    </View>
  );
}
```

Note: `react-native-svg` is NOT currently installed. It must be added:
```bash
npx expo install react-native-svg
```

### Pastel Color Palette for Step Placeholders
```typescript
const STEP_PASTEL_COLORS = [
  '#FDE8D8', // warm peach
  '#D4F0E8', // mint
  '#E8DFF5', // lavender
  '#FFF3CD', // butter
  '#D1ECF1', // sky
  '#F5D5D5', // rose
  '#E2F0CB', // sage
  '#FCE4EC', // blush
];

function getStepColor(index: number): string {
  return STEP_PASTEL_COLORS[index % STEP_PASTEL_COLORS.length];
}
```

### Resume Banner on Feed Screen
```typescript
// components/cooking/resume-banner.tsx
interface Props {
  recipeName: string;
  currentStep: number;
  totalSteps: number;
  onResume: () => void;
  onDismiss: () => void;
}

export function ResumeBanner({ recipeName, currentStep, totalSteps, onResume, onDismiss }: Props) {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>
        Yarim kalan tarifin var - devam et?
      </Text>
      <Text style={styles.bannerRecipe}>
        {recipeName} ({currentStep + 1}/{totalSteps})
      </Text>
      <View style={styles.bannerActions}>
        <Pressable onPress={onResume} style={styles.resumeButton}>
          <Text style={styles.resumeText}>Devam Et</Text>
        </Pressable>
        <Pressable onPress={onDismiss}>
          <Text style={styles.dismissText}>Kapat</Text>
        </Pressable>
      </View>
    </View>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `setInterval` countdown timers | Timestamp-based + AppState recalculation | ~2022 community consensus | Timers survive backgrounding without native modules |
| react-native-background-timer | expo-notifications for completion alerts | SDK 50+ (managed workflow) | No need for native background task; notification handles the alert |
| Custom horizontal ScrollView paging | react-native-pager-view | PagerView 6.x stable | Native page snapping, proper velocity handling, accessibility |
| AsyncStorage for session | expo-sqlite for session | Project pattern established Phase 1 | Consistent with existing DB pattern; transactional writes |

**Deprecated/outdated:**
- `react-native-background-timer`: Has known issues on iOS screen lock; not recommended for Expo managed workflow
- `Animated` (old API): Use `react-native-reanimated` v4 for all animations (project already uses it)
- `openDatabase()` from older expo-sqlite: Project uses v2 API (`useSQLiteContext`)

## Open Questions

1. **react-native-svg availability**
   - What we know: The circular timer ring pattern requires `react-native-svg` for the SVG Circle component. It is NOT currently in package.json.
   - What's unclear: Whether a pure View-based circular timer (using border tricks) would be sufficient.
   - Recommendation: Install `react-native-svg` via `npx expo install react-native-svg`. It is part of the Expo SDK and widely used. The SVG approach provides much cleaner circular progress than CSS border hacks.

2. **Timer alert sound**
   - What we know: expo-notifications supports custom sounds via the plugin config. The decision says "short alert sound."
   - What's unclear: Whether to use the system default sound or bundle a custom sound file.
   - Recommendation: Use the system default notification sound (`sound: true` in notification content). Custom sounds require bundling audio files and additional plugin config. System default is recognizable and sufficient for v1.

3. **expo-keep-awake scope**
   - What we know: During active cooking, the screen should not dim. expo-keep-awake prevents this.
   - What's unclear: Whether to keep the screen awake for the entire cooking session or only when a timer is actively counting.
   - Recommendation: Keep awake for the entire cooking session (from "Start Cooking" to completion/exit). Users are cooking with messy hands and need the screen visible.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + jest-expo ~54.0.17 |
| Config file | package.json `jest` section |
| Quick run command | `npx jest --testPathPattern="cooking" -x` |
| Full suite command | `npx jest` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COOK-01 | Cooking mode shows one step at a time | integration | `npx jest __tests__/cooking-session.test.ts -x` | No - Wave 0 |
| COOK-02 | Step displays instruction, why, looks-like-when-done | unit | `npx jest __tests__/step-content.test.ts -x` | No - Wave 0 |
| COOK-03 | Step shows common mistake and recovery | unit | `npx jest __tests__/step-content.test.ts -x` | No - Wave 0 |
| COOK-04 | Timer countdown with background survival | unit | `npx jest __tests__/cooking-timer.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="cooking" -x`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/cooking-session.test.ts` -- covers COOK-01: session CRUD, save/resume/clear
- [ ] `__tests__/cooking-timer.test.ts` -- covers COOK-04: timestamp-based timer logic, pause/resume, background recalculation
- [ ] `__tests__/step-content.test.ts` -- covers COOK-02, COOK-03: step content rendering (instruction, why, looksLikeWhenDone, commonMistake, recovery)
- [ ] DB migration test update in `__tests__/migration.test.ts` -- add cooking_sessions table assertion

## Sources

### Primary (HIGH confidence)
- [expo-notifications official docs](https://docs.expo.dev/versions/latest/sdk/notifications/) -- local notification scheduling, permission flow, trigger types
- [react-native-pager-view Expo docs](https://docs.expo.dev/versions/latest/sdk/view-pager/) -- installation, compatibility with SDK 54
- [AppState React Native docs](https://reactnative.dev/docs/appstate) -- foreground/background detection API
- [expo-keep-awake Expo docs](https://docs.expo.dev/versions/latest/sdk/keep-awake/) -- screen wake lock API

### Secondary (MEDIUM confidence)
- [Countdown Timer with Background support (Medium)](https://thevinaysingh.medium.com/countdown-timer-with-background-support-react-native-d28ac5f4f2a1) -- timestamp-based timer pattern verified against AppState docs
- [Expo local notifications setup guide (codesofphoenix.com)](https://www.codesofphoenix.com/articles/expo/local-notifications-expo) -- permission flow and scheduling patterns
- [Managing Timers in React Native (dev.to)](https://dev.to/shivampawar/efficiently-managing-timers-in-a-react-native-app-overcoming-background-foreground-timer-state-issues-map) -- AppState timer pattern

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries are part of or compatible with Expo SDK 54; react-native-gesture-handler and reanimated already installed
- Architecture: HIGH -- patterns follow existing project conventions (SQLite migration, expo-router file routing, hook pattern)
- Pitfalls: HIGH -- timer backgrounding is well-documented; notification permission flow is standard iOS behavior
- Timer implementation: HIGH -- timestamp-based approach is the established community pattern, verified by multiple sources

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable ecosystem, Expo SDK 54 is current)
