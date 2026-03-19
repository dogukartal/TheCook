import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "@/contexts/ThemeContext";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ServingStepperProps {
  value: number;
  originalValue: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

// ---------------------------------------------------------------------------
// ServingStepper — inline +/- stepper for serving count
// ---------------------------------------------------------------------------

export function ServingStepper({
  value,
  originalValue,
  min = 1,
  max = 20,
  onChange,
}: ServingStepperProps) {
  const { isDark, colors } = useAppTheme();
  const isModified = value !== originalValue;
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, { borderColor: colors.tint }, !canDecrease && { borderColor: colors.disabledIcon }]}
        onPress={() => canDecrease && onChange(Math.max(min, value - 1))}
        disabled={!canDecrease}
        accessibilityRole="button"
        accessibilityLabel="Porsiyon azalt"
      >
        <MaterialCommunityIcons
          name="minus"
          size={18}
          color={canDecrease ? colors.tint : colors.disabledIcon}
        />
      </Pressable>

      <Text style={[styles.valueText, { color: colors.text }, isModified && { color: colors.tint }]}>
        {value} kisi
      </Text>

      <Pressable
        style={[styles.button, { borderColor: colors.tint }, !canIncrease && { borderColor: colors.disabledIcon }]}
        onPress={() => canIncrease && onChange(Math.min(max, value + 1))}
        disabled={!canIncrease}
        accessibilityRole="button"
        accessibilityLabel="Porsiyon artir"
      >
        <MaterialCommunityIcons
          name="plus"
          size={18}
          color={canIncrease ? colors.tint : colors.disabledIcon}
        />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  valueText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
