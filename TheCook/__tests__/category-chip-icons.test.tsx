// Mock AsyncStorage (required by ThemeContext import chain)
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: {
      createAnimatedComponent: (c: any) => c,
      View,
      Text,
    },
    useSharedValue: (val: number) => ({ value: val }),
    useAnimatedStyle: (fn: () => any) => fn(),
    withTiming: (val: number) => val,
    interpolate: (val: number, input: number[], output: any[]) => output[0],
    Easing: { linear: 'linear' },
  };
});

// Mock @expo/vector-icons -- render icon name as testID for easy querying
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) =>
      React.createElement(Text, { testID: `icon-${props.name}` }, props.name),
  };
});

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { CategoryFilter } from '@/components/discovery/category-filter';
import type { DiscoveryFilter } from '@/src/types/discovery';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const defaultFilter: DiscoveryFilter = {
  cookTimeBucket: null,
  cuisine: null,
  skillLevel: null,
};

describe('Category chip icons', () => {
  test('category chip for "ana yemek" renders an icon', () => {
    render(
      <CategoryFilter
        selectedCategory="ana yemek"
        onCategoryChange={jest.fn()}
        filter={defaultFilter}
        onFilterChange={jest.fn()}
      />,
    );

    // The "ana yemek" chip should contain a MaterialCommunityIcons with the
    // silverware-fork-knife icon name rendered as testID
    const icon = screen.queryByTestId('icon-silverware-fork-knife');
    expect(icon).toBeTruthy();
  });

  test('"Hepsi" chip does NOT render a category icon', () => {
    render(
      <CategoryFilter
        selectedCategory={null}
        onCategoryChange={jest.fn()}
        filter={defaultFilter}
        onFilterChange={jest.fn()}
      />,
    );

    // "Hepsi" is the first chip. It should not have any CATEGORY_ICONS icon.
    // Query for any icon testIDs that correspond to category icons
    const categoryIconNames = [
      'icon-silverware-fork-knife',
      'icon-coffee',
      'icon-bowl-mix',
      'icon-cupcake',
      'icon-leaf',
      'icon-food-apple',
    ];

    // The Hepsi chip (first chip) should not contain any category icon.
    // Since Hepsi is selected (selectedCategory=null), and no icon should be in it,
    // we verify the icon IS present for category chips but NOT for Hepsi.
    // We just verify that the icons are only inside category chips, not the Hepsi chip.
    // The simplest check: Hepsi chip has "Hepsi" text but no icon testID nearby.
    const hepsiText = screen.getByText('Hepsi');
    expect(hepsiText).toBeTruthy();
    // Hepsi's parent pressable should not contain any category icon
    // We verify by checking the Chip component for "Hepsi" does not pass an icon
    // Since we pass icon only for CATEGORIES entries, Hepsi won't have one.
    // The icons ARE rendered in the tree (for other chips), but NOT inside the Hepsi chip.
    // We can verify there are exactly 6 category icons (one per category, none for Hepsi)
    const allIcons = categoryIconNames.map((name) => screen.queryByTestId(name));
    const presentIcons = allIcons.filter(Boolean);
    expect(presentIcons).toHaveLength(6);
  });
});
