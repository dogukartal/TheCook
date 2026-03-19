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
import { CATEGORY_STRIP_COLORS } from '@/constants/palette';

// ---------------------------------------------------------------------------
// Category palette
// ---------------------------------------------------------------------------

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'ana yemek', label: 'Ana Yemek' },
  { key: 'kahvaltı', label: 'Kahvaltı' },
  { key: 'çorba', label: 'Çorbalar' },
  { key: 'tatlı', label: 'Tatlılar' },
  { key: 'salata', label: 'Salatalar' },
  { key: 'aperatif', label: 'Aperatifler' },
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
        const catColor = CATEGORY_STRIP_COLORS[cat.key]; // palette-exempt

        return (
          <Pressable
            key={cat.key}
            onPress={() => onSelect(isSelected ? null : cat.key)}
            style={[
              styles.chip,
              isSelected
                ? { backgroundColor: catColor, borderColor: catColor }
                : {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: isSelected ? colors.onTint : colors.textSub },
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
