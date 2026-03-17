import { useState, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import type { Session } from '@supabase/supabase-js';

import { useProfileDb } from '@/src/db/profile';
import { useRecipesDb } from '@/src/db/recipes';
import { useSession } from '@/src/auth/useSession';

import type { Profile } from '@/src/types/profile';
import type { RecipeListItem, HardFilter } from '@/src/types/discovery';

// ---------------------------------------------------------------------------
// Label maps
// ---------------------------------------------------------------------------

const ALLERGEN_LABELS: Record<string, string> = {
  gluten: 'Gluten',
  dairy: 'Süt Ürünleri',
  egg: 'Yumurta',
  nuts: 'Kuruyemiş',
  peanuts: 'Fıstık',
  shellfish: 'Kabuklu Deniz Ürünleri',
  fish: 'Balık',
  soy: 'Soya',
  sesame: 'Susam',
  mustard: 'Hardal',
  celery: 'Kereviz',
  lupin: 'Acı Bakla',
  molluscs: 'Yumuşakça',
  sulphites: 'Sülfitler',
};

const SKILL_LEVEL_LABELS: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CookbookScreenState {
  profile: Profile | null;
  bookmarkedIds: Set<string>;
  savedRecipes: RecipeListItem[];
  loading: boolean;
  session: Session | null;
  profileSummary: string;
}

export interface CookbookScreenActions {
  handleBookmarkToggle: (id: string) => Promise<void>;
  handleRecipePress: (id: string) => void;
  handleSettingsPress: () => void;
  handleSignOut: () => Promise<void>;
  handleSignIn: () => void;
  loadData: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCookbookScreen(): CookbookScreenState & CookbookScreenActions {
  const { getProfile, getBookmarks, addBookmark, removeBookmark } = useProfileDb();
  const { getBookmarkedRecipes } = useRecipesDb();
  const { session, signOut } = useSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [savedRecipes, setSavedRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Build profile summary string
  function buildProfileSummary(): string {
    if (!profile) return '';
    const parts: string[] = [];
    if (profile.skillLevel) {
      parts.push(SKILL_LEVEL_LABELS[profile.skillLevel] ?? profile.skillLevel);
    }
    if (profile.allergens.length > 0) {
      parts.push(`${profile.allergens.length} allerjen`);
    }
    if (profile.equipment.length > 0) {
      parts.push(`${profile.equipment.length} ekipman`);
    }
    return parts.join(' \u2022 ');
  }

  const profileSummary = buildProfileSummary();

  // Load profile + bookmarks + recipe data for bookmarks
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, bookmarks] = await Promise.all([getProfile(), getBookmarks()]);
      setProfile(p);

      const ids = bookmarks.map((b) => b.recipeId);
      setBookmarkedIds(new Set(ids));

      if (ids.length === 0) {
        setSavedRecipes([]);
        return;
      }

      // Fetch bookmarked recipes with hard filter exclusion (DISC-05)
      const hardFilter: HardFilter = {
        allergens: p.allergens,
        skillLevel: p.skillLevel,
        equipment: p.equipment,
      };
      const ordered = await getBookmarkedRecipes(ids, hardFilter);
      setSavedRecipes(ordered);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Bookmark toggle
  async function handleBookmarkToggle(id: string) {
    if (bookmarkedIds.has(id)) {
      await removeBookmark(id);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setSavedRecipes((prev) => prev.filter((r) => r.id !== id));
    } else {
      await addBookmark(id, session?.user.id ?? null);
      setBookmarkedIds((prev) => new Set([...prev, id]));
      // Reload to get recipe data
      loadData();
    }
  }

  function handleRecipePress(id: string) {
    router.push(`/recipe/${id}` as never);
  }

  function handleSettingsPress() {
    router.push('/settings' as never);
  }

  async function handleSignOut() {
    await signOut();
  }

  function handleSignIn() {
    router.push('/(auth)/sign-in' as never);
  }

  return {
    // State
    profile,
    bookmarkedIds,
    savedRecipes,
    loading,
    session,
    profileSummary,
    // Actions
    handleBookmarkToggle,
    handleRecipePress,
    handleSettingsPress,
    handleSignOut,
    handleSignIn,
    loadData,
  };
}
