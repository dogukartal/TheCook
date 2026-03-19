import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProfileDb } from '@/src/db/profile';
import { useAppTheme } from '@/contexts/ThemeContext';
import { EquipmentEnum } from '@/src/types/recipe';
import type { Equipment } from '@/src/types/recipe';

const ALL_EQUIPMENT = EquipmentEnum.options as Equipment[];

// Default pre-selected equipment per CONTEXT.md — oven + stovetop
const DEFAULT_EQUIPMENT: Equipment[] = ['fırın', 'tava'];

const EQUIPMENT_LABELS: Record<Equipment, string> = {
  'fırın': 'Oven',
  'blender': 'Blender',
  'döküm tava': 'Cast Iron',
  'stand mixer': 'Stand Mixer',
  'wok': 'Wok',
  'su ısıtıcı': 'Kettle',
  'çırpıcı': 'Whisk',
  'tencere': 'Pot',
  'tava': 'Pan',
  'mikser': 'Hand Mixer',
  'rende': 'Grater',
  'bıçak seti': 'Knife Set',
  'kesme tahtası': 'Cutting Board',
};

type MCIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const EQUIPMENT_ICONS: Record<Equipment, MCIconName> = {
  'fırın': 'stove',
  'blender': 'blender',
  'döküm tava': 'pot',
  'stand mixer': 'chef-hat',
  'wok': 'pot-steam',
  'su ısıtıcı': 'kettle',
  'çırpıcı': 'silverware-fork-knife',
  'tencere': 'pot-steam-outline',
  'tava': 'pan',
  'mikser': 'silverware-variant',
  'rende': 'silverware-clean',
  'bıçak seti': 'knife',
  'kesme tahtası': 'silverware',
};

export default function EquipmentScreen() {
  const router = useRouter();
  const { getProfile, saveProfile } = useProfileDb();
  const { isDark, colors } = useAppTheme();
  const [selected, setSelected] = useState<Equipment[]>(DEFAULT_EQUIPMENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load existing equipment — on first visit defaults to ['fırın','tava'] from DB
    // On revisit from Settings, will load saved preferences
    getProfile()
      .then((profile) => setSelected(profile.equipment))
      .finally(() => setLoading(false));
  }, []);

  function toggleEquipment(item: Equipment) {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  }

  async function handleContinue() {
    await saveProfile({ equipment: selected, onboardingCompleted: true });
    router.push('/onboarding/account-nudge');
  }

  function handleSkip() {
    // Skip path: still navigate to account-nudge
    // onboardingCompleted will be written there on mount
    router.push('/onboarding/account-nudge');
  }

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.step, { color: colors.textMuted }]}>Step 3 of 3</Text>
        <Text style={[styles.title, { color: colors.text }]}>What's in your kitchen?</Text>
        <Text style={[styles.subtitle, { color: colors.textSub }]}>
          Deselect equipment you don't have. We'll only show recipes you can actually make.
        </Text>

        <View style={styles.grid}>
          {ALL_EQUIPMENT.map((item) => {
            const isSelected = selected.includes(item);
            return (
              <Pressable
                key={item}
                style={[
                  styles.gridItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isSelected && { borderColor: colors.tint, backgroundColor: colors.tintBg },
                ]}
                onPress={() => toggleEquipment(item)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
              >
                <MaterialCommunityIcons
                  name={EQUIPMENT_ICONS[item]}
                  size={28}
                  color={isSelected ? colors.tint : colors.textMuted}
                />
                <Text style={[styles.itemLabel, { color: colors.textSub }, isSelected && { color: colors.tint, fontWeight: '600' }]}>
                  {EQUIPMENT_LABELS[item]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable style={[styles.continueButton, { backgroundColor: colors.tint }]} onPress={handleContinue}>
          <Text style={[styles.continueText, { color: colors.onTint }]}>Continue</Text>
        </Pressable>
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 24,
  },
  step: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 6,
  },
  itemLabel: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
  },
  continueButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
  },
});
