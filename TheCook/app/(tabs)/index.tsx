import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useFeedScreen } from '@/src/hooks/useFeedScreen';
import { FeedSection, calculateCardWidth } from '@/components/ui/feed-section';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { ResumeBanner } from '@/components/cooking/resume-banner';
import { router } from 'expo-router';

const SKELETON_CARD_WIDTH = calculateCardWidth(Dimensions.get('window').width);

// ---------------------------------------------------------------------------
// Feed screen — horizontal sections feed (redesigned)
// ---------------------------------------------------------------------------

export default function FeedScreen() {
  const { isDark, colors } = useAppTheme();

  const {
    profile,
    profileLoaded,
    sections,
    allEmpty,
    loading,
    bookmarkedIds,
    resumeSession,
    resumeRecipeName,
    resumeTotalSteps,
    refreshing,
    handleBookmarkToggle,
    handleRefresh,
    handleResume,
    handleDismissResume,
    handleRecipePress,
  } = useFeedScreen();

  // Don't render until profile is loaded (prevents allergen flash)
  if (!profileLoaded) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.scrollContent}>
          {[0, 1].map((i) => (
            <View key={i} style={styles.sectionSkeleton}>
              <View style={[styles.skeletonTitleBar, { backgroundColor: colors.skeleton }]} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skeletonRow}>
                {[0, 1, 2].map((j) => (
                  <View key={j} style={[styles.skeletonCardWrapper, { width: SKELETON_CARD_WIDTH }]}>
                    <SkeletonCard variant="grid" />
                  </View>
                ))}
              </ScrollView>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.separator }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>The Cook</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
          />
        }
      >
        {/* Resume banner */}
        {resumeSession && (
          <ResumeBanner
            recipeName={resumeRecipeName}
            currentStep={resumeSession.currentStep}
            totalSteps={resumeTotalSteps}
            onResume={handleResume}
            onDismiss={handleDismissResume}
          />
        )}

        {/* Loading skeleton */}
        {loading ? (
          [0, 1].map((i) => (
            <View key={i} style={styles.sectionSkeleton}>
              <View style={[styles.skeletonTitleBar, { backgroundColor: colors.skeleton }]} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skeletonRow}>
                {[0, 1, 2].map((j) => (
                  <View key={j} style={[styles.skeletonCardWrapper, { width: SKELETON_CARD_WIDTH }]}>
                    <SkeletonCard variant="grid" />
                  </View>
                ))}
              </ScrollView>
            </View>
          ))
        ) : allEmpty ? (
          /* All sections empty — suggest profile update */
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Henüz tarif bulunamadı</Text>
            <Text style={[styles.emptyText, { color: colors.textSub }]}>
              Alerjen, ekipman ve beceri seviyeni Profil sekmesinden güncelleyerek sana özel tarifler keşfedebilirsin.
            </Text>
            <Pressable
              style={[styles.profileButton, { backgroundColor: colors.tint }]}
              onPress={() => router.push('/(tabs)/profile' as never)}
              accessibilityRole="button"
              accessibilityLabel="Profilini güncelle"
            >
              <Text style={[styles.profileButtonText, { color: colors.onTint }]}>Profilini güncelle</Text>
            </Pressable>
          </View>
        ) : (
          /* Feed sections */
          <>
            {sections.map((section, index) => (
              <FeedSection
                key={section.key}
                sectionKey={section.key}
                sectionIndex={index}
                title={section.title}
                data={section.data}
                bookmarkedIds={bookmarkedIds}
                userEquipment={profile?.equipment ?? []}
                onRecipePress={handleRecipePress}
                onBookmarkToggle={handleBookmarkToggle}
                isLast={false}
              />
            ))}

            {/* Community recipes banner */}
            <Pressable
              style={[styles.communityBanner, { backgroundColor: colors.tint }]}
              onPress={() => router.push('/discover')}
            >
              <View style={styles.communityBannerContent}>
                <MaterialCommunityIcons name="chef-hat" size={28} color={colors.onTint} />
                <View style={styles.communityBannerText}>
                  <Text style={[styles.communityBannerTitle, { color: colors.onTint }]}>
                    Topluluk Tarifleri
                  </Text>
                  <Text style={[styles.communityBannerSub, { color: colors.onTint }]}>
                    8.700+ tarif — yapay zeka ile hazırlanır
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onTint} />
              </View>
            </Pressable>
          </>
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
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  profileButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Skeleton loading
  sectionSkeleton: {
    marginBottom: 24,
  },
  skeletonTitleBar: {
    width: 140,
    height: 18,
    borderRadius: 6,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  skeletonRow: {
    paddingHorizontal: 16,
  },
  skeletonCardWrapper: {
    marginRight: 12,
  },
  // Community banner
  communityBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  communityBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  communityBannerText: {
    flex: 1,
  },
  communityBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  communityBannerSub: {
    fontSize: 13,
    opacity: 0.85,
    marginTop: 2,
  },
});
