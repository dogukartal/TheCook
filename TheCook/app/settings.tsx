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
import { useAppTheme } from '@/contexts/ThemeContext';

import { AllergenTagEnum, SkillLevelEnum, EquipmentEnum } from '@/src/types/recipe';
import type { AllergenTag, SkillLevel, Equipment } from '@/src/types/recipe';
import type { Profile } from '@/src/types/profile';

// ---------------------------------------------------------------------------
// Label maps (preserved from original settings.tsx)
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
// Settings sub-screen
// ---------------------------------------------------------------------------

export default function SettingsScreen() {
  const { getProfile, saveProfile } = useProfileDb();
  const { session, signOut } = useSession();
  const { isDark, colors } = useAppTheme();

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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerRow, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Ayarlar</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E8834A" />
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with back button */}
      <View style={[styles.headerRow, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Geri"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ayarlar</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ------------------------------------------------------------------ */}
        {/* Account section */}
        {/* ------------------------------------------------------------------ */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Hesap</Text>
        {session ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
            <View style={styles.accountInfo}>
              <MaterialCommunityIcons name="account-circle" size={40} color="#E8834A" />
              <View style={styles.accountText}>
                <Text style={[styles.accountEmail, { color: colors.text }]} numberOfLines={1}>
                  {session.user.email ?? 'Giriş yapıldı'}
                </Text>
                <Text style={[styles.accountProvider, { color: colors.textSub }]}>
                  {session.user.app_metadata?.provider ?? 'email'}
                </Text>
              </View>
            </View>
            <Pressable
              style={[styles.signOutButton, { backgroundColor: isDark ? 'rgba(232,131,74,0.15)' : '#FEF3EC' }]}
              onPress={signOut}
              accessibilityRole="button"
            >
              <Text style={styles.signOutText}>Çıkış Yap</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
            <View style={styles.accountInfo}>
              <MaterialCommunityIcons name="account-circle-outline" size={40} color={colors.textMuted} />
              <View style={styles.accountText}>
                <Text style={[styles.accountEmail, { color: colors.text }]}>Hesap oluşturulmadı</Text>
                <Text style={[styles.accountProvider, { color: colors.textSub }]}>Tarif geçmişinizi kaydedin</Text>
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
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Alerjenler</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSub }]}>
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
        {/* Skill level chips section */}
        {/* ------------------------------------------------------------------ */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Pişirme Seviyesi</Text>
        <View style={styles.skillOptionList}>
          {ALL_SKILL_LEVELS.map((level) => {
            const isSelected = profile?.skillLevel === level;
            return (
              <Pressable
                key={level}
                style={[
                  styles.skillOptionCard,
                  { backgroundColor: colors.card, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
                  isSelected && { borderColor: '#E8834A', backgroundColor: isDark ? 'rgba(232,131,74,0.15)' : '#FEF3EC' },
                ]}
                onPress={() => selectSkillLevel(level)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
              >
                <View style={styles.skillOptionLeft}>
                  <Text style={[styles.skillOptionLabel, { color: colors.textSub }, isSelected && styles.skillOptionLabelSelected]}>
                    {SKILL_LEVEL_LABELS[level]}
                  </Text>
                  <Text style={[styles.skillOptionDesc, { color: colors.textMuted }, isSelected && styles.skillOptionDescSelected]}>
                    {SKILL_LEVEL_DESCRIPTIONS[level]}
                  </Text>
                </View>
                {isSelected && (
                  <MaterialCommunityIcons name="check-circle" size={20} color="#E8834A" />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ------------------------------------------------------------------ */}
        {/* Equipment grid section */}
        {/* ------------------------------------------------------------------ */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mutfak Ekipmanlarım</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSub }]}>
          Sahip olmadığınız ekipmanı seçimi kaldırın.
        </Text>
        <View style={styles.equipmentGrid}>
          {ALL_EQUIPMENT.map((item) => {
            const isSelected = profile?.equipment.includes(item) ?? false;
            return (
              <Pressable
                key={item}
                style={[
                  styles.equipmentItem,
                  { backgroundColor: colors.card, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
                  isSelected && { borderColor: '#E8834A', backgroundColor: isDark ? 'rgba(232,131,74,0.15)' : '#FEF3EC' },
                ]}
                onPress={() => toggleEquipment(item)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
              >
                <MaterialCommunityIcons
                  name={EQUIPMENT_ICONS[item]}
                  size={28}
                  color={isSelected ? '#D4572A' : colors.textMuted}
                />
                <Text style={[styles.equipmentLabel, { color: colors.textSub }, isSelected && styles.equipmentLabelSelected]}>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A18',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A18',
    marginBottom: 8,
    marginTop: 20,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: 'rgba(26,26,24,0.5)',
    marginBottom: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#F0EDE8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
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
    color: '#1A1A18',
  },
  accountProvider: {
    fontSize: 13,
    color: 'rgba(26,26,24,0.5)',
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
    color: '#E8834A',
    fontSize: 14,
    fontWeight: '600',
  },
  createAccountButton: {
    backgroundColor: '#E8834A',
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
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#F0EDE8',
  },
  skillOptionCardSelected: {
    borderColor: '#E8834A',
    backgroundColor: '#FEF3EC',
  },
  skillOptionLeft: {
    flex: 1,
  },
  skillOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(26,26,24,0.65)',
    marginBottom: 2,
  },
  skillOptionLabelSelected: {
    color: '#92400E',
  },
  skillOptionDesc: {
    fontSize: 12,
    color: 'rgba(26,26,24,0.35)',
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
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#F0EDE8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 6,
  },
  equipmentItemSelected: {
    borderColor: '#E8834A',
    backgroundColor: '#FEF3EC',
  },
  equipmentLabel: {
    fontSize: 11,
    color: 'rgba(26,26,24,0.5)',
    textAlign: 'center',
    fontWeight: '500',
  },
  equipmentLabelSelected: {
    color: '#D4572A',
    fontWeight: '600',
  },
  bottomPad: {
    height: 40,
  },
});
