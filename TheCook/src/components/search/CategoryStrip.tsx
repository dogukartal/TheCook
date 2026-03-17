import React from 'react';
import {
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Category } from '../../types/recipe';

// ---------------------------------------------------------------------------
// Category palette — copied from recipe-card-grid (not exported there)
// ---------------------------------------------------------------------------

const CATEGORIES: { key: Category; label: string; gradient: [string, string] }[] = [
  { key: 'ana yemek', label: 'Ana Yemek', gradient: ['#E07B39', '#C05F20'] },
  { key: 'kahvaltı', label: 'Kahvaltı', gradient: ['#F59E0B', '#D97706'] },
  { key: 'çorba', label: 'Çorbalar', gradient: ['#0891B2', '#0E7490'] },
  { key: 'tatlı', label: 'Tatlılar', gradient: ['#EC4899', '#DB2777'] },
  { key: 'salata', label: 'Salatalar', gradient: ['#16A34A', '#15803D'] },
  { key: 'aperatif', label: 'Aperatifler', gradient: ['#7C3AED', '#6D28D9'] },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CategoryStripProps {
  selected: Category | null;
  onSelect: (category: Category | null) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CategoryStrip({ selected, onSelect }: CategoryStripProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((cat) => {
        const isSelected = selected === cat.key;

        return (
          <Pressable
            key={cat.key}
            onPress={() => onSelect(isSelected ? null : cat.key)}
            style={[styles.card, isSelected && styles.cardSelected]}
          >
            <LinearGradient
              colors={cat.gradient}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.label}>{cat.label}</Text>
            </LinearGradient>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 10,
    paddingVertical: 8,
  },
  card: {
    width: 120,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
});
