import React from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AnimatedHeartProps {
  isBookmarked: boolean;
  onToggle: () => void;
  /** Icon size (default 20) */
  size?: number;
  color: string;
  testID?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnimatedHeart({
  isBookmarked,
  onToggle,
  size = 20,
  color,
  testID,
}: AnimatedHeartProps) {
  const scale = useSharedValue(1);

  function handlePress() {
    if (!isBookmarked) {
      // Only animate + haptic when bookmarking (adding), not removing
      scale.value = withSequence(
        withTiming(1.35, { duration: 150 }),
        withTiming(1, { duration: 200 }),
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggle();
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isBookmarked ? 'Favoriden cikar' : 'Favoriye ekle'}
    >
      <Animated.View style={animatedStyle}>
        <MaterialCommunityIcons
          name={isBookmarked ? 'heart' : 'heart-outline'}
          size={size}
          color={color}
          testID={testID ? `${testID}-icon` : undefined}
        />
      </Animated.View>
    </Pressable>
  );
}
