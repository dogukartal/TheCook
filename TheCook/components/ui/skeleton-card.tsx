import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SkeletonCardProps {
  variant: 'grid' | 'row';
}

// ---------------------------------------------------------------------------
// Shimmer block — opacity pulse between 0.4 and 1.0
// ---------------------------------------------------------------------------

function ShimmerBlock({ style }: { style?: object }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1, // infinite
      true, // reverse
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.shimmerBlock, style, animatedStyle]} />
  );
}

// ---------------------------------------------------------------------------
// SkeletonCard
// ---------------------------------------------------------------------------

export function SkeletonCard({ variant }: SkeletonCardProps) {
  if (variant === 'grid') {
    return (
      <View style={styles.gridCard}>
        {/* Image area placeholder */}
        <ShimmerBlock style={styles.gridImageArea} />
        {/* Meta row placeholders */}
        <View style={styles.gridMetaRow}>
          <ShimmerBlock style={styles.gridSkillBadge} />
          <ShimmerBlock style={styles.gridCookTime} />
        </View>
      </View>
    );
  }

  // variant === 'row'
  return (
    <View style={styles.rowCard}>
      {/* Thumbnail placeholder */}
      <ShimmerBlock style={styles.rowThumbnail} />
      {/* Content placeholders */}
      <View style={styles.rowContent}>
        <ShimmerBlock style={styles.rowTitleLine1} />
        <ShimmerBlock style={styles.rowTitleLine2} />
        <View style={styles.rowMetaRow}>
          <ShimmerBlock style={styles.rowSkillBadge} />
          <ShimmerBlock style={styles.rowCookTime} />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  shimmerBlock: {
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },

  // Grid variant — matches RecipeCardGrid dimensions
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    flex: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  gridImageArea: {
    height: 140,
    borderRadius: 0,
  },
  gridMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  gridSkillBadge: {
    width: 64,
    height: 18,
    borderRadius: 10,
  },
  gridCookTime: {
    width: 36,
    height: 14,
  },

  // Row variant — matches RecipeCardRow dimensions
  rowCard: {
    flexDirection: 'row',
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 8,
  },
  rowThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 0,
  },
  rowContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  rowTitleLine1: {
    height: 14,
    borderRadius: 4,
    marginBottom: 4,
  },
  rowTitleLine2: {
    height: 14,
    width: '60%',
    borderRadius: 4,
  },
  rowMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowSkillBadge: {
    width: 56,
    height: 16,
    borderRadius: 10,
  },
  rowCookTime: {
    width: 30,
    height: 12,
  },
});
