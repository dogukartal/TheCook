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
  const disabledColor = isDark ? 'rgba(255,255,255,0.15)' : '#D1D5DB';

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, !canDecrease && [styles.buttonDisabled, { borderColor: disabledColor }]]}
        onPress={() => canDecrease && onChange(Math.max(min, value - 1))}
        disabled={!canDecrease}
        accessibilityRole="button"
        accessibilityLabel="Porsiyon azalt"
      >
        <MaterialCommunityIcons
          name="minus"
          size={18}
          color={canDecrease ? "#E8834A" : disabledColor}
        />
      </Pressable>

      <Text style={[styles.valueText, { color: colors.text }, isModified && styles.valueTextModified]}>
        {value} kisi
      </Text>

      <Pressable
        style={[styles.button, !canIncrease && [styles.buttonDisabled, { borderColor: disabledColor }]]}
        onPress={() => canIncrease && onChange(Math.min(max, value + 1))}
        disabled={!canIncrease}
        accessibilityRole="button"
        accessibilityLabel="Porsiyon artir"
      >
        <MaterialCommunityIcons
          name="plus"
          size={18}
          color={canIncrease ? "#E8834A" : disabledColor}
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
    borderColor: "#E8834A",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    borderColor: "#D1D5DB",
  },
  valueText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A18",
  },
  valueTextModified: {
    color: "#E8834A",
  },
});
