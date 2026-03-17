import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useCookbookScreen } from '@/src/hooks/useCookbookScreen';
import { RecipeCardGrid } from '@/components/ui/recipe-card-grid';
import { SkeletonCard } from '@/components/ui/skeleton-card';

// ---------------------------------------------------------------------------
// My Kitchen screen
// ---------------------------------------------------------------------------

export default function MyKitchenScreen() {
  const {
    profile,
    bookmarkedIds,
    savedRecipes,
    loading,
    session,
    profileSummary,
    handleBookmarkToggle,
    handleRecipePress,
    handleSettingsPress,
    handleSignOut,
    handleSignIn,
  } = useCookbookScreen();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} stickyHeaderIndices={[0]}>
        {/* Header row */}
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

        {/* Account card */}
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
              onPress={handleSignOut}
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
              onPress={handleSignIn}
              accessibilityRole="button"
            >
              <Text style={styles.createAccountText}>Hesap Oluştur</Text>
            </Pressable>
          </View>
        )}

        {/* Profile summary row */}
        {profile && profileSummary.length > 0 && (
          <Pressable
            style={styles.profileSummaryRow}
            onPress={handleSettingsPress}
            accessibilityRole="button"
            accessibilityLabel="Profil bilgilerini düzenle"
          >
            <MaterialCommunityIcons name="tune-vertical" size={16} color="#6B7280" />
            <Text style={styles.profileSummaryText}>{profileSummary}</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#9CA3AF" />
          </Pressable>
        )}

        {/* Saved recipes section header */}
        <Text style={styles.sectionHeader}>Kaydedilen Tarifler</Text>

        {/* Saved recipes content */}
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
              {'Henüz kaydedilmiş tarifiniz yok.\nTariflerin üzerindeki \u2661 ikonuna basın.'}
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
                  userEquipment={profile?.equipment ?? []}
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
