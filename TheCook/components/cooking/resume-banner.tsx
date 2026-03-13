import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

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
  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>Yarim kalan tarifin var - devam et?</Text>
      <Text style={styles.detail}>
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
          <Text style={styles.dismissText}>Kapat</Text>
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
    borderRadius: 12,
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
    color: '#111827',
    marginBottom: 4,
  },
  detail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  resumeButton: {
    backgroundColor: '#E07B39',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resumeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissText: {
    color: '#6B7280',
    fontSize: 14,
  },
});
