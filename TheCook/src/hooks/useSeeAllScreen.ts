import { useState, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';

import { getAllRecipesForFeed } from '@/src/db/recipes';
import { getCookedRecipeIds } from '@/src/db/cooking-history';
import { useProfileDb } from '@/src/db/profile';
import { buildFeedSections } from '@/src/hooks/useFeedScreen';

import type { RecipeListItem, HardFilter, FeedSection } from '@/src/types/discovery';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_KEYS: ReadonlySet<string> = new Set(['trending', 'quick', 'personal', 'untried']);

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface SeeAllScreenState {
  recipes: RecipeListItem[];
  title: string;
  loading: boolean;
  bookmarkedIds: Set<string>;
  isValid: boolean;
  userEquipment: string[];
  toggleBookmark: (id: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSeeAllScreen(sectionKey: string): SeeAllScreenState {
  const db = useSQLiteContext();
  const { getProfile, getBookmarks, addBookmark, removeBookmark } = useProfileDb();

  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [userEquipment, setUserEquipment] = useState<string[]>([]);

  // Validate section key early
  const isValid = VALID_KEYS.has(sectionKey);

  // If invalid key, return immediately with empty state
  if (!isValid) {
    return {
      recipes: [],
      title: '',
      loading: false,
      bookmarkedIds: new Set(),
      isValid: false,
      userEquipment: [],
      toggleBookmark: async () => {},
    };
  }

  // Re-fetch data on every screen focus (fresh data, handles allergen/filter changes)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setLoading(true);
        try {
          // 1. Get profile for hard filter params
          const profile = await getProfile();

          // 2. Build hard filter
          const hardFilter: HardFilter = {
            allergens: profile.allergens,
            skillLevel: profile.skillLevel,
            equipment: profile.equipment ?? [],
          };

          // 3. Fetch filtered recipes
          const allRecipes = await getAllRecipesForFeed(db, hardFilter);

          // 4. Get cooked recipe IDs
          const cookedIds = await getCookedRecipeIds(db);

          // 5. Build feed sections using the shared pure function
          const { sections } = buildFeedSections(allRecipes, cookedIds, profile);

          // 6. Find the matching section
          const section = sections.find((s: FeedSection) => s.key === sectionKey);

          if (cancelled) return;

          // 7. Set recipes and title from matching section
          setRecipes(section?.data ?? []);
          setTitle(section?.title ?? '');
          setUserEquipment(profile.equipment ?? []);

          // 8. Load bookmarks
          const bookmarks = await getBookmarks();
          if (cancelled) return;
          setBookmarkedIds(new Set(bookmarks.map((b) => b.recipeId)));
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      }

      load();

      return () => {
        cancelled = true;
      };
    }, [sectionKey])
  );

  // Bookmark toggle — add/remove and update local state
  async function toggleBookmark(id: string) {
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

  return {
    recipes,
    title,
    loading,
    bookmarkedIds,
    isValid,
    userEquipment,
    toggleBookmark,
  };
}
