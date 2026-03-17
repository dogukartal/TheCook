import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useRecipeDetailScreen } from '@/src/hooks/useRecipeDetailScreen';
import { ServingStepper } from '@/components/recipe/serving-stepper';
import { formatAmount } from '@/src/hooks/useRecipeAdaptation';
import { SkeletonCard } from '@/components/ui/skeleton-card';

import type { SkillLevel, Category, Ingredient } from '@/src/types/recipe';

// ---------------------------------------------------------------------------
// Gradient palette — same as RecipeCardGrid
// ---------------------------------------------------------------------------

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  'ana yemek': ['#E07B39', '#C05F20'],
  'kahvaltı':  ['#F59E0B', '#D97706'],
  'çorba':     ['#0891B2', '#0E7490'],
  'tatlı':     ['#EC4899', '#DB2777'],
  'salata':    ['#16A34A', '#15803D'],
  'aperatif':  ['#7C3AED', '#6D28D9'],
};
const DEFAULT_GRADIENT: [string, string] = ['#9CA3AF', '#6B7280'];

// ---------------------------------------------------------------------------
// Label maps
// ---------------------------------------------------------------------------

const SKILL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Baslangic',
  intermediate: 'Orta',
  advanced: 'Ileri',
};

const ALLERGEN_LABELS: Record<string, string> = {
  gluten: 'Gluten',
  dairy: 'Sut Urunleri',
  egg: 'Yumurta',
  nuts: 'Kuruyemis',
  peanuts: 'Fistik',
  shellfish: 'Kabuklu Deniz Urunleri',
  fish: 'Balik',
  soy: 'Soya',
  sesame: 'Susam',
  mustard: 'Hardal',
  celery: 'Kereviz',
  lupin: 'Aci Bakla',
  molluscs: 'Yumusakca',
  sulphites: 'Sulfitler',
};

// ---------------------------------------------------------------------------
// Step preview pastel palette
// ---------------------------------------------------------------------------

const STEP_PASTEL_COLORS = [
  '#FDE8D8',
  '#D4F0E8',
  '#E8DFF5',
  '#FFF3CD',
  '#D1ECF1',
  '#F5D5D5',
  '#E2F0CB',
  '#FCE4EC',
];

// ---------------------------------------------------------------------------
// Helper: format duration
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return `${seconds} sn`;
  return `${minutes} dk`;
}

// ---------------------------------------------------------------------------
// Swap picker helper
// ---------------------------------------------------------------------------

function showSwapPicker(
  item: Ingredient,
  onSwap: (ingredientName: string, altName: string) => void,
) {
  if (item.alternatives.length === 1) {
    onSwap(item.name, item.alternatives[0].name);
    return;
  }
  // Multiple alternatives — show Alert picker
  const buttons = item.alternatives.map((alt) => ({
    text: `${alt.name} (${formatAmount(alt.amount)} ${alt.unit})`,
    onPress: () => onSwap(item.name, alt.name),
  }));
  buttons.push({ text: 'Iptal', onPress: () => {} });
  Alert.alert('Yerine ne kullanalim?', undefined, buttons);
}

// ---------------------------------------------------------------------------
// Recipe detail / cooking preview screen
// ---------------------------------------------------------------------------

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    recipe,
    isBookmarked,
    hasActiveSession,
    adaptation,
    handleBookmarkToggle,
    startCooking,
  } = useRecipeDetailScreen(id as string);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (recipe === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.backRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </Pressable>
        </View>
        <View style={styles.skeletonContainer}>
          <SkeletonCard variant="grid" />
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Not found state
  // ---------------------------------------------------------------------------

  if (recipe === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.backRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </Pressable>
        </View>
        <View style={styles.notFoundContainer}>
          <MaterialCommunityIcons name="file-question-outline" size={48} color="#9CA3AF" />
          <Text style={styles.notFoundText}>Tarif bulunamadi</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Geri Don</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const gradient = CATEGORY_GRADIENTS[recipe.category as Category] ?? DEFAULT_GRADIENT;
  const totalTime = recipe.prepTime + recipe.cookTime;

  // ---------------------------------------------------------------------------
  // Full recipe cooking preview render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero gradient with back + bookmark buttons */}
        <View style={styles.heroContainer}>
          <LinearGradient colors={gradient} style={styles.heroGradient}>
            {/* Back button */}
            <Pressable
              style={styles.heroBackButton}
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Geri"
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
            </Pressable>

            {/* Bookmark button */}
            <Pressable
              style={styles.heroBookmarkButton}
              onPress={handleBookmarkToggle}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={isBookmarked ? 'Favoriden cikar' : 'Favoriye ekle'}
            >
              <MaterialCommunityIcons
                name={isBookmarked ? 'heart' : 'heart-outline'}
                size={24}
                color="#FFFFFF"
              />
            </Pressable>

            {/* Title overlay */}
            <Text style={styles.heroTitle}>{recipe.title}</Text>
          </LinearGradient>
        </View>

        <View style={styles.contentContainer}>
          {/* Metadata row */}
          <View style={styles.metaRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{SKILL_LABELS[recipe.skillLevel]}</Text>
            </View>
            <View style={[styles.badge, styles.cuisineBadge]}>
              <Text style={styles.cuisineBadgeText}>{recipe.cuisine}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{totalTime} dk</Text>
            </View>
            <ServingStepper
              value={adaptation.servings}
              originalValue={recipe.servings}
              onChange={adaptation.setServings}
            />
          </View>

          {/* Allergen tags row */}
          {recipe.allergens.length > 0 && (
            <View style={styles.allergenRow}>
              {recipe.allergens.map((allergen) => (
                <View key={allergen} style={styles.allergenTag}>
                  <Text style={styles.allergenTagText}>
                    {ALLERGEN_LABELS[allergen] ?? allergen}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Ingredients section */}
          <Text style={styles.sectionHeader}>Malzemeler</Text>
          {adaptation.adaptedGroups.map((group, groupIdx) => (
            <View key={groupIdx} style={styles.ingredientGroup}>
              {group.label && (
                <Text style={styles.ingredientGroupLabel}>{group.label}</Text>
              )}
              {group.items.map((item, itemIdx) => {
                const hasAlts = item.alternatives && item.alternatives.length > 0;
                const isSwapped = Boolean(adaptation.swaps[item.name]);
                // Find the original ingredient name if swapped
                const originalName = isSwapped
                  ? Object.entries(adaptation.swaps).find(([, v]) => v === item.name)?.[0]
                  : undefined;

                return (
                  <View key={itemIdx} style={styles.ingredientRow}>
                    <View style={styles.ingredientDot} />
                    <Text style={styles.ingredientText}>
                      <Text style={styles.ingredientAmount}>
                        {formatAmount(item.amount)} {item.unit}{' '}
                      </Text>
                      {item.name}
                      {item.optional && (
                        <Text style={styles.optionalLabel}> (opsiyonel)</Text>
                      )}
                    </Text>
                    {hasAlts && !isSwapped && (
                      <Pressable
                        style={styles.swapButton}
                        onPress={() => showSwapPicker(item, adaptation.swapIngredient)}
                        accessibilityRole="button"
                        accessibilityLabel="Elimde yok"
                      >
                        <Text style={styles.swapButtonText}>Elimde yok</Text>
                      </Pressable>
                    )}
                    {isSwapped && originalName && (
                      <Pressable
                        style={[styles.swapButton, styles.swapButtonActive]}
                        onPress={() => adaptation.resetSwap(originalName)}
                        accessibilityRole="button"
                        accessibilityLabel="Geri al"
                      >
                        <Text style={styles.swapButtonActiveText}>Geri al</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          ))}

          {/* Start Cooking button inside ingredients section */}
          <Pressable
            style={styles.inlineStartCookingButton}
            onPress={startCooking}
            accessibilityRole="button"
            accessibilityLabel={hasActiveSession ? 'Devam Et' : 'Pismek Baslat'}
          >
            <Text style={styles.inlineStartCookingText}>
              {hasActiveSession ? 'Devam Et' : 'Pismek Baslat'}
            </Text>
          </Pressable>

          {/* Steps Preview section */}
          <Text style={styles.sectionHeader}>Adimlar</Text>
          {adaptation.adaptedSteps.map((step, idx) => {
            const bgColor = STEP_PASTEL_COLORS[idx % STEP_PASTEL_COLORS.length];

            return (
              <View
                key={idx}
                style={[styles.stepPreviewBox, { backgroundColor: bgColor }]}
              >
                <View style={styles.stepPreviewHeader}>
                  <View style={styles.stepPreviewNumberBadge}>
                    <Text style={styles.stepPreviewNumber}>{idx + 1}</Text>
                  </View>
                  {step.timerSeconds != null && (
                    <View style={styles.stepPreviewTimer}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={13}
                        color="#6B7280"
                      />
                      <Text style={styles.stepPreviewTimerText}>
                        {formatDuration(step.timerSeconds)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.stepPreviewTitle}>
                  {step.title || step.instruction.slice(0, 60) + (step.instruction.length > 60 ? '...' : '')}
                </Text>
              </View>
            );
          })}

          {/* Bottom padding for scroll */}
          <View style={styles.bottomPad} />
        </View>
      </ScrollView>

      {/* Start Cooking button — fixed at bottom */}
      <View style={styles.startCookingContainer}>
        <Pressable
          style={styles.startCookingButton}
          onPress={startCooking}
          accessibilityRole="button"
          accessibilityLabel={hasActiveSession ? 'Devam Et' : 'Pismek Baslat'}
        >
          <Text style={styles.startCookingText}>
            {hasActiveSession ? 'Devam Et' : 'Pismek Baslat'}
          </Text>
        </Pressable>
      </View>
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

  // Loading state
  backRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skeletonContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    flex: 1,
  },

  // Not found state
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  notFoundText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#E07B39',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Hero
  heroContainer: {
    height: 200,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroBackButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBookmarkButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Content
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Metadata row
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#FEF3EC',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#E07B39',
    fontSize: 12,
    fontWeight: '600',
  },
  cuisineBadge: {
    backgroundColor: '#F3F4F6',
  },
  cuisineBadgeText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Allergen tags
  allergenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 20,
  },
  allergenTag: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  allergenTagText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '500',
  },

  // Section headers
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
    marginBottom: 12,
  },

  // Ingredients
  ingredientGroup: {
    marginBottom: 16,
  },
  ingredientGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E07B39',
    marginTop: 0,
    marginRight: 10,
  },
  ingredientText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  ingredientAmount: {
    fontWeight: '600',
    color: '#111827',
  },
  optionalLabel: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },

  // Swap buttons
  swapButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E07B39',
    borderRadius: 6,
  },
  swapButtonText: {
    fontSize: 12,
    color: '#E07B39',
    fontWeight: '500',
  },
  swapButtonActive: {
    backgroundColor: '#FEF3EC',
    borderColor: '#9CA3AF',
  },
  swapButtonActiveText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Inline start cooking button (inside ingredients section)
  inlineStartCookingButton: {
    backgroundColor: '#E07B39',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  inlineStartCookingText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Steps preview boxes
  stepPreviewBox: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  stepPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stepPreviewNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPreviewNumber: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
  },
  stepPreviewTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  stepPreviewTimerText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  stepPreviewTitle: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },

  // Start cooking button
  startCookingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  startCookingButton: {
    backgroundColor: '#E07B39',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startCookingText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  bottomPad: {
    height: 16,
  },
});
