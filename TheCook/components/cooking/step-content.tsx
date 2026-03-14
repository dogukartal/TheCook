import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { CircularTimer } from './circular-timer';
import type { RecipeStep } from '@/src/types/recipe';

// ---------------------------------------------------------------------------
// Pastel palette for step image placeholders
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
// Props
// ---------------------------------------------------------------------------

export interface StepContentProps {
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

  const bgColor = STEP_PASTEL_COLORS[stepIndex % STEP_PASTEL_COLORS.length];

  const hasTimer = step.timerSeconds != null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Pastel color placeholder with overlapping timer */}
      <View style={styles.imageWrapper}>
        <View style={[styles.imagePlaceholder, { backgroundColor: bgColor }]} />
        {hasTimer && (
          <View style={styles.timerOverlap} testID="circular-timer">
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
          <Text style={styles.stepLabel}>Adım {stepIndex + 1}</Text>
          {step.title ? <Text style={styles.stepTitle}>{step.title}</Text> : null}
        </View>
      </View>

      {/* Instruction text */}
      <Text style={styles.instruction}>{step.instruction}</Text>

      {/* Gormeli section */}
      <View style={styles.gormeliSection}>
        <Text style={styles.gormeliLabel}>Gormeli (You should see)</Text>
        <Text style={styles.gormeliText}>{step.looksLikeWhenDone}</Text>
      </View>

      {/* Neden? tap-to-reveal */}
      <Pressable onPress={() => setWhyExpanded(!whyExpanded)}>
        <Text style={styles.nedenLink}>Neden?</Text>
      </Pressable>
      {whyExpanded && (
        <Text style={styles.whyText}>{step.why}</Text>
      )}

      {/* Dikkat section */}
      <View style={styles.dikkatSection}>
        <View style={styles.dikkatHeader}>
          <MaterialCommunityIcons name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.dikkatTitle}>Dikkat!</Text>
        </View>
        <Text style={styles.dikkatBody}>{step.commonMistake}</Text>
        <Text style={styles.recoveryLabel}>Ne yapmaliyim?</Text>
        <Text style={styles.recoveryText}>{step.recovery}</Text>
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
    backgroundColor: '#FFFFFF',
  },
  imageWrapper: {
    position: 'relative',
  },
  imagePlaceholder: {
    height: 200,
    width: '100%',
  },
  timerOverlap: {
    position: 'absolute',
    bottom: -48,
    right: 16,
    zIndex: 10,
    backgroundColor: '#FFFFFF',
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
    color: '#6B7280',
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  instruction: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  gormeliSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  gormeliLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  gormeliText: {
    fontSize: 15,
    color: '#15803D',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  nedenLink: {
    fontSize: 15,
    color: '#E07B39',
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  whyText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dikkatSection: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
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
    color: '#DC2626',
  },
  dikkatBody: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
    marginBottom: 8,
  },
  recoveryLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 2,
  },
  recoveryText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
  },
  bottomPad: {
    height: 40,
  },
});
