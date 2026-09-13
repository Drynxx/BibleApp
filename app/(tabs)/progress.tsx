import { useRouter } from 'expo-router';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flame,
  Leaf,
  Moon,
  MoreVertical,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Palette, Typography } from '@/constants/theme';
import { useCovenant } from '../../src/services/covenantContext';

const months = ['October 2024', 'November 2024', 'December 2024'];
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const activity = [
  0, 1, 1, 1, 1, 1, 0,
  1, 1, 1, 0, 0, 1, 1,
  1, 1, 1, 1, 1, 1, 1,
  1, 0, 0, 1, 1, 0, 0,
  0, 0, 1, 0, 0, 1, 0,
];

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();

  const achievements = [
    {
      label: t('progress.achievement_7day'),
      Icon: Flame,
      bg: Palette.primaryLight,
      medallion: 'rgba(158, 67, 36, 0.18)',
      iconColor: Palette.primary,
    },
    {
      label: t('progress.achievement_firstBook'),
      Icon: BookOpen,
      bg: Palette.goldLight,
      medallion: 'rgba(198, 139, 53, 0.22)',
      iconColor: Palette.gold,
    },
    {
      label: t('progress.achievement_nightOwl'),
      Icon: Moon,
      bg: Palette.sageLight,
      medallion: 'rgba(90, 119, 94, 0.25)',
      iconColor: Palette.sage,
    },
    {
      label: t('progress.achievement_psalmsMaster'),
      Icon: Crown,
      bg: Palette.goldLight,
      medallion: 'rgba(198, 139, 53, 0.22)',
      iconColor: Palette.gold,
    },
  ];

  const mastered = [
    t('progress.mastered_philippians'),
    t('progress.mastered_psalm'),
    t('progress.mastered_jeremiah')
  ];
  const [monthIndex, setMonthIndex] = useState(1);
  const months = [
    t('progress.october'),
    t('progress.november'),
    t('progress.december')
  ];
  const weekdays = [
    t('progress.sun'),
    t('progress.mon'),
    t('progress.tue'),
    t('progress.wed'),
    t('progress.thu'),
    t('progress.fri'),
    t('progress.sat')
  ];
  const currentMonth = months[monthIndex] ?? months[1];

  const { partnerProfile, partnerTodayReview } = useCovenant();
  const partnerName = partnerProfile?.display_name || 'Your Partner';
  const partnerDone = !!partnerTodayReview && partnerTodayReview.status === 'completed';

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
        <Pressable style={styles.headerBrand} onPress={() => router.push('/')}>
          <View style={styles.logoBadge}>
            <Leaf color={Palette.gold} size={28} strokeWidth={1.8} style={{ transform: [{ rotate: '-12deg' }] }} />
          </View>
          <View>
            <Text style={styles.brandTitle}>{t('login.title')}</Text>
            <Text style={styles.brandSubtitle}>{t('progress.subtitle')}</Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          accessibilityLabel="Open menu"
        >
          <MoreVertical color={Palette.foreground} size={20} />
        </Pressable>
      </View>

      {/* Hero Stats */}
      <View style={styles.heroSection}>
        <Text style={styles.heroNumber}>47</Text>
        <Text style={styles.heroLabel}>{t('progress.versesMemorized')}</Text>
        <Text style={styles.heroCaption}>{t('progress.caption')}</Text>

        <View style={styles.watermarkWrapper}>
          <Leaf color={Palette.gold} size={90} strokeWidth={1.2} style={{ opacity: 0.22, transform: [{ rotate: '25deg' }] }} />
        </View>
      </View>

      {/* Partner Status Card */}
      {partnerProfile && (
        <View style={[styles.card, { marginTop: 24 }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>{t('progress.partnerTitle')}</Text>
              <Text style={styles.cardSubtitle}>{t('progress.partnerSubtitle')}</Text>
            </View>
            <View style={[styles.monthPill, partnerDone ? { backgroundColor: Palette.primary } : {}]}>
              <Text style={[styles.monthPillText, partnerDone ? { color: '#FFF' } : {}]}>
                {partnerDone ? 'Done' : 'Pending'}
              </Text>
            </View>
          </View>
          <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.navArrow, { width: 40, height: 40, borderRadius: 20 }]}>
              <Text style={{ fontFamily: Typography.sansBold, color: Palette.primary, fontSize: 16 }}>
                {partnerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={{ fontFamily: Typography.sansMedium, fontSize: 16, color: Palette.foreground }}>
              {partnerName}
            </Text>
          </View>
        </View>
      )}

      {/* Practice Days Calendar Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>{t('progress.practiceTitle')}</Text>
            <Text style={styles.cardSubtitle}>{currentMonth.toUpperCase()}</Text>
          </View>

          <View style={styles.monthControls}>
            <Pressable
              style={({ pressed }) => [
                styles.navArrow,
                monthIndex === 0 && styles.navDisabled,
                pressed && styles.pressed,
              ]}
              disabled={monthIndex === 0}
              onPress={() => setMonthIndex((v) => Math.max(0, v - 1))}
            >
              <ChevronLeft color={Palette.foreground} size={18} />
            </Pressable>

            <View style={styles.monthPill}>
              <Text style={styles.monthPillText}>{currentMonth.split(' ')[0]}</Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.navArrow,
                monthIndex === months.length - 1 && styles.navDisabled,
                pressed && styles.pressed,
              ]}
              disabled={monthIndex === months.length - 1}
              onPress={() => setMonthIndex((v) => Math.min(months.length - 1, v + 1))}
            >
              <ChevronRight color={Palette.foreground} size={18} />
            </Pressable>
          </View>
        </View>

        {/* Heatmap & Stats row */}
        <View style={styles.calendarBody}>
          <View style={styles.calendarGrid}>
            <View style={styles.weekdaysRow}>
              {weekdays.map((day) => (
                <Text key={day} style={styles.weekdayLabel}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.dotsGrid}>
              {activity.map((active, idx) => (
                <View key={idx} style={styles.dotCell}>
                  <View
                    style={[
                      styles.activityDot,
                      active ? styles.activityDotActive : styles.activityDotInactive,
                    ]}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Vertical divider and side stats */}
          <View style={styles.sideStats}>
            <Text style={styles.sideStatNumber}>18</Text>
            <Text style={styles.sideStatLabel}>{t('progress.daysMonth')}</Text>

            <View style={styles.goldLine} />

            <Text style={styles.sideStatNumber}>5</Text>
            <Text style={styles.sideStatLabel}>{t('progress.dayStreak')}</Text>

            <View style={styles.goldLine} />

            <Text style={styles.sideStatQuote}>{t('progress.quote')}</Text>
          </View>
        </View>
      </View>

      {/* Achievements Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('progress.achievements')}</Text>
          <Pressable style={styles.seeAllRow}>
            <Text style={styles.seeAllText}>{t('progress.seeAll')}</Text>
            <ChevronRight color={Palette.primary} size={16} />
          </Pressable>
        </View>

        <View style={styles.achievementsGrid}>
          {achievements.map((item) => {
            const Icon = item.Icon;
            return (
              <View key={item.label} style={[styles.achievementCard, { backgroundColor: item.bg }]}>
                <View style={[styles.medallion, { backgroundColor: item.medallion }]}>
                  <Icon color={item.iconColor} size={26} strokeWidth={1.8} />
                </View>
                <Text style={styles.achievementLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Recently Mastered Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('progress.mastered')}</Text>
          <Pressable style={styles.seeAllRow}>
            <Text style={styles.seeAllText}>{t('progress.seeAll')}</Text>
            <ChevronRight color={Palette.primary} size={16} />
          </Pressable>
        </View>

        <View style={styles.masteredList}>
          {mastered.map((verse, index) => (
            <Pressable
              key={verse}
              style={({ pressed }) => [
                styles.masteredRow,
                index < mastered.length - 1 && styles.rowBorder,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/verse')}
            >
              <View style={styles.checkMedallion}>
                <Check color="#FFFFFF" size={16} strokeWidth={2.4} />
              </View>

              <View style={styles.masteredInfo}>
                <Text style={styles.masteredName}>{verse}</Text>
                <Text style={styles.masteredTag}>— mastered</Text>
              </View>

              <ChevronRight color={Palette.mutedForeground} size={18} />
            </Pressable>
          ))}
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
  heroSection: {
    marginTop: 24,
    position: 'relative',
    minHeight: 120,
  },
  heroNumber: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 58,
    lineHeight: 64,
    color: Palette.foreground,
  },
  heroLabel: {
    fontFamily: Typography.serifMedium,
    fontSize: 24,
    color: Palette.foreground,
    marginTop: 2,
  },
  heroCaption: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    letterSpacing: 1.8,
    color: Palette.primary,
    marginTop: 8,
  },
  watermarkWrapper: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  card: {
    marginTop: 20,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: Typography.sansBold,
    fontSize: 18,
    color: Palette.foreground,
  },
  cardSubtitle: {
    fontFamily: Typography.sansBold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Palette.primary,
    marginTop: 3,
  },
  monthControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.secondary,
  },
  navDisabled: {
    opacity: 0.35,
  },
  monthPill: {
    backgroundColor: Palette.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  monthPillText: {
    fontFamily: Typography.sansMedium,
    fontSize: 12,
    color: Palette.foreground,
  },
  calendarBody: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 16,
  },
  calendarGrid: {
    flex: 1,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekdayLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: 11,
    color: Palette.mutedForeground,
    width: 24,
    textAlign: 'center',
  },
  dotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dotCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    marginVertical: 4,
  },
  activityDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  activityDotActive: {
    backgroundColor: Palette.primary,
  },
  activityDotInactive: {
    backgroundColor: Palette.secondary,
  },
  sideStats: {
    width: 85,
    borderLeftWidth: 1,
    borderLeftColor: Palette.border,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  sideStatNumber: {
    fontFamily: Typography.sansBold,
    fontSize: 24,
    color: Palette.foreground,
    lineHeight: 26,
  },
  sideStatLabel: {
    fontFamily: Typography.sansBold,
    fontSize: 8,
    letterSpacing: 1.2,
    color: Palette.primary,
    marginTop: 2,
  },
  goldLine: {
    height: 1,
    width: 20,
    backgroundColor: Palette.gold,
    marginVertical: 8,
  },
  sideStatQuote: {
    fontFamily: Typography.sansMedium,
    fontSize: 8,
    lineHeight: 11,
    color: Palette.mutedForeground,
  },
  sectionContainer: {
    marginTop: 26,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: Typography.sansBold,
    fontSize: 19,
    color: Palette.foreground,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontFamily: Typography.sansBold,
    fontSize: 13,
    color: Palette.primary,
  },
  achievementsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  achievementCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  medallion: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementLabel: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 11,
    textAlign: 'center',
    color: Palette.foreground,
    marginTop: 8,
    lineHeight: 14,
  },
  masteredList: {
    marginTop: 14,
    backgroundColor: Palette.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  masteredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  checkMedallion: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masteredInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  masteredName: {
    fontFamily: Typography.sansMedium,
    fontSize: 15,
    color: Palette.foreground,
  },
  masteredTag: {
    fontFamily: Typography.sans,
    fontSize: 13,
    color: Palette.primary,
    marginLeft: 6,
  },
});
