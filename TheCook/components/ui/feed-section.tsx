import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { RecipeCardGrid } from '@/components/ui/recipe-card-grid';
import type { RecipeListItem } from '@/src/types/discovery';
import { useAppTheme } from '@/contexts/ThemeContext';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FeedSectionProps {
  title: string;
  data: RecipeListItem[];
  bookmarkedIds: Set<string>;
  userEquipment: string[];
  onRecipePress: (id: string) => void;
  onBookmarkToggle: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FeedSection({
  title,
  data,
  bookmarkedIds,
  userEquipment,
  onRecipePress,
  onBookmarkToggle,
}: FeedSectionProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A18',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  cardWrapper: {
    width: 180,
    marginRight: 12,
  },
});
