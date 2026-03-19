import React from 'react';
import { render } from '@testing-library/react-native';
import { RecipeCardRow } from '@/components/ui/recipe-card-row';
import type { RecipeListItem } from '@/src/types/discovery';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetRecipeImages = jest.fn();

jest.mock('@/app/assets/image-registry', () => ({
  getRecipeImages: (...args: unknown[]) => mockGetRecipeImages(...args),
}));

jest.mock('expo-linear-gradient', () => {
  const mockReact = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: (props: Record<string, unknown>) =>
      mockReact.createElement(View, { ...props, testID: props.testID ?? 'linear-gradient' }),
  };
});

jest.mock('@/contexts/ThemeContext', () => ({
  useAppTheme: () => ({
    isDark: false,
    colors: {
      card: '#F0EDE8',
      shadow: '#000000',
      cardBorder: 'rgba(0,0,0,0.06)',
      tintBg: '#FEF3EC',
      tint: '#E8834A',
      warning: '#D97706',
      textSub: 'rgba(26,26,24,0.5)',
      text: '#1A1A18',
    },
    toggleTheme: jest.fn(),
  }),
}));

jest.mock('@/constants/palette', () => ({
  CATEGORY_GRADIENTS: { 'kahvalt\u0131': ['#F59E0B', '#D97706'] },
  DEFAULT_GRADIENT: ['#9CA3AF', '#6B7280'],
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockRecipe: RecipeListItem = {
  id: 'menemen',
  title: 'Menemen',
  cuisine: 'Turk',
  category: 'kahvalt\u0131',
  skillLevel: 'beginner',
  prepTime: 5,
  cookTime: 15,
  coverImage: null,
  allergens: [],
  equipment: [],
};

const noop = () => {};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RecipeCardRow image rendering', () => {
  beforeEach(() => {
    mockGetRecipeImages.mockReset();
  });

  it('renders expo-image in thumbnail when cover exists', () => {
    mockGetRecipeImages.mockReturnValue({
      cover: 1,
      coverBlurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
      steps: [],
      stepBlurhashes: [],
    });

    const { getByTestId } = render(
      React.createElement(RecipeCardRow, {
        recipe: mockRecipe,
        onPress: noop,
      }),
    );

    expect(getByTestId('row-cover-image')).toBeTruthy();
  });

  it('renders gradient fallback when cover is null', () => {
    mockGetRecipeImages.mockReturnValue({
      cover: null,
      coverBlurhash: null,
      steps: [],
      stepBlurhashes: [],
    });

    const { queryByTestId, getByTestId } = render(
      React.createElement(RecipeCardRow, {
        recipe: mockRecipe,
        onPress: noop,
      }),
    );

    expect(queryByTestId('row-cover-image')).toBeNull();
    expect(getByTestId('linear-gradient')).toBeTruthy();
  });
});
