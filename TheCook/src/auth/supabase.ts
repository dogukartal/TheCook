import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

// expo-sqlite localStorage is used for session persistence in native environments.
// The localStorage global is installed by expo-sqlite/localStorage/install.js.
// In Jest/Node environments, the global may not be available — we fall back to
// in-memory storage so tests don't crash.
let storage: Storage | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('expo-sqlite/localStorage/install');
  storage = typeof localStorage !== 'undefined' ? localStorage : undefined;
} catch {
  // Not available in test environment — supabase will use in-memory fallback
  storage = undefined;
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
  {
    auth: {
      storage: storage as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Start/stop auto-refresh on foreground/background transitions
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
