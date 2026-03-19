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
import { Chip } from '@/components/ui/chip';
import { useProfileDb } from '@/src/db/profile';
import { useAppTheme } from '@/contexts/ThemeContext';
import { AllergenTagEnum } from '@/src/types/recipe';
import type { AllergenTag } from '@/src/types/recipe';

const ALL_ALLERGENS = AllergenTagEnum.options as AllergenTag[];

// Human-readable labels for allergens
const ALLERGEN_LABELS: Record<AllergenTag, string> = {
  gluten: 'Gluten',
  dairy: 'Dairy',
  egg: 'Egg',
  nuts: 'Nuts',
  peanuts: 'Peanuts',
  shellfish: 'Shellfish',
  fish: 'Fish',
  soy: 'Soy',
  sesame: 'Sesame',
  mustard: 'Mustard',
  celery: 'Celery',
  lupin: 'Lupin',
  molluscs: 'Molluscs',
  sulphites: 'Sulphites',
};

export default function AllergensScreen() {
  const router = useRouter();
  const { getProfile, saveProfile } = useProfileDb();
  const { isDark, colors } = useAppTheme();
  const [selected, setSelected] = useState<AllergenTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load existing allergens — used when revisiting from Settings
    // Safety: on first visit, allergens default to [] so nothing will be pre-selected
    getProfile()
      .then((profile) => setSelected(profile.allergens))
      .finally(() => setLoading(false));
  }, []);

  function toggleAllergen(allergen: AllergenTag) {
    setSelected((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen]
    );
  }

  async function handleContinue() {
    await saveProfile({ allergens: selected });
    router.push('/onboarding/skill-level');
  }

  function handleSkip() {
    router.push('/onboarding/skill-level');
  }

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#E8834A" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.step, { color: colors.textMuted }]}>Step 1 of 3</Text>
        <Text style={[styles.title, { color: colors.text }]}>Do you have any food allergies?</Text>
        <Text style={[styles.subtitle, { color: colors.textSub }]}>
          Select all that apply. This helps us keep unsafe recipes out of your feed.
        </Text>

        <View style={styles.chipGrid}>
          {ALL_ALLERGENS.map((allergen) => (
            <Chip
              key={allergen}
              label={ALLERGEN_LABELS[allergen]}
              selected={selected.includes(allergen)}
              onPress={() => toggleAllergen(allergen)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueText}>Continue</Text>
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
    backgroundColor: '#FFFFFF',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 24,
  },
  step: {
    fontSize: 13,
    color: 'rgba(26,26,24,0.35)',
    fontWeight: '500',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A18',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(26,26,24,0.5)',
    lineHeight: 22,
    marginBottom: 28,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: '#E8834A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    color: 'rgba(26,26,24,0.35)',
  },
});
