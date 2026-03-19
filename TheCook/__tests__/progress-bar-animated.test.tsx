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
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      createAnimatedComponent: (c: any) => c,
      View,
    },
    useSharedValue: (val: number) => ({ value: val }),
    useAnimatedStyle: (fn: () => any) => fn(),
    withTiming: (val: number) => val,
    interpolateColor: (_val: number, _input: number[], _output: string[]) => _output[0],
    Easing: { linear: 'linear' },
  };
});

import React from 'react';
import { render } from '@testing-library/react-native';
import { SegmentedProgressBar } from '@/components/cooking/progress-bar';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SegmentedProgressBar animated segments', () => {
  test('renders correct number of segments', () => {
    const { toJSON } = render(
      <SegmentedProgressBar totalSteps={5} currentStep={2} />,
    );

    const tree = toJSON();
    // The container View has children = segment Views
    // With the AnimatedSegment sub-component, each segment is an Animated.View
    // In our mock, Animated.View renders as View
    expect(tree).toBeTruthy();
    const container = tree as any;
    // Container should have exactly 5 children (segments)
    expect(container.children).toHaveLength(5);
  });

  test('renders with different step counts', () => {
    const { toJSON } = render(
      <SegmentedProgressBar totalSteps={3} currentStep={0} />,
    );

    const tree = toJSON();
    const container = tree as any;
    expect(container.children).toHaveLength(3);
  });
});
