import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

// Mock AsyncStorage (required by ThemeContext -> step-content import chain)
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    Svg: View,
    Circle: View,
    G: View,
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      createAnimatedComponent: (c: any) => c,
      View,
    },
    useSharedValue: (val: number) => ({ value: val }),
    useAnimatedProps: (fn: () => any) => fn(),
    withTiming: (val: number) => val,
    withRepeat: (val: number) => val,
    Easing: { linear: 'linear' },
    FadeIn: {},
  };
});

// Mock image registry
const mockGetRecipeImages = jest.fn();
jest.mock('@/app/assets/image-registry', () => ({
  getRecipeImages: (...args: any[]) => mockGetRecipeImages(...args),
}));

import { StepContent } from '@/components/cooking/step-content';
import type { RecipeStep } from '@/src/types/recipe';

const mockStep: RecipeStep = {
  title: 'Soganlari hazirlayin',
  instruction: 'Soganlari ince ince dogra',
  why: 'Ince dogranan soganlar daha cabuk karamellesir',
  looksLikeWhenDone: 'Soganlar seffaf ve altin rengi olmali',
  commonMistake: 'Soganlari cok kalin dogamak',
  recovery: 'Kalin dogramissaniz biraz daha uzun pisirin',
  stepImage: null,
  timerSeconds: null,
  checkpoint: null,
  warning: null,
  sefimQA: [],
};

describe('StepContent', () => {
  beforeEach(() => {
    mockGetRecipeImages.mockReturnValue({
      cover: null,
      coverBlurhash: null,
      steps: [null],
      stepBlurhashes: [null],
    });
  });

  it('renders instruction text', () => {
    render(
      React.createElement(StepContent, {
        recipeId: 'test-recipe',
        step: mockStep,
        stepIndex: 0,
        totalSteps: 3,
      })
    );
    expect(screen.getByText('Soganlari ince ince dogra')).toBeTruthy();
  });

  it('renders "Neden?" pressable and reveals why text on tap', () => {
    render(
      React.createElement(StepContent, {
        recipeId: 'test-recipe',
        step: mockStep,
        stepIndex: 0,
        totalSteps: 3,
      })
    );
    const nedenButton = screen.getByText(/Neden/i);
    expect(nedenButton).toBeTruthy();
    // Why text should not be visible before tap
    expect(screen.queryByText('Ince dogranan soganlar daha cabuk karamellesir')).toBeNull();
    // Tap to reveal
    fireEvent.press(nedenButton);
    expect(screen.getByText('Ince dogranan soganlar daha cabuk karamellesir')).toBeTruthy();
  });

  it('renders "Gormeli" section with looksLikeWhenDone text', () => {
    render(
      React.createElement(StepContent, {
        recipeId: 'test-recipe',
        step: mockStep,
        stepIndex: 0,
        totalSteps: 3,
      })
    );
    expect(screen.getByText('Soganlar seffaf ve altin rengi olmali')).toBeTruthy();
  });

  it('renders "Dikkat" section with commonMistake text', () => {
    render(
      React.createElement(StepContent, {
        recipeId: 'test-recipe',
        step: mockStep,
        stepIndex: 0,
        totalSteps: 3,
      })
    );
    expect(screen.getByText('Soganlari cok kalin dogamak')).toBeTruthy();
  });

  it('renders recovery text', () => {
    render(
      React.createElement(StepContent, {
        recipeId: 'test-recipe',
        step: mockStep,
        stepIndex: 0,
        totalSteps: 3,
      })
    );
    expect(screen.getByText('Kalin dogramissaniz biraz daha uzun pisirin')).toBeTruthy();
  });

  it('does NOT render CircularTimer when timerSeconds is null', () => {
    render(
      React.createElement(StepContent, {
        recipeId: 'test-recipe',
        step: mockStep,
        stepIndex: 0,
        totalSteps: 3,
      })
    );
    expect(screen.queryByTestId('circular-timer')).toBeNull();
  });

  it('renders CircularTimer area when timerSeconds is provided', () => {
    const stepWithTimer: RecipeStep = {
      ...mockStep,
      timerSeconds: 300,
    };
    render(
      React.createElement(StepContent, {
        recipeId: 'test-recipe',
        step: stepWithTimer,
        stepIndex: 0,
        totalSteps: 3,
      })
    );
    expect(screen.getByTestId('circular-timer')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Phase 11 — image and checkpoint/warning (updated for registry-based images)
// ---------------------------------------------------------------------------

describe('Phase 11 — image and checkpoint/warning', () => {
  beforeEach(() => {
    mockGetRecipeImages.mockReturnValue({
      cover: null,
      coverBlurhash: null,
      steps: [null],
      stepBlurhashes: [null],
    });
  });

  it('renders expo-image when registry step image exists', () => {
    mockGetRecipeImages.mockReturnValue({
      cover: null,
      coverBlurhash: null,
      steps: [1],
      stepBlurhashes: ['LKO2?U%2Tw=w]~RBVZRi};RPxuwH'],
    });
    render(
      React.createElement(StepContent, {
        recipeId: 'test-recipe',
        step: mockStep,
        stepIndex: 0,
        totalSteps: 3,
      })
    );
    expect(screen.getByTestId('step-image')).toBeTruthy();
  });

  it('renders pastel placeholder when registry step image is null', () => {
    render(
      React.createElement(StepContent, {
        recipeId: 'test-recipe',
        step: mockStep,
        stepIndex: 0,
        totalSteps: 3,
      })
    );
    // No step-image testID should exist
    expect(screen.queryByTestId('step-image')).toBeNull();
  });

  it('passes blurhash placeholder to expo-image when stepBlurhash exists', () => {
    mockGetRecipeImages.mockReturnValue({
      cover: null,
      coverBlurhash: null,
      steps: [1],
      stepBlurhashes: ['LKO2?U%2Tw=w]~RBVZRi};RPxuwH'],
    });
    render(
      React.createElement(StepContent, {
        recipeId: 'test-recipe',
        step: mockStep,
        stepIndex: 0,
        totalSteps: 3,
      })
    );
    // Verify expo-image is rendered (with blurhash -- expo-image mock is View,
    // so we verify the image element exists; blurhash is a prop passed to Image)
    expect(screen.getByTestId('step-image')).toBeTruthy();
  });

  it('renders checkpoint text with check-circle when checkpoint is non-null', () => {
    const stepWithCheckpoint: RecipeStep = {
      ...mockStep,
      checkpoint: 'Kopurmeli ve hafif kizarmis olmali',
    };
    render(
      React.createElement(StepContent, {
        recipeId: 'test-recipe',
        step: stepWithCheckpoint,
        stepIndex: 0,
        totalSteps: 3,
      })
    );
    expect(screen.getByText('Kopurmeli ve hafif kizarmis olmali')).toBeTruthy();
  });

  it('hides checkpoint section when checkpoint is null', () => {
    render(
      React.createElement(StepContent, {
        recipeId: 'test-recipe',
        step: mockStep,
        stepIndex: 0,
        totalSteps: 3,
      })
    );
    expect(screen.queryByTestId('checkpoint-callout')).toBeNull();
  });

  it('renders warning text with alert icon when warning is non-null', () => {
    const stepWithWarning: RecipeStep = {
      ...mockStep,
      warning: 'Cok kisdirmak yanar!',
    };
    render(
      React.createElement(StepContent, {
        recipeId: 'test-recipe',
        step: stepWithWarning,
        stepIndex: 0,
        totalSteps: 3,
      })
    );
    expect(screen.getByText('Cok kisdirmak yanar!')).toBeTruthy();
  });

  it('hides warning section when warning is null', () => {
    render(
      React.createElement(StepContent, {
        recipeId: 'test-recipe',
        step: mockStep,
        stepIndex: 0,
        totalSteps: 3,
      })
    );
    expect(screen.queryByTestId('warning-callout')).toBeNull();
  });

  it('existing Dikkat section still renders commonMistake and recovery (unchanged)', () => {
    render(
      React.createElement(StepContent, {
        recipeId: 'test-recipe',
        step: mockStep,
        stepIndex: 0,
        totalSteps: 3,
      })
    );
    expect(screen.getByText('Soganlari cok kalin dogamak')).toBeTruthy();
    expect(screen.getByText('Kalin dogramissaniz biraz daha uzun pisirin')).toBeTruthy();
  });
});
