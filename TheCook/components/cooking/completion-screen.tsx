import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)} accessibilityRole="button" accessibilityLabel={`${star} yildiz`}>
          <MaterialCommunityIcons
            name={star <= value ? 'star' : 'star-outline'}
            size={36}
            color={star <= value ? '#F59E0B' : '#D1D5DB'}
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

  return (
    <View style={styles.container}>
      {/* Celebration icon */}
      <MaterialCommunityIcons name="party-popper" size={72} color="#E07B39" />

      {/* Title */}
      <Text style={styles.title}>Afiyet olsun!</Text>

      {/* Recipe name */}
      <Text style={styles.recipeName}>{recipeName}</Text>

      {/* Cooking time */}
      <Text style={styles.cookingTime}>{totalCookingTime} dakika</Text>

      {/* Rating */}
      <Text style={styles.ratingLabel}>Bu tarifi degerlendir</Text>
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
    backgroundColor: '#FFFFFF',
    padding: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#E07B39',
    marginTop: 20,
    marginBottom: 8,
  },
  recipeName: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  cookingTime: {
    fontSize: 15,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 24,
    marginBottom: 12,
  },
  starRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#E07B39',
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
