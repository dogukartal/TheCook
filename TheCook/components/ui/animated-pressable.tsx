import React from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ScalePressableProps extends Omit<PressableProps, 'style'> {
  /** Scale-down target on press (default 0.96) */
  scaleValue?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
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
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        {...rest}
        onPressIn={(e) => {
          scale.value = withSpring(scaleValue, { damping: 15, stiffness: 300 });
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
          onPressOut?.(e);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
