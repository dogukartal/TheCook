import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  // Only render when timer is on a different step and still counting
  if (timerStepIndex === currentStepIndex || displaySeconds <= 0) {
    return null;
  }

  const direction = timerStepIndex < currentStepIndex ? 'left' : 'right';
  const arrowIcon =
    direction === 'left' ? 'arrow-left' : 'arrow-right';

  return (
    <Pressable
      style={styles.pill}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Zamanlayici adim ${timerStepIndex + 1}, ${formatTime(displaySeconds)} kaldi`}
    >
      <MaterialCommunityIcons name={arrowIcon} size={16} color="#FFFFFF" />
      <Text style={styles.text}>{formatTime(displaySeconds)}</Text>
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
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(224, 123, 57, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
