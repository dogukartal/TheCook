import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProfileDb } from '@/src/db/profile';
import { useAppTheme } from '@/contexts/ThemeContext';

export default function AccountNudgeScreen() {
  const router = useRouter();
  const { saveProfile } = useProfileDb();
  const { isDark, colors } = useAppTheme();

  useEffect(() => {
    // Mark this nudge as shown and onboarding as complete on mount.
    // This fires regardless of which action the user takes (create account or skip),
    // ensuring the nudge never appears again and onboarding is always marked done
    // even when the user skipped all 3 steps.
    saveProfile({ accountNudgeShown: true, onboardingCompleted: true });
  }, []);

  function handleCreateAccount() {
    router.push('/(auth)/sign-in');
  }

  function handleNotNow() {
    router.replace('/(tabs)');
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.tintBg }]}>
          <MaterialCommunityIcons name="cloud-sync-outline" size={64} color={colors.tint} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Your profile is saved.</Text>
        <Text style={[styles.body, { color: colors.textSub }]}>
          Create a free account to sync your preferences, bookmarks, and cooking history across all your devices.
        </Text>

        <View style={styles.benefitList}>
          <BenefitRow icon="bookmark-multiple-outline" text="Keep your saved recipes anywhere" colors={colors} />
          <BenefitRow icon="sync" text="Sync profile changes instantly" colors={colors} />
          <BenefitRow icon="shield-check-outline" text="Your data stays private" colors={colors} />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable style={[styles.createButton, { backgroundColor: colors.tint }]} onPress={handleCreateAccount}>
          <Text style={[styles.createText, { color: colors.onTint }]}>Create free account</Text>
        </Pressable>
        <Pressable style={styles.skipButton} onPress={handleNotNow}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>Not now</Text>
        </Pressable>
      </View>
    </View>
  );
}

function BenefitRow({ icon, text, colors }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; text: string; colors: any }) {
  return (
    <View style={styles.benefitRow}>
      <MaterialCommunityIcons name={icon} size={20} color={colors.tint} />
      <Text style={[styles.benefitText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 36,
  },
  benefitList: {
    alignSelf: 'stretch',
    gap: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 12,
  },
  createButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createText: {
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
