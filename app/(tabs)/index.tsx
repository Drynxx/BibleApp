import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Check,
  Flame,
  Leaf,
  LogOut,
  Sun,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';
import { Palette, Typography } from '@/constants/theme';
import { useAuth } from '../../src/services/authContext';
import { useCovenant } from '../../src/services/covenantContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const [started, setStarted] = useState(false);
  const { profile, signOut } = useAuth();
  const { activeCovenant, myTodayReview } = useCovenant();
  
  const displayName = profile?.displayName || 'Sarah';
  const streak = activeCovenant?.shared_streak || 12;
  const isDoneToday = !!myTodayReview && myTodayReview.status === 'completed';

  const collections = [
    {
      title: t('collections.psalms', 'Psalms of\nComfort'),
      icon: Leaf,
      toneBg: Palette.sageLight,
      accentColor: Palette.sage,
    },
    {
      title: t('collections.fruit', 'Fruit of\nthe Spirit'),
      icon: 'fruit' as const,
      toneBg: Palette.primaryLight,
      accentColor: Palette.gold,
    },
    {
      title: t('collections.proverbs', 'Proverbs\nWisdom'),
      icon: Sun,
      toneBg: Palette.goldLight,
      accentColor: Palette.gold,
    },
  ];

  const week = [
    { day: t('progress.mon', 'Mon'), done: true },
    { day: t('progress.tue', 'Tue'), done: true },
    { day: t('progress.wed', 'Wed'), done: true },
    { day: t('progress.thu', 'Thu'), done: true },
    { day: t('progress.fri', 'Fri'), done: true },
    { day: t('progress.sat', 'Sat'), done: true },
    { day: t('progress.sun', 'Sun'), done: false },
  ];

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
        <View style={styles.headerBrand}>
          <View style={styles.logoBadge}>
            <Leaf color={Palette.gold} size={30} strokeWidth={1.8} style={{ transform: [{ rotate: '-12deg' }] }} />
          </View>
          <View>
            <Text style={styles.brandTitle}>{t('login.title', 'Inscribe')}</Text>
            <Text style={styles.brandSubtitle}>{t('progress.subtitle', 'SMALL STEPS. DEEPER FAITH.')}</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          accessibilityLabel="Log out"
          onPress={() => signOut()}
        >
          <LogOut color={Palette.foreground} size={20} />
        </Pressable>
      </View>

      {/* Greeting */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingTitle}>{t('home.goodMorning', 'Good morning')}, {displayName}</Text>
        <View style={styles.streakRow}>
          <Text style={styles.streakText}>{t('home.dayStreak', { streak, defaultValue: `Day ${streak} streak` })}</Text>
          <Flame color={Palette.primary} fill={Palette.primary} size={22} />
        </View>
      </View>

      {/* Streak Summary Card */}
      <View style={styles.card}>
        <View style={styles.streakCardHeader}>
          <View style={styles.flameCircle}>
            <Flame color={Palette.primary} fill={Palette.primary} size={30} />
          </View>
          <View style={styles.streakNumbers}>
            <Text style={styles.streakCount}>{t('home.streakDays', { streak, defaultValue: `${streak} days` })}</Text>
            <Text style={styles.streakCaption}>{t('verse.keepGoing', 'KEEP GOING')}</Text>
          </View>
        </View>

        {/* Weekly indicators */}
        <View style={styles.weekRow}>
          {week.map((item) => (
            <View key={item.day} style={styles.dayCol}>
              <View
                style={[
                  styles.dayBadge,
                  item.done ? styles.dayBadgeActive : styles.dayBadgeInactive,
                ]}
              >
                {item.done && <Check color="#FFFFFF" size={12} strokeWidth={2.5} />}
              </View>
              <Text style={styles.dayLabel}>{item.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Featured Verse Card */}
      <Pressable
        style={({ pressed }) => [styles.verseCard, pressed && { opacity: 0.96 }]}
        onPress={() => router.push('/verse')}
      >
        {/* Background decorative blob */}
        <View style={styles.verseBlobOne} />
        <View style={styles.verseBlobTwo} />

        <View style={styles.verseBadge}>
          <Text style={styles.verseBadgeText}>JOHN 3:16</Text>
        </View>

        <Text style={styles.verseQuote}>
          {t('home.verseQuote', '“For God so loved the world, that he gave his one and only Son...”')}
        </Text>

        <Text style={styles.verseFootnote}>{t('home.loveChanges', 'A LOVE THAT CHANGES EVERYTHING')}</Text>
      </Pressable>

      {/* Start Practice CTA */}
      <Pressable
        style={({ pressed }) => [
          styles.ctaButton,
          isDoneToday && { backgroundColor: Palette.primary }, // Make it solid if done
          pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
        ]}
        onPress={() => {
          setStarted(true);
          router.push('/practice');
        }}
      >
        {isDoneToday || started ? (
          <View style={styles.ctaContent}>
            <Check color="#FFFFFF" size={20} strokeWidth={2} />
            <Text style={styles.ctaText}>{t('home.completed', 'Completed')}</Text>
          </View>
        ) : (
          <View style={styles.ctaContent}>
            <Text style={styles.ctaText}>{t('home.startToday', 'Start today’s verse')}</Text>
            <ArrowRight color="#FFFFFF" size={20} strokeWidth={2} />
          </View>
        )}
      </Pressable>

      {/* Continue Journey Collections */}
      <View style={styles.collectionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.continueJourney', 'Continue your journey')}</Text>
          <Pressable style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>{t('progress.seeAll', 'See all')}</Text>
            <ArrowRight color={Palette.primary} size={15} />
          </Pressable>
        </View>

        <View style={styles.collectionsGrid}>
          {collections.map((item) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={item.title}
                style={({ pressed }) => [
                  styles.collectionCard,
                  { backgroundColor: item.toneBg },
                  pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => router.push('/verse')}
              >
                <View style={styles.collectionIconContainer}>
                  {Icon === 'fruit' ? (
                    <View style={styles.fruitIconWrapper}>
                      <View style={[styles.fruitDot, { backgroundColor: Palette.primary, bottom: 2, left: 2 }]} />
                      <View style={[styles.fruitDot, { backgroundColor: Palette.gold, top: 4, right: 4 }]} />
                      <Leaf color={Palette.sage} size={18} style={{ transform: [{ rotate: '45deg' }] }} />
                    </View>
                  ) : (
                    <Icon color={item.accentColor} size={30} strokeWidth={1.7} />
                  )}
                </View>

                <Text style={styles.collectionTitle}>{item.title}</Text>
                <Text style={styles.collectionCount}>{t('home.sevenVerses', '7 VERSES')}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
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
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 28,
    color: Palette.foreground,
    lineHeight: 30,
  },
  brandSubtitle: {
    fontFamily: Typography.sansBold,
    fontSize: 9,
    letterSpacing: 1.8,
    color: Palette.primary,
    marginTop: 2,
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
  greetingSection: {
    marginTop: 28,
  },
  greetingTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 32,
    color: Palette.foreground,
    lineHeight: 38,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  streakText: {
    fontFamily: Typography.sansMedium,
    fontSize: 19,
    color: Palette.primary,
  },
  card: {
    marginTop: 22,
    backgroundColor: Palette.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  streakCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  flameCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakNumbers: {
    justifyContent: 'center',
  },
  streakCount: {
    fontFamily: Typography.sansBold,
    fontSize: 26,
    color: Palette.foreground,
    lineHeight: 30,
  },
  streakCaption: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Palette.primary,
    marginTop: 2,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  dayCol: {
    alignItems: 'center',
  },
  dayBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeActive: {
    backgroundColor: Palette.primary,
  },
  dayBadgeInactive: {
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.background,
  },
  dayLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: 11,
    color: Palette.mutedForeground,
    marginTop: 6,
  },
  verseCard: {
    marginTop: 18,
    backgroundColor: Palette.paper,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  verseBlobOne: {
    position: 'absolute',
    bottom: -60,
    right: -20,
    width: 200,
    height: 180,
    borderRadius: 90,
    backgroundColor: Palette.secondary,
    opacity: 0.45,
    transform: [{ rotate: '-10deg' }],
  },
  verseBlobTwo: {
    position: 'absolute',
    top: 15,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.gold,
    opacity: 0.2,
  },
  verseBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  verseBadgeText: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#FFFFFF',
  },
  verseQuote: {
    fontFamily: Typography.serifMedium,
    fontSize: 24,
    lineHeight: 32,
    color: Palette.foreground,
    marginTop: 16,
  },
  verseFootnote: {
    fontFamily: Typography.sansBold,
    fontSize: 9,
    letterSpacing: 1.8,
    color: Palette.primary,
    marginTop: 16,
    opacity: 0.85,
  },
  ctaButton: {
    marginTop: 18,
    backgroundColor: Palette.primary,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaText: {
    fontFamily: Typography.sansBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  collectionsSection: {
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: Typography.sansBold,
    fontSize: 20,
    color: Palette.foreground,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontFamily: Typography.sansBold,
    fontSize: 14,
    color: Palette.primary,
  },
  collectionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  collectionCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  collectionIconContainer: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fruitIconWrapper: {
    width: 32,
    height: 32,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fruitDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  collectionTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 14,
    textAlign: 'center',
    color: Palette.foreground,
    marginTop: 8,
    lineHeight: 18,
  },
  collectionCount: {
    fontFamily: Typography.sansBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: Palette.primary,
    marginTop: 8,
  },
});
