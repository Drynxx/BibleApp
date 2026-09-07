import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { tokens } from "@/theme/tokens";
import { DuoFlameCard } from "@/components/streak/DuoFlameCard";
import { TactileButton } from "@/components/ui/TactileButton";
import { verseRepository, Verse } from "@/services/db/verseRepository";

interface HomeScreenProps {
  onStartDrill: (verseId?: string) => void;
  onOpenLibrary: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartDrill,
  onOpenLibrary,
}) => {
  const todayVerse: Verse =
    verseRepository.getById("v-1") || verseRepository.getAll("VDC")[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* macOS Style Window Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandTitle}>Inscribe</Text>
            <Text style={styles.brandSubtitle}>DAILY SCRIPTURE MEMORY • DUO HABIT</Text>
          </View>
          <View style={styles.datePill}>
            <Text style={styles.dateText}>TODAY • PROVERBS 3:3</Text>
          </View>
        </View>

        {/* Duo Streak Accountability Card */}
        <DuoFlameCard
          streakCount={21}
          longestStreak={42}
          partnerName="Andrei"
          userCompletedToday={false}
          partnerCompletedToday={false}
        />

        {/* Featured Daily Scripture Card with Tactile 3D CTA */}
        <View style={styles.verseCard}>
          <View style={styles.verseCardHeader}>
            <View style={styles.themePill}>
              <Text style={styles.themeText}>{todayVerse.theme}</Text>
            </View>
            <Text style={styles.verseCitation}>
              {todayVerse.book} {todayVerse.chapter}:{todayVerse.verse_number} • {todayVerse.translation}
            </Text>
          </View>

          <Text style={styles.verseQuote}>"{todayVerse.text}"</Text>

          <View style={styles.verseCardFooter}>
            <View style={styles.timeCluster}>
              <Feather name="clock" size={13} color={tokens.colors.inkMuted} />
              <Text style={styles.estimatedTime}>60-second active recall</Text>
            </View>

            <View style={styles.ctaWrapper}>
              <TactileButton
                title="Inscribe Verse"
                onPress={() => onStartDrill(todayVerse.id)}
                variant="primary"
                size="md"
                rightIcon={<Feather name="arrow-right" size={15} color="#FFFFFF" />}
              />
            </View>
          </View>
        </View>

        {/* Habit & Retention Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>HABIT & RETENTION METRICS</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>18</Text>
              <Text style={styles.statLabel}>Verses Inscribed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>96%</Text>
              <Text style={styles.statLabel}>Recall Accuracy</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>1</Text>
              <Text style={styles.statLabel}>Freeze Remaining</Text>
            </View>
          </View>
        </View>

        {/* Explore More Verses Action */}
        <View style={styles.exploreBanner}>
          <View style={styles.exploreLeft}>
            <View style={styles.exploreIconBox}>
              <Feather name="compass" size={16} color={tokens.colors.inkPrimary} />
            </View>
            <View>
              <Text style={styles.exploreTitle}>Curated Verse Catalog</Text>
              <Text style={styles.exploreSubtitle}>30 bilingual verses across 6 themes</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.exploreButton}
            activeOpacity={0.75}
            onPress={onOpenLibrary}
          >
            <Text style={styles.exploreButtonText}>Browse</Text>
            <Feather name="chevron-right" size={13} color={tokens.colors.inkPrimary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.canvas, // #F8F9FA macOS canvas
  },
  scrollContent: {
    paddingBottom: tokens.spacing.s32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: tokens.spacing.s20,
    paddingTop: tokens.spacing.s16,
    paddingBottom: tokens.spacing.s12,
  },
  brandTitle: {
    ...tokens.typography.headingLg,        // 38px Lyon Display, weight 300, 0.9 line-height
    color: tokens.colors.inkPrimary,
  },
  brandSubtitle: {
    ...tokens.typography.uppercaseTracked, // 11px with 0.1820em tracking
    color: tokens.colors.inkMuted,
    marginTop: tokens.spacing.s4,
  },
  datePill: {
    paddingHorizontal: tokens.spacing.s12,
    paddingVertical: tokens.spacing.s6,
    borderRadius: tokens.radii.buttons,    // 8px
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
    ...tokens.shadows.subtle,
  },
  dateText: {
    ...tokens.typography.monoLabel,
    fontSize: 10,
    lineHeight: 14,
    color: tokens.colors.inkSecondary,
  },
  verseCard: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.featureCards,// 30px
    padding: tokens.spacing.s24,
    marginHorizontal: tokens.spacing.s16,
    marginVertical: tokens.spacing.s8,
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
    ...tokens.shadows.card,
  },
  verseCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacing.s16,
  },
  themePill: {
    paddingHorizontal: tokens.spacing.s8,
    paddingVertical: tokens.spacing.s4,
    borderRadius: tokens.radii.buttons,
    backgroundColor: tokens.colors.cardWash,
  },
  themeText: {
    ...tokens.typography.uppercaseTracked,
    fontSize: 10,
    color: tokens.colors.inkSecondary,
  },
  verseCitation: {
    ...tokens.typography.monoLabel,
    fontSize: 11,
    lineHeight: 16,
    color: tokens.colors.inkMuted,
    textTransform: "none",
  },
  verseQuote: {
    fontFamily: tokens.typography.fontFamilies.serif, // Lyon Display / DM Serif Display light
    fontSize: 21,
    fontWeight: "300",
    color: tokens.colors.inkPrimary,
    lineHeight: 32,
    marginBottom: tokens.spacing.s20,
    letterSpacing: -0.2,
  },
  verseCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: tokens.colors.borderSubtle,
    paddingTop: tokens.spacing.s16,
  },
  timeCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.s6,
  },
  estimatedTime: {
    fontFamily: tokens.typography.fontFamilies.mono,
    fontSize: 11,
    color: tokens.colors.inkMuted,
  },
  ctaWrapper: {
    minWidth: 155,
  },
  statsSection: {
    marginHorizontal: tokens.spacing.s16,
    marginTop: tokens.spacing.s16,
    marginBottom: tokens.spacing.s8,
  },
  sectionTitle: {
    ...tokens.typography.uppercaseTracked,
    color: tokens.colors.inkMuted,
    marginBottom: tokens.spacing.s12,
  },
  statsGrid: {
    flexDirection: "row",
    gap: tokens.spacing.s10,
  },
  statCard: {
    flex: 1,
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.statBlocks, // 16px
    padding: tokens.spacing.s16,
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
    alignItems: "center",
    ...tokens.shadows.subtle,
  },
  statNumber: {
    fontFamily: tokens.typography.fontFamilies.mono,
    fontSize: 22,
    fontWeight: "500",
    color: tokens.colors.inkPrimary,
  },
  statLabel: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 11,
    color: tokens.colors.inkSecondary,
    marginTop: tokens.spacing.s4,
    textAlign: "center",
  },
  exploreBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.cards,      // 16px
    padding: tokens.spacing.s16,
    marginHorizontal: tokens.spacing.s16,
    marginTop: tokens.spacing.s12,
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
    ...tokens.shadows.subtle,
  },
  exploreLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.s12,
  },
  exploreIconBox: {
    width: 32,
    height: 32,
    borderRadius: tokens.radii.inputs,     // 8px
    backgroundColor: tokens.colors.cardWash,
    alignItems: "center",
    justifyContent: "center",
  },
  exploreTitle: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 14,
    fontWeight: "500",
    color: tokens.colors.inkPrimary,
  },
  exploreSubtitle: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 12,
    color: tokens.colors.inkMuted,
    marginTop: 1,
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.s4,
    paddingHorizontal: tokens.spacing.s12,
    paddingVertical: tokens.spacing.s6,
    borderRadius: tokens.radii.buttons,    // 8px
    backgroundColor: tokens.colors.cardWash,
  },
  exploreButtonText: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 12,
    fontWeight: "500",
    color: tokens.colors.inkPrimary,
  },
});

