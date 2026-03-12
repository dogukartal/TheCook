import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface IngredientChipsProps {
  chips: string[];
  onRemove: (name: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IngredientChips({ chips, onRemove }: IngredientChipsProps) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {chips.map((name) => (
        <View key={name} style={styles.chip}>
          <Text style={styles.chipText}>{name}</Text>
          <Pressable
            onPress={() => onRemove(name)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={`${name} malzemesini kaldır`}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={16}
              color="#C05F20"
            />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3EC',
    borderColor: '#E07B39',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    margin: 4,
  },
  chipText: {
    color: '#C05F20',
    fontSize: 13,
    marginRight: 4,
  },
});
