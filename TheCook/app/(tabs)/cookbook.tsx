import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@/contexts/ThemeContext';
import { useCookbookScreen } from '@/src/hooks/useCookbookScreen';
import { RecipeCardGrid } from '@/components/ui/recipe-card-grid';
import { SkeletonCard } from '@/components/ui/skeleton-card';

// ---------------------------------------------------------------------------
// Cookbook screen — saved recipes only (no account card, no profile summary)
// ---------------------------------------------------------------------------

export default function CookbookScreen() {
  const { colors } = useAppTheme();

  const {
    profile,
    bookmarkedIds,
    savedRecipes,
    loading,
    handleBookmarkToggle,
    handleRecipePress,
  } = useCookbookScreen();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} stickyHeaderIndices={[0]}>
        {/* Header row */}
        <View style={[styles.headerRow, { backgroundColor: colors.background }]}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Yemek Defterim</Text>
        </View>

        {/* Saved recipes section header */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Kaydedilen Tarifler</Text>

        {/* Saved recipes content */}
        {loading ? (
          <View style={styles.skeletonGrid}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonItem}>
                <SkeletonCard variant="grid" />
              </View>
            ))}
          </View>
        ) : savedRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="heart-outline" size={48} color="#E8834A" />
            <Text style={[styles.emptyText, { color: colors.textSub }]}>
              {'Hen\u00FCz kaydedilmi\u015F tarifiniz yok.\nTariflerin \u00FCzerindeki \u2661 ikonuna bas\u0131n.'}
            </Text>
          </View>
        ) : (
          <View style={styles.savedGrid}>
            {savedRecipes.map((item) => (
              <View key={item.id} style={styles.cardWrapper}>
                <RecipeCardGrid
                  recipe={item}
                  isBookmarked={bookmarkedIds.has(item.id)}
                  onBookmarkToggle={handleBookmarkToggle}
                  onPress={handleRecipePress}
                  userEquipment={profile?.equipment ?? []}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  screenTitle: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  skeletonItem: {
    width: '50%',
    padding: 4,
  },
  savedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  cardWrapper: {
    width: '50%',
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
});
