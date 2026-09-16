import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Flame, ShieldAlert, Sparkles, Snowflake } from 'lucide-react-native';
import { Palette, Typography } from '../../../constants/theme';
import { DuoStreakState } from '../../engine/duoStreak';

interface DuoFlameProps {
  streak: number;
  state: DuoStreakState;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const DuoFlame: React.FC<DuoFlameProps> = ({
  streak,
  state,
  onPress,
  size = 'medium',
}) => {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.8);

  useEffect(() => {
    // Trigger celebratory spring bounce when completed
    if (state === 'COMPLETED_BOTH') {
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 220 }),
        withSpring(1, { damping: 10, stiffness: 180 })
      );
    } else if (state === 'AT_RISK') {
      scale.value = withSequence(
        withSpring(1.08, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 160 })
      );
    }
  }, [state]);

  const handlePressIn = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    scale.value = withSpring(0.92, { damping: 12, stiffness: 240 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 180 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Visual styling based on state
  const isCompleted = state === 'COMPLETED_BOTH';
  const isAtRisk = state === 'AT_RISK';
  const isFrozen = state === 'SAVED_BY_FREEZE';
  const isBroken = state === 'BROKEN';

  const flameColor = isCompleted
    ? '#F59E0B' // bright amber/gold
    : isAtRisk
    ? '#EF4444' // red warning
    : isFrozen
    ? '#38BDF8' // ice blue
    : isBroken
    ? '#71717A' // zinc gray
    : Palette.primary; // terracotta rust

  const badgeBg = isCompleted
    ? 'rgba(245, 158, 11, 0.15)'
    : isAtRisk
    ? 'rgba(239, 68, 68, 0.15)'
    : isFrozen
    ? 'rgba(56, 189, 248, 0.15)'
    : isBroken
    ? 'rgba(113, 113, 122, 0.12)'
    : 'rgba(158, 67, 36, 0.12)';

  const iconSize = size === 'large' ? 42 : size === 'medium' ? 28 : 18;
  const numFontSize = size === 'large' ? 44 : size === 'medium' ? 28 : 16;
  const containerPadding = size === 'large' ? 24 : size === 'medium' ? 16 : 8;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: badgeBg, padding: containerPadding },
        animatedStyle,
      ]}
    >
      <View style={styles.iconRow}>
        {isFrozen ? (
          <Snowflake color={flameColor} size={iconSize} />
        ) : isAtRisk ? (
          <ShieldAlert color={flameColor} size={iconSize} />
        ) : isCompleted ? (
          <View style={styles.completedFlameWrapper}>
            <Flame color={flameColor} size={iconSize} fill={flameColor} />
            <Sparkles color="#FBBF24" size={14} style={styles.sparkleIcon} />
          </View>
        ) : (
          <Flame color={flameColor} size={iconSize} />
        )}

        <Text
          style={[
            styles.streakNumber,
            { fontSize: numFontSize, color: flameColor },
          ]}
        >
          {streak}
        </Text>
      </View>

      <Text style={[styles.streakLabel, { color: flameColor }]}>
        {isCompleted
          ? 'DAY STREAK • COMPLETED'
          : isAtRisk
          ? 'AT RISK • 10 PM NUDGE'
          : isFrozen
          ? 'SAVED BY FREEZE'
          : isBroken
          ? 'STREAK RESET'
          : 'DAY STREAK'}
      </Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedFlameWrapper: {
    position: 'relative',
  },
  sparkleIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  streakNumber: {
    fontFamily: Typography.serifSemiBold,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  streakLabel: {
    fontFamily: Typography.sansBold,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
});
