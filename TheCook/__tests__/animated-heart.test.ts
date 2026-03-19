import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AnimatedHeart } from '@/components/ui/animated-heart';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockImpactAsync = jest.fn();

jest.mock('expo-haptics', () => ({
  impactAsync: (...args: unknown[]) => mockImpactAsync(...args),
  ImpactFeedbackStyle: { Light: 'light' },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AnimatedHeart', () => {
  beforeEach(() => {
    mockImpactAsync.mockClear();
  });

  it('calls onToggle when pressed', () => {
    const onToggle = jest.fn();
    const { getByRole } = render(
      React.createElement(AnimatedHeart, {
        isBookmarked: false,
        onToggle,
        color: '#FFFFFF',
      }),
    );

    fireEvent.press(getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls Haptics.impactAsync when isBookmarked is false (adding bookmark)', () => {
    const onToggle = jest.fn();
    const { getByRole } = render(
      React.createElement(AnimatedHeart, {
        isBookmarked: false,
        onToggle,
        color: '#FFFFFF',
      }),
    );

    fireEvent.press(getByRole('button'));
    expect(mockImpactAsync).toHaveBeenCalledWith('light');
  });

  it('does NOT call Haptics.impactAsync when isBookmarked is true (removing bookmark)', () => {
    const onToggle = jest.fn();
    const { getByRole } = render(
      React.createElement(AnimatedHeart, {
        isBookmarked: true,
        onToggle,
        color: '#FFFFFF',
      }),
    );

    fireEvent.press(getByRole('button'));
    expect(mockImpactAsync).not.toHaveBeenCalled();
  });

  it('renders heart icon when bookmarked', () => {
    const { getByTestId } = render(
      React.createElement(AnimatedHeart, {
        isBookmarked: true,
        onToggle: jest.fn(),
        color: '#FFFFFF',
        testID: 'animated-heart',
      }),
    );

    const icon = getByTestId('animated-heart-icon');
    expect(icon.props.name).toBe('heart');
  });

  it('renders heart-outline icon when not bookmarked', () => {
    const { getByTestId } = render(
      React.createElement(AnimatedHeart, {
        isBookmarked: false,
        onToggle: jest.fn(),
        color: '#FFFFFF',
        testID: 'animated-heart',
      }),
    );

    const icon = getByTestId('animated-heart-icon');
    expect(icon.props.name).toBe('heart-outline');
  });
});
