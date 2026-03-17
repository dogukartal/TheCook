import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useProfileDb } from '@/src/db/profile';
import { useSession } from '@/src/auth/useSession';
import { Chip } from '@/components/ui/chip';

import { AllergenTagEnum, SkillLevelEnum, EquipmentEnum } from '@/src/types/recipe';
import type { AllergenTag, SkillLevel, Equipment } from '@/src/types/recipe';
import type { Profile } from '@/src/types/profile';

// ---------------------------------------------------------------------------
// Label maps (from settings.tsx)
// ---------------------------------------------------------------------------

const ALL_ALLERGENS = AllergenTagEnum.options as AllergenTag[];
const ALL_SKILL_LEVELS = SkillLevelEnum.options as SkillLevel[];
const ALL_EQUIPMENT = EquipmentEnum.options as Equipment[];

const ALLERGEN_LABELS: Record<AllergenTag, string> = {
  gluten: 'Gluten',
  dairy: 'Süt Ürünleri',
  egg: 'Yumurta',
  nuts: 'Kuruyemiş',
  peanuts: 'Fıstık',
  shellfish: 'Kabuklu Deniz Ürünleri',
  fish: 'Balık',
  soy: 'Soya',
  sesame: 'Susam',
  mustard: 'Hardal',
  celery: 'Kereviz',
  lupin: 'Acı Bakla',
  molluscs: 'Yumuşakça',
  sulphites: 'Sülfitler',
};

const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};

const SKILL_LEVEL_DESCRIPTIONS: Record<SkillLevel, string> = {
  beginner: 'Basit tarifleri tercih ederim',
  intermediate: 'Çoğu tekniği uygulayabilirim',
  advanced: 'Karmaşık yemeklerden keyif alırım',
};

const EQUIPMENT_LABELS: Record<Equipment, string> = {
  'fırın': 'Fırın',
  'blender': 'Blender',
  'döküm tava': 'Döküm Tava',
  'stand mixer': 'Hamur Makinesi',
  'wok': 'Wok',
  'su ısıtıcı': 'Su Isıtıcı',
  'çırpıcı': 'Çırpıcı',
  'tencere': 'Tencere',
  'tava': 'Tava',
  'mikser': 'El Mikseri',
  'rende': 'Rende',
  'bıçak seti': 'Bıçak Seti',
  'kesme tahtası': 'Kesme Tahtası',
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

// ---------------------------------------------------------------------------
// Profile tab screen — absorbs settings content as a tab
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const { getProfile, saveProfile } = useProfileDb();
  const { session, signOut } = useSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile()
      .then((p) => setProfile(p))
      .finally(() => setLoading(false));
  }, []);

  // ---------------------------------------------------------------------------
  // Immediate-save logic — saves a partial profile update on every toggle
  // ---------------------------------------------------------------------------

  const persistProfileChange = useCallback(
    async (changes: Partial<Profile>) => {
      await saveProfile(changes);
      setProfile((prev) => (prev ? { ...prev, ...changes } : prev));
    },
    [saveProfile]
  );

  function toggleAllergen(allergen: AllergenTag) {
    if (!profile) return;
    const next = profile.allergens.includes(allergen)
      ? profile.allergens.filter((a) => a !== allergen)
      : [...profile.allergens, allergen];
    persistProfileChange({ allergens: next });
  }

  function selectSkillLevel(level: SkillLevel) {
    if (!profile) return;
    persistProfileChange({ skillLevel: level });
  }

  function toggleEquipment(item: Equipment) {
    if (!profile) return;
    const next = profile.equipment.includes(item)
      ? profile.equipment.filter((e) => e !== item)
      : [...profile.equipment, item];
    persistProfileChange({ equipment: next });
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E07B39" />
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      {/* Header — tab style (no back arrow) */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ------------------------------------------------------------------ */}
        {/* Account section */}
        {/* ------------------------------------------------------------------ */}
        <Text style={styles.sectionTitle}>Hesap</Text>
        {session ? (
          <View style={styles.card}>
            <View style={styles.accountInfo}>
              <MaterialCommunityIcons name="account-circle" size={40} color="#E07B39" />
              <View style={styles.accountText}>
                <Text style={styles.accountEmail} numberOfLines={1}>
                  {session.user.email ?? 'Giriş yapıldı'}
                </Text>
                <Text style={styles.accountProvider}>
                  {session.user.app_metadata?.provider ?? 'email'}
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.signOutButton}
              onPress={signOut}
              accessibilityRole="button"
            >
              <Text style={styles.signOutText}>Çıkış Yap</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.accountInfo}>
              <MaterialCommunityIcons name="account-circle-outline" size={40} color="#9CA3AF" />
              <View style={styles.accountText}>
                <Text style={styles.accountEmail}>Hesap oluşturulmadı</Text>
                <Text style={styles.accountProvider}>Tarif geçmişinizi kaydedin</Text>
              </View>
            </View>
            <Pressable
              style={styles.createAccountButton}
              onPress={() => router.push('/(auth)/sign-in' as never)}
              accessibilityRole="button"
            >
              <Text style={styles.createAccountText}>Hesap Oluştur</Text>
            </Pressable>
          </View>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Allergen chips section */}
        {/* ------------------------------------------------------------------ */}
        <Text style={styles.sectionTitle}>Alerjenler</Text>
        <Text style={styles.sectionSubtitle}>
          Seçili alerjenler içeren tarifler görünmez.
        </Text>
        <View style={styles.chipGrid}>
          {ALL_ALLERGENS.map((allergen) => (
            <Chip
              key={allergen}
              label={ALLERGEN_LABELS[allergen]}
              selected={profile?.allergens.includes(allergen) ?? false}
              onPress={() => toggleAllergen(allergen)}
            />
          ))}
        </View>

        {/* ------------------------------------------------------------------ */}
        {/* Skill level section */}
        {/* ------------------------------------------------------------------ */}
        <Text style={styles.sectionTitle}>Pişirme Seviyesi</Text>
        <View style={styles.skillOptionList}>
          {ALL_SKILL_LEVELS.map((level) => {
            const isSelected = profile?.skillLevel === level;
            return (
              <Pressable
                key={level}
                style={[styles.skillOptionCard, isSelected && styles.skillOptionCardSelected]}
                onPress={() => selectSkillLevel(level)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
              >
                <View style={styles.skillOptionLeft}>
                  <Text style={[styles.skillOptionLabel, isSelected && styles.skillOptionLabelSelected]}>
                    {SKILL_LEVEL_LABELS[level]}
                  </Text>
                  <Text style={[styles.skillOptionDesc, isSelected && styles.skillOptionDescSelected]}>
                    {SKILL_LEVEL_DESCRIPTIONS[level]}
                  </Text>
                </View>
                {isSelected && (
                  <MaterialCommunityIcons name="check-circle" size={20} color="#E07B39" />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ------------------------------------------------------------------ */}
        {/* Equipment grid section */}
        {/* ------------------------------------------------------------------ */}
        <Text style={styles.sectionTitle}>Mutfak Ekipmanlarım</Text>
        <Text style={styles.sectionSubtitle}>
          Sahip olmadığınız ekipmanı seçimi kaldırın.
        </Text>
        <View style={styles.equipmentGrid}>
          {ALL_EQUIPMENT.map((item) => {
            const isSelected = profile?.equipment.includes(item) ?? false;
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
                  size={28}
                  color={isSelected ? '#C05F20' : '#9CA3AF'}
                />
                <Text style={[styles.equipmentLabel, isSelected && styles.equipmentLabelSelected]}>
                  {EQUIPMENT_LABELS[item]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    marginTop: 20,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 4,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountText: {
    flex: 1,
    marginLeft: 12,
  },
  accountEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  accountProvider: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  signOutButton: {
    backgroundColor: '#FEF3EC',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  signOutText: {
    color: '#E07B39',
    fontSize: 14,
    fontWeight: '600',
  },
  createAccountButton: {
    backgroundColor: '#E07B39',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  createAccountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  skillOptionList: {
    gap: 10,
    marginBottom: 4,
  },
  skillOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  skillOptionCardSelected: {
    borderColor: '#E07B39',
    backgroundColor: '#FEF3EC',
  },
  skillOptionLeft: {
    flex: 1,
  },
  skillOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  skillOptionLabelSelected: {
    color: '#92400E',
  },
  skillOptionDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  skillOptionDescSelected: {
    color: '#B45309',
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
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
  bottomPad: {
    height: 40,
  },
});
