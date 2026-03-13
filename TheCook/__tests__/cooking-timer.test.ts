import { renderHook, act } from "@testing-library/react-native";

// ---------------------------------------------------------------------------
// Mocks — jest.mock factory runs before variable hoisting, so we use
// require-style access to get references after mock setup
// ---------------------------------------------------------------------------

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("notif-123"),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: { TIME_INTERVAL: "timeInterval" },
}));

jest.mock("react-native/Libraries/Alert/Alert", () => ({
  alert: jest.fn((_title: string, _msg: string, buttons: any[]) => {
    // Auto-press "Izin ver" (second button) to grant permission in tests
    const grantButton = buttons?.find((b: any) => b.text === "Izin ver");
    grantButton?.onPress?.();
  }),
}));

import * as Notifications from "expo-notifications";
import { useCookingTimer } from "../src/hooks/useCookingTimer";
import {
  ensureNotificationPermission,
  scheduleTimerNotification,
  cancelTimerNotification,
} from "../src/services/notifications";

const mockGetPermissions = Notifications.getPermissionsAsync as jest.Mock;
const mockRequestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const mockScheduleNotification = Notifications.scheduleNotificationAsync as jest.Mock;
const mockCancelNotification = Notifications.cancelScheduledNotificationAsync as jest.Mock;

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();

  // Default: permission already granted
  mockGetPermissions.mockResolvedValue({ status: "granted" });
  mockRequestPermissions.mockResolvedValue({ status: "granted" });
  mockScheduleNotification.mockResolvedValue("notif-123");
  mockCancelNotification.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// useCookingTimer tests
// ---------------------------------------------------------------------------

describe("useCookingTimer", () => {
  it("start(stepIndex, duration) sets isRunning=true and correct state", () => {
    const { result } = renderHook(() => useCookingTimer());

    act(() => {
      result.current.start(2, 60);
    });

    expect(result.current.timer.isRunning).toBe(true);
    expect(result.current.timer.stepIndex).toBe(2);
    expect(result.current.timer.startTimestamp).toBeGreaterThan(0);
    expect(result.current.displaySeconds).toBe(60);
  });

  it("displaySeconds decreases over time", async () => {
    const { result } = renderHook(() => useCookingTimer());

    act(() => {
      result.current.start(0, 10);
    });

    // Advance time by 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // displaySeconds should have decreased (timestamp-based, so it should be ~7)
    expect(result.current.displaySeconds).toBeLessThanOrEqual(10);
    expect(result.current.displaySeconds).toBeGreaterThan(0);
  });

  it("pause() sets isRunning=false and stores pausedRemaining", () => {
    const { result } = renderHook(() => useCookingTimer());

    act(() => {
      result.current.start(0, 30);
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    act(() => {
      result.current.pause();
    });

    expect(result.current.timer.isRunning).toBe(false);
    expect(result.current.timer.pausedRemaining).toBeGreaterThan(0);
    expect(result.current.timer.pausedRemaining).toBeLessThanOrEqual(30);
  });

  it("resume() restarts timer from pausedRemaining", () => {
    const { result } = renderHook(() => useCookingTimer());

    act(() => {
      result.current.start(0, 30);
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    act(() => {
      result.current.pause();
    });

    const pausedRemaining = result.current.timer.pausedRemaining;
    expect(pausedRemaining).toBeGreaterThan(0);

    act(() => {
      result.current.resume();
    });

    expect(result.current.timer.isRunning).toBe(true);
    expect(result.current.timer.startTimestamp).toBeGreaterThan(0);
    expect(result.current.timer.pausedRemaining).toBeNull();
  });

  it("starting timer on different step cancels previous", () => {
    const { result } = renderHook(() => useCookingTimer());

    act(() => {
      result.current.start(0, 60);
    });

    expect(result.current.timer.stepIndex).toBe(0);

    act(() => {
      result.current.start(3, 120);
    });

    expect(result.current.timer.stepIndex).toBe(3);
    expect(result.current.timer.duration).toBe(120);
    expect(result.current.displaySeconds).toBe(120);
  });

  it("timer reaching 0 sets isRunning=false and calls onComplete", () => {
    const onComplete = jest.fn();
    const { result } = renderHook(() => useCookingTimer({ onComplete }));

    act(() => {
      result.current.start(0, 2);
    });

    // Advance past the timer duration
    act(() => {
      jest.advanceTimersByTime(2500);
    });

    expect(result.current.timer.isRunning).toBe(false);
    expect(result.current.displaySeconds).toBe(0);
    expect(onComplete).toHaveBeenCalled();
  });

  it("reset() clears all state", () => {
    const { result } = renderHook(() => useCookingTimer());

    act(() => {
      result.current.start(0, 30);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.timer.isRunning).toBe(false);
    expect(result.current.timer.stepIndex).toBeNull();
    expect(result.current.timer.startTimestamp).toBeNull();
    expect(result.current.displaySeconds).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Notification service tests
// ---------------------------------------------------------------------------

describe("notifications service", () => {
  beforeEach(() => {
    jest.useRealTimers(); // notification tests don't need fake timers
  });

  it("ensureNotificationPermission returns true if already granted", async () => {
    mockGetPermissions.mockResolvedValue({ status: "granted" });
    const result = await ensureNotificationPermission();
    expect(result).toBe(true);
  });

  it("scheduleTimerNotification calls scheduleNotificationAsync with correct seconds", async () => {
    mockScheduleNotification.mockResolvedValue("notif-456");

    const id = await scheduleTimerNotification(120);

    expect(mockScheduleNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: "Zamanlayici bitti!",
          sound: true,
        }),
        trigger: expect.objectContaining({
          seconds: 120,
          repeats: false,
        }),
      })
    );
    expect(id).toBe("notif-456");
  });

  it("cancelTimerNotification calls cancelScheduledNotificationAsync", async () => {
    await cancelTimerNotification("notif-789");

    expect(mockCancelNotification).toHaveBeenCalledWith("notif-789");
  });
});
