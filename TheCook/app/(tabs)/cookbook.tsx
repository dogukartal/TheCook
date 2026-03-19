import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@/contexts/ThemeContext';
import { useCookbookScreen } from '@/src/hooks/useCookbookScreen';
import { RecipeCardRow } from '@/components/ui/recipe-card-row';
import { RecipeCardRowCooked } from '@/components/ui/recipe-card-row-cooked';

// ---------------------------------------------------------------------------
// Cookbook screen -- two tabs: Kaydedilenler (Saved) and Pisirilmis (Cooked)
// ---------------------------------------------------------------------------

export default function CookbookScreen() {
  const { colors } = useAppTheme();

  const {
    profile,
    savedRecipes,
    loading,
    activeTab,
    setActiveTab,
    cookedRecipes,
    cookedLoading,
    handleBookmarkToggle,
    handleRecipePress,
    handleReRate,
  } = useCookbookScreen();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} stickyHeaderIndices={[0]}>
        {/* Sticky header + tab bar */}
        <View style={{ backgroundColor: colors.background }}>
          {/* Header row */}
          <View style={styles.headerRow}>
            <Text style={[styles.screenTitle, { color: colors.text }]}>Yemek Defterim</Text>
          </View>

          {/* Tab bar */}
          <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
            <Pressable
              style={[
                styles.tabButton,
                activeTab === 'saved' && [styles.tabButtonActive, { borderBottomColor: colors.tint }],
              ]}
              onPress={() => setActiveTab('saved')}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'saved' ? colors.tint : colors.textSub },
                  activeTab === 'saved' && styles.tabTextActive,
                ]}
              >
                Kaydedilenler
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tabButton,
                activeTab === 'cooked' && [styles.tabButtonActive, { borderBottomColor: colors.tint }],
              ]}
              onPress={() => setActiveTab('cooked')}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'cooked' ? colors.tint : colors.textSub },
                  activeTab === 'cooked' && styles.tabTextActive,
                ]}
              >
                Pisirilmis
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tab content */}
        {activeTab === 'saved' ? (
          /* Saved Tab */
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
            </View>
          ) : savedRecipes.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="heart-outline" size={48} color={colors.tint} />
              <Text style={[styles.emptyText, { color: colors.textSub }]}>
                {'Henuz kaydedilmis tarifiniz yok.\nTariflerin uzerindeki \u2661 ikonuna basin.'}
              </Text>
            </View>
          ) : (
            <View style={styles.listContent}>
              {savedRecipes.map((item) => (
                <RecipeCardRow
                  key={item.id}
                  recipe={item}
                  onPress={handleRecipePress}
                  userEquipment={profile?.equipment ?? []}
                  onBookmarkToggle={handleBookmarkToggle}
                />
              ))}
            </View>
          )
        ) : (
          /* Cooked Tab */
          cookedLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
            </View>
          ) : cookedRecipes.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="chef-hat" size={48} color={colors.tint} />
              <Text style={[styles.emptyText, { color: colors.textSub }]}>
                {'Henuz bir tarif pisirmediniz.\nYemek pisirmeye baslayin!'}
              </Text>
            </View>
          ) : (
            <View style={styles.listContent}>
              {cookedRecipes.map((item) => (
                <RecipeCardRowCooked
                  key={item.id}
                  recipe={item}
                  rating={item.latestRating}
                  cookCount={item.cookCount}
                  onPress={handleRecipePress}
                  onRatingChange={handleReRate}
                  userEquipment={profile?.equipment ?? []}
                />
              ))}
            </View>
          )
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
  scrollContent: {
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  screenTitle: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
  },
  tabTextActive: {
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  loadingContainer: {
    paddingTop: 48,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
});
