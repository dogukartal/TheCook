import { useState, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { Session } from '@supabase/supabase-js';

import { useProfileDb } from '@/src/db/profile';
import { useRecipesDb } from '@/src/db/recipes';
import { getRecipesByIds } from '@/src/db/recipes';
import { getCookedRecipesWithMeta, updateLatestRating } from '@/src/db/cooking-history';
import { useSession } from '@/src/auth/useSession';

import type { Profile } from '@/src/types/profile';
import type { RecipeListItem, HardFilter } from '@/src/types/discovery';

// ---------------------------------------------------------------------------
// Label maps
// ---------------------------------------------------------------------------

const ALLERGEN_LABELS: Record<string, string> = {
  gluten: 'Gluten',
  dairy: 'Sut Urunleri',
  egg: 'Yumurta',
  nuts: 'Kuruyemis',
  peanuts: 'Fistik',
  shellfish: 'Kabuklu Deniz Urunleri',
  fish: 'Balik',
  soy: 'Soya',
  sesame: 'Susam',
  mustard: 'Hardal',
  celery: 'Kereviz',
  lupin: 'Aci Bakla',
  molluscs: 'Yumusakca',
  sulphites: 'Sulfitler',
};

const SKILL_LEVEL_LABELS: Record<string, string> = {
  beginner: 'Baslangic',
  intermediate: 'Orta',
  advanced: 'Ileri',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CookbookTab = 'saved' | 'cooked';

export interface CookedRecipeDisplayItem extends RecipeListItem {
  cookCount: number;
  latestRating: number | null;
}

export interface CookbookScreenState {
  profile: Profile | null;
  bookmarkedIds: Set<string>;
  savedRecipes: RecipeListItem[];
  loading: boolean;
  session: Session | null;
  profileSummary: string;
  activeTab: CookbookTab;
  cookedRecipes: CookedRecipeDisplayItem[];
  cookedLoading: boolean;
}

export interface CookbookScreenActions {
  handleBookmarkToggle: (id: string) => Promise<void>;
  handleRecipePress: (id: string) => void;
  handleSettingsPress: () => void;
  handleSignOut: () => Promise<void>;
  handleSignIn: () => void;
  loadData: () => Promise<void>;
  setActiveTab: (tab: CookbookTab) => void;
  handleReRate: (recipeId: string, rating: number) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCookbookScreen(): CookbookScreenState & CookbookScreenActions {
  const db = useSQLiteContext();
  const { getProfile, getBookmarks, addBookmark, removeBookmark } = useProfileDb();
  const { getBookmarkedRecipes } = useRecipesDb();
  const { session, signOut } = useSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [savedRecipes, setSavedRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CookbookTab>('saved');
  const [cookedRecipes, setCookedRecipes] = useState<CookedRecipeDisplayItem[]>([]);
  const [cookedLoading, setCookedLoading] = useState(true);

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

  // Load profile + bookmarks + saved recipes + cooked recipes in parallel
  const loadData = useCallback(async () => {
    setLoading(true);
    setCookedLoading(true);
    try {
      const [p, bookmarks, cookedMeta] = await Promise.all([
        getProfile(),
        getBookmarks(),
        getCookedRecipesWithMeta(db),
      ]);
      setProfile(p);

      const ids = bookmarks.map((b) => b.recipeId);
      setBookmarkedIds(new Set(ids));

      // --- Saved recipes (with hard filters) ---
      if (ids.length === 0) {
        setSavedRecipes([]);
      } else {
        const hardFilter: HardFilter = {
          allergens: p.allergens,
          skillLevel: p.skillLevel,
          equipment: p.equipment,
        };
        const ordered = await getBookmarkedRecipes(ids, hardFilter);
        setSavedRecipes(ordered);
      }

      // --- Cooked recipes (NO hard filters -- user already cooked these) ---
      if (cookedMeta.length === 0) {
        setCookedRecipes([]);
      } else {
        const cookedIds = cookedMeta.map((m) => m.recipeId);
        const recipeDetails = await getRecipesByIds(db, cookedIds);

        // Merge recipe details with cooking meta
        const metaMap = new Map(cookedMeta.map((m) => [m.recipeId, m]));
        const merged: CookedRecipeDisplayItem[] = recipeDetails
          .map((recipe) => {
            const meta = metaMap.get(recipe.id);
            if (!meta) return null;
            return {
              ...recipe,
              cookCount: meta.cookCount,
              latestRating: meta.latestRating,
            };
          })
          .filter((item): item is CookedRecipeDisplayItem => item !== null);
        setCookedRecipes(merged);
      }
    } finally {
      setLoading(false);
      setCookedLoading(false);
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

  // Re-rate a cooked recipe (optimistic update + DB write)
  async function handleReRate(recipeId: string, rating: number) {
    // Optimistic update
    setCookedRecipes((prev) =>
      prev.map((item) =>
        item.id === recipeId ? { ...item, latestRating: rating } : item
      )
    );
    // Persist to DB
    await updateLatestRating(db, recipeId, rating);
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
    activeTab,
    cookedRecipes,
    cookedLoading,
    // Actions
    handleBookmarkToggle,
    handleRecipePress,
    handleSettingsPress,
    handleSignOut,
    handleSignIn,
    loadData,
    setActiveTab,
    handleReRate,
  };
}
