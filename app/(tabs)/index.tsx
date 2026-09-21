import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowRight,
  Check,
  Flame,
  Leaf,
  Sun,
} from 'lucide-react-native';
import React, { useState, useRef, useCallback } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';
import { Palette, Typography } from '@/constants/theme';
import { useAuth } from '../../src/services/authContext';
import { getBookName } from '../../src/constants/bibleBooks';
import { useCovenant } from '../../src/services/covenantContext';
import { useDailyPractice } from '../../src/hooks/useDailyPractice';
import { useUserProgress } from '../../src/hooks/useUserProgress';
import { VerseRepository } from '../../src/services/db/verseRepository';
import { QueueManager, PracticeQueueItem } from '../../src/services/practice/queueManager';
import { DiscoverService } from '../../src/services/discoverService';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [started, setStarted] = useState(false);
  const { profile, signOut, user } = useAuth();
  const { activeCovenant, myTodayReview } = useCovenant();

  const { currentSession } = useDailyPractice();
  const progress = useUserProgress();
  const [dbVerseText, setDbVerseText] = useState(currentSession.verse.text);
  const [activeCollections, setActiveCollections] = useState<any[]>([]);
  const [displayReference, setDisplayReference] = useState(currentSession.verse.reference);
  const [dailyVerseRef, setDailyVerseRef] = useState({ book: currentSession.verse.bookId, chapter: currentSession.verse.chapter, verse: currentSession.verse.verse });

  const formatReference = (book: number, chapter: number, verse: number) => {
    const langToUse = i18n.language === 'ro' ? 'vdcc' : 'kjv';
    const bookName = getBookName(book, langToUse);
    return `${bookName} ${chapter}:${verse}`;
  };

  const selectedTranslation = profile?.translation?.toLowerCase() || 'kjv';

  const refetchHomeData = async () => {
    let bookId = currentSession.verse.bookId;
    let chapter = currentSession.verse.chapter;
    let verse = currentSession.verse.verse;

    // Phase 1: Purely dynamic daily verse, ignore queue
    const dailyVerse = await DiscoverService.getVerseOfTheDay();
    if (dailyVerse) {
      bookId = dailyVerse.book;
      chapter = dailyVerse.chapter;
      verse = dailyVerse.verse;
      setDailyVerseRef({ book: bookId, chapter: chapter, verse: verse });
    }

    setDisplayReference(formatReference(bookId, chapter, verse));

    const text = await VerseRepository.getVerse(
      bookId,
      chapter,
      verse,
      selectedTranslation as 'kjv' | 'vdcc' | 'cornilescu'
    );
    if (text) {
      setDbVerseText(text);
    }

    if (user) {
      const collections = await QueueManager.getActiveCollections(user.id);
      setActiveCollections(collections);
    }
  };

  useFocusEffect(
    useCallback(() => {
      refetchHomeData();
    }, [currentSession, selectedTranslation, user, i18n.language])
  );

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await refetchHomeData();
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  }, [currentSession, selectedTranslation, user]);

  const displayName = profile?.displayName || 'Sarah';
  const streak = progress.currentStreak;
  const isDoneToday = progress.isDoneToday;

  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  // Old static collections removed per Phase 2

  const week = [
    { day: t('progress.mon'), done: true },
    { day: t('progress.tue'), done: true },
    { day: t('progress.wed'), done: true },
    { day: t('progress.thu'), done: true },
    { day: t('progress.fri'), done: true },
    { day: t('progress.sat'), done: true },
    { day: t('progress.sun'), done: false },
  ];

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 8, 20) }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor={Palette.primary}
          colors={[Palette.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.logoBadge, { transform: [{ rotate: '-12deg' }] }]}>
          <Leaf
            color={Palette.gold}
            size={30}
            strokeWidth={1.8}
          />
        </View>
      </View>

      {/* Greeting */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingTitle}>{t('home.goodMorning')}, {displayName}</Text>
        <View style={styles.streakRow}>
          <Text style={styles.streakText}>{t('home.dayStreak', { streak })}</Text>
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
            <Text style={styles.streakCount}>{t('home.streakDays', { streak })}</Text>
            <Text style={styles.streakCaption}>{t('verse.keepGoing')}</Text>
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
        onPress={() => {
          // TODO: Route to clean reading view
        }}
      >
        {/* Background decorative blob */}
        <View style={styles.verseBlobOne} />
        <View style={styles.verseBlobTwo} />

        <View style={styles.verseBadge}>
          <Text style={styles.verseBadgeText}>
            {displayReference.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.verseQuote}>
          "{dbVerseText}"
        </Text>

        <Text style={styles.verseFootnote}>{t('home.loveChanges')}</Text>
      </Pressable>

      {/* Start Practice CTA for Daily Verse */}
      <Pressable
        style={({ pressed }) => [
          styles.ctaButton,
          isDoneToday && { backgroundColor: Palette.primary },
          pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
        ]}
        onPress={() => {
          setStarted(true);
          router.push({
            pathname: '/inscribe',
            params: {
              book: dailyVerseRef.book,
              chapter: dailyVerseRef.chapter,
              verse: dailyVerseRef.verse
            }
          });
        }}
      >
        {isDoneToday || started ? (
          <View style={styles.ctaContent}>
            <Check color="#FFFFFF" size={20} strokeWidth={2} />
            <Text style={styles.ctaText}>{t('home.completed')}</Text>
          </View>
        ) : (
          <View style={styles.ctaContent}>
            <Text style={styles.ctaText}>{t('home.startToday')}</Text>
            <ArrowRight color="#FFFFFF" size={20} strokeWidth={2} />
          </View>
        )}
      </Pressable>

      {/* Continue Journey Collections */}
      {activeCollections.filter(c => c.dueCount > 0).length > 0 && (
        <View style={styles.collectionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.continueJourney')}</Text>
            <Pressable style={styles.seeAllButton} onPress={() => router.push('/(tabs)/discover')}>
              <Text style={styles.seeAllText}>{t('progress.seeAll')}</Text>
              <ArrowRight color={Palette.primary} size={15} />
            </Pressable>
          </View>

          <View style={styles.collectionsGrid}>
            {activeCollections.filter(c => c.dueCount > 0).map((collection, index) => {
            const progressPct = Math.min(100, Math.round(collection.progress * 100));
            const image = index % 2 === 0
              ? require('../../assets/images/plans/plan-anxiety.jpg')
              : require('../../assets/images/plans/plan-grief.jpg');

            return (
              <Pressable
                key={collection.planId}
                style={({ pressed }) => [
                  styles.collectionWideCard,
                  pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => router.push({
                  pathname: '/inscribe',
                  params: {
                    planId: collection.planId,
                    ...(collection.nextVerse ? {
                      book: collection.nextVerse.book,
                      chapter: collection.nextVerse.chapter,
                      verse: collection.nextVerse.verse,
                      queueId: collection.nextVerse.id
                    } : {})
                  }
                })}
              >
                <View style={styles.collectionImageWrapper}>
                  <Image source={image} style={styles.collectionImage} resizeMode="cover" />
                  <View style={styles.collectionImageProgressTrack}>
                    <View style={[styles.collectionImageProgressBar, { width: `${progressPct}%` }]} />
                  </View>
                </View>
                <View style={styles.collectionMetaRow}>
                  <Text style={styles.collectionTitle} numberOfLines={1}>
                    {collection.planId === 'my_saved_verses' ? String(t('progress.mySavedVerses', 'My Saved Verses')) : String(t(`discover.plansList.${collection.planId}.title`, { defaultValue: collection.title }))}
                  </Text>
                  <Text style={styles.collectionMetaDot}>·</Text>
                  <Text style={styles.collectionCountText}>{collection.dueCount} {String(t('home.due', 'due'))}</Text>
                </View>
                <View style={styles.collectionBottomTrack}>
                  <View style={[styles.collectionBottomBar, { width: `${progressPct}%` }]} />
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
      )}
    </ScrollView>
    </View>
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
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
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
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
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
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.3)',
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
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  collectionWideCard: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  collectionImageWrapper: {
    position: 'relative',
    aspectRatio: 2.75,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  collectionImage: {
    width: '100%',
    height: '100%',
    opacity: 0.55,
  },
  collectionImageProgressTrack: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
    zIndex: 2,
  },
  collectionImageProgressBar: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  collectionMetaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
    gap: 4,
  },
  collectionTitle: {
    fontFamily: Typography.sansBold,
    fontSize: 13,
    color: Palette.foreground,
    flexShrink: 1,
  },
  collectionMetaDot: {
    fontFamily: Typography.sansBold,
    fontSize: 13,
    color: Palette.mutedForeground,
  },
  collectionCountText: {
    fontFamily: Typography.sansBold,
    fontSize: 12,
    color: Palette.mutedForeground,
    flexShrink: 0,
  },
  collectionBottomTrack: {
    marginTop: 6,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.15)', // Primary with opacity
    overflow: 'hidden',
  },
  collectionBottomBar: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Palette.primary,
  },
});
