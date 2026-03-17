import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { SkillLevel } from '../../types/recipe';

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
  if (!visible) return null;

  const toggleEquipment = (item: string) => {
    if (equipmentFilter.includes(item)) {
      onEquipmentChange(equipmentFilter.filter((e) => e !== item));
    } else {
      onEquipmentChange([...equipmentFilter, item]);
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Skill level section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seviye</Text>
        <View style={styles.chipRow}>
          {SKILL_OPTIONS.map((opt) => {
            const isActive = skillFilter === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => onSkillChange(isActive ? null : opt.key)}
                style={[styles.chip, isActive && styles.chipActive]}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
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
          <Text style={styles.sectionTitle}>Ekipman</Text>
          <View style={styles.chipRow}>
            {userEquipment.map((item) => {
              const isActive = equipmentFilter.includes(item);
              return (
                <Pressable
                  key={item}
                  onPress={() => toggleEquipment(item)}
                  style={[styles.chip, isActive && styles.chipActive]}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
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
    borderBottomColor: '#E5E7EB',
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
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
    backgroundColor: '#F3F4F6',
  },
  chipActive: {
    backgroundColor: '#E07B39',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
