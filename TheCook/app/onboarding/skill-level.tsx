import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Chip } from '@/components/ui/chip';
import { useProfileDb } from '@/src/db/profile';
import { useAppTheme } from '@/contexts/ThemeContext';
import { SkillLevelEnum } from '@/src/types/recipe';
import type { SkillLevel } from '@/src/types/recipe';

const ALL_SKILL_LEVELS = SkillLevelEnum.options as SkillLevel[];

const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const SKILL_LEVEL_DESCRIPTIONS: Record<SkillLevel, string> = {
  beginner: 'New to cooking or prefer simple recipes',
  intermediate: 'Comfortable with most techniques',
  advanced: 'Love a challenge and complex dishes',
};

export default function SkillLevelScreen() {
  const router = useRouter();
  const { getProfile, saveProfile } = useProfileDb();
  const { isDark, colors } = useAppTheme();
  const [selected, setSelected] = useState<SkillLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load existing skill level — used when revisiting from Settings
    // Default is null so nothing pre-selected on first visit
    getProfile()
      .then((profile) => setSelected(profile.skillLevel))
      .finally(() => setLoading(false));
  }, []);

  async function handleContinue() {
    await saveProfile({ skillLevel: selected });
    router.push('/onboarding/equipment');
  }

  function handleSkip() {
    router.push('/onboarding/equipment');
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
      <View style={styles.content}>
        <Text style={[styles.step, { color: colors.textMuted }]}>Step 2 of 3</Text>
        <Text style={[styles.title, { color: colors.text }]}>What's your cooking experience?</Text>
        <Text style={[styles.subtitle, { color: colors.textSub }]}>
          We'll tailor recipe difficulty to match your confidence in the kitchen.
        </Text>

        <View style={styles.optionList}>
          {ALL_SKILL_LEVELS.map((level) => {
            const isSelected = selected === level;
            return (
              <Pressable
                key={level}
                style={[
                  styles.optionCard,
                  { backgroundColor: colors.card, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
                  isSelected && { borderColor: '#E8834A', backgroundColor: isDark ? 'rgba(232,131,74,0.15)' : '#FEF3EC' },
                ]}
                onPress={() => setSelected(level)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
              >
                <Chip
                  label={SKILL_LEVEL_LABELS[level]}
                  selected={isSelected}
                  onPress={() => setSelected(level)}
                  style={styles.levelChip}
                />
                <Text style={[styles.description, { color: colors.textSub }, isSelected && styles.descriptionSelected]}>
                  {SKILL_LEVEL_DESCRIPTIONS[level]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
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
    marginBottom: 36,
  },
  optionList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#F0EDE8',
    gap: 12,
  },
  optionCardSelected: {
    borderColor: '#E8834A',
    backgroundColor: '#FEF3EC',
  },
  levelChip: {
    margin: 0,
  },
  description: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(26,26,24,0.5)',
    lineHeight: 18,
  },
  descriptionSelected: {
    color: '#92400E',
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
