import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import {
  ensureNotificationPermission,
  scheduleTimerNotification,
  cancelTimerNotification,
} from "../services/notifications";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimerState {
  stepIndex: number | null;
  duration: number;
  startTimestamp: number | null;
  pausedRemaining: number | null;
  isRunning: boolean;
}

export interface UseCookingTimerOptions {
  onComplete?: () => void;
}

export interface UseCookingTimerReturn {
  timer: TimerState;
  displaySeconds: number;
  start: (stepIndex: number, durationSeconds: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const INITIAL_STATE: TimerState = {
  stepIndex: null,
  duration: 0,
  startTimestamp: null,
  pausedRemaining: null,
  isRunning: false,
};

export function useCookingTimer(
  options?: UseCookingTimerOptions
): UseCookingTimerReturn {
  const [timer, setTimer] = useState<TimerState>(INITIAL_STATE);
  const [displaySeconds, setDisplaySeconds] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notificationIdRef = useRef<string | null>(null);
  const onCompleteRef = useRef(options?.onComplete);

  // Keep onComplete ref up to date
  useEffect(() => {
    onCompleteRef.current = options?.onComplete;
  }, [options?.onComplete]);

  // ---------------------------------------------------------------------------
  // Tick — derives remaining from timestamps, not interval counting
  // ---------------------------------------------------------------------------

  const clearTickInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTickInterval = useCallback(
    (duration: number, startTimestamp: number) => {
      clearTickInterval();

      const tick = () => {
        const elapsed = (Date.now() - startTimestamp) / 1000;
        const remaining = Math.max(0, duration - elapsed);
        setDisplaySeconds(Math.ceil(remaining));

        if (remaining <= 0) {
          clearTickInterval();
          setTimer((prev) => ({
            ...prev,
            isRunning: false,
            pausedRemaining: null,
          }));
          onCompleteRef.current?.();
        }
      };

      // Immediate first tick
      tick();
      intervalRef.current = setInterval(tick, 200);
    },
    [clearTickInterval]
  );

  // ---------------------------------------------------------------------------
  // Notification helpers
  // ---------------------------------------------------------------------------

  const cancelCurrentNotification = useCallback(async () => {
    if (notificationIdRef.current) {
      try {
        await cancelTimerNotification(notificationIdRef.current);
      } catch {
        // Ignore — notification may already be delivered or cancelled
      }
      notificationIdRef.current = null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  const start = useCallback(
    (stepIndex: number, durationSeconds: number) => {
      // Cancel any existing timer/notification
      clearTickInterval();
      cancelCurrentNotification();

      const now = Date.now();

      setTimer({
        stepIndex,
        duration: durationSeconds,
        startTimestamp: now,
        pausedRemaining: null,
        isRunning: true,
      });

      setDisplaySeconds(durationSeconds);
      startTickInterval(durationSeconds, now);

      // Schedule notification (fire-and-forget; permission checked inside)
      ensureNotificationPermission().then((granted) => {
        if (granted) {
          scheduleTimerNotification(durationSeconds).then((id) => {
            notificationIdRef.current = id;
          });
        }
      });
    },
    [clearTickInterval, cancelCurrentNotification, startTickInterval]
  );

  const pause = useCallback(() => {
    if (!timer.isRunning || timer.startTimestamp === null) return;

    clearTickInterval();
    cancelCurrentNotification();

    const elapsed = (Date.now() - timer.startTimestamp) / 1000;
    const remaining = Math.max(0, timer.duration - elapsed);

    setTimer((prev) => ({
      ...prev,
      isRunning: false,
      pausedRemaining: remaining,
    }));
    setDisplaySeconds(Math.ceil(remaining));
  }, [timer.isRunning, timer.startTimestamp, timer.duration, clearTickInterval, cancelCurrentNotification]);

  const resume = useCallback(() => {
    if (timer.pausedRemaining === null || timer.pausedRemaining <= 0) return;

    const now = Date.now();
    const newDuration = timer.pausedRemaining;

    setTimer((prev) => ({
      ...prev,
      duration: newDuration,
      startTimestamp: now,
      pausedRemaining: null,
      isRunning: true,
    }));

    startTickInterval(newDuration, now);

    // Reschedule notification
    ensureNotificationPermission().then((granted) => {
      if (granted) {
        scheduleTimerNotification(Math.ceil(newDuration)).then((id) => {
          notificationIdRef.current = id;
        });
      }
    });
  }, [timer.pausedRemaining, startTickInterval]);

  const reset = useCallback(() => {
    clearTickInterval();
    cancelCurrentNotification();
    setTimer(INITIAL_STATE);
    setDisplaySeconds(0);
  }, [clearTickInterval, cancelCurrentNotification]);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      clearTickInterval();
      cancelCurrentNotification();
    };
  }, [clearTickInterval, cancelCurrentNotification]);

  // ---------------------------------------------------------------------------
  // AppState listener — timer auto-recalculates on foreground since
  // displaySeconds derives from Date.now() on each tick. We restart the
  // interval when coming back to active state.
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        nextAppState === "active" &&
        timer.isRunning &&
        timer.startTimestamp !== null
      ) {
        // Restart interval to recalculate from timestamps
        startTickInterval(timer.duration, timer.startTimestamp);
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [timer.isRunning, timer.startTimestamp, timer.duration, startTickInterval]);

  return { timer, displaySeconds, start, pause, resume, reset };
}
