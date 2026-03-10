import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Chip } from '@/components/ui/chip';
import { useProfileDb } from '@/src/db/profile';
import { useSession } from '@/src/auth/useSession';
import { supabase } from '@/src/auth/supabase';
import { AllergenTagEnum } from '@/src/types/recipe';
import { SkillLevelEnum } from '@/src/types/recipe';
import { EquipmentEnum } from '@/src/types/recipe';
import type { AllergenTag, SkillLevel, Equipment } from '@/src/types/recipe';
import type { Profile } from '@/src/types/profile';

const ALL_ALLERGENS = AllergenTagEnum.options as AllergenTag[];
const ALL_SKILL_LEVELS = SkillLevelEnum.options as SkillLevel[];
const ALL_EQUIPMENT = EquipmentEnum.options as Equipment[];

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

const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

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

function getAccountLabel(session: { user: { email?: string; app_metadata?: { provider?: string } } } | null): string {
  if (!session) return '';
  const provider = session.user.app_metadata?.provider;
  if (provider === 'apple') return 'Apple Account';
  if (provider === 'google') return 'Google Account';
  return session.user.email ?? 'Signed in';
}

export default function SettingsScreen() {
  const { getProfile, saveProfile } = useProfileDb();
  const { session, signOut } = useSession();

  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const [allergens, setAllergens] = useState<AllergenTag[]>([]);
  const [skillLevel, setSkillLevel] = useState<SkillLevel | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  // Load current profile on mount
  useEffect(() => {
    getProfile()
      .then((profile) => {
        setAllergens(profile.allergens);
        setSkillLevel(profile.skillLevel);
        setEquipment(profile.equipment);
      })
      .finally(() => setLoading(false));
  }, []);

  // Persist a profile change locally + push to Supabase if signed in
  const persistProfileChange = useCallback(
    async (update: Partial<Profile>) => {
      await saveProfile(update);
      if (session) {
        await supabase.from('profiles').upsert({
          id: session.user.id,
          ...(update.allergens !== undefined && { allergens: update.allergens }),
          ...(update.skillLevel !== undefined && { skill_level: update.skillLevel }),
          ...(update.equipment !== undefined && { equipment: update.equipment }),
          updated_at: new Date().toISOString(),
        });
      }
    },
    [session, saveProfile]
  );

  // Allergen toggle — save immediately on each change
  async function toggleAllergen(allergen: AllergenTag) {
    const updated = allergens.includes(allergen)
      ? allergens.filter((a) => a !== allergen)
      : [...allergens, allergen];
    setAllergens(updated);
    await persistProfileChange({ allergens: updated });
  }

  // Skill level change — save immediately
  async function changeSkillLevel(level: SkillLevel) {
    setSkillLevel(level);
    await persistProfileChange({ skillLevel: level });
  }

  // Equipment toggle — save immediately on each change
  async function toggleEquipment(item: Equipment) {
    const updated = equipment.includes(item)
      ? equipment.filter((e) => e !== item)
      : [...equipment, item];
    setEquipment(updated);
    await persistProfileChange({ equipment: updated });
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E07B39" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.screenTitle}>Settings</Text>

      {/* ── Account Section ─────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        {session ? (
          <View style={styles.accountCard}>
            <Text style={styles.accountLabel}>Signed in as</Text>
            <Text style={styles.accountValue}>{getAccountLabel(session)}</Text>
            <Pressable
              style={[styles.signOutButton, signingOut && styles.signOutButtonDisabled]}
              onPress={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.signOutText}>Sign Out</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.accountCard}>
            <Text style={styles.noAccountText}>Not signed in</Text>
            <Text style={styles.noAccountSubtext}>
              Your recipes and preferences are saved locally.
            </Text>
            <Link href="/(auth)/sign-in" asChild>
              <Pressable style={styles.createAccountButton}>
                <Text style={styles.createAccountText}>Create an account</Text>
              </Pressable>
            </Link>
          </View>
        )}
      </View>

      {/* ── Allergens Section ────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Allergens</Text>
        <Text style={styles.sectionSubtitle}>
          Recipes containing these ingredients will be filtered out.
        </Text>
        <View style={styles.chipGrid}>
          {ALL_ALLERGENS.map((allergen) => (
            <Chip
              key={allergen}
              label={ALLERGEN_LABELS[allergen]}
              selected={allergens.includes(allergen)}
              onPress={() => toggleAllergen(allergen)}
            />
          ))}
        </View>
      </View>

      {/* ── Skill Level Section ──────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skill Level</Text>
        <Text style={styles.sectionSubtitle}>
          We use this to tailor recipe difficulty suggestions.
        </Text>
        <View style={styles.chipRow}>
          {ALL_SKILL_LEVELS.map((level) => (
            <Chip
              key={level}
              label={SKILL_LEVEL_LABELS[level]}
              selected={skillLevel === level}
              onPress={() => changeSkillLevel(level)}
            />
          ))}
        </View>
      </View>

      {/* ── Equipment Section ────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kitchen Equipment</Text>
        <Text style={styles.sectionSubtitle}>
          Deselect equipment you don't have. We'll only show recipes you can make.
        </Text>
        <View style={styles.equipmentGrid}>
          {ALL_EQUIPMENT.map((item) => {
            const isSelected = equipment.includes(item);
            return (
              <Pressable
                key={item}
                style={[styles.equipmentItem, isSelected && styles.equipmentItemSelected]}
                onPress={() => toggleEquipment(item)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
              >
                <MaterialCommunityIcons
                  name={EQUIPMENT_ICONS[item]}
                  size={26}
                  color={isSelected ? '#C05F20' : '#9CA3AF'}
                />
                <Text style={[styles.equipmentLabel, isSelected && styles.equipmentLabelSelected]}>
                  {EQUIPMENT_LABELS[item]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 48,
  },
  screenTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 32,
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 14,
  },
  // Account card
  accountCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    padding: 16,
    gap: 8,
  },
  accountLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  accountValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 4,
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noAccountText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  noAccountSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  createAccountButton: {
    backgroundColor: '#E07B39',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  createAccountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Allergen chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  // Skill level chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  // Equipment grid
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  equipmentItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 6,
  },
  equipmentItemSelected: {
    borderColor: '#E07B39',
    backgroundColor: '#FEF3EC',
  },
  equipmentLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  equipmentLabelSelected: {
    color: '#C05F20',
    fontWeight: '600',
  },
});
