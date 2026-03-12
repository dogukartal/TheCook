import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';

import { useRecipesDb } from '@/src/db/recipes';
import { useProfileDb } from '@/src/db/profile';
import { RecipeCardGrid } from '@/components/ui/recipe-card-grid';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { CategoryFilter } from '@/components/discovery/category-filter';

import type { Profile } from '@/src/types/profile';
import type { RecipeListItem, DiscoveryFilter } from '@/src/types/discovery';
import type { Category } from '@/src/types/recipe';

// ---------------------------------------------------------------------------
// Feed screen — Keşfet tab (index)
// ---------------------------------------------------------------------------

type FeedTab = 'trending' | 'for-you';

const INITIAL_FILTER: DiscoveryFilter = {
  category: null,
  cookTimeBucket: null,
  skillLevel: null,
  cuisine: null,
};

export default function FeedScreen() {
  const { getAllRecipesForFeed, getFeedRecipes, filterRecipesByCategory } = useRecipesDb();
  const { getProfile, getBookmarks, addBookmark, removeBookmark } = useProfileDb();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedTab>('trending');
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [filter, setFilter] = useState<DiscoveryFilter>(INITIAL_FILTER);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Load profile first, then bookmarks — guard against allergen race condition
  useEffect(() => {
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
  }, []);

  // Load recipes whenever profile is loaded or tab/category/filter changes
  const loadRecipes = useCallback(async () => {
    if (!profileLoaded || !profile) return;

    setLoading(true);
    try {
      // Get allergen-excluded recipes from DB
      const allergenFiltered = await getAllRecipesForFeed(profile.allergens);

      let result: RecipeListItem[];

      if (activeTab === 'trending') {
        // Trending: Hira's curated rowid order (already sorted by DB query)
        result = allergenFiltered;
      } else {
        // For You: skill-matched order
        result = await getFeedRecipes(allergenFiltered, profile.skillLevel);
      }

      // Apply category JS filter if a category is selected
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

  // Navigate to recipe detail
  function handleRecipePress(id: string) {
    router.push(`/recipe/${id}` as never);
  }

  // Don't render until profile is loaded (prevents allergen flash)
  if (!profileLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.skeletonGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonItem}>
              <SkeletonCard variant="grid" />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top tabs */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabButton, activeTab === 'trending' && styles.tabButtonActive]}
          onPress={() => setActiveTab('trending')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'trending' }}
        >
          <Text style={[styles.tabLabel, activeTab === 'trending' && styles.tabLabelActive]}>
            Keşfet
          </Text>
          {activeTab === 'trending' && <View style={styles.tabUnderline} />}
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'for-you' && styles.tabButtonActive]}
          onPress={() => setActiveTab('for-you')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'for-you' }}
        >
          <Text style={[styles.tabLabel, activeTab === 'for-you' && styles.tabLabelActive]}>
            Sizin İçin
          </Text>
          {activeTab === 'for-you' && <View style={styles.tabUnderline} />}
        </Pressable>
      </View>

      {/* Category filter */}
      <View style={styles.filterContainer}>
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={(cat) => {
            setSelectedCategory(cat);
            setFilter((prev) => ({ ...prev, category: cat }));
          }}
          filter={filter}
          onFilterChange={setFilter}
        />
      </View>

      {/* Recipe list or skeleton */}
      {loading ? (
        <View style={styles.skeletonGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonItem}>
              <SkeletonCard variant="grid" />
            </View>
          ))}
        </View>
      ) : (
        <FlashList
          data={recipes}
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
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Bu kategoride tarif bulunamadı.</Text>
              <Pressable onPress={loadRecipes} style={styles.retryButton}>
                <Text style={styles.retryText}>Tekrar dene</Text>
              </Pressable>
            </View>
          }
          contentContainerStyle={{ padding: 8 }}
        />
      )}
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
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabButtonActive: {},
  tabLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: '#E07B39',
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: '#E07B39',
    borderRadius: 1,
  },
  filterContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  skeletonItem: {
    width: '50%',
    padding: 4,
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
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#E07B39',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
