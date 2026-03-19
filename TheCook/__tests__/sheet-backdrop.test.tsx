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

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

// Mock @jamsch/expo-speech-recognition
jest.mock('@jamsch/expo-speech-recognition', () => ({
  ExpoSpeechRecognitionModule: {
    getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    start: jest.fn(),
    stop: jest.fn(),
  },
  useSpeechRecognitionEvent: jest.fn(),
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
    withSpring: (val: number) => val,
    runOnJS: (fn: any) => fn,
    interpolateColor: () => 'transparent',
    Easing: { linear: 'linear' },
  };
});

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => React.createElement(Text, null, props.name),
  };
});

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => ({
    getAllAsync: jest.fn().mockResolvedValue([]),
    runAsync: jest.fn().mockResolvedValue(undefined),
  }),
}));

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { IngredientsSheet } from '@/components/cooking/ingredients-sheet';
import { SefimSheet } from '@/components/cooking/sefim-sheet';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Sheet backdrop animation', () => {
  test('IngredientsSheet uses animationType="none"', () => {
    const { UNSAFE_root } = render(
      <IngredientsSheet
        ingredientGroups={[]}
        checkedIndices={[]}
        onToggleCheck={jest.fn()}
        visible={true}
        onClose={jest.fn()}
      />,
    );

    // Find the Modal component and check its animationType prop
    const modal = findModal(UNSAFE_root);
    expect(modal).toBeTruthy();
    expect(modal.props.animationType).toBe('none');
  });

  test('SefimSheet uses animationType="none"', () => {
    const { UNSAFE_root } = render(
      <SefimSheet
        visible={true}
        onClose={jest.fn()}
        chips={[]}
        messages={[]}
        isLoading={false}
        onChipTap={jest.fn()}
        onSendQuestion={jest.fn()}
      />,
    );

    const modal = findModal(UNSAFE_root);
    expect(modal).toBeTruthy();
    expect(modal.props.animationType).toBe('none');
  });

  test('IngredientsSheet calls onClose on backdrop press', () => {
    const onClose = jest.fn();
    const { UNSAFE_root } = render(
      <IngredientsSheet
        ingredientGroups={[]}
        checkedIndices={[]}
        onToggleCheck={jest.fn()}
        visible={true}
        onClose={onClose}
      />,
    );

    // Find Pressable elements in the tree that don't have an accessibilityRole
    // The backdrop dismiss is the one without accessibilityRole (close button has "button")
    const pressables: any[] = [];
    function walk(node: any) {
      if (!node || typeof node !== 'object') return;
      // Check if this is a Pressable-like element without accessibility role
      if (node.props?.onPress && !node.props?.accessibilityRole) {
        pressables.push(node);
      }
      const children = node.children || node.props?.children;
      if (Array.isArray(children)) {
        children.forEach(walk);
      } else if (children && typeof children === 'object') {
        walk(children);
      }
    }
    walk(UNSAFE_root);

    // The first Pressable without an accessibilityRole is the backdrop dismiss
    const backdrop = pressables[0];
    expect(backdrop).toBeTruthy();
    // Call onPress directly since fireEvent may not work with the tree traversal
    backdrop.props.onPress();
    expect(onClose).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findModal(root: any): any {
  const { Modal } = require('react-native');
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node.type === Modal || node.type?.name === 'Modal') {
      return node;
    }
    if (node.children) {
      for (const child of node.children) {
        if (typeof child === 'object' && child !== null) {
          queue.push(child);
        }
      }
    }
  }
  return null;
}
