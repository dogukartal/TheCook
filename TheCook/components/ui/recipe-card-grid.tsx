import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RecipeListItem } from '@/src/types/discovery';
import type { Category, SkillLevel } from '@/src/types/recipe';
import { useAppTheme } from '@/contexts/ThemeContext';
import { CATEGORY_GRADIENTS, DEFAULT_GRADIENT } from '@/constants/palette';
import { getRecipeImages } from '@/app/assets/image-registry';

const SKILL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Baslangi\u00e7',
  intermediate: 'Orta',
  advanced: '\u0130leri',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RecipeCardGridProps {
  recipe: RecipeListItem;
  isBookmarked: boolean;
  onBookmarkToggle: (id: string) => void;
  onPress: (id: string) => void;
  userEquipment?: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecipeCardGrid({
  recipe,
  isBookmarked,
  onBookmarkToggle,
  onPress,
  userEquipment = [],
}: RecipeCardGridProps) {
  const { isDark, colors } = useAppTheme();
  const gradient = CATEGORY_GRADIENTS[recipe.category as Category] ?? DEFAULT_GRADIENT;
  const images = getRecipeImages(recipe.id);
  const totalTime = recipe.prepTime + recipe.cookTime;

  const hasMissingEquipment =
    recipe.equipment.length > 0 &&
    recipe.equipment.some((e) => !userEquipment.includes(e));

  return (
    <Pressable
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
      {/* Gradient image area with overlaid title + bookmark */}
      <View style={styles.imageArea}>
        {images.cover ? (
          <>
            <Image
              source={images.cover}
              placeholder={images.coverBlurhash ? { blurhash: images.coverBlurhash } : undefined}
              placeholderContentFit="cover"
              contentFit="cover"
              transition={200}
              style={StyleSheet.absoluteFill}
              testID="card-cover-image"
            />
            {/* Dark scrim for text readability over photo */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.55)']}
              style={[StyleSheet.absoluteFill, { top: '50%' }]}
            />
          </>
        ) : (
          <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} testID="linear-gradient" />
        )}
        {/* Title overlay -- bottom-left */}
        <Text style={styles.titleOverlay} numberOfLines={2} ellipsizeMode="tail">
          {recipe.title}
        </Text>
        {/* Bookmark icon -- top-right */}
        <Pressable
          style={styles.bookmarkButton}
          onPress={() => onBookmarkToggle(recipe.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={isBookmarked ? 'Favoriden \u00e7\u0131kar' : 'Favoriye ekle'}
        >
          <MaterialCommunityIcons
            name={isBookmarked ? 'heart' : 'heart-outline'}
            size={20}
            color="#FFFFFF" // on-gradient // palette-exempt
          />
        </Pressable>
      </View>

      {/* Meta row -- skill badge + equipment warning + cook time */}
      <View style={styles.metaRow}>
        <View style={[styles.skillBadge, { backgroundColor: colors.tintBg }]}>
          <Text style={[styles.skillText, { color: colors.tint }]}>{SKILL_LABELS[recipe.skillLevel]}</Text>
        </View>
        {hasMissingEquipment && (
          <View style={styles.equipmentWarning}>
            <MaterialCommunityIcons name="alert-circle-outline" size={12} color={colors.warning} />
            <Text style={[styles.equipmentWarningText, { color: colors.warning }]}>Ekipman eksik</Text>
          </View>
        )}
        <Text style={[styles.cookTimeText, { color: colors.textSub }]}>{totalTime} dk</Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    flex: 1,
    // Shadow (iOS)
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    // Elevation (Android)
    elevation: 2,
  },
  imageArea: {
    height: 140,
    overflow: 'hidden',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 40, // leave room for bookmark icon
    color: '#FFFFFF', // on-gradient // palette-exempt
    fontSize: 13,
    fontWeight: '600',
    padding: 8,
  },
  bookmarkButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  skillBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  skillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cookTimeText: {
    fontSize: 11,
  },
  equipmentWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  equipmentWarningText: {
    fontSize: 10,
    fontWeight: '500',
  },
});
