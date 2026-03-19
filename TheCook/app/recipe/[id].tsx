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
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useRecipeDetailScreen } from '@/src/hooks/useRecipeDetailScreen';
import { ServingStepper } from '@/components/recipe/serving-stepper';
import { formatAmount } from '@/src/hooks/useRecipeAdaptation';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { useAppTheme } from '@/contexts/ThemeContext';
import { CATEGORY_GRADIENTS, DEFAULT_GRADIENT, STEP_PASTEL_BACKGROUNDS } from '@/constants/palette';
import { getRecipeImages } from '@/app/assets/image-registry';
import { AnimatedHeart } from '@/components/ui/animated-heart';
import { ScalePressable } from '@/components/ui/animated-pressable';

import type { SkillLevel, Category, Ingredient } from '@/src/types/recipe';

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
  // Multiple alternatives -- show Alert picker
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
  const { isDark, colors } = useAppTheme();

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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.backRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.backRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.notFoundContainer}>
          <MaterialCommunityIcons name="file-question-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.notFoundText, { color: colors.textSub }]}>Tarif bulunamadi</Text>
          <Pressable style={[styles.backButton, { backgroundColor: colors.tint }]} onPress={() => router.back()}>
            <Text style={[styles.backButtonText, { color: colors.onTint }]}>Geri Don</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const gradient = CATEGORY_GRADIENTS[recipe.category as Category] ?? DEFAULT_GRADIENT;
  const images = getRecipeImages(id as string);
  const totalTime = recipe.prepTime + recipe.cookTime;

  // ---------------------------------------------------------------------------
  // Full recipe cooking preview render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image/gradient with back + bookmark buttons */}
        <View style={styles.heroContainer}>
          {images.cover ? (
            <>
              <Image
                source={images.cover}
                placeholder={images.coverBlurhash ? { blurhash: images.coverBlurhash } : undefined}
                placeholderContentFit="cover"
                contentFit="cover"
                transition={200}
                style={StyleSheet.absoluteFill}
                testID="hero-cover-image"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.65)']}
                style={StyleSheet.absoluteFill}
              />
            </>
          ) : (
            <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} testID="linear-gradient" />
          )}
          {/* Overlay: buttons + title */}
          <View style={styles.heroGradient}>
            {/* Back button */}
            <Pressable
              style={styles.heroBackButton}
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Geri"
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />{/* palette-exempt */}
            </Pressable>

            {/* Bookmark button */}
            <View style={styles.heroBookmarkButton}>
              <AnimatedHeart
                isBookmarked={isBookmarked}
                onToggle={handleBookmarkToggle}
                size={24}
                color="#FFFFFF" // palette-exempt
              />
            </View>

            {/* Title overlay */}
            <Text style={styles.heroTitle}>{recipe.title}</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          {/* Metadata row */}
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: colors.tintBg }]}>
              <Text style={[styles.badgeText, { color: colors.tint }]}>{SKILL_LABELS[recipe.skillLevel]}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.card }]}>
              <Text style={[styles.cuisineBadgeText, { color: colors.textSub }]}>{recipe.cuisine}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSub} />
              <Text style={[styles.metaText, { color: colors.textSub }]}>{totalTime} dk</Text>
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
                <View key={allergen} style={[styles.allergenTag, { borderColor: colors.error }]}>
                  <Text style={[styles.allergenTagText, { color: colors.error }]}>
                    {ALLERGEN_LABELS[allergen] ?? allergen}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Ingredients section */}
          <Text style={[styles.sectionHeader, { color: colors.text }]}>Malzemeler</Text>
          {adaptation.adaptedGroups.map((group, groupIdx) => (
            <View key={groupIdx} style={styles.ingredientGroup}>
              {group.label && (
                <Text style={[styles.ingredientGroupLabel, { color: colors.textSecondary }]}>{group.label}</Text>
              )}
              {group.items.map((item, itemIdx) => {
                const hasAlts = item.alternatives && item.alternatives.length > 0;
                // Check if this item's name is a swap VALUE (it was swapped TO this)
                const swapEntry = Object.entries(adaptation.swaps).find(
                  ([, v]) => v === item.name
                );
                const isSwapped = Boolean(swapEntry);
                const originalName = swapEntry?.[0];

                return (
                  <View key={itemIdx} style={styles.ingredientRow}>
                    <View style={[styles.ingredientDot, { backgroundColor: colors.tint }]} />
                    <Text style={[styles.ingredientText, { color: colors.textSecondary }]}>
                      <Text style={[styles.ingredientAmount, { color: colors.text }]}>
                        {formatAmount(item.amount)} {item.unit}{' '}
                      </Text>
                      {item.name}
                      {item.optional && (
                        <Text style={[styles.optionalLabel, { color: colors.textMuted }]}> (opsiyonel)</Text>
                      )}
                    </Text>
                    {hasAlts && !isSwapped && (
                      <Pressable
                        style={[styles.swapButton, { borderColor: colors.tint }]}
                        onPress={() => showSwapPicker(item, adaptation.swapIngredient)}
                        accessibilityRole="button"
                        accessibilityLabel="Elimde yok"
                      >
                        <Text style={[styles.swapButtonText, { color: colors.tint }]}>Elimde yok</Text>
                      </Pressable>
                    )}
                    {isSwapped && originalName && (
                      <Pressable
                        style={[styles.swapButton, styles.swapButtonActive, { backgroundColor: colors.tintBg, borderColor: colors.textMuted }]}
                        onPress={() => adaptation.resetSwap(originalName)}
                        accessibilityRole="button"
                        accessibilityLabel="Geri al"
                      >
                        <Text style={[styles.swapButtonActiveText, { color: colors.textSub }]}>Geri al</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          ))}

          {/* Steps Preview section */}
          <Text style={[styles.sectionHeader, { color: colors.text }]}>Adimlar</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stepsHorizontalContainer}
          >
            {adaptation.adaptedSteps.map((step, idx) => {
              const bgColor = isDark ? colors.card : STEP_PASTEL_BACKGROUNDS[idx % STEP_PASTEL_BACKGROUNDS.length];

              return (
                <View
                  key={idx}
                  style={[styles.stepPreviewBox, { backgroundColor: bgColor }]}
                >
                  <View style={styles.stepPreviewHeader}>
                    <View style={[styles.stepPreviewNumberBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }]}>
                      <Text style={[styles.stepPreviewNumber, { color: colors.text }]}>{idx + 1}</Text>
                    </View>
                    {step.timerSeconds != null && (
                      <View style={styles.stepPreviewTimer}>
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={13}
                          color={colors.textSub}
                        />
                        <Text style={[styles.stepPreviewTimerText, { color: colors.textSub }]}>
                          {formatDuration(step.timerSeconds)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.stepPreviewTitle, { color: isDark ? colors.textSub : colors.textSecondary }]} numberOfLines={3}>
                    {step.title || step.instruction.slice(0, 80) + (step.instruction.length > 80 ? '...' : '')}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Bottom padding for scroll */}
          <View style={styles.bottomPad} />
        </View>
      </ScrollView>

      {/* Start Cooking button -- fixed at bottom */}
      <View style={[styles.startCookingContainer, { backgroundColor: colors.background, borderTopColor: colors.separator }]}>
        <ScalePressable
          style={[styles.startCookingButton, { backgroundColor: colors.tint }]}
          onPress={startCooking}
          accessibilityRole="button"
          accessibilityLabel={hasActiveSession ? 'Devam Et' : 'Pisirmeye Basla'}
        >
          <Text style={[styles.startCookingText, { color: colors.onTint }]}>
            {hasActiveSession ? 'Devam Et' : 'Pisirmeye Basla'}
          </Text>
        </ScalePressable>
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
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  backButtonText: {
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
    borderRadius: 12,
    backgroundColor: 'rgba(12,12,10,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBookmarkButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(12,12,10,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF', // on-gradient // palette-exempt
    letterSpacing: -1,
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
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cuisineBadgeText: {
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
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  allergenTagText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Section headers
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
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
    marginTop: 0,
    marginRight: 10,
  },
  ingredientText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  ingredientAmount: {
    fontWeight: '600',
  },
  optionalLabel: {
    fontStyle: 'italic',
  },

  // Swap buttons
  swapButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 6,
  },
  swapButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  swapButtonActive: {},
  swapButtonActiveText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Steps preview boxes
  stepsHorizontalContainer: {
    paddingRight: 16,
    gap: 10,
  },
  stepPreviewBox: {
    borderRadius: 14,
    padding: 14,
    width: 180,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPreviewNumber: {
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
    fontWeight: '500',
  },
  stepPreviewTitle: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Start cooking button
  startCookingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  startCookingButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startCookingText: {
    fontSize: 17,
    fontWeight: '700',
  },

  bottomPad: {
    height: 16,
  },
});
