import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Leaf,
  MoreVertical,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { Palette, Typography } from '@/constants/theme';
import { useDailyPractice } from '../src/hooks/useDailyPractice';

const R = 42;
const C = 2 * Math.PI * R;

export default function VerseDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { currentSession } = useDailyPractice();
  const targetProgress = currentSession.masteryPercentage;
  const verse = currentSession.verse;
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(targetProgress);
    }, 150);
    return () => clearTimeout(timer);
  }, [targetProgress]);

  const strokeDashoffset = C - (C * animatedProgress) / 100;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top + 8, 20), paddingBottom: insets.bottom + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <ArrowLeft color={Palette.foreground} size={22} />
        </Pressable>

        <Text style={styles.headerTitle}>{t('verse.detail')}</Text>

        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          accessibilityLabel="Open menu"
        >
          <MoreVertical color={Palette.foreground} size={20} />
        </Pressable>
      </View>

      {/* Reference Tags */}
      <View style={styles.tagRow}>
        <View style={styles.goldBadge}>
          <Text style={styles.goldBadgeText}>{verse.reference.toUpperCase()}</Text>
        </View>
        <View style={styles.tagDivider} />
        <Text style={styles.translationText}>{verse.translation}</Text>
      </View>

      {/* Verse Scripture Text */}
      <Text style={styles.verseScripture}>
        {verse.text}
      </Text>

      {/* Memorization Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.ringWrapper}>
          <Svg width={96} height={96} viewBox="0 0 100 100" style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle
              cx={50}
              cy={50}
              r={R}
              stroke={Palette.secondary}
              strokeWidth={7}
              fill="none"
              opacity={0.6}
            />
            <Circle
              cx={50}
              cy={50}
              r={R}
              stroke={Palette.primary}
              strokeWidth={7}
              strokeDasharray={`${C} ${C}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
          <View style={styles.ringCenterText}>
            <Text style={styles.ringPercentageText}>{targetProgress}%</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>{targetProgress}% {t('verse.memorized')}</Text>
          <Text style={styles.progressSub}>{t('verse.keepGoing')}</Text>
        </View>
      </View>

      {/* Reflection Card */}
      <View style={styles.reflectionCard}>
        <View style={styles.reflectionBlob} />
        <View style={styles.reflectionHeader}>
          <Leaf color={Palette.gold} size={20} strokeWidth={1.8} style={{ transform: [{ rotate: '-12deg' }] }} />
          <Text style={styles.reflectionTitle}>{t('verse.reflection')}</Text>
        </View>
        <Text style={styles.reflectionBody}>
          This verse is the heart of the gospel — God’s love expressed through sacrifice.
        </Text>
      </View>

      {/* CTA Button */}
      <Pressable
        style={({ pressed }) => [
          styles.ctaButton,
          pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
        ]}
        onPress={() => router.push('/inscribe')}
      >
        <Text style={styles.ctaText}>{t('verse.continue')}</Text>
        <ArrowRight color="#FFFFFF" size={20} strokeWidth={2} style={styles.ctaArrow} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: Typography.sansBold,
    fontSize: 18,
    color: Palette.foreground,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  pressed: {
    opacity: 0.6,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 26,
  },
  goldBadge: {
    backgroundColor: Palette.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  goldBadgeText: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#FFFFFF',
  },
  tagDivider: {
    width: 1,
    height: 20,
    backgroundColor: Palette.border,
  },
  translationText: {
    fontFamily: Typography.sansBold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: Palette.mutedForeground,
  },
  verseScripture: {
    fontFamily: Typography.serifMedium,
    fontSize: 26,
    lineHeight: 38,
    color: Palette.foreground,
    marginTop: 22,
  },
  progressCard: {
    marginTop: 28,
    backgroundColor: Palette.card,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  ringWrapper: {
    position: 'relative',
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercentageText: {
    fontFamily: Typography.sansBold,
    fontSize: 20,
    color: Palette.foreground,
  },
  cardDivider: {
    width: 1,
    height: 48,
    backgroundColor: Palette.border,
    marginHorizontal: 18,
  },
  progressInfo: {
    flex: 1,
  },
  progressLabel: {
    fontFamily: Typography.sansBold,
    fontSize: 17,
    color: Palette.foreground,
  },
  progressSub: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: Palette.gold,
    marginTop: 4,
  },
  reflectionCard: {
    marginTop: 18,
    backgroundColor: Palette.paper,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: Palette.border,
    position: 'relative',
    overflow: 'hidden',
  },
  reflectionBlob: {
    position: 'absolute',
    bottom: -40,
    right: -20,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Palette.secondary,
    opacity: 0.35,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reflectionTitle: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    letterSpacing: 1.8,
    color: Palette.gold,
  },
  reflectionBody: {
    fontFamily: Typography.sans,
    fontSize: 15,
    lineHeight: 24,
    color: Palette.foreground,
    marginTop: 12,
    opacity: 0.9,
  },
  ctaButton: {
    marginTop: 26,
    backgroundColor: Palette.primary,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.3)',
    elevation: 3,
  },
  ctaText: {
    fontFamily: Typography.sansBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  ctaArrow: {
    position: 'absolute',
    right: 22,
  },
});
