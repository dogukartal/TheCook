import { Stack, Redirect } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { migrateDb } from '../src/db/client';
import { seedIfNeeded } from '../src/db/seed';
import { initAuthListener } from '../src/auth/sync';
import { SessionProvider } from '../src/auth/useSession';
import { useProfileDb } from '../src/db/profile';
import { ThemeProvider } from '../contexts/ThemeContext';

// Configure Google Sign In at module level — must happen before any sign-in attempt
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

function RootNavigator() {
  const db = useSQLiteContext();
  const { getProfile } = useProfileDb();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    getProfile().then((p) => setOnboardingDone(p.onboardingCompleted));
  }, []);

  // Do not redirect while loading — wait until onboarding state is known
  if (onboardingDone === null) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      {!onboardingDone && <Redirect href="/onboarding/allergens" />}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider
      databaseName="thecook.db"
      onInit={async (db) => {
        await migrateDb(db);
        await seedIfNeeded(db);
        initAuthListener(db); // start auth → cloud sync listener after DB is ready
      }}
    >
      <SessionProvider>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </SessionProvider>
    </SQLiteProvider>
  );
}
