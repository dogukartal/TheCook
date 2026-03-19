import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ResumeBannerProps {
  recipeName: string;
  currentStep: number;
  totalSteps: number;
  onResume: () => void;
  onDismiss: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ResumeBanner({
  recipeName,
  currentStep,
  totalSteps,
  onResume,
  onDismiss,
}: ResumeBannerProps) {
  const { isDark, colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? 'rgba(232,131,74,0.15)' : '#FEF3EC' }]}>
      <Text style={[styles.prompt, { color: colors.text }]}>Yarim kalan tarifin var - devam et?</Text>
      <Text style={[styles.detail, { color: colors.textSub }]}>
        {recipeName} ({currentStep + 1}/{totalSteps})
      </Text>
      <View style={styles.buttonRow}>
        <Pressable
          style={styles.resumeButton}
          onPress={onResume}
          accessibilityRole="button"
          accessibilityLabel="Devam Et"
        >
          <Text style={styles.resumeButtonText}>Devam Et</Text>
        </Pressable>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
        >
          <Text style={[styles.dismissText, { color: colors.textSub }]}>Kapat</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF3EC',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  prompt: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A18',
    marginBottom: 4,
  },
  detail: {
    fontSize: 13,
    color: 'rgba(26,26,24,0.5)',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  resumeButton: {
    backgroundColor: '#E8834A',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 14,
  },
  resumeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissText: {
    color: 'rgba(26,26,24,0.5)',
    fontSize: 14,
  },
});
