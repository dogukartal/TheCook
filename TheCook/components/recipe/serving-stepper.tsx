import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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
  const isModified = value !== originalValue;
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, !canDecrease && styles.buttonDisabled]}
        onPress={() => canDecrease && onChange(Math.max(min, value - 1))}
        disabled={!canDecrease}
        accessibilityRole="button"
        accessibilityLabel="Porsiyon azalt"
      >
        <MaterialCommunityIcons
          name="minus"
          size={18}
          color={canDecrease ? "#E07B39" : "#D1D5DB"}
        />
      </Pressable>

      <Text style={[styles.valueText, isModified && styles.valueTextModified]}>
        {value} kisi
      </Text>

      <Pressable
        style={[styles.button, !canIncrease && styles.buttonDisabled]}
        onPress={() => canIncrease && onChange(Math.min(max, value + 1))}
        disabled={!canIncrease}
        accessibilityRole="button"
        accessibilityLabel="Porsiyon artir"
      >
        <MaterialCommunityIcons
          name="plus"
          size={18}
          color={canIncrease ? "#E07B39" : "#D1D5DB"}
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
    borderColor: "#E07B39",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    borderColor: "#D1D5DB",
  },
  valueText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  valueTextModified: {
    color: "#E07B39",
  },
});
