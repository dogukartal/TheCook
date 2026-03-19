import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@/contexts/ThemeContext';
import { STAR_RATING_COLOR } from '@/constants/palette';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StarRatingInlineProps {
  value: number;
  onChange?: (n: number) => void;
  size?: number;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StarRatingInline({
  value,
  onChange,
  size = 20,
  disabled = false,
}: StarRatingInlineProps) {
  const { colors } = useAppTheme();
  const interactive = !!onChange && !disabled;

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const icon = star <= value ? 'star' : 'star-outline';
        const color = star <= value ? STAR_RATING_COLOR : colors.disabledIcon;

        if (interactive) {
          return (
            <Pressable
              key={star}
              onPress={() => onChange!(star)}
              accessibilityRole="button"
              accessibilityLabel={`${star} yildiz`}
              hitSlop={4}
            >
              <MaterialCommunityIcons name={icon} size={size} color={color} />
            </Pressable>
          );
        }

        return (
          <View key={star} accessibilityLabel={`${star} yildiz`}>
            <MaterialCommunityIcons name={icon} size={size} color={color} />
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
