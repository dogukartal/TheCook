import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";

// ---------------------------------------------------------------------------
// Foreground notification handler — show alerts even when app is in foreground
// ---------------------------------------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ---------------------------------------------------------------------------
// Permission
// ---------------------------------------------------------------------------

/**
 * Ensures notification permission is granted. If not yet granted, shows a
 * Turkish-language explanation alert before requesting system permission.
 * Returns true if permission is granted, false otherwise.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  if (existingStatus === "granted") return true;

  // Show a sincere Turkish explanation before the system prompt
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      "Bildirim izni",
      "Yemeklerin hazir oldugunda sana haber verebilmemiz icin bildirim iznine ihtiyacimiz var. Boylece baska islerinle ilgilenirken biz sana zamanlayicin bittigini soyleyebiliriz.",
      [
        {
          text: "Simdi degil",
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: "Izin ver",
          onPress: async () => {
            const { status } =
              await Notifications.requestPermissionsAsync();
            resolve(status === "granted");
          },
        },
      ]
    );
  });
}

// ---------------------------------------------------------------------------
// Timer notification scheduling
// ---------------------------------------------------------------------------

/**
 * Schedule a local notification to fire after the given number of seconds.
 * Returns the notification identifier for later cancellation.
 */
export async function scheduleTimerNotification(
  seconds: number
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Zamanlayici bitti!",
      body: "Yemegin icin zamanlayici sona erdi. Bir sonraki adima gecebilirsin!",
      sound: true,
    },
    trigger: Platform.OS === "web"
      ? null
      : { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
  });
  return id;
}

/**
 * Cancel a previously scheduled notification by its identifier.
 */
export async function cancelTimerNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}
