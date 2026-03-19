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

  it('shows "Favoriden cikar" label when bookmarked', () => {
    const { getByLabelText } = render(
      React.createElement(AnimatedHeart, {
        isBookmarked: true,
        onToggle: jest.fn(),
        color: '#FFFFFF',
      }),
    );

    expect(getByLabelText('Favoriden cikar')).toBeTruthy();
  });

  it('shows "Favoriye ekle" label when not bookmarked', () => {
    const { getByLabelText } = render(
      React.createElement(AnimatedHeart, {
        isBookmarked: false,
        onToggle: jest.fn(),
        color: '#FFFFFF',
      }),
    );

    expect(getByLabelText('Favoriye ekle')).toBeTruthy();
  });
});
