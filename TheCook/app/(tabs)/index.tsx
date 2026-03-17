import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { useFeedScreen } from '@/src/hooks/useFeedScreen';
import { RecipeCardGrid } from '@/components/ui/recipe-card-grid';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { CategoryFilter } from '@/components/discovery/category-filter';
import { ResumeBanner } from '@/components/cooking/resume-banner';

// ---------------------------------------------------------------------------
// Feed screen — Kesfet tab (index)
// ---------------------------------------------------------------------------

export default function FeedScreen() {
  const {
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
    setActiveTab,
    setSelectedCategory,
    handleBookmarkToggle,
    handleRefresh,
    handleResume,
    handleDismissResume,
    handleRecipePress,
    loadRecipes,
    setFilter,
  } = useFeedScreen();

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
      {/* Resume banner */}
      {resumeSession && (
        <ResumeBanner
          recipeName={resumeRecipeName}
          currentStep={resumeSession.currentStep}
          totalSteps={resumeTotalSteps}
          onResume={handleResume}
          onDismiss={handleDismissResume}
        />
      )}

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
                userEquipment={profile?.equipment ?? []}
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#E07B39" />
          }
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
