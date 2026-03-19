import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Text,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Chip } from '@/components/ui/chip';
import { useAppTheme } from '@/contexts/ThemeContext';
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
// Category icon map
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<string, string> = {
  'ana yemek': 'silverware-fork-knife',
  'kahvaltı': 'coffee',
  'çorba': 'bowl-mix',
  'tatlı': 'cupcake',
  'salata': 'leaf',
  'aperatif': 'food-apple',
};

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
  const arrowRotation = useSharedValue(0);
  const { colors } = useAppTheme();

  function togglePanel() {
    const toValue = panelOpen ? 0 : 1;
    arrowRotation.value = withTiming(toValue, { duration: 200 });
    setPanelOpen(!panelOpen);
  }

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(arrowRotation.value, [0, 1], [0, 180])}deg`,
      },
    ],
  }));

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
              icon={
                <MaterialCommunityIcons
                  name={CATEGORY_ICONS[cat.value] as any}
                  size={14}
                  color={selectedCategory === cat.value ? colors.tint : colors.textSub}
                />
              }
            />
          ))}
        </ScrollView>

        {/* Advanced filter toggle */}
        <Pressable
          style={styles.arrowButton}
          onPress={togglePanel}
          accessibilityRole="button"
          accessibilityLabel={panelOpen ? 'Filtreyi kapat' : 'Geli\u015Fmi\u015F filtre'}
          accessibilityState={{ expanded: panelOpen }}
        >
          <Animated.Text style={[styles.arrowText, arrowStyle, { color: colors.textMuted }]}>
            {'\u25BC'}
          </Animated.Text>
        </Pressable>
      </View>

      {/* Advanced filter panel */}
      {panelOpen && (
        <View style={[styles.panel, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {/* Section 1: Cuisine */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Mutfak</Text>
          <View style={styles.chipGroup}>
            <Chip
              label="T\u00FCrk"
              selected={filter.cuisine === 'T\u00FCrk'}
              onPress={() => handleCuisine('T\u00FCrk')}
            />
            <Chip
              label="D\u00FCnya"
              selected={filter.cuisine === 'D\u00FCnya'}
              onPress={() => handleCuisine('D\u00FCnya')}
            />
          </View>

          {/* Section 2: Cook time */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Pi\u015Firme S\u00FCresi</Text>
          <View style={styles.chipGroup}>
            <Chip
              label="< 15 dk"
              selected={filter.cookTimeBucket === 'under15'}
              onPress={() => handleCookTime('under15')}
            />
            <Chip
              label="15\u201330 dk"
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
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Zorluk</Text>
          <View style={styles.chipGroup}>
            <Chip
              label="Ba\u015Flang\u0131\u00E7"
              selected={filter.skillLevel === 'beginner'}
              onPress={() => handleSkill('beginner')}
            />
            <Chip
              label="Orta"
              selected={filter.skillLevel === 'intermediate'}
              onPress={() => handleSkill('intermediate')}
            />
            <Chip
              label="\u0130leri"
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
  },
  panel: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
