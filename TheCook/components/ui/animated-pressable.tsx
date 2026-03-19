import React from 'react';
import { PressableProps, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(
  require('react-native').Pressable,
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ScalePressableProps extends PressableProps {
  /** Scale-down target on press (default 0.96) */
  scaleValue?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScalePressable({
  scaleValue = 0.96,
  style,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: ScalePressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      style={[style, animatedStyle]}
      onPressIn={(e: any) => {
        scale.value = withSpring(scaleValue, { damping: 15, stiffness: 300 });
        onPressIn?.(e);
      }}
      onPressOut={(e: any) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
