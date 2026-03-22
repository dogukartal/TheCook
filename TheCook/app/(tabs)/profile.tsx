import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@/contexts/ThemeContext';
import { useProfileDb } from '@/src/db/profile';
import { useSession } from '@/src/auth/useSession';
import { Chip } from '@/components/ui/chip';
import {
  initIAP,
  closeIAP,
  fetchSubscriptions,
  purchaseSubscription,
  setupPurchaseListeners,
  getSubscriptionStatus,
  SUBSCRIPTION_PRODUCT_ID,
} from '@/src/services/iap';

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
// Profile tab screen -- absorbs settings content as a tab
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const { isDark, toggleTheme, colors } = useAppTheme();
  const { getProfile, saveProfile } = useProfileDb();
  const { session, signOut } = useSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [subscriptionPrice, setSubscriptionPrice] = useState<string | null>(null);
  const [iapReady, setIapReady] = useState(false);

  useEffect(() => {
    getProfile()
      .then((p) => setProfile(p))
      .finally(() => setLoading(false));
  }, []);

  // IAP setup
  useEffect(() => {
    initIAP()
      .then(() => {
        console.log('IAP connected, fetching subs...');
        setIapReady(true);
        return fetchSubscriptions();
      })
      .then((subs) => {
        console.log('Subs result:', subs.length, JSON.stringify(subs));
        if (subs.length > 0) {
          const sub = subs[0];
          setSubscriptionPrice(sub.localizedPrice ?? '₺2,99');
        } else {
          console.warn('No subscriptions found for SKUs - Apple may need time to propagate');
        }
      })
      .catch((err) => {
        console.warn('IAP setup error:', err);
      });

    const removePurchaseListeners = setupPurchaseListeners(
      (isPremium) => {
        setPurchasing(false);
        persistProfileChange({ isPremium });
        Alert.alert('Başarılı', 'Premium aboneliğiniz aktif!');
      },
      (error) => {
        setPurchasing(false);
        Alert.alert('Hata', error);
      }
    );

    return () => {
      removePurchaseListeners();
      closeIAP();
    };
  }, []);

  // Check subscription status on mount (for returning users)
  useEffect(() => {
    if (session) {
      getSubscriptionStatus().then(({ isPremium }) => {
        if (profile && profile.isPremium !== isPremium) {
          persistProfileChange({ isPremium });
        }
      });
    }
  }, [session]);

  async function handlePurchase() {
    if (!session) {
      Alert.alert('Giriş Gerekli', 'Abonelik için önce hesabınıza giriş yapın.');
      return;
    }
    if (!iapReady) {
      // IAP henüz hazır değilse tekrar init et
      try {
        await initIAP();
        setIapReady(true);
      } catch (err) {
        Alert.alert('IAP Hatası', 'Mağaza bağlantısı kurulamadı. Lütfen tekrar deneyin.');
        return;
      }
    }
    setPurchasing(true);
    try {
      await purchaseSubscription();
    } catch (err) {
      console.warn('handlePurchase error:', err);
      Alert.alert('Satın Alma Hatası', String(err));
      setPurchasing(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Immediate-save logic -- saves a partial profile update on every toggle
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
  // Theme toggle button component
  // ---------------------------------------------------------------------------

  const themeToggleButton = (
    <Pressable
      onPress={toggleTheme}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: colors.cardBorder,
        borderWidth: 1,
        borderColor: colors.border,
      }}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
    >
      <MaterialCommunityIcons
        name={isDark ? 'white-balance-sunny' : 'moon-waning-crescent'}
        size={13}
        color={colors.text}
      />
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>Tema</Text>
    </Pressable>
  );

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerRow, { backgroundColor: colors.background, borderBottomColor: colors.separator }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profil</Text>
          {themeToggleButton}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header -- tab style (no back arrow) */}
      <View style={[styles.headerRow, { backgroundColor: colors.background, borderBottomColor: colors.separator }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profil</Text>
        {themeToggleButton}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ------------------------------------------------------------------ */}
        {/* Account section */}
        {/* ------------------------------------------------------------------ */}
        <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Hesap</Text>
        {session ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.accountInfo}>
              <MaterialCommunityIcons name="account-circle" size={40} color={colors.tint} />
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
              style={[styles.signOutButton, { backgroundColor: colors.tintBg }]}
              onPress={signOut}
              accessibilityRole="button"
            >
              <Text style={[styles.signOutText, { color: colors.tint }]}>Çıkış Yap</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.accountInfo}>
              <MaterialCommunityIcons name="account-circle-outline" size={40} color={colors.placeholder} />
              <View style={styles.accountText}>
                <Text style={[styles.accountEmail, { color: colors.text }]}>Hesap oluşturulmadı</Text>
                <Text style={[styles.accountProvider, { color: colors.textSub }]}>Tarif geçmişinizi kaydedin</Text>
              </View>
            </View>
            <Pressable
              style={[styles.createAccountButton, { backgroundColor: colors.tint }]}
              onPress={() => router.push('/(auth)/sign-in' as never)}
              accessibilityRole="button"
            >
              <Text style={[styles.createAccountText, { color: colors.onTint }]}>Hesap Oluştur</Text>
            </Pressable>
          </View>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Subscription section */}
        {/* ------------------------------------------------------------------ */}
        <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Abonelik</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {profile?.isPremium ? (
            <View style={styles.accountInfo}>
              <MaterialCommunityIcons name="crown" size={32} color="#F5A623" />
              <View style={styles.accountText}>
                <Text style={[styles.accountEmail, { color: colors.text }]}>Premium Üye</Text>
                <Text style={[styles.accountProvider, { color: colors.textSub }]}>
                  Aboneliğiniz aktif
                </Text>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.accountInfo}>
                <MaterialCommunityIcons name="crown-outline" size={32} color={colors.placeholder} />
                <View style={styles.accountText}>
                  <Text style={[styles.accountEmail, { color: colors.text }]}>Premium'a Geç</Text>
                  <Text style={[styles.accountProvider, { color: colors.textSub }]}>
                    Aylık {subscriptionPrice ?? '₺2,99'}
                  </Text>
                </View>
              </View>
              <Pressable
                style={[styles.createAccountButton, { backgroundColor: '#F5A623' }]}
                onPress={handlePurchase}
                disabled={purchasing}
                accessibilityRole="button"
              >
                {purchasing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.createAccountText, { color: '#fff' }]}>Abone Ol</Text>
                )}
              </Pressable>
            </>
          )}
        </View>

        {/* ------------------------------------------------------------------ */}
        {/* Allergen chips section */}
        {/* ------------------------------------------------------------------ */}
        <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Alerjenler</Text>
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
        {/* Skill level section */}
        {/* ------------------------------------------------------------------ */}
        <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Pişirme Seviyesi</Text>
        <View style={styles.skillOptionList}>
          {ALL_SKILL_LEVELS.map((level) => {
            const isSelected = profile?.skillLevel === level;
            return (
              <Pressable
                key={level}
                style={[
                  styles.skillOptionCard,
                  {
                    backgroundColor: isSelected ? colors.tintBg : colors.card,
                    borderColor: isSelected ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => selectSkillLevel(level)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
              >
                <View style={styles.skillOptionLeft}>
                  <Text style={[
                    styles.skillOptionLabel,
                    { color: isSelected ? colors.tint : colors.textSecondary },
                  ]}>
                    {SKILL_LEVEL_LABELS[level]}
                  </Text>
                  <Text style={[
                    styles.skillOptionDesc,
                    { color: isSelected ? colors.tint : colors.placeholder },
                  ]}>
                    {SKILL_LEVEL_DESCRIPTIONS[level]}
                  </Text>
                </View>
                {isSelected && (
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.tint} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ------------------------------------------------------------------ */}
        {/* Equipment grid section */}
        {/* ------------------------------------------------------------------ */}
        <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Mutfak Ekipmanlarım</Text>
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
                  {
                    backgroundColor: isSelected ? colors.tintBg : colors.card,
                    borderColor: isSelected ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => toggleEquipment(item)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
              >
                <MaterialCommunityIcons
                  name={EQUIPMENT_ICONS[item]}
                  size={28}
                  color={isSelected ? colors.tint : colors.placeholder}
                />
                <Text style={[styles.equipmentLabel, { color: isSelected ? colors.tint : colors.textSub }]}>
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1,
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
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
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
  },
  accountProvider: {
    fontSize: 13,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  signOutButton: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  createAccountButton: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  createAccountText: {
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
    borderRadius: 16,
    borderWidth: 1.5,
  },
  skillOptionLeft: {
    flex: 1,
  },
  skillOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  skillOptionDesc: {
    fontSize: 12,
    lineHeight: 16,
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
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 6,
  },
  equipmentLabel: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomPad: {
    height: 40,
  },
});
