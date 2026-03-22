import { supabase } from './supabase';
import { saveProfileToDb, saveBookmarksToDb } from '../db/profile';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Bookmark } from '../types/profile';

/**
 * pullCloudProfile — fetches the user's profile and bookmarks from Supabase
 * and overwrites local SQLite data. Cloud always wins on conflict.
 *
 * Pass null/undefined userId to skip silently (e.g. no active session).
 */
export async function pullCloudProfile(
  db: SQLiteDatabase,
  userId: string | null | undefined
): Promise<void> {
  if (!userId) return;

  // Pull profile — cloud wins
  const { data: cloudProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (cloudProfile) {
    await saveProfileToDb(db, {
      allergens: cloudProfile.allergens ?? [],
      skillLevel: cloudProfile.skill_level ?? null,
      equipment: cloudProfile.equipment ?? [],
      isPremium: cloudProfile.is_premium ?? false,
    });
  }

  // Pull bookmarks — cloud wins
  const { data: cloudBookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId);

  if (cloudBookmarks && cloudBookmarks.length > 0) {
    const bookmarks: Bookmark[] = cloudBookmarks.map(
      (b: { id: string; recipe_id: string; user_id: string | null; created_at: string }) => ({
        id: b.id,
        recipeId: b.recipe_id,
        userId: b.user_id,
        createdAt: b.created_at,
      })
    );
    await saveBookmarksToDb(db, bookmarks);
  }
}

/**
 * initAuthListener — registers a Supabase auth state listener on the given db.
 *
 * - SIGNED_IN: pulls cloud profile/bookmarks and overwrites local SQLite (cloud wins)
 * - SIGNED_OUT: does nothing — local data persists per user decision
 *
 * Returns an unsubscribe function. Call it on component unmount or app teardown.
 */
export function initAuthListener(db: SQLiteDatabase): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      await pullCloudProfile(db, session.user.id);
    }
    // SIGNED_OUT: do nothing — local data persists per user decision
  });

  return () => subscription.unsubscribe();
}
