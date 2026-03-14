import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';

import { useProfileDb } from '@/src/db/profile';
import { useRecipesDb } from '@/src/db/recipes';
import { useSession } from '@/src/auth/useSession';
import { RecipeCardGrid } from '@/components/ui/recipe-card-grid';
import { SkeletonCard } from '@/components/ui/skeleton-card';

import type { Profile } from '@/src/types/profile';
import type { RecipeListItem } from '@/src/types/discovery';

// ---------------------------------------------------------------------------
// Label maps (mirrors what was in settings.tsx before deletion)
// ---------------------------------------------------------------------------

const ALLERGEN_LABELS: Record<string, string> = {
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

const SKILL_LEVEL_LABELS: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};

// ---------------------------------------------------------------------------
// My Kitchen screen
// ---------------------------------------------------------------------------

export default function MyKitchenScreen() {
  const db = useSQLiteContext();
  const { getProfile, getBookmarks, addBookmark, removeBookmark } = useProfileDb();
  const { getAllRecipesForFeed } = useRecipesDb();
  const { session, signOut } = useSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [savedRecipes, setSavedRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load profile + bookmarks + recipe data for bookmarks
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, bookmarks] = await Promise.all([getProfile(), getBookmarks()]);
      setProfile(p);

      const ids = bookmarks.map((b) => b.recipeId);
      setBookmarkedIds(new Set(ids));

      if (ids.length === 0) {
        setSavedRecipes([]);
        return;
      }

      // Batch SELECT for bookmark recipe list items
      const placeholders = ids.map(() => '?').join(', ');
      const rows = await db.getAllAsync<{
        id: string;
        title: string;
        cuisine: string;
        category: string;
        skill_level: string | null;
        prep_time: number;
        cook_time: number;
        cover_image: string | null;
        allergens: string;
        equipment: string;
      }>(
        `SELECT id, title, cuisine, category, skill_level, prep_time, cook_time, cover_image, allergens, equipment
         FROM recipes WHERE id IN (${placeholders})`,
        ids
      );

      // Preserve bookmark order (most recently saved first)
      const rowMap = new Map(rows.map((r) => [r.id, r]));
      const ordered: RecipeListItem[] = ids
        .map((id) => rowMap.get(id))
        .filter((r): r is NonNullable<typeof r> => r !== undefined)
        .map((row) => ({
          id: row.id,
          title: row.title,
          cuisine: row.cuisine,
          category: row.category as RecipeListItem['category'],
          skillLevel: (row.skill_level ?? 'beginner') as RecipeListItem['skillLevel'],
          prepTime: row.prep_time,
          cookTime: row.cook_time,
          coverImage: row.cover_image ?? null,
          allergens: JSON.parse(row.allergens ?? '[]'),
          equipment: JSON.parse(row.equipment ?? '[]'),
        }));

      setSavedRecipes(ordered);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Bookmark toggle
  async function handleBookmarkToggle(id: string) {
    if (bookmarkedIds.has(id)) {
      await removeBookmark(id);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setSavedRecipes((prev) => prev.filter((r) => r.id !== id));
    } else {
      await addBookmark(id, session?.user.id ?? null);
      setBookmarkedIds((prev) => new Set([...prev, id]));
      // Reload to get recipe data
      loadData();
    }
  }

  function handleRecipePress(id: string) {
    router.push(`/recipe/${id}` as never);
  }

  function handleSettingsPress() {
    router.push('/settings' as never);
  }

  // ---------------------------------------------------------------------------
  // Profile summary row
  // ---------------------------------------------------------------------------

  function buildProfileSummary(): string {
    if (!profile) return '';
    const parts: string[] = [];
    if (profile.skillLevel) {
      parts.push(SKILL_LEVEL_LABELS[profile.skillLevel] ?? profile.skillLevel);
    }
    if (profile.allergens.length > 0) {
      parts.push(`${profile.allergens.length} allerjen`);
    }
    if (profile.equipment.length > 0) {
      parts.push(`${profile.equipment.length} ekipman`);
    }
    return parts.join(' • ');
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} stickyHeaderIndices={[0]}>
        {/* ------------------------------------------------------------------ */}
        {/* Header row */}
        {/* ------------------------------------------------------------------ */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Mutfağım</Text>
          <Pressable
            onPress={handleSettingsPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Ayarlar"
          >
            <MaterialCommunityIcons name="cog" size={24} color="#6B7280" />
          </Pressable>
        </View>

        {/* ------------------------------------------------------------------ */}
        {/* Account card */}
        {/* ------------------------------------------------------------------ */}
        {session ? (
          <View style={styles.accountCard}>
            <View style={styles.accountInfo}>
              <MaterialCommunityIcons name="account-circle" size={40} color="#E07B39" />
              <View style={styles.accountText}>
                <Text style={styles.accountEmail} numberOfLines={1}>
                  {session.user.email ?? 'Giriş yapıldı'}
                </Text>
                <Text style={styles.accountSubtext}>Hesap aktif</Text>
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
          <View style={styles.accountCard}>
            <View style={styles.accountInfo}>
              <MaterialCommunityIcons name="account-circle-outline" size={40} color="#9CA3AF" />
              <View style={styles.accountText}>
                <Text style={styles.accountEmail}>Hesap oluşturulmadı</Text>
                <Text style={styles.accountSubtext}>
                  Tarif geçmişinizi kaydedin
                </Text>
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
        {/* Profile summary row */}
        {/* ------------------------------------------------------------------ */}
        {profile && buildProfileSummary().length > 0 && (
          <Pressable
            style={styles.profileSummaryRow}
            onPress={handleSettingsPress}
            accessibilityRole="button"
            accessibilityLabel="Profil bilgilerini düzenle"
          >
            <MaterialCommunityIcons name="tune-vertical" size={16} color="#6B7280" />
            <Text style={styles.profileSummaryText}>{buildProfileSummary()}</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#9CA3AF" />
          </Pressable>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Saved recipes section header */}
        {/* ------------------------------------------------------------------ */}
        <Text style={styles.sectionHeader}>Kaydedilen Tarifler</Text>

        {/* ------------------------------------------------------------------ */}
        {/* Saved recipes content */}
        {/* ------------------------------------------------------------------ */}
        {loading ? (
          <View style={styles.skeletonGrid}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonItem}>
                <SkeletonCard variant="grid" />
              </View>
            ))}
          </View>
        ) : savedRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="heart-outline" size={48} color="#E07B39" />
            <Text style={styles.emptyText}>
              {'Henüz kaydedilmiş tarifiniz yok.\nTariflerin üzerindeki ♡ ikonuna basın.'}
            </Text>
          </View>
        ) : (
          <View style={styles.savedGrid}>
            {savedRecipes.map((item) => (
              <View key={item.id} style={styles.cardWrapper}>
                <RecipeCardGrid
                  recipe={item}
                  isBookmarked={bookmarkedIds.has(item.id)}
                  onBookmarkToggle={handleBookmarkToggle}
                  onPress={handleRecipePress}
                />
              </View>
            ))}
          </View>
        )}
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
  scrollContent: {
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  screenTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },
  accountCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  accountSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
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
  profileSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  profileSummaryText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  skeletonItem: {
    width: '50%',
    padding: 4,
  },
  savedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  cardWrapper: {
    width: '50%',
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
});
