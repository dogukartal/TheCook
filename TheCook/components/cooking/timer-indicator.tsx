import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@/contexts/ThemeContext';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TimerIndicatorProps {
  timerStepIndex: number;
  currentStepIndex: number;
  displaySeconds: number;
  onPress: () => void;
}

// ---------------------------------------------------------------------------
// Helper: format MM:SS
// ---------------------------------------------------------------------------

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TimerIndicator({
  timerStepIndex,
  currentStepIndex,
  displaySeconds,
  onPress,
}: TimerIndicatorProps) {
  const { colors } = useAppTheme();

  // Only render when timer is on a different step and still counting
  if (timerStepIndex === currentStepIndex || displaySeconds <= 0) {
    return null;
  }

  const direction = timerStepIndex < currentStepIndex ? 'left' : 'right';
  const arrowIcon =
    direction === 'left' ? 'arrow-left' : 'arrow-right';

  const positionStyle =
    direction === 'left'
      ? { left: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }
      : { right: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 };

  return (
    <Pressable
      style={[styles.pill, positionStyle, { backgroundColor: colors.tint, shadowColor: colors.shadow }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Zamanlayici adim ${timerStepIndex + 1}, ${formatTime(displaySeconds)} kaldi`}
    >
      <MaterialCommunityIcons name={arrowIcon} size={16} color={colors.onTint} />
      <Text style={[styles.text, { color: colors.onTint }]}>{formatTime(displaySeconds)}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
  },
});
