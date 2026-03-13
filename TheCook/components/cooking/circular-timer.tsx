import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CircularTimerProps {
  totalSeconds: number;
  displaySeconds: number;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SIZE = 96;
const STROKE_WIDTH = 6;
const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = SIZE / 2;

// ---------------------------------------------------------------------------
// Animated circle
// ---------------------------------------------------------------------------

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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

export function CircularTimer({
  totalSeconds,
  displaySeconds,
  isRunning,
  onStart,
  onPause,
  onResume,
}: CircularTimerProps) {
  const progress = totalSeconds > 0 ? displaySeconds / totalSeconds : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const isComplete = displaySeconds === 0;
  const notStarted = displaySeconds === totalSeconds && !isRunning;
  const isPaused = displaySeconds < totalSeconds && !isRunning && !isComplete;

  // Pulse animation for completion
  const pulseOpacity = useSharedValue(1);
  if (isComplete) {
    pulseOpacity.value = withRepeat(
      withTiming(0.4, { duration: 800, easing: Easing.linear }),
      -1,
      true
    );
  }

  function handlePress() {
    if (notStarted) {
      onStart();
    } else if (isRunning) {
      onPause();
    } else if (isPaused) {
      onResume();
    }
  }

  const buttonIcon = isComplete
    ? 'check-circle'
    : isRunning
    ? 'pause'
    : 'play';

  const buttonColor = isComplete ? '#15803D' : '#E07B39';

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <G rotation="-90" origin={`${CENTER}, ${CENTER}`}>
          {/* Background circle */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke="#E5E7EB"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Progress circle */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke="#E07B39"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>

      {/* Center text */}
      <View style={styles.centerOverlay}>
        <Text style={styles.timeText}>{formatTime(displaySeconds)}</Text>
      </View>

      {/* Play/pause button */}
      <Pressable
        style={styles.controlButton}
        onPress={handlePress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={
          isComplete
            ? 'Zamanlayici tamamlandi'
            : isRunning
            ? 'Duraklat'
            : 'Baslat'
        }
      >
        <MaterialCommunityIcons name={buttonIcon} size={22} color={buttonColor} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: SIZE,
  },
  centerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  controlButton: {
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
});
