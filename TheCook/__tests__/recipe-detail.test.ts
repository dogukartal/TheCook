import React from 'react';
import { render } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks (must be declared before imports that use them)
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

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'menemen' }),
  router: { back: jest.fn(), push: jest.fn() },
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useAppTheme: () => ({
    isDark: false,
    colors: {
      background: '#FFFFFF',
      card: '#F0EDE8',
      text: '#1A1A18',
      textSub: 'rgba(26,26,24,0.5)',
      textMuted: 'rgba(26,26,24,0.28)',
      textSecondary: 'rgba(26,26,24,0.65)',
      tint: '#E8834A',
      tintBg: '#FEF3EC',
      onTint: '#FFFFFF',
      separator: 'rgba(0,0,0,0.05)',
      error: '#DC2626',
      warning: '#D97706',
      shadow: '#000000',
      cardBorder: 'rgba(0,0,0,0.06)',
    },
    toggleTheme: jest.fn(),
  }),
}));

jest.mock('@/constants/palette', () => ({
  CATEGORY_GRADIENTS: { 'kahvalt\u0131': ['#F59E0B', '#D97706'] },
  DEFAULT_GRADIENT: ['#9CA3AF', '#6B7280'],
  STEP_PASTEL_BACKGROUNDS: ['#FDE8D8'],
}));

jest.mock('@/components/recipe/serving-stepper', () => {
  const mockReact2 = require('react');
  const { View } = require('react-native');
  return { ServingStepper: () => mockReact2.createElement(View) };
});

jest.mock('@/components/ui/skeleton-card', () => {
  const mockReact3 = require('react');
  const { View } = require('react-native');
  return { SkeletonCard: () => mockReact3.createElement(View) };
});

const mockRecipe = {
  id: 'menemen',
  title: 'Menemen',
  cuisine: 'Turk',
  category: 'kahvalt\u0131',
  skillLevel: 'beginner' as const,
  prepTime: 5,
  cookTime: 15,
  servings: 2,
  coverImage: null,
  allergens: [],
  equipment: [],
  ingredientGroups: [{ label: null, items: [] }],
  steps: [{ title: 'Step 1', instruction: 'Do something', timerSeconds: null, tip: null }],
};

jest.mock('@/src/hooks/useRecipeDetailScreen', () => ({
  useRecipeDetailScreen: () => ({
    recipe: mockRecipe,
    isBookmarked: false,
    hasActiveSession: false,
    adaptation: {
      servings: 2,
      setServings: jest.fn(),
      swaps: {},
      swapIngredient: jest.fn(),
      resetSwap: jest.fn(),
      adaptedGroups: [{ label: null, items: [] }],
      adaptedSteps: [{ title: 'Step 1', instruction: 'Do something', timerSeconds: null, tip: null }],
    },
    handleBookmarkToggle: jest.fn(),
    startCooking: jest.fn(),
  }),
}));

jest.mock('@/src/hooks/useRecipeAdaptation', () => ({
  formatAmount: (n: number) => String(n),
}));

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------

import RecipeDetailScreen from '@/app/recipe/[id]';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Recipe detail hero image rendering', () => {
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

    const { getByTestId } = render(React.createElement(RecipeDetailScreen));

    expect(getByTestId('hero-cover-image')).toBeTruthy();
  });

  it('renders gradient fallback when cover is null', () => {
    mockGetRecipeImages.mockReturnValue({
      cover: null,
      coverBlurhash: null,
      steps: [],
      stepBlurhashes: [],
    });

    const { queryByTestId, getByTestId } = render(React.createElement(RecipeDetailScreen));

    expect(queryByTestId('hero-cover-image')).toBeNull();
    expect(getByTestId('linear-gradient')).toBeTruthy();
  });
});
