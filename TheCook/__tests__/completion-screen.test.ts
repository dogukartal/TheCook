import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

// Mock @expo/vector-icons — render icon name as text for assertions
jest.mock('@expo/vector-icons', () => {
  const RN = require('react-native');
  const MockReact = require('react');
  return {
    MaterialCommunityIcons: ({ name, ...props }: any) =>
      MockReact.createElement(RN.View, { ...props, testID: `icon-${name}` },
        MockReact.createElement(RN.Text, {}, name)
      ),
  };
});

import { CompletionScreen } from '@/components/cooking/completion-screen';

describe('CompletionScreen', () => {
  const defaultProps = {
    recipeName: 'Menemen',
    totalCookingTime: 25,
    onComplete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "Afiyet olsun!" title', () => {
    render(React.createElement(CompletionScreen, defaultProps));
    expect(screen.getByText('Afiyet olsun!')).toBeTruthy();
  });

  it('renders recipe name', () => {
    render(React.createElement(CompletionScreen, defaultProps));
    expect(screen.getByText('Menemen')).toBeTruthy();
  });

  it('renders 5 star icons (all star-outline initially)', () => {
    render(React.createElement(CompletionScreen, defaultProps));
    for (let i = 0; i < 5; i++) {
      expect(screen.getAllByText('star-outline').length).toBe(5);
    }
  });

  it('pressing star 3 fills stars 1-3 and leaves 4-5 as star-outline', () => {
    render(React.createElement(CompletionScreen, defaultProps));
    // Tap star 3 (accessibilityLabel="3 yildiz")
    fireEvent.press(screen.getByLabelText('3 yildiz'));

    // Stars 1-3 should be filled
    expect(screen.getAllByText('star').length).toBe(3);
    // Stars 4-5 should remain outlined
    expect(screen.getAllByText('star-outline').length).toBe(2);
  });

  it('pressing action button calls onComplete with selected rating', () => {
    const onComplete = jest.fn();
    render(React.createElement(CompletionScreen, { ...defaultProps, onComplete }));

    fireEvent.press(screen.getByLabelText('3 yildiz'));
    fireEvent.press(screen.getByLabelText('Tariflere Don'));

    expect(onComplete).toHaveBeenCalledWith(3);
  });

  it('pressing action button without selecting rating calls onComplete with null', () => {
    const onComplete = jest.fn();
    render(React.createElement(CompletionScreen, { ...defaultProps, onComplete }));

    fireEvent.press(screen.getByLabelText('Tariflere Don'));

    expect(onComplete).toHaveBeenCalledWith(null);
  });
});
