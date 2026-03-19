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
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RecipeCardRowProps {
  recipe: RecipeListItem;
  onPress: (id: string) => void;
  userEquipment?: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecipeCardRow({ recipe, onPress, userEquipment = [] }: RecipeCardRowProps) {
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
            testID="row-cover-image"
          />
        ) : (
          <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} testID="linear-gradient" />
        )}
      </View>

      {/* Right: title + meta */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {recipe.title}
        </Text>
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
      </View>
    </Pressable>
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
