import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { router, useFocusEffect } from 'expo-router';

import { useRecipesDb, getRecipeById } from '@/src/db/recipes';
import { useProfileDb } from '@/src/db/profile';
import { getActiveSession, clearSession, CookingSession } from '@/src/db/cooking-session';

import type { Profile } from '@/src/types/profile';
import type { RecipeListItem, DiscoveryFilter, HardFilter } from '@/src/types/discovery';
import type { Category } from '@/src/types/recipe';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FeedTab = 'trending' | 'for-you';

export interface FeedScreenState {
  profile: Profile | null;
  profileLoaded: boolean;
  recipes: RecipeListItem[];
  loading: boolean;
  activeTab: FeedTab;
  selectedCategory: Category | null;
  bookmarkedIds: Set<string>;
  resumeSession: CookingSession | null;
  resumeRecipeName: string;
  resumeTotalSteps: number;
  refreshing: boolean;
  filter: DiscoveryFilter;
}

export interface FeedScreenActions {
  setActiveTab: (tab: FeedTab) => void;
  setSelectedCategory: (cat: Category | null) => void;
  handleBookmarkToggle: (id: string) => Promise<void>;
  handleRefresh: () => Promise<void>;
  handleResume: () => void;
  handleDismissResume: () => Promise<void>;
  handleRecipePress: (id: string) => void;
  loadRecipes: () => Promise<void>;
  setFilter: React.Dispatch<React.SetStateAction<DiscoveryFilter>>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const INITIAL_FILTER: DiscoveryFilter = {
  category: null,
  cookTimeBucket: null,
  skillLevel: null,
  cuisine: null,
  equipment: [],
};

export function useFeedScreen(): FeedScreenState & FeedScreenActions {
  const db = useSQLiteContext();
  const { getAllRecipesForFeed, getFeedRecipes, filterRecipesByCategory } = useRecipesDb();
  const { getProfile, getBookmarks, addBookmark, removeBookmark } = useProfileDb();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Resume banner state
  const [resumeSession, setResumeSession] = useState<CookingSession | null>(null);
  const [resumeRecipeName, setResumeRecipeName] = useState('');
  const [resumeTotalSteps, setResumeTotalSteps] = useState(0);
  const [activeTab, setActiveTab] = useState<FeedTab>('trending');
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [filter, setFilter] = useState<DiscoveryFilter>(INITIAL_FILTER);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // Re-fetch profile + bookmarks on every focus
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getProfile().then((p) => {
        if (cancelled) return;
        setProfile(p);
        return getBookmarks().then((bookmarks) => {
          if (cancelled) return;
          setBookmarkedIds(new Set(bookmarks.map((b) => b.recipeId)));
          setProfileLoaded(true);
        });
      });
      return () => { cancelled = true; };
    }, [])
  );

  // Check for active cooking session on every focus
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function checkSession() {
        const session = await getActiveSession(db);
        if (cancelled) return;
        if (session) {
          const recipe = await getRecipeById(db, session.recipeId);
          if (cancelled) return;
          setResumeSession(session);
          setResumeRecipeName(recipe?.title ?? 'Tarif');
          setResumeTotalSteps(recipe?.steps.length ?? 0);
        } else {
          setResumeSession(null);
        }
      }
      checkSession();
      return () => { cancelled = true; };
    }, [])
  );

  // Resume banner actions
  function handleResume() {
    if (resumeSession) {
      router.push(`/recipe/cook/${resumeSession.recipeId}` as never);
    }
  }

  async function handleDismissResume() {
    await clearSession(db);
    setResumeSession(null);
  }

  // Load recipes whenever profile is loaded or tab/category/filter changes
  const loadRecipes = useCallback(async () => {
    if (!profileLoaded || !profile) return;

    setLoading(true);
    try {
      const hardFilter: HardFilter = {
        allergens: profile.allergens,
        skillLevel: profile.skillLevel,
        equipment: profile.equipment ?? [],
      };
      const allergenFiltered = await getAllRecipesForFeed(hardFilter);

      let result: RecipeListItem[];

      if (activeTab === 'trending') {
        result = allergenFiltered;
      } else {
        result = await getFeedRecipes(allergenFiltered, profile.skillLevel);
      }

      if (selectedCategory) {
        result = await filterRecipesByCategory(result, selectedCategory);
      }

      setRecipes(result);
    } finally {
      setLoading(false);
    }
  }, [profileLoaded, profile, activeTab, selectedCategory]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Bookmark toggle
  async function handleBookmarkToggle(id: string) {
    if (bookmarkedIds.has(id)) {
      await removeBookmark(id);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      await addBookmark(id, null);
      setBookmarkedIds((prev) => new Set([...prev, id]));
    }
  }

  // Pull-to-refresh
  async function handleRefresh() {
    setRefreshing(true);
    const p = await getProfile();
    setProfile(p);
    const bookmarks = await getBookmarks();
    setBookmarkedIds(new Set(bookmarks.map((b) => b.recipeId)));
    await loadRecipes();
    setRefreshing(false);
  }

  // Navigate to recipe detail
  function handleRecipePress(id: string) {
    router.push(`/recipe/${id}` as never);
  }

  return {
    // State
    profile,
    profileLoaded,
    recipes,
    loading,
    activeTab,
    selectedCategory,
    bookmarkedIds,
    resumeSession,
    resumeRecipeName,
    resumeTotalSteps,
    refreshing,
    filter,
    // Actions
    setActiveTab,
    setSelectedCategory,
    handleBookmarkToggle,
    handleRefresh,
    handleResume,
    handleDismissResume,
    handleRecipePress,
    loadRecipes,
    setFilter,
  };
}
