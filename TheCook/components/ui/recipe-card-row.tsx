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
      {/* Left: gradient thumbnail */}
      <View style={styles.thumbnailContainer}>
        <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />
      </View>

      {/* Right: title + meta */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {recipe.title}
        </Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    // Shadow (iOS)
    shadowColor: '#000000',
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
    color: '#1A1A18',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
