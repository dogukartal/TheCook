import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@/contexts/ThemeContext';

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
  const { isDark } = useAppTheme();
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)} accessibilityRole="button" accessibilityLabel={`${star} yildiz`}>
          <MaterialCommunityIcons
            name={star <= value ? 'star' : 'star-outline'}
            size={36}
            color={star <= value ? '#F59E0B' : (isDark ? 'rgba(255,255,255,0.2)' : '#D1D5DB')}
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
      <MaterialCommunityIcons name="party-popper" size={72} color="#E8834A" />

      {/* Title */}
      <Text style={styles.title}>Afiyet olsun!</Text>

      {/* Recipe name */}
      <Text style={[styles.recipeName, { color: colors.textSub }]}>{recipeName}</Text>

      {/* Cooking time */}
      <Text style={[styles.cookingTime, { color: colors.textMuted }]}>{totalCookingTime} dakika</Text>

      {/* Rating */}
      <Text style={[styles.ratingLabel, { color: colors.textSub }]}>Bu tarifi degerlendir</Text>
      <StarRating value={rating} onChange={setRating} />

      {/* Back to recipes button */}
      <Pressable
        style={styles.button}
        onPress={() => onComplete(rating > 0 ? rating : null)}
        accessibilityRole="button"
        accessibilityLabel="Tariflere Don"
      >
        <Text style={styles.buttonText}>Tariflere Don</Text>
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
    color: '#E8834A',
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
    backgroundColor: '#E8834A',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
