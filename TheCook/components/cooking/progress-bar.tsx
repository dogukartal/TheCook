import React from 'react';
import { View, StyleSheet } from 'react-native';

import { useAppTheme } from '@/contexts/ThemeContext';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SegmentedProgressBarProps {
  totalSteps: number;
  currentStep: number;
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
        <View
          key={idx}
          style={[
            styles.segment,
            { backgroundColor: idx <= currentStep ? colors.tint : colors.border },
          ]}
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
