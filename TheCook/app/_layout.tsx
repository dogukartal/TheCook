import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { migrateDb } from "../src/db/client";
import { seedIfNeeded } from "../src/db/seed";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <SQLiteProvider
      databaseName="thecook.db"
      onInit={async (db) => {
        await migrateDb(db);
        await seedIfNeeded(db);
      }}
    >
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      </Stack>
    </SQLiteProvider>
  );
}
