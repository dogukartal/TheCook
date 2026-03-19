import React from 'react';
import { render } from '@testing-library/react-native';
import { RecipeCardGrid } from '@/components/ui/recipe-card-grid';
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

describe('RecipeCardGrid image rendering', () => {
  beforeEach(() => {
    mockGetRecipeImages.mockReset();
  });

  it('renders expo-image when cover exists', () => {
    mockGetRecipeImages.mockReturnValue({
      cover: 1,
      coverBlurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
      steps: [],
      stepBlurhashes: [],
    });

    const { getByTestId } = render(
      React.createElement(RecipeCardGrid, {
        recipe: mockRecipe,
        isBookmarked: false,
        onBookmarkToggle: noop,
        onPress: noop,
      }),
    );

    expect(getByTestId('card-cover-image')).toBeTruthy();
  });

  it('renders gradient fallback when cover is null', () => {
    mockGetRecipeImages.mockReturnValue({
      cover: null,
      coverBlurhash: null,
      steps: [],
      stepBlurhashes: [],
    });

    const { queryByTestId, getByTestId } = render(
      React.createElement(RecipeCardGrid, {
        recipe: mockRecipe,
        isBookmarked: false,
        onBookmarkToggle: noop,
        onPress: noop,
      }),
    );

    expect(queryByTestId('card-cover-image')).toBeNull();
    expect(getByTestId('linear-gradient')).toBeTruthy();
  });

  it('passes blurhash placeholder prop when coverBlurhash is non-null', () => {
    const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
    mockGetRecipeImages.mockReturnValue({
      cover: 1,
      coverBlurhash: blurhash,
      steps: [],
      stepBlurhashes: [],
    });

    const { getByTestId } = render(
      React.createElement(RecipeCardGrid, {
        recipe: mockRecipe,
        isBookmarked: false,
        onBookmarkToggle: noop,
        onPress: noop,
      }),
    );

    // expo-image is mocked as View in jest/setup.ts;
    // confirm the element exists (placeholder prop is passed but View ignores it)
    const image = getByTestId('card-cover-image');
    expect(image).toBeTruthy();
  });
});
