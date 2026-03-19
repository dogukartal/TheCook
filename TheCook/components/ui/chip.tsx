import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function Chip({ label, selected, onPress, style }: ChipProps) {
  const { isDark } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: isDark ? '#161614' : '#F0EDE8',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        },
        selected && [
          styles.selected,
          { backgroundColor: isDark ? 'rgba(232,131,74,0.15)' : '#FEF3EC' },
        ],
        style,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
    >
      <Text
        style={[
          styles.label,
          { color: isDark ? '#F0EDE6' : '#1A1A18' },
          selected && styles.selectedLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#F0EDE8',
    margin: 4,
  },
  selected: {
    borderColor: '#E8834A', // warm terracotta — brand color for The Cook
    backgroundColor: '#FEF3EC',
  },
  label: {
    fontSize: 14,
    color: '#1A1A18',
  },
  selectedLabel: {
    color: '#E8834A',
    fontWeight: '600',
  },
});
