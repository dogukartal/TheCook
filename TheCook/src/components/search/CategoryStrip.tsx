import React from 'react';
import {
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import type { Category } from '../../types/recipe';
import { useAppTheme } from '@/contexts/ThemeContext';

// ---------------------------------------------------------------------------
// Category palette
// ---------------------------------------------------------------------------

const CATEGORIES: { key: Category; label: string; color: string }[] = [
  { key: 'ana yemek', label: 'Ana Yemek', color: '#E8834A' },
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
  const { isDark, colors } = useAppTheme();

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
                : {
                    backgroundColor: isDark ? '#161614' : '#F0EDE8',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: isSelected ? '#FFFFFF' : colors.textSub },
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
