import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SefimPulseProps {
  active: boolean;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Animated wrapper that pulses (scale + opacity) when active.
 * Used to draw attention to the chef-hat icon when the user lingers on a step.
 */
export function SefimPulse({ active, children }: SefimPulseProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 500 }),
          withTiming(1.0, { duration: 500 }),
        ),
        -1,
        false,
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 500 }),
          withTiming(1.0, { duration: 500 }),
        ),
        -1,
        false,
      );
    } else {
      scale.value = withTiming(1);
      opacity.value = withTiming(1);
    }
  }, [active, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}
