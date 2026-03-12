import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RecipeListItem } from '@/src/types/discovery';
import type { Category, SkillLevel } from '@/src/types/recipe';

// ---------------------------------------------------------------------------
// Gradient palette — category-based, anchored to brand terracotta #E07B39
// ---------------------------------------------------------------------------

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  'ana yemek': ['#E07B39', '#C05F20'],
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
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecipeCardRow({ recipe, onPress }: RecipeCardRowProps) {
  const gradient = CATEGORY_GRADIENTS[recipe.category as Category] ?? DEFAULT_GRADIENT;
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <Pressable
      style={styles.card}
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
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.skillBadge}>
            <Text style={styles.skillText}>{SKILL_LABELS[recipe.skillLevel]}</Text>
          </View>
          <Text style={styles.cookTimeText}>{totalTime} dk</Text>
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
    borderRadius: 12,
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
    color: '#111827',
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
    color: '#E07B39',
    fontSize: 11,
    fontWeight: '600',
  },
  cookTimeText: {
    color: '#6B7280',
    fontSize: 11,
  },
});
