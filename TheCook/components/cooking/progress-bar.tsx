import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

import { useAppTheme } from '@/contexts/ThemeContext';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SegmentedProgressBarProps {
  totalSteps: number;
  currentStep: number;
}

// ---------------------------------------------------------------------------
// AnimatedSegment sub-component (avoids hooks-in-map pitfall)
// ---------------------------------------------------------------------------

function AnimatedSegment({
  active,
  activeColor,
  inactiveColor,
}: {
  active: boolean;
  activeColor: string;
  inactiveColor: string;
}) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 300 });
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [inactiveColor, activeColor],
    ),
  }));

  return <Animated.View style={[styles.segment, animatedStyle]} />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SegmentedProgressBar({
  totalSteps,
  currentStep,
}: SegmentedProgressBarProps) {
  const { colors } = useAppTheme();
  const segments = Array.from({ length: totalSteps }, (_, i) => i);

  return (
    <View style={styles.container}>
      {segments.map((idx) => (
        <AnimatedSegment
          key={idx}
          active={idx <= currentStep}
          activeColor={colors.tint}
          inactiveColor={colors.border}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});
