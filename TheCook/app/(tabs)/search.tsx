import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';

import { useRecipesDb } from '@/src/db/recipes';
import { useProfileDb } from '@/src/db/profile';
import { RecipeCardGrid } from '@/components/ui/recipe-card-grid';
import { RecipeCardRow } from '@/components/ui/recipe-card-row';
import { IngredientChips } from '@/components/discovery/ingredient-chips';

import type { Profile } from '@/src/types/profile';
import type { RecipeListItem, AutocompleteSuggestion } from '@/src/types/discovery';

// ---------------------------------------------------------------------------
// Search screen — Ara tab
// ---------------------------------------------------------------------------

export default function SearchScreen() {
  const {
    getAllIngredientNames,
    getAllRecipeTitles,
    getAllRecipesForSearch,
    searchRecipesByIngredients,
    getRecentViews,
    recordRecentView,
    getBookmarks,
    addBookmark,
    removeBookmark,
  } = useRecipesDb();
  const { getProfile } = useProfileDb();

  // Data loaded on mount
  const [allIngredients, setAllIngredients] = useState<string[]>([]);
  const [allRecipeTitles, setAllRecipeTitles] = useState<{ id: string; title: string }[]>([]);
  const [allRecipes, setAllRecipes] = useState<(RecipeListItem & { ingredient_groups: string })[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [recentViews, setRecentViews] = useState<RecipeListItem[]>([]);

  // Search interaction state
  const [query, setQuery] = useState('');
  const [ingredientChips, setIngredientChips] = useState<string[]>([]);
  const [results, setResults] = useState<RecipeListItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // ---------------------------------------------------------------------------
  // Load data on focus (re-fetches profile for allergen changes)
  // ---------------------------------------------------------------------------
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadAll() {
        // Load profile first (needed for allergen exclusion)
        const p = await getProfile();
        if (cancelled) return;
        setProfile(p);

        // Parallel: ingredients, titles, allergen-filtered recipe list (with ingredient_groups), bookmarks
        const [ingredients, titles, recipes, bookmarks, recentViewEntries] = await Promise.all([
          getAllIngredientNames(),
          getAllRecipeTitles(),
          getAllRecipesForSearch(p.allergens),
          getBookmarks(null),
          getRecentViews(),
        ]);

        if (cancelled) return;

        setAllIngredients(ingredients);
        setAllRecipeTitles(titles);
        setAllRecipes(recipes);
        setBookmarkedIds(new Set(bookmarks.map((b) => b.recipeId)));

        // Join recent views with recipe data (strip ingredient_groups for display)
        const recipeMap = new Map(recipes.map((r) => [r.id, r as RecipeListItem]));
        const recentRecipes = recentViewEntries
          .map((rv) => recipeMap.get(rv.recipeId))
          .filter((r): r is RecipeListItem => r !== undefined);
        setRecentViews(recentRecipes);

        setProfileLoaded(true);
      }

      loadAll();
      return () => { cancelled = true; };
    }, [])
  );

  // ---------------------------------------------------------------------------
  // Autocomplete logic — in-memory filter on every query change (no DB calls)
  // ---------------------------------------------------------------------------
  const suggestions = useMemo<AutocompleteSuggestion[]>(() => {
    if (query.length < 2) return [];

    const lowerQuery = query.toLowerCase();

    const ingredientMatches = allIngredients
      .filter((name) => name.toLowerCase().includes(lowerQuery))
      .slice(0, 8)
      .map<AutocompleteSuggestion>((name) => ({
        value: name,
        type: 'ingredient',
        recipeId: null,
      }));

    const recipeMatches = allRecipeTitles
      .filter((r) => r.title.toLowerCase().includes(lowerQuery))
      .slice(0, 4)
      .map<AutocompleteSuggestion>((r) => ({
        value: r.title,
        type: 'recipe',
        recipeId: r.id,
      }));

    return [...ingredientMatches, ...recipeMatches];
  }, [query, allIngredients, allRecipeTitles]);

  // ---------------------------------------------------------------------------
  // Search by ingredient chips — fires when chips change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (ingredientChips.length === 0) {
      setResults([]);
      return;
    }
    if (!profile) return;

    let cancelled = false;
    setSearchLoading(true);

    searchRecipesByIngredients(allRecipes, ingredientChips, true).then((matched) => {
      if (cancelled) return;
      setResults(matched);
      setSearchLoading(false);
    });

    return () => { cancelled = true; };
  }, [ingredientChips, allRecipes, profile]);

  // ---------------------------------------------------------------------------
  // Interactions
  // ---------------------------------------------------------------------------
  function handleSelectIngredient(name: string) {
    if (!ingredientChips.includes(name)) {
      setIngredientChips((prev) => [...prev, name]);
    }
    setQuery('');
  }

  function handleRemoveChip(name: string) {
    setIngredientChips((prev) => prev.filter((c) => c !== name));
  }

  function handleSelectRecipe(recipeId: string) {
    setQuery('');
    router.push(`/recipe/${recipeId}` as never);
  }

  function handleRecipePress(id: string) {
    recordRecentView(id);
    // Update recent views state optimistically
    const recipe = allRecipes.find((r) => r.id === id);
    if (recipe) {
      setRecentViews((prev) => {
        const filtered = prev.filter((r) => r.id !== id);
        return [recipe, ...filtered].slice(0, 10);
      });
    }
    router.push(`/recipe/${id}` as never);
  }

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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const isIdle = ingredientChips.length === 0 && query.length === 0;
  const hasChips = ingredientChips.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBarWrapper}>
        <TextInput
          style={styles.searchBar}
          placeholder="Malzeme veya tarif ara..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {/* Autocomplete dropdown */}
      {suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => `${item.type}:${item.value}`}
            renderItem={({ item }) => (
              <Pressable
                style={styles.suggestionRow}
                onPress={() => {
                  if (item.type === 'ingredient') {
                    handleSelectIngredient(item.value);
                  } else if (item.recipeId) {
                    handleSelectRecipe(item.recipeId);
                  }
                }}
              >
                <Text style={styles.suggestionText}>{item.value}</Text>
                <View style={[
                  styles.typeBadge,
                  item.type === 'ingredient' ? styles.typeBadgeIngredient : styles.typeBadgeRecipe,
                ]}>
                  <Text style={styles.typeBadgeText}>
                    {item.type === 'ingredient' ? 'Malzeme' : 'Tarif'}
                  </Text>
                </View>
              </Pressable>
            )}
            style={styles.dropdownList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {/* Ingredient chips */}
      {ingredientChips.length > 0 && (
        <View style={styles.chipsContainer}>
          <IngredientChips chips={ingredientChips} onRemove={handleRemoveChip} />
        </View>
      )}

      {/* Results area */}
      {isIdle ? (
        // Idle state: show recent views
        recentViews.length > 0 ? (
          <View style={styles.resultsArea}>
            <Text style={styles.sectionLabel}>Son Görüntülenenler</Text>
            <FlatList
              data={recentViews}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <RecipeCardRow recipe={item} onPress={handleRecipePress} />
              )}
              contentContainerStyle={styles.rowListContent}
            />
          </View>
        ) : null
      ) : hasChips ? (
        // Chips active: show grid results
        searchLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aranıyor...</Text>
          </View>
        ) : results.length > 0 ? (
          <FlashList
            data={results}
            numColumns={2}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <RecipeCardGrid
                  recipe={item}
                  isBookmarked={bookmarkedIds.has(item.id)}
                  onBookmarkToggle={handleBookmarkToggle}
                  onPress={handleRecipePress}
                />
              </View>
            )}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={null}
            contentContainerStyle={{ padding: 8 }}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Eşleşen tarif bulunamadı. Başka malzemeler dene.
            </Text>
          </View>
        )
      ) : null}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBar: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 15,
    backgroundColor: '#F9FAFB',
    color: '#111827',
  },
  dropdown: {
    position: 'absolute',
    top: 64,
    left: 16,
    right: 16,
    zIndex: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    maxHeight: 280,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownList: {
    borderRadius: 12,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  typeBadgeIngredient: {
    backgroundColor: '#FEF3EC',
  },
  typeBadgeRecipe: {
    backgroundColor: '#EEF2FF',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  chipsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  resultsArea: {
    flex: 1,
    paddingTop: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    paddingHorizontal: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowListContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  cardWrapper: {
    flex: 1,
    padding: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
});
