import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import PagerView from 'react-native-pager-view';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getRecipeById } from '@/src/db/recipes';
import {
  saveSession,
  getActiveSession,
  clearSession,
  CookingSession,
} from '@/src/db/cooking-session';
import { logCookingCompletion } from '@/src/db/cooking-history';
import { useCookingTimer } from '@/src/hooks/useCookingTimer';
import { useRecipeAdaptation } from '@/src/hooks/useRecipeAdaptation';
import { useSefim } from '@/src/hooks/useSefim';
import { useProfileDb } from '@/src/db/profile';
import { useAppTheme } from '@/contexts/ThemeContext';

import { StepContent } from '@/components/cooking/step-content';
import { SegmentedProgressBar } from '@/components/cooking/progress-bar';
import { IngredientsSheet } from '@/components/cooking/ingredients-sheet';
import { SefimSheet } from '@/components/cooking/sefim-sheet';
import { SefimPulse } from '@/components/cooking/sefim-pulse';
import { TimerIndicator } from '@/components/cooking/timer-indicator';
import { CompletionScreen } from '@/components/cooking/completion-screen';
import { ScalePressable } from '@/components/ui/animated-pressable';

import type { Recipe } from '@/src/types/recipe';

// ---------------------------------------------------------------------------
// Cooking view — full-screen step-by-step
// ---------------------------------------------------------------------------

export default function CookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { isDark, colors } = useAppTheme();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [ingredientChecks, setIngredientChecks] = useState<number[]>([]);
  const [sessionStartedAt, setSessionStartedAt] = useState<string>(
    new Date().toISOString()
  );
  const [showIngredients, setShowIngredients] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [initialPage, setInitialPage] = useState(0);
  const [ready, setReady] = useState(false);

  const pagerRef = useRef<PagerView>(null);
  const mountedRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Adaptation — initialized after recipe loads, restored from session
  // ---------------------------------------------------------------------------

  const adaptation = useRecipeAdaptation(recipe);

  // ---------------------------------------------------------------------------
  // Skill level from profile
  // ---------------------------------------------------------------------------

  const [skillLevel, setSkillLevel] = useState<string>('beginner');
  const { getProfile } = useProfileDb();

  useEffect(() => {
    getProfile().then((profile) => {
      if (profile.skillLevel) {
        setSkillLevel(profile.skillLevel);
      }
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Sef'im AI companion
  // ---------------------------------------------------------------------------

  const sefim = useSefim(
    recipe,
    currentStep,
    skillLevel,
    adaptation.swaps,
    adaptation.servings,
  );

  // ---------------------------------------------------------------------------
  // Timer
  // ---------------------------------------------------------------------------

  const { timer, displaySeconds, start, pause, resume, reset } =
    useCookingTimer();

  // ---------------------------------------------------------------------------
  // Keep-awake
  // ---------------------------------------------------------------------------

  useEffect(() => {
    activateKeepAwakeAsync();
    return () => {
      deactivateKeepAwake();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Load recipe + restore session (including adaptation state)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      const r = await getRecipeById(db, id as string);
      if (cancelled || !r) return;

      setRecipe(r);

      // Check for active session to resume
      const session = await getActiveSession(db);
      if (session && session.recipeId === id) {
        setCurrentStep(session.currentStep);
        setInitialPage(session.currentStep);
        setIngredientChecks(session.ingredientChecks);
        setSessionStartedAt(session.sessionStartedAt);

        // Restore adaptation state from session
        if (session.adaptedServings != null) {
          adaptation.setServings(session.adaptedServings);
        }
        if (session.ingredientSwaps) {
          for (const [originalName, subName] of Object.entries(session.ingredientSwaps)) {
            adaptation.swapIngredient(originalName, subName);
          }
        }

        // Restore timer if it was running (Pitfall 4: recalculate remaining)
        if (
          session.timerRemaining != null &&
          session.timerStartTimestamp != null
        ) {
          const elapsed =
            (Date.now() - session.timerStartTimestamp) / 1000;
          const newRemaining = session.timerRemaining - elapsed;
          if (newRemaining > 0) {
            // Timer still has time — manual start per CONTEXT.md
          }
        }
      } else if (!session) {
        // New session — save initial state
        await saveSession(db, {
          recipeId: id as string,
          currentStep: 0,
          timerRemaining: null,
          timerStartTimestamp: null,
          ingredientChecks: [],
          sessionStartedAt: new Date().toISOString(),
          adaptedServings: null,
          ingredientSwaps: {},
        });
      }

      setReady(true);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ---------------------------------------------------------------------------
  // Session persistence helpers
  // ---------------------------------------------------------------------------

  const persistSession = useCallback(
    async (overrides: Partial<CookingSession> = {}) => {
      if (!id) return;

      const session: CookingSession = {
        recipeId: id as string,
        currentStep,
        timerRemaining: timer.isRunning
          ? displaySeconds
          : timer.pausedRemaining,
        timerStartTimestamp: timer.isRunning ? timer.startTimestamp : null,
        ingredientChecks,
        sessionStartedAt,
        adaptedServings: adaptation.servings,
        ingredientSwaps: adaptation.swaps,
        ...overrides,
      };

      await saveSession(db, session);
    },
    [id, currentStep, timer, displaySeconds, ingredientChecks, sessionStartedAt, adaptation.servings, adaptation.swaps]
  );

  // ---------------------------------------------------------------------------
  // Page change handler
  // ---------------------------------------------------------------------------

  const handlePageSelected = useCallback(
    (position: number) => {
      // Guard against mount-fire (Pitfall 3)
      if (!mountedRef.current) {
        mountedRef.current = true;
        if (position === initialPage) return;
      }

      if (!recipe) return;

      // Check if navigating to completion page (beyond last step)
      if (position >= recipe.steps.length) {
        setShowCompletion(true);
        clearSession(db);
        return;
      }

      setCurrentStep(position);
      setShowCompletion(false);

      // Save session on every step change
      saveSession(db, {
        recipeId: id as string,
        currentStep: position,
        timerRemaining: timer.isRunning
          ? displaySeconds
          : timer.pausedRemaining,
        timerStartTimestamp: timer.isRunning ? timer.startTimestamp : null,
        ingredientChecks,
        sessionStartedAt,
        adaptedServings: adaptation.servings,
        ingredientSwaps: adaptation.swaps,
      });
    },
    [recipe, id, timer, displaySeconds, ingredientChecks, sessionStartedAt, initialPage, adaptation.servings, adaptation.swaps]
  );

  // ---------------------------------------------------------------------------
  // Timer callbacks for StepContent
  // ---------------------------------------------------------------------------

  const handleTimerStart = useCallback(
    (stepIndex: number, durationSeconds: number) => {
      start(stepIndex, durationSeconds);
      // Persist session with new timer state
      setTimeout(() => persistSession(), 100);
    },
    [start, persistSession]
  );

  const handleTimerPause = useCallback(() => {
    pause();
    setTimeout(() => persistSession(), 100);
  }, [pause, persistSession]);

  const handleTimerResume = useCallback(() => {
    resume();
    setTimeout(() => persistSession(), 100);
  }, [resume, persistSession]);

  // ---------------------------------------------------------------------------
  // Ingredient toggle
  // ---------------------------------------------------------------------------

  const handleIngredientToggle = useCallback(
    (flatIndex: number) => {
      setIngredientChecks((prev) => {
        const next = prev.includes(flatIndex)
          ? prev.filter((i) => i !== flatIndex)
          : [...prev, flatIndex];

        // Save session with updated checks
        if (id) {
          saveSession(db, {
            recipeId: id as string,
            currentStep,
            timerRemaining: timer.isRunning
              ? displaySeconds
              : timer.pausedRemaining,
            timerStartTimestamp: timer.isRunning ? timer.startTimestamp : null,
            ingredientChecks: next,
            sessionStartedAt,
            adaptedServings: adaptation.servings,
            ingredientSwaps: adaptation.swaps,
          });
        }

        return next;
      });
    },
    [id, currentStep, timer, displaySeconds, sessionStartedAt, adaptation.servings, adaptation.swaps]
  );

  // ---------------------------------------------------------------------------
  // Swap handlers for IngredientsSheet
  // ---------------------------------------------------------------------------

  const handleSwap = useCallback(
    (ingredientName: string, alternativeName: string) => {
      adaptation.swapIngredient(ingredientName, alternativeName);
    },
    [adaptation.swapIngredient]
  );

  const handleResetSwap = useCallback(
    (ingredientName: string) => {
      adaptation.resetSwap(ingredientName);
    },
    [adaptation.resetSwap]
  );

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  function goToPreviousStep() {
    if (currentStep > 0) {
      pagerRef.current?.setPage(currentStep - 1);
    }
  }

  function goToNextStep() {
    if (!recipe) return;

    if (currentStep < recipe.steps.length - 1) {
      pagerRef.current?.setPage(currentStep + 1);
    } else {
      // Last step -> completion page
      pagerRef.current?.setPage(recipe.steps.length);
    }
  }

  function goToTimerStep() {
    if (timer.stepIndex == null || !pagerRef.current) return;

    const target = timer.stepIndex;
    const direction = target < currentStep ? -1 : 1;
    const distance = Math.abs(target - currentStep);

    if (distance <= 1) {
      // Adjacent step — just slide normally
      pagerRef.current.setPage(target);
      return;
    }

    // Animate through intermediate pages with short delays
    let step = currentStep;
    const interval = setInterval(() => {
      step += direction;
      pagerRef.current?.setPage(step);
      if (step === target) {
        clearInterval(interval);
      }
    }, 150);
  }

  async function handleCompletion(rating: number | null) {
    if (id) {
      await logCookingCompletion(db, id as string, rating ?? undefined);
    }
    router.replace('/(tabs)');
  }

  function handleExitPress() {
    Alert.alert(
      'Pisirmeden cikiyorsun',
      'Ilerlemen kaydedilecek. Sonra devam edebilirsin.',
      [
        { text: 'Devam et', style: 'cancel' },
        { text: 'Cik', style: 'destructive', onPress: () => router.back() },
      ]
    );
  }

  // ---------------------------------------------------------------------------
  // Loading / not found
  // ---------------------------------------------------------------------------

  if (!ready || !recipe) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSub }]}>Yukleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Completion screen
  // ---------------------------------------------------------------------------

  if (showCompletion) {
    const elapsedMs =
      Date.now() - new Date(sessionStartedAt).getTime();
    const elapsedMinutes = Math.round(elapsedMs / 60000);

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <CompletionScreen
          recipeName={recipe.title}
          totalCookingTime={elapsedMinutes}
          onComplete={handleCompletion}
        />
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Determine bottom bar button labels
  // ---------------------------------------------------------------------------

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === recipe.steps.length - 1;
  const nextLabel = isLastStep ? 'Bitir' : 'Sonraki';

  // ---------------------------------------------------------------------------
  // Main render — uses adapted data
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: colors.background }]}>
        <View style={styles.topBarButtons}>
          <Pressable
            onPress={handleExitPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
          >
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </Pressable>

          <Pressable
            onPress={sefim.open}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Sef'im"
          >
            <SefimPulse active={sefim.lingerActive}>
              <MaterialCommunityIcons name="chef-hat" size={24} color={colors.tint} />
            </SefimPulse>
          </Pressable>
        </View>

        <SegmentedProgressBar
          totalSteps={recipe.steps.length}
          currentStep={currentStep}
        />
      </View>

      {/* PagerView — step pages + completion */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialPage}
        onPageSelected={(e) => handlePageSelected(e.nativeEvent.position)}
      >
        {adaptation.adaptedSteps.map((step, idx) => (
          <View key={idx} style={styles.pageContainer}>
            <StepContent
              recipeId={id as string}
              step={step}
              stepIndex={idx}
              totalSteps={recipe.steps.length}
              timerDisplaySeconds={
                timer.stepIndex === idx ? displaySeconds : undefined
              }
              timerIsRunning={timer.stepIndex === idx && timer.isRunning}
              timerStepIndex={timer.stepIndex}
              onTimerStart={() =>
                handleTimerStart(idx, step.timerSeconds ?? 0)
              }
              onTimerPause={handleTimerPause}
              onTimerResume={handleTimerResume}
            />
          </View>
        ))}

        {/* Completion page (extra page after last step) */}
        <View key="completion" style={styles.pageContainer}>
          <CompletionScreen
            recipeName={recipe.title}
            totalCookingTime={Math.round(
              (Date.now() - new Date(sessionStartedAt).getTime()) / 60000
            )}
            onComplete={handleCompletion}
          />
        </View>
      </PagerView>

      {/* Floating timer indicator */}
      {timer.stepIndex != null && timer.isRunning && (
        <TimerIndicator
          timerStepIndex={timer.stepIndex}
          currentStepIndex={currentStep}
          displaySeconds={displaySeconds}
          onPress={goToTimerStep}
        />
      )}

      {/* Ingredients sheet modal — adapted data */}
      <IngredientsSheet
        ingredientGroups={adaptation.adaptedGroups}
        checkedIndices={ingredientChecks}
        onToggleCheck={handleIngredientToggle}
        visible={showIngredients}
        onClose={() => setShowIngredients(false)}
        onSwap={handleSwap}
        onResetSwap={handleResetSwap}
        swaps={adaptation.swaps}
      />

      {/* Sef'im AI companion sheet */}
      <SefimSheet
        visible={sefim.isOpen}
        onClose={sefim.close}
        chips={recipe.steps[currentStep]?.sefimQA ?? []}
        messages={sefim.messages}
        isLoading={sefim.isLoading}
        onChipTap={sefim.handleChipTap}
        onSendQuestion={sefim.handleOpenQuestion}
      />

      {/* Bottom navigation bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <ScalePressable
          style={[styles.ingredientsButton, { borderColor: colors.border }]}
          onPress={() => setShowIngredients(true)}
          accessibilityRole="button"
          accessibilityLabel="Malzemeler"
        >
          <MaterialCommunityIcons
            name="format-list-checks"
            size={20}
            color={colors.tint}
          />
          <Text style={[styles.ingredientsButtonText, { color: colors.tint }]}>Malzemeler</Text>
        </ScalePressable>

        <View style={styles.navButtons}>
          {!isFirstStep && (
            <ScalePressable
              style={styles.prevButton}
              onPress={goToPreviousStep}
              accessibilityRole="button"
              accessibilityLabel="Geri"
            >
              <Text style={[styles.prevButtonText, { color: colors.textSub }]}>Geri</Text>
            </ScalePressable>
          )}

          <ScalePressable
            style={[styles.nextButton, { backgroundColor: colors.tint }]}
            onPress={goToNextStep}
            accessibilityRole="button"
            accessibilityLabel={nextLabel}
          >
            <Text style={[styles.nextButtonText, { color: colors.onTint }]}>{nextLabel}</Text>
          </ScalePressable>
        </View>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },

  // Top bar
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topBarButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  // PagerView
  pager: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  ingredientsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  ingredientsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prevButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  prevButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  nextButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
