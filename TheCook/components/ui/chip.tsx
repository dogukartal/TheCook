import React from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function Chip({ label, selected, onPress, style, icon }: ChipProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        selected && {
          backgroundColor: colors.tintBg,
          borderColor: colors.tint,
        },
        style,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
    >
      {icon ? (
        <View style={styles.iconRow}>
          {icon}
          <Text
            style={[
              styles.label,
              { color: colors.text },
              selected && { color: colors.tint, fontWeight: '600' },
            ]}
          >
            {label}
          </Text>
        </View>
      ) : (
        <Text
          style={[
            styles.label,
            { color: colors.text },
            selected && { color: colors.tint, fontWeight: '600' },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    margin: 4,
  },
  label: {
    fontSize: 14,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
