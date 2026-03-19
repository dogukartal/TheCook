import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { router, useFocusEffect } from 'expo-router';

import { getAllRecipesForFeed, getRecipeById } from '@/src/db/recipes';
import { getCookedRecipeIds } from '@/src/db/cooking-history';
import { useProfileDb } from '@/src/db/profile';
import { getActiveSession, clearSession, CookingSession } from '@/src/db/cooking-session';

import type { Profile } from '@/src/types/profile';
import type { RecipeListItem, HardFilter, FeedSection } from '@/src/types/discovery';

// ---------------------------------------------------------------------------
// Pure functions (exported for testability)
// ---------------------------------------------------------------------------

const SKILL_ORDER: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

/**
 * Sorts recipes by cuisine preference match then skill level proximity.
 * Does not mutate the input array.
 */
export function rankByProfile(recipes: RecipeListItem[], profile: Profile): RecipeListItem[] {
  const cuisinePrefs = profile.cuisinePreferences
    ? profile.cuisinePreferences.split(',').map((c) => c.trim().toLocaleLowerCase('tr'))
    : [];

  const userSkill = SKILL_ORDER[profile.skillLevel ?? 'beginner'] ?? 1;

  return [...recipes].sort((a, b) => {
    // Primary: cuisine preference match (preferred first)
    const aMatch = cuisinePrefs.length > 0 && cuisinePrefs.includes(a.cuisine.toLocaleLowerCase('tr')) ? 0 : 1;
    const bMatch = cuisinePrefs.length > 0 && cuisinePrefs.includes(b.cuisine.toLocaleLowerCase('tr')) ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;

    // Secondary: skill level proximity (closer to user's level = higher)
    const aSkill = SKILL_ORDER[a.skillLevel ?? 'beginner'] ?? 1;
    const bSkill = SKILL_ORDER[b.skillLevel ?? 'beginner'] ?? 1;
    return Math.abs(aSkill - userSkill) - Math.abs(bSkill - userSkill);
  });
}

/**
 * Builds the 4 feed sections from a single recipe fetch.
 * Filters out sections with zero results.
 */
export function buildFeedSections(
  allRecipes: RecipeListItem[],
  cookedIds: Set<string>,
  profile: Profile
): { sections: FeedSection[]; allEmpty: boolean } {
  const raw: FeedSection[] = [
    { key: 'trending', title: 'Şu an trend', data: allRecipes },
    { key: 'quick', title: '30 dakikada bitir', data: allRecipes.filter((r) => (r.prepTime + r.cookTime) <= 30) },
    { key: 'personal', title: 'Sana özel', data: rankByProfile(allRecipes, profile) },
    { key: 'untried', title: 'Denemediklerin', data: allRecipes.filter((r) => !cookedIds.has(r.id)) },
  ];

  const sections = raw.filter((s) => s.data.length > 0);
  return { sections, allEmpty: sections.length === 0 };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeedScreenState {
  profile: Profile | null;
  profileLoaded: boolean;
  sections: FeedSection[];
  allEmpty: boolean;
  loading: boolean;
  bookmarkedIds: Set<string>;
  resumeSession: CookingSession | null;
  resumeRecipeName: string;
  resumeTotalSteps: number;
  refreshing: boolean;
}

export interface FeedScreenActions {
  handleBookmarkToggle: (id: string) => Promise<void>;
  handleRefresh: () => Promise<void>;
  handleResume: () => void;
  handleDismissResume: () => Promise<void>;
  handleRecipePress: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFeedScreen(): FeedScreenState & FeedScreenActions {
  const db = useSQLiteContext();
  const { getProfile, getBookmarks, addBookmark, removeBookmark } = useProfileDb();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Resume banner state
  const [resumeSession, setResumeSession] = useState<CookingSession | null>(null);
  const [resumeRecipeName, setResumeRecipeName] = useState('');
  const [resumeTotalSteps, setResumeTotalSteps] = useState(0);
  const [sections, setSections] = useState<FeedSection[]>([]);
  const [allEmpty, setAllEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
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

  // Load sections whenever profile is loaded
  const loadSections = useCallback(async () => {
    if (!profileLoaded || !profile) return;

    setLoading(true);
    try {
      const hardFilter: HardFilter = {
        allergens: profile.allergens,
        skillLevel: profile.skillLevel,
        equipment: profile.equipment ?? [],
      };
      const allRecipes = await getAllRecipesForFeed(db, hardFilter);
      const cookedIds = await getCookedRecipeIds(db);
      const result = buildFeedSections(allRecipes, cookedIds, profile);
      setSections(result.sections);
      setAllEmpty(result.allEmpty);
    } finally {
      setLoading(false);
    }
  }, [profileLoaded, profile, db]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

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
    await loadSections();
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
    sections,
    allEmpty,
    loading,
    bookmarkedIds,
    resumeSession,
    resumeRecipeName,
    resumeTotalSteps,
    refreshing,
    // Actions
    handleBookmarkToggle,
    handleRefresh,
    handleResume,
    handleDismissResume,
    handleRecipePress,
  };
}
