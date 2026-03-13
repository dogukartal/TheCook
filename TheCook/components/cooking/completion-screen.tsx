import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CompletionScreenProps {
  recipeName: string;
  totalCookingTime: number; // in minutes
  onBackToRecipes: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CompletionScreen({
  recipeName,
  totalCookingTime,
  onBackToRecipes,
}: CompletionScreenProps) {
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

      {/* Back to recipes button */}
      <Pressable
        style={styles.button}
        onPress={onBackToRecipes}
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
    marginBottom: 40,
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
