import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/contexts/ThemeContext';
import { useSeeAllScreen } from '@/src/hooks/useSeeAllScreen';
import { RecipeCardGrid } from '@/components/ui/recipe-card-grid';

// ---------------------------------------------------------------------------
// See All screen -- vertical 2-column grid for a feed section
// ---------------------------------------------------------------------------

export default function SeeAllScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const { colors } = useAppTheme();

  const {
    recipes,
    title,
    loading,
    bookmarkedIds,
    isValid,
    userEquipment,
    toggleBookmark,
  } = useSeeAllScreen(section ?? '');

  function handleRecipePress(id: string) {
    router.push(`/recipe/${id}` as never);
  }

  // ---------------------------------------------------------------------------
  // Invalid section key -- graceful error state
  // ---------------------------------------------------------------------------

  if (!isValid) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Hata</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSub }]}>
            Bu bolum bulunamadi
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.tint }]}
          >
            <Text style={[styles.backButtonText, { color: colors.onTint }]}>Geri Don</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{title || 'Yukleniyor...'}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Main content -- vertical 2-column FlashList grid
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Geri"
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {title} ({recipes.length})
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Recipe grid */}
      <FlashList
        data={recipes}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <RecipeCardGrid
              recipe={item}
              isBookmarked={bookmarkedIds.has(item.id)}
              onBookmarkToggle={toggleBookmark}
              onPress={handleRecipePress}
              userEquipment={userEquipment}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 8 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSub }]}>
              Bu bolumde tarif bulunamadi
            </Text>
          </View>
        }
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  headerSpacer: {
    width: 28,
  },
  cardWrapper: {
    flex: 1,
    padding: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
