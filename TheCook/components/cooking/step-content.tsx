import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { CircularTimer } from './circular-timer';
import { getRecipeImages } from '@/app/assets/image-registry';
import { useAppTheme } from '@/contexts/ThemeContext';
import { STEP_PASTEL_BACKGROUNDS } from '@/constants/palette';
import type { RecipeStep } from '@/src/types/recipe';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface StepContentProps {
  recipeId: string;
  step: RecipeStep;
  stepIndex: number;
  totalSteps: number;
  /** Timer display props — optional, managed by parent via useCookingTimer */
  timerDisplaySeconds?: number;
  timerIsRunning?: boolean;
  timerStepIndex?: number | null;
  onTimerStart?: () => void;
  onTimerPause?: () => void;
  onTimerResume?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepContent({
  recipeId,
  step,
  stepIndex,
  totalSteps,
  timerDisplaySeconds = 0,
  timerIsRunning = false,
  timerStepIndex = null,
  onTimerStart,
  onTimerPause,
  onTimerResume,
}: StepContentProps) {
  const [whyExpanded, setWhyExpanded] = useState(false);
  const { isDark, colors } = useAppTheme();

  const bgColor = isDark ? colors.card : STEP_PASTEL_BACKGROUNDS[stepIndex % STEP_PASTEL_BACKGROUNDS.length];

  const images = getRecipeImages(recipeId, totalSteps);
  const stepImage = images.steps[stepIndex] ?? null;
  const stepBlurhash = images.stepBlurhashes[stepIndex] ?? null;

  const hasTimer = step.timerSeconds != null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Step image or pastel color placeholder with overlapping timer */}
      <View style={styles.imageWrapper}>
        {stepImage ? (
          <Image
            source={stepImage}
            placeholder={stepBlurhash ? { blurhash: stepBlurhash } : undefined}
            placeholderContentFit="cover"
            contentFit="cover"
            transition={200}
            style={styles.stepImage}
            testID="step-image"
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: bgColor }]} />
        )}
        {hasTimer && (
          <View style={[styles.timerOverlap, { backgroundColor: colors.background }]} testID="circular-timer">
            <CircularTimer
              totalSeconds={step.timerSeconds!}
              displaySeconds={timerDisplaySeconds || step.timerSeconds!}
              isRunning={timerIsRunning}
              onStart={onTimerStart ?? (() => {})}
              onPause={onTimerPause ?? (() => {})}
              onResume={onTimerResume ?? (() => {})}
            />
          </View>
        )}
      </View>

      {/* Step title */}
      <View style={[styles.titleRow, hasTimer && styles.titleRowWithTimer]}>
        <View>
          <Text style={[styles.stepLabel, { color: colors.textSub }]}>Adım {stepIndex + 1}</Text>
          {step.title ? <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text> : null}
        </View>
      </View>

      {/* Instruction text */}
      <Text style={[styles.instruction, { color: colors.text }]}>{step.instruction}</Text>

      {/* Checkpoint callout (green) */}
      {step.checkpoint ? (
        <View style={[styles.checkpointCallout, { backgroundColor: colors.successBg }]} testID="checkpoint-callout">
          <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
          <Text style={[styles.checkpointText, { color: colors.success }]}>{step.checkpoint}</Text>
        </View>
      ) : null}

      {/* Warning callout (amber) */}
      {step.warning ? (
        <View style={[styles.warningCallout, { backgroundColor: colors.warningBg }]} testID="warning-callout">
          <MaterialCommunityIcons name="alert" size={16} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.warning }]}>{step.warning}</Text>
        </View>
      ) : null}

      {/* Gormeli section */}
      <View style={styles.gormeliSection}>
        <Text style={[styles.gormeliLabel, { color: colors.textSub }]}>Gormeli (You should see)</Text>
        <Text style={[styles.gormeliText, { color: colors.success }]}>{step.looksLikeWhenDone}</Text>
      </View>

      {/* Neden? tap-to-reveal */}
      <Pressable onPress={() => setWhyExpanded(!whyExpanded)}>
        <Text style={[styles.nedenLink, { color: colors.tint }]}>Neden?</Text>
      </Pressable>
      {whyExpanded && (
        <Text style={[styles.whyText, { color: colors.textSecondary }]}>{step.why}</Text>
      )}

      {/* Dikkat section */}
      <View style={[styles.dikkatSection, { backgroundColor: colors.errorBg, borderLeftColor: colors.error }]}>
        <View style={styles.dikkatHeader}>
          <MaterialCommunityIcons name="alert-circle" size={18} color={colors.error} />
          <Text style={[styles.dikkatTitle, { color: colors.error }]}>Dikkat!</Text>
        </View>
        <Text style={[styles.dikkatBody, { color: colors.textSecondary }]}>{step.commonMistake}</Text>
        <Text style={[styles.recoveryLabel, { color: colors.textSub }]}>Ne yapmaliyim?</Text>
        <Text style={[styles.recoveryText, { color: colors.textSecondary }]}>{step.recovery}</Text>
      </View>

      {/* Bottom spacing */}
      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageWrapper: {
    position: 'relative',
  },
  imagePlaceholder: {
    height: 200,
    width: '100%',
  },
  stepImage: {
    height: 200,
    width: '100%',
  },
  timerOverlap: {
    position: 'absolute',
    bottom: -48,
    right: 16,
    zIndex: 10,
    borderRadius: 50,
    padding: 2,
  },
  titleRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  titleRowWithTimer: {
    paddingRight: 120,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  instruction: {
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  checkpointCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    padding: 10,
  },
  checkpointText: {
    fontSize: 14,
    flex: 1,
  },
  warningCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    padding: 10,
  },
  warningText: {
    fontSize: 14,
    flex: 1,
  },
  gormeliSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  gormeliLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  gormeliText: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  nedenLink: {
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  whyText: {
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dikkatSection: {
    marginHorizontal: 16,
    marginTop: 8,
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 14,
  },
  dikkatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dikkatTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  dikkatBody: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
  },
  recoveryLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  recoveryText: {
    fontSize: 14,
    lineHeight: 21,
  },
  bottomPad: {
    height: 40,
  },
});
