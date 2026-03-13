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
}: IngredientsSheetProps) {
  // Flatten all ingredients with their group labels
  type FlatItem =
    | { type: 'header'; label: string }
    | { type: 'ingredient'; flatIndex: number; text: string };

  const flatItems: FlatItem[] = [];
  let flatIndex = 0;

  for (const group of ingredientGroups) {
    if (group.label) {
      flatItems.push({ type: 'header', label: group.label });
    }
    for (const item of group.items) {
      const text = `${item.amount} ${item.unit} ${item.name}${item.optional ? ' (opsiyonel)' : ''}`;
      flatItems.push({ type: 'ingredient', flatIndex, text });
      flatIndex++;
    }
  }

  function handleSwap() {
    Alert.alert(
      'Yakin zamanda!',
      'Bu ozellik cok yakinda geliyor.',
      [{ text: 'Tamam' }]
    );
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
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Malzemeler</Text>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
            >
              <MaterialCommunityIcons name="close" size={24} color="#374151" />
            </Pressable>
          </View>

          {/* Ingredient list */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {flatItems.map((item, idx) => {
              if (item.type === 'header') {
                return (
                  <Text key={`h-${idx}`} style={styles.groupLabel}>
                    {item.label}
                  </Text>
                );
              }

              const checked = checkedIndices.includes(item.flatIndex);

              return (
                <View key={`i-${item.flatIndex}`} style={styles.ingredientRow}>
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
                      color={checked ? '#9CA3AF' : '#E07B39'}
                    />
                  </Pressable>

                  {/* Ingredient text */}
                  <Text
                    style={[
                      styles.ingredientText,
                      checked && styles.ingredientTextChecked,
                    ]}
                    numberOfLines={2}
                  >
                    {item.text}
                  </Text>

                  {/* Swap button */}
                  <Pressable
                    onPress={handleSwap}
                    style={styles.swapButton}
                    accessibilityRole="button"
                    accessibilityLabel="Degistir"
                  >
                    <Text style={styles.swapButtonText}>Degistir</Text>
                  </Pressable>
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  checkbox: {
    marginRight: 10,
  },
  ingredientText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  ingredientTextChecked: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  swapButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
  },
  swapButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  listBottomPad: {
    height: 20,
  },
});
