import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function Chip({ label, selected, onPress, style }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.selected, style]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    margin: 4,
  },
  selected: {
    borderColor: '#E07B39', // warm terracotta — brand color for The Cook
    backgroundColor: '#FEF3EC',
  },
  label: {
    fontSize: 14,
    color: '#374151',
  },
  selectedLabel: {
    color: '#C05F20',
    fontWeight: '600',
  },
});
