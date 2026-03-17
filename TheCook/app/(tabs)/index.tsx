import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';

import { useFeedScreen } from '@/src/hooks/useFeedScreen';
import { FeedSection } from '@/components/ui/feed-section';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { ResumeBanner } from '@/components/cooking/resume-banner';
import { router } from 'expo-router';

// ---------------------------------------------------------------------------
// Feed screen — horizontal sections feed (redesigned)
// ---------------------------------------------------------------------------

export default function FeedScreen() {
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
      <SafeAreaView style={styles.container}>
        <View style={styles.scrollContent}>
          {[0, 1].map((i) => (
            <View key={i} style={styles.sectionSkeleton}>
              <View style={styles.skeletonTitleBar} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skeletonRow}>
                {[0, 1, 2].map((j) => (
                  <View key={j} style={styles.skeletonCardWrapper}>
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#E07B39"
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
              <View style={styles.skeletonTitleBar} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skeletonRow}>
                {[0, 1, 2].map((j) => (
                  <View key={j} style={styles.skeletonCardWrapper}>
                    <SkeletonCard variant="grid" />
                  </View>
                ))}
              </ScrollView>
            </View>
          ))
        ) : allEmpty ? (
          /* All sections empty — suggest profile update */
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Henüz tarif bulunamadı</Text>
            <Text style={styles.emptyText}>
              Alerjen, ekipman ve beceri seviyeni Profil sekmesinden güncelleyerek sana özel tarifler keşfedebilirsin.
            </Text>
            <Pressable
              style={styles.profileButton}
              onPress={() => router.push('/(tabs)/profile' as never)}
              accessibilityRole="button"
              accessibilityLabel="Profilini güncelle"
            >
              <Text style={styles.profileButtonText}>Profilini güncelle</Text>
            </Pressable>
          </View>
        ) : (
          /* Feed sections */
          sections.map((section) => (
            <FeedSection
              key={section.key}
              title={section.title}
              data={section.data}
              bookmarkedIds={bookmarkedIds}
              userEquipment={profile?.equipment ?? []}
              onRecipePress={handleRecipePress}
              onBookmarkToggle={handleBookmarkToggle}
            />
          ))
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
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  profileButton: {
    backgroundColor: '#E07B39',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  profileButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  skeletonRow: {
    paddingHorizontal: 16,
  },
  skeletonCardWrapper: {
    width: 180,
    marginRight: 12,
  },
});
