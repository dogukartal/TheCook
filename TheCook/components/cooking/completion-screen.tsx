import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@/contexts/ThemeContext';
import { STAR_RATING_COLOR } from '@/constants/palette';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CompletionScreenProps {
  recipeName: string;
  totalCookingTime: number; // in minutes
  onComplete: (rating: number | null) => void;
}

// ---------------------------------------------------------------------------
// Star Rating (internal)
// ---------------------------------------------------------------------------

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)} accessibilityRole="button" accessibilityLabel={`${star} yildiz`}>
          <MaterialCommunityIcons
            name={star <= value ? 'star' : 'star-outline'}
            size={36}
            color={star <= value ? STAR_RATING_COLOR : colors.disabledIcon}
          />
        </Pressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CompletionScreen({
  recipeName,
  totalCookingTime,
  onComplete,
}: CompletionScreenProps) {
  const [rating, setRating] = useState<number>(0);
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Celebration icon */}
      <MaterialCommunityIcons name="party-popper" size={72} color={colors.tint} />

      {/* Title */}
      <Text style={[styles.title, { color: colors.tint }]}>Afiyet olsun!</Text>

      {/* Recipe name */}
      <Text style={[styles.recipeName, { color: colors.textSub }]}>{recipeName}</Text>

      {/* Cooking time */}
      <Text style={[styles.cookingTime, { color: colors.textMuted }]}>{totalCookingTime} dakika</Text>

      {/* Rating */}
      <Text style={[styles.ratingLabel, { color: colors.textSub }]}>Bu tarifi degerlendir</Text>
      <StarRating value={rating} onChange={setRating} />

      {/* Back to recipes button */}
      <Pressable
        style={[styles.button, { backgroundColor: colors.tint }]}
        onPress={() => onComplete(rating > 0 ? rating : null)}
        accessibilityRole="button"
        accessibilityLabel="Tariflere Don"
      >
        <Text style={[styles.buttonText, { color: colors.onTint }]}>Tariflere Don</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 8,
  },
  recipeName: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  cookingTime: {
    fontSize: 15,
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 15,
    marginTop: 24,
    marginBottom: 12,
  },
  starRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 32,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
