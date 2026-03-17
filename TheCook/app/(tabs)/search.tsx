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

import { useSearchScreen } from '@/src/hooks/useSearchScreen';
import { RecipeCardGrid } from '@/components/ui/recipe-card-grid';
import { RecipeCardRow } from '@/components/ui/recipe-card-row';
import { IngredientChips } from '@/components/discovery/ingredient-chips';

// ---------------------------------------------------------------------------
// Search screen — Ara tab
// ---------------------------------------------------------------------------

export default function SearchScreen() {
  const {
    profile,
    recentViews,
    query,
    bookmarkedIds,
    ingredientSuggestions,
    displayResults,
    isIdle,
    hasChips,
    showDropdown,
    searchLoading,
    ingredientChips,
    handleSelectIngredient,
    handleRemoveChip,
    handleRecipePress,
    handleBookmarkToggle,
    handleQueryChange,
    setDropdownOpen,
  } = useSearchScreen();

  return (
    <SafeAreaView style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBarRow}>
          <TextInput
            style={styles.searchBar}
            placeholder={hasChips ? 'Tarif adı ile filtrele...' : 'Malzeme veya tarif ara...'}
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={handleQueryChange}
            onFocus={() => { if (query.length >= 2) setDropdownOpen(true); }}
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
              <Text style={styles.clearButtonText}>{'\u2715'}</Text>
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

      {/* Ingredient autocomplete dropdown (only when no chips active) */}
      {showDropdown && (
        <View style={styles.dropdown}>
          {ingredientSuggestions.map((name) => (
            <Pressable
              key={name}
              style={styles.suggestionRow}
              onPress={() => handleSelectIngredient(name)}
            >
              <Text style={styles.suggestionText}>{name}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>Malzeme</Text>
              </View>
            </Pressable>
          ))}
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
                <RecipeCardRow recipe={item} onPress={handleRecipePress} userEquipment={profile?.equipment ?? []} />
              )}
              contentContainerStyle={styles.rowListContent}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Malzeme veya tarif adı arayın
            </Text>
          </View>
        )
      ) : searchLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Aranıyor...</Text>
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
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
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
    backgroundColor: '#FFFFFF',
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    paddingRight: 40,
    fontSize: 15,
    backgroundColor: '#F9FAFB',
    color: '#111827',
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
    color: '#9CA3AF',
    fontWeight: '600',
  },
  dropdown: {
    marginHorizontal: 16,
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
    overflow: 'hidden',
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
    backgroundColor: '#FEF3EC',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C05F20',
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
