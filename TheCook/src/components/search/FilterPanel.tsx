import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { SkillLevel } from '../../types/recipe';
import { useAppTheme } from '@/contexts/ThemeContext';

// ---------------------------------------------------------------------------
// Skill level labels (Turkish)
// ---------------------------------------------------------------------------

const SKILL_OPTIONS: { key: SkillLevel; label: string }[] = [
  { key: 'beginner', label: 'Başlangıç' },
  { key: 'intermediate', label: 'Orta' },
  { key: 'advanced', label: 'İleri' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FilterPanelProps {
  visible: boolean;
  skillFilter: SkillLevel | null;
  equipmentFilter: string[];
  userEquipment: string[];
  onSkillChange: (skill: SkillLevel | null) => void;
  onEquipmentChange: (equipment: string[]) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FilterPanel({
  visible,
  skillFilter,
  equipmentFilter,
  userEquipment,
  onSkillChange,
  onEquipmentChange,
}: FilterPanelProps) {
  const { isDark, colors } = useAppTheme();

  if (!visible) return null;

  const toggleEquipment = (item: string) => {
    if (equipmentFilter.includes(item)) {
      onEquipmentChange(equipmentFilter.filter((e) => e !== item));
    } else {
      onEquipmentChange([...equipmentFilter, item]);
    }
  };

  return (
    <View style={[styles.wrapper, { borderBottomColor: colors.border }]}>
      {/* Skill level section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Seviye</Text>
        <View style={styles.chipRow}>
          {SKILL_OPTIONS.map((opt) => {
            const isActive = skillFilter === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => onSkillChange(isActive ? null : opt.key)}
                style={[
                  styles.chip,
                  { backgroundColor: colors.card },
                  isActive && { backgroundColor: colors.tint },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: colors.textSecondary },
                    isActive && { color: colors.onTint },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Equipment section */}
      {userEquipment.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Ekipman</Text>
          <View style={styles.chipRow}>
            {userEquipment.map((item) => {
              const isActive = equipmentFilter.includes(item);
              return (
                <Pressable
                  key={item}
                  onPress={() => toggleEquipment(item)}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.card },
                    isActive && { backgroundColor: colors.tint },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: colors.textSecondary },
                      isActive && { color: colors.onTint },
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
