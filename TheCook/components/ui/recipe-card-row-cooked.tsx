import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { RecipeListItem } from '@/src/types/discovery';
import type { Category } from '@/src/types/recipe';
import { useAppTheme } from '@/contexts/ThemeContext';
import { CATEGORY_GRADIENTS, DEFAULT_GRADIENT } from '@/constants/palette';
import { getRecipeImages } from '@/app/assets/image-registry';
import { StarRatingInline } from '@/components/ui/star-rating-inline';
import { ScalePressable } from '@/components/ui/animated-pressable';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RecipeCardRowCookedProps {
  recipe: RecipeListItem;
  rating: number | null;
  cookCount: number;
  onPress: (id: string) => void;
  onRatingChange: (recipeId: string, rating: number) => void;
  userEquipment?: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecipeCardRowCooked({
  recipe,
  rating,
  cookCount,
  onPress,
  onRatingChange,
  userEquipment: _userEquipment,
}: RecipeCardRowCookedProps) {
  const { isDark, colors } = useAppTheme();
  const gradient = CATEGORY_GRADIENTS[recipe.category as Category] ?? DEFAULT_GRADIENT;
  const images = getRecipeImages(recipe.id);

  return (
    <ScalePressable
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          shadowColor: colors.shadow,
          borderColor: colors.cardBorder,
          borderWidth: isDark ? 1 : 0,
        },
      ]}
      onPress={() => onPress(recipe.id)}
      accessibilityRole="button"
      accessibilityLabel={recipe.title}
    >
      {/* Left: image / gradient thumbnail */}
      <View style={styles.thumbnailContainer}>
        {images.cover ? (
          <Image
            source={images.cover}
            placeholder={images.coverBlurhash ? { blurhash: images.coverBlurhash } : undefined}
            placeholderContentFit="cover"
            contentFit="cover"
            transition={200}
            style={StyleSheet.absoluteFill}
            testID="cooked-row-cover-image"
          />
        ) : (
          <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} testID="linear-gradient" />
        )}
      </View>

      {/* Right: title + metadata */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {recipe.title}
        </Text>
        <View style={styles.metaRow}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
            }}
            style={styles.ratingTouchZone}
          >
            <StarRatingInline
              value={rating ?? 0}
              onChange={(newRating) => onRatingChange(recipe.id, newRating)}
            />
          </Pressable>
          {cookCount > 1 && (
            <Text style={[styles.cookCountText, { color: colors.textMuted }]}>
              {cookCount} kez pisirdin
            </Text>
          )}
        </View>
      </View>
    </ScalePressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    height: 80,
    borderRadius: 14,
    overflow: 'hidden',
    // Shadow (iOS)
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    // Elevation (Android)
    elevation: 1,
    marginBottom: 8,
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    overflow: 'hidden',
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingTouchZone: {
    // Separate Pressable zone so star taps don't trigger card navigation
  },
  cookCountText: {
    fontSize: 11,
  },
});
