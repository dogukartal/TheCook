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

  it('applies style prop to outer wrapper', () => {
    const { toJSON } = render(
      React.createElement(ScalePressable, {
        style: { backgroundColor: 'red' },
      },
        React.createElement(Text, null, 'Styled'),
      ),
    );

    const tree = toJSON() as any;
    // The outer Animated.View should have the style with backgroundColor
    function findStyle(node: any): boolean {
      if (!node || typeof node !== 'object') return false;
      const styles = node.props?.style;
      if (styles) {
        const flat = Array.isArray(styles)
          ? Object.assign({}, ...styles.filter((s: unknown) => typeof s === 'object' && s !== null))
          : styles;
        if (flat.backgroundColor === 'red') return true;
      }
      if (Array.isArray(node.children)) {
        return node.children.some((c: any) => findStyle(c));
      }
      return false;
    }
    expect(findStyle(tree)).toBe(true);
  });
});
