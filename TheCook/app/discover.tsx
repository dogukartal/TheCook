import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@/contexts/ThemeContext';
import {
  fetchRawRecipes,
  transformRawRecipe,
  type RawRecipeListItem,
} from '@/src/services/raw-recipes';

// ---------------------------------------------------------------------------
// Discover screen — Community recipes (lazy-transform via Claude)
// ---------------------------------------------------------------------------

export default function DiscoverScreen() {
  const db = useSQLiteContext();
  const { colors } = useAppTheme();

  const [recipes, setRecipes] = useState<RawRecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [transformingId, setTransformingId] = useState<number | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load & search
  const loadRecipes = useCallback(async (query: string, pageNum: number, append: boolean) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    const data = await fetchRawRecipes(pageNum, 30, query);

    if (append) {
      setRecipes((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const newItems = data.filter((r) => !existingIds.has(r.id));
        return [...prev, ...newItems];
      });
    } else {
      setRecipes(data);
    }
    setHasMore(data.length === 30);
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    loadRecipes('', 0, false);
  }, [loadRecipes]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    setPage(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadRecipes(text, 0, false);
    }, 400);
  }, [loadRecipes]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadRecipes(searchQuery, nextPage, true);
  }, [loadingMore, hasMore, page, searchQuery, loadRecipes]);

  // Tap handler — transform if needed, then navigate
  const handleRecipePress = useCallback(async (item: RawRecipeListItem) => {
    // Already transformed → go directly to detail
    if (item.transformed_recipe_id) {
      router.push(`/recipe/${item.transformed_recipe_id}`);
      return;
    }

    setTransformingId(item.id);
    try {
      const recipeId = await transformRawRecipe(item.id, db);

      // Update local list so it shows as transformed
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === item.id ? { ...r, transformed_recipe_id: recipeId } : r
        )
      );

      router.push(`/recipe/${recipeId}`);
    } catch (err) {
      console.error('Transform error:', err);
      Alert.alert(
        'Dönüştürme Hatası',
        'Tarif hazırlanırken bir sorun oluştu. İnternet bağlantınızı kontrol edip tekrar deneyin.'
      );
    } finally {
      setTransformingId(null);
    }
  }, [db]);

  const renderItem = useCallback(({ item }: { item: RawRecipeListItem }) => {
    const isTransforming = transformingId === item.id;
    const isTransformed = !!item.transformed_recipe_id;

    return (
      <Pressable
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleRecipePress(item)}
        disabled={isTransforming}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardTextArea}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.cardMeta}>
              <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
              <Text style={[styles.cardRating, { color: colors.textSub }]}>
                {item.rating.toFixed(1)}
              </Text>
              <Text style={[styles.cardVotes, { color: colors.textSub }]}>
                ({item.votes.toLocaleString('tr-TR')} oy)
              </Text>
            </View>
          </View>
          <View style={styles.cardAction}>
            {isTransforming ? (
              <View style={styles.transformingContainer}>
                <ActivityIndicator size="small" color={colors.tint} />
                <Text style={[styles.transformingText, { color: colors.tint }]}>
                  Hazırlanıyor...
                </Text>
              </View>
            ) : isTransformed ? (
              <MaterialCommunityIcons name="check-circle" size={22} color={colors.success} />
            ) : (
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSub} />
            )}
          </View>
        </View>
      </Pressable>
    );
  }, [transformingId, colors, handleRecipePress]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Topluluk Tarifleri</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Subtitle */}
      <Text style={[styles.subtitle, { color: colors.textSub }]}>
        8.700+ tarif — tıkla, yapay zeka senin için hazırlasın
      </Text>

      {/* Search bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBarRow}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={colors.placeholder}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            placeholder="Tarif ara..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <Pressable
              style={styles.clearButton}
              onPress={() => handleSearchChange('')}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.placeholder} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Recipe list */}
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSub }]}>
                {searchQuery ? `"${searchQuery}" ile eşleşen tarif bulunamadı.` : 'Tarif bulunamadı.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color={colors.tint} />
              </View>
            ) : null
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBarRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchBar: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingLeft: 38,
    paddingRight: 36,
    fontSize: 15,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  cardTextArea: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardRating: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardVotes: {
    fontSize: 12,
  },
  cardAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 30,
  },
  transformingContainer: {
    alignItems: 'center',
    gap: 4,
  },
  transformingText: {
    fontSize: 10,
    fontWeight: '600',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
