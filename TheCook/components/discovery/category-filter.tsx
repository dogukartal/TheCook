import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Text,
  Animated,
} from 'react-native';
import { Chip } from '@/components/ui/chip';
import type { Category } from '@/src/types/recipe';
import type { DiscoveryFilter } from '@/src/types/discovery';

// ---------------------------------------------------------------------------
// Category chip definitions — display labels for CategoryEnum values
// ---------------------------------------------------------------------------

const CATEGORIES: Array<{ value: Category; label: string }> = [
  { value: 'ana yemek', label: 'Ana Yemek' },
  { value: 'kahvaltı',  label: 'Kahvaltı' },
  { value: 'çorba',    label: 'Çorba' },
  { value: 'tatlı',    label: 'Tatlı' },
  { value: 'salata',   label: 'Salata' },
  { value: 'aperatif', label: 'Aperatif' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CategoryFilterProps {
  selectedCategory: Category | null;
  onCategoryChange: (cat: Category | null) => void;
  filter: DiscoveryFilter;
  onFilterChange: (f: DiscoveryFilter) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  filter,
  onFilterChange,
}: CategoryFilterProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const arrowRotation = useRef(new Animated.Value(0)).current;

  function togglePanel() {
    const toValue = panelOpen ? 0 : 1;
    Animated.timing(arrowRotation, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setPanelOpen(!panelOpen);
  }

  const arrowStyle = {
    transform: [
      {
        rotate: arrowRotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  // Helper to toggle cook time bucket — deselects if already selected
  function handleCookTime(bucket: DiscoveryFilter['cookTimeBucket']) {
    onFilterChange({
      ...filter,
      cookTimeBucket: filter.cookTimeBucket === bucket ? null : bucket,
    });
  }

  // Helper to toggle cuisine
  function handleCuisine(cuisine: string) {
    onFilterChange({
      ...filter,
      cuisine: filter.cuisine === cuisine ? null : cuisine,
    });
  }

  // Helper to toggle skill level
  function handleSkill(level: DiscoveryFilter['skillLevel']) {
    onFilterChange({
      ...filter,
      skillLevel: filter.skillLevel === level ? null : level,
    });
  }

  return (
    <View>
      {/* Chip row + toggle arrow */}
      <View style={styles.chipRowContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {/* "Hepsi" chip */}
          <Chip
            label="Hepsi"
            selected={selectedCategory === null}
            onPress={() => onCategoryChange(null)}
          />
          {/* Category chips */}
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.value}
              label={cat.label}
              selected={selectedCategory === cat.value}
              onPress={() => onCategoryChange(cat.value)}
            />
          ))}
        </ScrollView>

        {/* Advanced filter toggle */}
        <Pressable
          style={styles.arrowButton}
          onPress={togglePanel}
          accessibilityRole="button"
          accessibilityLabel={panelOpen ? 'Filtreyi kapat' : 'Gelişmiş filtre'}
          accessibilityState={{ expanded: panelOpen }}
        >
          <Animated.Text style={[styles.arrowText, arrowStyle]}>▼</Animated.Text>
        </Pressable>
      </View>

      {/* Advanced filter panel */}
      {panelOpen && (
        <View style={styles.panel}>
          {/* Section 1: Cuisine */}
          <Text style={styles.sectionLabel}>Mutfak</Text>
          <View style={styles.chipGroup}>
            <Chip
              label="Türk"
              selected={filter.cuisine === 'Türk'}
              onPress={() => handleCuisine('Türk')}
            />
            <Chip
              label="Dünya"
              selected={filter.cuisine === 'Dünya'}
              onPress={() => handleCuisine('Dünya')}
            />
          </View>

          {/* Section 2: Cook time */}
          <Text style={styles.sectionLabel}>Pişirme Süresi</Text>
          <View style={styles.chipGroup}>
            <Chip
              label="< 15 dk"
              selected={filter.cookTimeBucket === 'under15'}
              onPress={() => handleCookTime('under15')}
            />
            <Chip
              label="15–30 dk"
              selected={filter.cookTimeBucket === '15to30'}
              onPress={() => handleCookTime('15to30')}
            />
            <Chip
              label="30+ dk"
              selected={filter.cookTimeBucket === 'over30'}
              onPress={() => handleCookTime('over30')}
            />
          </View>

          {/* Section 3: Skill level */}
          <Text style={styles.sectionLabel}>Zorluk</Text>
          <View style={styles.chipGroup}>
            <Chip
              label="Başlangıç"
              selected={filter.skillLevel === 'beginner'}
              onPress={() => handleSkill('beginner')}
            />
            <Chip
              label="Orta"
              selected={filter.skillLevel === 'intermediate'}
              onPress={() => handleSkill('intermediate')}
            />
            <Chip
              label="İleri"
              selected={filter.skillLevel === 'advanced'}
              onPress={() => handleSkill('advanced')}
            />
          </View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  chipRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipRow: {
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  arrowText: {
    fontSize: 12,
    color: '#6B7280',
  },
  panel: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    marginTop: 8,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
