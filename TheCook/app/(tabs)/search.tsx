import React from 'react';
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
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@/contexts/ThemeContext';
import { useSearchScreen } from '@/src/hooks/useSearchScreen';
import { RecipeCardGrid } from '@/components/ui/recipe-card-grid';
import { RecipeCardRow } from '@/components/ui/recipe-card-row';
import { IngredientChips } from '@/components/discovery/ingredient-chips';
import { CategoryStrip } from '@/src/components/search/CategoryStrip';
import { FilterPanel } from '@/src/components/search/FilterPanel';

// ---------------------------------------------------------------------------
// Search screen — Ara tab
// ---------------------------------------------------------------------------

export default function SearchScreen() {
  const { isDark, colors } = useAppTheme();

  const {
    profile,
    recentViews,
    query,
    bookmarkedIds,
    displayResults,
    isIdle,
    hasChips,
    searchLoading,
    ingredientChips,
    selectedCategory,
    showFilterPanel,
    showFilters,
    skillFilter,
    equipmentFilter,
    handleRemoveChip,
    handleRecipePress,
    handleBookmarkToggle,
    handleQueryChange,
    handleCategorySelect,
    handleSkillFilterChange,
    handleEquipmentFilterChange,
    handleToggleFilterPanel,
  } = useSearchScreen();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.screenHeader}>
        <Text style={[styles.screenHeaderTitle, { color: colors.text }]}>Ara</Text>
      </View>
      {/* Search bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBarRow}>
          <TextInput
            style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            placeholder={hasChips ? 'Tarif adı ile filtrele...' : 'Malzeme veya tarif ara...'}
            placeholderTextColor={colors.placeholder}
            value={query}
            onChangeText={handleQueryChange}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable
              style={styles.clearButton}
              onPress={() => handleQueryChange('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.clearButtonText, { color: colors.placeholder }]}>{'\u2715'}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Ingredient chips */}
      {hasChips && (
        <View style={styles.chipsContainer}>
          <IngredientChips chips={ingredientChips} onRemove={handleRemoveChip} />
        </View>
      )}

      {/* Category strip — always visible */}
      <CategoryStrip selected={selectedCategory} onSelect={handleCategorySelect} />

      {/* Filter toggle button — only when category is active and no ingredient chips */}
      {showFilterPanel && (
        <View style={styles.filterButtonRow}>
          <Pressable
            style={[
              styles.filterButton,
              { borderColor: colors.tint, backgroundColor: colors.background },
              showFilters && { backgroundColor: colors.tint },
            ]}
            onPress={handleToggleFilterPanel}
          >
            <MaterialCommunityIcons
              name="filter-variant"
              size={18}
              color={showFilters ? colors.onTint : colors.tint}
            />
            <Text style={[styles.filterButtonText, { color: colors.tint }, showFilters && { color: colors.onTint }]}>
              Filtrele
            </Text>
          </Pressable>
        </View>
      )}

      {/* Filter panel — visible when filter button toggled ON */}
      <FilterPanel
        visible={showFilterPanel && showFilters}
        skillFilter={skillFilter}
        equipmentFilter={equipmentFilter}
        userEquipment={profile?.equipment ?? []}
        onSkillChange={handleSkillFilterChange}
        onEquipmentChange={handleEquipmentFilterChange}
      />

      {/* Results area */}
      {isIdle ? (
        // Idle state: no category, no query, no chips — show recent views
        recentViews.length > 0 ? (
          <View style={styles.resultsArea}>
            <Text style={[styles.sectionLabel, { color: colors.textSub }]}>Son Görüntülenenler</Text>
            <FlatList
              data={recentViews}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <RecipeCardRow recipe={item} onPress={handleRecipePress} userEquipment={profile?.equipment ?? []} />
              )}
              contentContainerStyle={styles.rowListContent}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSub }]}>
              Malzeme veya tarif adı arayın
            </Text>
          </View>
        )
      ) : searchLoading ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSub }]}>Aranıyor...</Text>
        </View>
      ) : displayResults.length > 0 ? (
        <FlashList
          data={displayResults}
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
          ListEmptyComponent={null}
          contentContainerStyle={{ padding: 8 }}
          keyboardShouldPersistTaps="handled"
        />
      ) : selectedCategory && !searchLoading ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSub }]}>
            Bu kategoride tarif bulunamadı.
          </Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSub }]}>
            {query.length > 0
              ? `"${query}" ile eşleşen tarif bulunamadı.`
              : 'Eşleşen tarif bulunamadı. Başka malzemeler dene.'}
          </Text>
        </View>
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
  },
  screenHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  screenHeaderTitle: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1,
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBarRow: {
    position: 'relative',
  },
  searchBar: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    paddingRight: 40,
    fontSize: 15,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  chipsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  filterButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonActive: {},
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultsArea: {
    flex: 1,
    paddingTop: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
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
    textAlign: 'center',
  },
});
