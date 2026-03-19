import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ScalePressable } from '@/components/ui/animated-pressable';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ScalePressable', () => {
  it('renders children', () => {
    const { getByText } = render(
      React.createElement(ScalePressable, { onPress: jest.fn() },
        React.createElement(Text, null, 'Child content'),
      ),
    );

    expect(getByText('Child content')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      React.createElement(ScalePressable, { onPress },
        React.createElement(Text, null, 'Tap me'),
      ),
    );

    fireEvent.press(getByText('Tap me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('forwards onPressIn and onPressOut props', () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    const { getByText } = render(
      React.createElement(ScalePressable, { onPressIn, onPressOut },
        React.createElement(Text, null, 'Press me'),
      ),
    );

    const pressable = getByText('Press me');
    fireEvent(pressable, 'pressIn');
    expect(onPressIn).toHaveBeenCalledTimes(1);

    fireEvent(pressable, 'pressOut');
    expect(onPressOut).toHaveBeenCalledTimes(1);
  });

  it('applies style prop', () => {
    const { getByTestId } = render(
      React.createElement(ScalePressable, {
        testID: 'scale-pressable',
        style: { backgroundColor: 'red' },
      },
        React.createElement(Text, null, 'Styled'),
      ),
    );

    const element = getByTestId('scale-pressable');
    // Style array should contain the user-provided style
    const flatStyle = Array.isArray(element.props.style)
      ? Object.assign({}, ...element.props.style.map((s: unknown) =>
          typeof s === 'object' && s !== null ? s : {}
        ))
      : element.props.style;
    expect(flatStyle.backgroundColor).toBe('red');
  });
});
