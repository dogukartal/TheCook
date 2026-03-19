import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { RecipeCardGrid } from '@/components/ui/recipe-card-grid';
import type { RecipeListItem } from '@/src/types/discovery';
import { useAppTheme } from '@/contexts/ThemeContext';

// ---------------------------------------------------------------------------
// Card width calculation (pure, exported for testing)
// ---------------------------------------------------------------------------

const HORIZONTAL_PADDING = 16;
const CARD_GAP = 12;

/**
 * Calculates card width so that ~2.3 cards are visible, creating a peek
 * of the 3rd card to hint at horizontal scrollability.
 */
export function calculateCardWidth(screenWidth: number): number {
  return Math.floor(
    (screenWidth - 2 * HORIZONTAL_PADDING + CARD_GAP) / 2.3 - CARD_GAP,
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FeedSectionProps {
  sectionKey: string;
  sectionIndex: number;
  title: string;
  data: RecipeListItem[];
  bookmarkedIds: Set<string>;
  userEquipment: string[];
  onRecipePress: (id: string) => void;
  onBookmarkToggle: (id: string) => void;
  isLast?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FeedSection({
  sectionKey,
  sectionIndex,
  title,
  data,
  bookmarkedIds,
  userEquipment,
  onRecipePress,
  onBookmarkToggle,
  isLast = false,
}: FeedSectionProps) {
  const { colors } = useAppTheme();
  const cardWidth = calculateCardWidth(Dimensions.get('window').width);

  function handleSeeAll() {
    router.push(`/feed/${sectionKey}` as never);
  }

  return (
    <View style={styles.container}>
      {/* Header row: title (count) ... See All */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.count, { color: colors.textSub }]}>
          {' '}({data.length})
        </Text>
        <View style={styles.spacer} />
        {data.length > 2 && (
          <Pressable
            onPress={handleSeeAll}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Tümünü Gör"
          >
            <Text style={[styles.seeAllText, { color: colors.tint }]}>
              Tümünü Gör &gt;
            </Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.cardWrapper, { width: cardWidth }]}>
            <RecipeCardGrid
              recipe={item}
              isBookmarked={bookmarkedIds.has(item.id)}
              onBookmarkToggle={onBookmarkToggle}
              onPress={onRecipePress}
              userEquipment={userEquipment}
            />
          </View>
        )}
      />

      {/* Separator between sections (not after the last one) */}
      {!isLast && (
        <View
          style={[
            styles.separator,
            { backgroundColor: colors.separator },
          ]}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  count: {
    fontSize: 14,
    fontWeight: '400',
  },
  spacer: {
    flex: 1,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  cardWrapper: {
    marginRight: 12,
  },
  separator: {
    height: 3,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 1.5,
  },
});
