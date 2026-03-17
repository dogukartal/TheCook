import { useState, useEffect, useCallback } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { router } from "expo-router";

import {
  getRecipeById,
  recordRecentView,
  getBookmarks,
  addBookmark,
  removeBookmark,
} from "@/src/db/recipes";
import {
  getActiveSession,
  clearSession,
  saveSession,
} from "@/src/db/cooking-session";
import { useRecipeAdaptation } from "@/src/hooks/useRecipeAdaptation";
import type { Recipe } from "@/src/types/recipe";

// ---------------------------------------------------------------------------
// useRecipeDetailScreen — encapsulates all recipe detail screen state
// Per project convention (Phase 7+): screens are thin rendering shells
// ---------------------------------------------------------------------------

export function useRecipeDetailScreen(id: string) {
  const db = useSQLiteContext();

  // ---------------------------------------------------------------------------
  // Core state
  // ---------------------------------------------------------------------------

  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined); // undefined = loading
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  // ---------------------------------------------------------------------------
  // Adaptation state (scaling, swaps, variable resolution)
  // ---------------------------------------------------------------------------

  const adaptation = useRecipeAdaptation(recipe ?? null);

  // ---------------------------------------------------------------------------
  // Load recipe, bookmarks, and session on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!id) {
      setRecipe(null);
      return;
    }

    let cancelled = false;

    async function load() {
      const [r, bookmarks, session] = await Promise.all([
        getRecipeById(db, id),
        getBookmarks(db, null),
        getActiveSession(db),
      ]);

      if (cancelled) return;

      setRecipe(r);
      setIsBookmarked(bookmarks.some((b) => b.recipeId === id));
      setHasActiveSession(session?.recipeId === id);

      if (r) {
        await recordRecentView(db, id);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id, db]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleBookmarkToggle = useCallback(async () => {
    if (!id) return;
    if (isBookmarked) {
      await removeBookmark(db, id);
      setIsBookmarked(false);
    } else {
      await addBookmark(db, id, null);
      setIsBookmarked(true);
    }
  }, [id, isBookmarked, db]);

  const startCooking = useCallback(async () => {
    if (!id) return;

    // If no active session for this recipe, check for other sessions
    if (!hasActiveSession) {
      const existingSession = await getActiveSession(db);
      if (existingSession && existingSession.recipeId !== id) {
        // Clear old session — only one at a time
        await clearSession(db);
      }
      // Create new session with adaptation data
      await saveSession(db, {
        recipeId: id,
        currentStep: 0,
        timerRemaining: null,
        timerStartTimestamp: null,
        ingredientChecks: [],
        sessionStartedAt: new Date().toISOString(),
        adaptedServings: adaptation.servings,
        ingredientSwaps: adaptation.swaps,
      });
    }
    router.push(`/recipe/cook/${id}` as never);
  }, [id, hasActiveSession, db, adaptation.servings, adaptation.swaps]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    recipe,
    isBookmarked,
    hasActiveSession,
    adaptation,
    handleBookmarkToggle,
    startCooking,
  };
}
