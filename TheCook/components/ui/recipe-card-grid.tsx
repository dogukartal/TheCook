import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RecipeListItem } from '@/src/types/discovery';
import type { Category, SkillLevel } from '@/src/types/recipe';
import { useAppTheme } from '@/contexts/ThemeContext';

// ---------------------------------------------------------------------------
// Gradient palette — category-based, anchored to brand terracotta #E8834A
// ---------------------------------------------------------------------------

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  'ana yemek': ['#E8834A', '#D4572A'],
  'kahvaltı':  ['#F59E0B', '#D97706'],
  'çorba':     ['#0891B2', '#0E7490'],
  'tatlı':     ['#EC4899', '#DB2777'],
  'salata':    ['#16A34A', '#15803D'],
  'aperatif':  ['#7C3AED', '#6D28D9'],
};
const DEFAULT_GRADIENT: [string, string] = ['#9CA3AF', '#6B7280'];

const SKILL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
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
  const totalTime = recipe.prepTime + recipe.cookTime;

  const hasMissingEquipment =
    recipe.equipment.length > 0 &&
    recipe.equipment.some((e) => !userEquipment.includes(e));

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.background }]}
      onPress={() => onPress(recipe.id)}
      accessibilityRole="button"
      accessibilityLabel={recipe.title}
    >
      {/* Gradient image area with overlaid title + bookmark */}
      <View style={styles.imageArea}>
        <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />
        {/* Title overlay — bottom-left */}
        <Text style={styles.titleOverlay} numberOfLines={2} ellipsizeMode="tail">
          {recipe.title}
        </Text>
        {/* Bookmark icon — top-right */}
        <Pressable
          style={styles.bookmarkButton}
          onPress={() => onBookmarkToggle(recipe.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={isBookmarked ? 'Favoriden çıkar' : 'Favoriye ekle'}
        >
          <MaterialCommunityIcons
            name={isBookmarked ? 'heart' : 'heart-outline'}
            size={20}
            color="#FFFFFF"
          />
        </Pressable>
      </View>

      {/* Meta row — skill badge + equipment warning + cook time */}
      <View style={styles.metaRow}>
        <View style={[styles.skillBadge, { backgroundColor: isDark ? 'rgba(232,131,74,0.15)' : '#FEF3EC' }]}>
          <Text style={styles.skillText}>{SKILL_LABELS[recipe.skillLevel]}</Text>
        </View>
        {hasMissingEquipment && (
          <View style={styles.equipmentWarning}>
            <MaterialCommunityIcons name="alert-circle-outline" size={12} color="#D97706" />
            <Text style={styles.equipmentWarningText}>Ekipman eksik</Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    flex: 1,
    // Shadow (iOS)
    shadowColor: '#000000',
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
    color: '#FFFFFF',
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
    backgroundColor: '#FEF3EC',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  skillText: {
    color: '#E8834A',
    fontSize: 11,
    fontWeight: '600',
  },
  cookTimeText: {
    color: 'rgba(26,26,24,0.5)',
    fontSize: 11,
  },
  equipmentWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  equipmentWarningText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '500',
  },
});
