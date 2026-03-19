import React from 'react';
import {
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import type { Category } from '../../types/recipe';

// ---------------------------------------------------------------------------
// Category palette
// ---------------------------------------------------------------------------

const CATEGORIES: { key: Category; label: string; color: string }[] = [
  { key: 'ana yemek', label: 'Ana Yemek', color: '#E07B39' },
  { key: 'kahvaltı', label: 'Kahvaltı', color: '#D97706' },
  { key: 'çorba', label: 'Çorbalar', color: '#0E7490' },
  { key: 'tatlı', label: 'Tatlılar', color: '#DB2777' },
  { key: 'salata', label: 'Salatalar', color: '#15803D' },
  { key: 'aperatif', label: 'Aperatifler', color: '#6D28D9' },
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
      style={styles.scroll}
    >
      {CATEGORIES.map((cat) => {
        const isSelected = selected === cat.key;

        return (
          <Pressable
            key={cat.key}
            onPress={() => onSelect(isSelected ? null : cat.key)}
            style={[
              styles.chip,
              isSelected
                ? { backgroundColor: cat.color, borderColor: cat.color }
                : { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: isSelected ? '#FFFFFF' : '#374151' },
              ]}
            >
              {cat.label}
            </Text>
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
  scroll: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: {
    fontWeight: '600',
    fontSize: 13,
  },
});
