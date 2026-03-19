import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { formatAmount } from '@/src/hooks/useRecipeAdaptation';
import { useAppTheme } from '@/contexts/ThemeContext';
import type { IngredientGroup } from '@/src/types/recipe';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface IngredientsSheetProps {
  ingredientGroups: IngredientGroup[];
  checkedIndices: number[];
  onToggleCheck: (flatIndex: number) => void;
  visible: boolean;
  onClose: () => void;
  onSwap?: (ingredientName: string, alternativeName: string) => void;
  onResetSwap?: (ingredientName: string) => void;
  swaps?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IngredientsSheet({
  ingredientGroups,
  checkedIndices,
  onToggleCheck,
  visible,
  onClose,
  onSwap,
  onResetSwap,
  swaps = {},
}: IngredientsSheetProps) {
  const { isDark, colors } = useAppTheme();

  // Flatten all ingredients with their group labels
  type FlatItem =
    | { type: 'header'; label: string }
    | {
        type: 'ingredient';
        flatIndex: number;
        text: string;
        hasAlternatives: boolean;
        isSwapped: boolean;
        originalName: string | undefined;
        ingredientName: string;
        alternatives: { name: string; amount: number; unit: string }[];
      };

  const flatItems: FlatItem[] = [];
  let flatIndex = 0;

  for (const group of ingredientGroups) {
    if (group.label) {
      flatItems.push({ type: 'header', label: group.label });
    }
    for (const item of group.items) {
      const text = `${formatAmount(item.amount)} ${item.unit} ${item.name}${item.optional ? ' (opsiyonel)' : ''}`;
      const hasAlternatives = item.alternatives != null && item.alternatives.length > 0;
      const isSwapped = Boolean(swaps[item.name]);
      // Find original name if this ingredient was swapped (the key in swaps map whose value matches item.name)
      const originalName = isSwapped
        ? undefined // already the swapped name, the key IS the original
        : Object.entries(swaps).find(([, v]) => v === item.name)?.[0];

      flatItems.push({
        type: 'ingredient',
        flatIndex,
        text,
        hasAlternatives,
        isSwapped: Boolean(originalName), // true when the displayed item is a swapped-in alternative
        originalName,
        ingredientName: item.name,
        alternatives: item.alternatives ?? [],
      });
      flatIndex++;
    }
  }

  function handleSwapPress(
    ingredientName: string,
    alternatives: { name: string; amount: number; unit: string }[],
  ) {
    if (!onSwap) return;
    if (alternatives.length === 1) {
      onSwap(ingredientName, alternatives[0].name);
      return;
    }
    // Multiple alternatives — show Alert picker
    const buttons = alternatives.map((alt) => ({
      text: `${alt.name} (${formatAmount(alt.amount)} ${alt.unit})`,
      onPress: () => onSwap(ingredientName, alt.name),
    }));
    buttons.push({ text: 'Iptal', onPress: () => {} });
    Alert.alert('Yerine ne kullanalim?', undefined, buttons);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={onClose} />
        <View style={[styles.sheetContainer, { backgroundColor: isDark ? '#161614' : '#FFFFFF' }]}>
          {/* Handle bar */}
          <View style={styles.handleBarRow}>
            <View style={[styles.handleBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Malzemeler</Text>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.textSub} />
            </Pressable>
          </View>

          {/* Ingredient list */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {flatItems.map((item, idx) => {
              if (item.type === 'header') {
                return (
                  <Text key={`h-${idx}`} style={[styles.groupLabel, { color: isDark ? 'rgba(240,237,230,0.65)' : 'rgba(26,26,24,0.65)' }]}>
                    {item.label}
                  </Text>
                );
              }

              const checked = checkedIndices.includes(item.flatIndex);

              return (
                <View key={`i-${item.flatIndex}`} style={[styles.ingredientRow, { borderBottomColor: colors.border }]}>
                  {/* Checkbox */}
                  <Pressable
                    onPress={() => onToggleCheck(item.flatIndex)}
                    style={styles.checkbox}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                  >
                    <MaterialCommunityIcons
                      name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={22}
                      color={checked ? colors.textMuted : '#E8834A'}
                    />
                  </Pressable>

                  {/* Ingredient text */}
                  <Text
                    style={[
                      styles.ingredientText,
                      { color: isDark ? 'rgba(240,237,230,0.65)' : 'rgba(26,26,24,0.65)' },
                      checked && { color: colors.textMuted, textDecorationLine: 'line-through' },
                    ]}
                    numberOfLines={2}
                  >
                    {item.text}
                  </Text>

                  {/* Swap button — only for ingredients with alternatives */}
                  {item.hasAlternatives && !item.isSwapped && (
                    <Pressable
                      onPress={() => handleSwapPress(item.ingredientName, item.alternatives)}
                      style={styles.swapButton}
                      accessibilityRole="button"
                      accessibilityLabel="Elimde yok"
                    >
                      <Text style={styles.swapButtonText}>Elimde yok</Text>
                    </Pressable>
                  )}
                  {item.isSwapped && item.originalName && onResetSwap && (
                    <Pressable
                      onPress={() => onResetSwap(item.originalName!)}
                      style={[styles.swapButton, styles.swapButtonActive, { backgroundColor: isDark ? 'rgba(232,131,74,0.15)' : '#FEF3EC' }]}
                      accessibilityRole="button"
                      accessibilityLabel="Geri al"
                    >
                      <Text style={[styles.swapButtonActiveText, { color: colors.textSub }]}>Geri al</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
            <View style={styles.listBottomPad} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  overlayDismiss: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  handleBarRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  checkbox: {
    marginRight: 10,
  },
  ingredientText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  swapButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E8834A',
    borderRadius: 6,
  },
  swapButtonText: {
    fontSize: 12,
    color: '#E8834A',
    fontWeight: '500',
  },
  swapButtonActive: {
    borderColor: 'rgba(26,26,24,0.35)',
  },
  swapButtonActiveText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listBottomPad: {
    height: 20,
  },
});
