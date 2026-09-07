import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import {
  tokenizeVerse,
  generateMaskedTokens,
  MaskedToken,
  BlankingStage,
  normalizeDiacritics,
} from "@/engine/blanking";
import { WordCanvas } from "@/components/drill/WordCanvas";
import { WordTileTray, BankItem } from "@/components/drill/WordTileTray";
import { DuolingoProgressBar } from "@/components/drill/DuolingoProgressBar";
import { TactileButton } from "@/components/ui/TactileButton";
import { verseRepository, Verse } from "@/services/db/verseRepository";
import { tokens as themeTokens } from "@/theme/tokens";

interface DrillScreenProps {
  initialVerseId?: string;
  onFinish?: () => void;
  onBack?: () => void;
}

export const DrillScreen: React.FC<DrillScreenProps> = ({
  initialVerseId = "v-1",
  onFinish,
  onBack,
}) => {
  const [verse, setVerse] = useState<Verse>(() => {
    return verseRepository.getById(initialVerseId) || verseRepository.getAll("VDC")[0];
  });
  const [stage, setStage] = useState<BlankingStage>(1);
  const [tokens, setTokens] = useState<MaskedToken[]>([]);
  const [bank, setBank] = useState<BankItem[]>([]);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Victory modal animations
  const victoryScale = useRef(new Animated.Value(0.8)).current;
  const victoryOpacity = useRef(new Animated.Value(0)).current;
  const streakFlameScale = useRef(new Animated.Value(1)).current;

  // Raw tokens of the verse
  const baseTokens = useMemo(() => tokenizeVerse(verse.text), [verse.text]);

  // Setup tokens and bank for current stage
  const initStage = useCallback(
    (targetStage: BlankingStage) => {
      const { maskedTokens, wordBank } = generateMaskedTokens(baseTokens, targetStage);
      setTokens(maskedTokens);
      setBank(
        wordBank.map((word, idx) => ({
          id: `bank-${idx}-${word}`,
          word,
          used: false,
        }))
      );
    },
    [baseTokens]
  );

  useEffect(() => {
    initStage(stage);
  }, [stage, initStage]);

  // Contemplative timer: tracks elapsed seconds
  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  // Trigger celebration modal animation on finish
  useEffect(() => {
    if (isCompleted) {
      Animated.parallel([
        Animated.spring(victoryScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(victoryOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulsing flame animation in modal
      Animated.loop(
        Animated.sequence([
          Animated.timing(streakFlameScale, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(streakFlameScale, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isCompleted]);

  // Find next unfilled blank index
  const nextBlankIndex = tokens.findIndex((t) => t.isMasked && !t.userPlacedText);

  // Handle selecting a word from the tray
  const handleSelectWord = async (item: BankItem) => {
    if (nextBlankIndex === -1) return;

    const targetToken = tokens[nextBlankIndex];
    const isMatch =
      normalizeDiacritics(item.word) === normalizeDiacritics(targetToken.raw);

    if (isMatch) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}

      // Fill the slot
      const updatedTokens = [...tokens];
      updatedTokens[nextBlankIndex] = {
        ...targetToken,
        userPlacedText: item.word,
        isCorrect: true,
      };
      setTokens(updatedTokens);

      // Mark bank item as used
      setBank((prev) =>
        prev.map((b) => (b.id === item.id ? { ...b, used: true } : b))
      );

      // Check if all blanks filled in this stage
      const remainingBlanks = updatedTokens.filter((t) => t.isMasked && !t.userPlacedText);
      if (remainingBlanks.length === 0) {
        handleStageAdvance();
      }
    } else {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}

      // Temporary error visual on target slot
      const updatedTokens = [...tokens];
      updatedTokens[nextBlankIndex] = {
        ...targetToken,
        isCorrect: false,
      };
      setTokens(updatedTokens);

      setTimeout(() => {
        setTokens((current) =>
          current.map((t, idx) =>
            idx === nextBlankIndex ? { ...t, isCorrect: undefined } : t
          )
        );
      }, 400);
    }
  };

  // Undo a placed blank
  const handleBlankTap = async (token: MaskedToken, index: number) => {
    if (!token.userPlacedText) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    // Return to bank
    setBank((prev) => {
      let restored = false;
      return prev.map((b) => {
        if (!restored && b.word === token.userPlacedText && b.used) {
          restored = true;
          return { ...b, used: false };
        }
        return b;
      });
    });

    // Clear slot
    const updatedTokens = [...tokens];
    updatedTokens[index] = {
      ...token,
      userPlacedText: undefined,
      isCorrect: undefined,
    };
    setTokens(updatedTokens);
  };

  // Hint button: reveals first letter of the target blank
  const handleHint = async () => {
    if (nextBlankIndex === -1) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    const targetToken = tokens[nextBlankIndex];
    Alert.alert("Verse Hint", `Next word starts with "${targetToken.raw[0].toUpperCase()}"`);
  };

  // Advance stage or complete
  const handleStageAdvance = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    if (stage < 4) {
      setStage((prev) => (prev + 1) as BlankingStage);
    } else {
      setIsCompleted(true);
    }
  };

  // Toggle translation between Romanian and English
  const handleToggleTranslation = () => {
    const nextTrans = verse.translation === "VDC" ? "WEB" : "VDC";
    const nextVerse =
      verseRepository.getAll(nextTrans)[0] || verseRepository.getRandom(nextTrans);
    setVerse(nextVerse);
    setStage(1);
    setIsCompleted(false);
    setSecondsElapsed(0);
  };

  // Calculate Duolingo progress: Stage 1 = 25%, Stage 2 = 50%, Stage 3 = 75%, Stage 4 = 100%
  const stageProgress = stage === 1 ? 25 : stage === 2 ? 50 : stage === 3 ? 75 : 100;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar with macOS Window & Duolingo Progress */}
      <View style={styles.topBar}>
        <View style={styles.metaRow}>
          <View style={styles.titleWithBack}>
            {onBack && (
              <TouchableOpacity
                onPress={onBack}
                style={styles.backButton}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Exit drill"
              >
                <Feather name="arrow-left" size={16} color={themeTokens.colors.inkPrimary} />
              </TouchableOpacity>
            )}
            <Text style={styles.verseRef}>
              {verse.book} {verse.chapter}:{verse.verse_number}
            </Text>
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.timerBadge}>
              <Feather name="clock" size={11} color={themeTokens.colors.inkSecondary} />
              <Text style={styles.timerText}>{secondsElapsed}s</Text>
            </View>
            <TouchableOpacity
              style={styles.langPill}
              onPress={handleToggleTranslation}
              activeOpacity={0.75}
            >
              <Text style={styles.langText}>{verse.translation}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Duolingo Glossy Progress Bar */}
        <View style={styles.progressSection}>
          <DuolingoProgressBar progress={stageProgress} color="#10B981" height={12} />
        </View>

        {/* Stage Status Row */}
        <View style={styles.stageIndicatorRow}>
          <View style={styles.dotsGroup}>
            {[1, 2, 3, 4].map((s) => (
              <View
                key={s}
                style={[
                  styles.stageDot,
                  s === stage && styles.stageDotActive,
                  s < stage && styles.stageDotDone,
                ]}
              />
            ))}
          </View>
          <Text style={styles.stageLabel}>
            {stage === 1 && "STAGE 1 • INSCRIBE (READ)"}
            {stage === 2 && "STAGE 2 • 30% ACTIVE RECALL"}
            {stage === 3 && "STAGE 3 • 70% DEEP RECALL"}
            {stage === 4 && "STAGE 4 • 100% MASTERY"}
          </Text>
        </View>
      </View>

      {/* Main Scripture Canvas */}
      <View style={styles.centerSection}>
        <WordCanvas
          tokens={tokens}
          onBlankTap={handleBlankTap}
          activeBlankIndex={nextBlankIndex}
        />

        {stage === 1 && (
          <View style={styles.stageOneCtaContainer}>
            <TactileButton
              title="I have inscribed it"
              onPress={handleStageAdvance}
              variant="primary"
              size="md"
              rightIcon={<Feather name="arrow-right" size={16} color="#FFFFFF" />}
            />
          </View>
        )}
      </View>

      {/* Bottom Tray for Stages 2, 3, 4 */}
      {stage > 1 && (
        <WordTileTray
          bank={bank}
          onSelectWord={handleSelectWord}
          onHint={handleHint}
          disabled={nextBlankIndex === -1}
        />
      )}

      {/* Duolingo Victory Celebration Modal */}
      <Modal visible={isCompleted} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                opacity: victoryOpacity,
                transform: [{ scale: victoryScale }],
              },
            ]}
          >
            {/* Pulsing Duo Flame */}
            <Animated.View
              style={[
                styles.successIconBox,
                { transform: [{ scale: streakFlameScale }] },
              ]}
            >
              <Feather name="zap" size={32} color="#F59E0B" />
            </Animated.View>

            <Text style={styles.modalTitle}>Inscribed Upon Your Heart</Text>
            <Text style={styles.modalSubtitle}>
              {verse.book} {verse.chapter}:{verse.verse_number} committed in {secondsElapsed}s.
            </Text>

            {/* Gamified Milestone Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <Text style={styles.statValue}>100%</Text>
                <Text style={styles.statName}>ACCURACY</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statValue}>60s</Text>
                <Text style={styles.statName}>SPEED</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statValue}>+1</Text>
                <Text style={styles.statName}>STREAK DAY</Text>
              </View>
            </View>

            {/* Duo Shared Streak Status */}
            <View style={styles.duoCard}>
              <View style={styles.duoHeader}>
                <Text style={styles.duoLabel}>MUTUAL FATE DUO STREAK</Text>
                <Text style={styles.duoCount}>21 Days 🔥</Text>
              </View>
              <Text style={styles.duoStatus}>
                ✓ You completed your review today!{"\n"}
                ⏳ Andrei has until midnight to preserve your streak.
              </Text>
            </View>

            {/* 3D Tactile Continue Button */}
            <View style={styles.modalButtonWrapper}>
              <TactileButton
                title="Continue Daily Habit"
                onPress={() => {
                  setIsCompleted(false);
                  setStage(1);
                  setSecondsElapsed(0);
                  if (onFinish) onFinish();
                }}
                variant="streak"
                size="lg"
                rightIcon={<Feather name="check" size={18} color="#FFFFFF" />}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeTokens.colors.canvas, // #F8F9FA macOS canvas
    justifyContent: "space-between",
  },
  topBar: {
    paddingTop: themeTokens.spacing.s16,
    paddingHorizontal: themeTokens.spacing.s20,
    paddingBottom: themeTokens.spacing.s8,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: themeTokens.spacing.s10,
  },
  titleWithBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: themeTokens.spacing.s10,
  },
  backButton: {
    padding: themeTokens.spacing.s6,
    borderRadius: themeTokens.radii.buttons,    // 8px
    backgroundColor: themeTokens.colors.card,
    borderWidth: 1,
    borderColor: themeTokens.colors.borderHairline,
    ...themeTokens.shadows.subtle,
  },
  verseRef: {
    fontFamily: themeTokens.typography.fontFamilies.serif,
    fontSize: 22,
    fontWeight: "400",
    color: themeTokens.colors.inkPrimary,
    letterSpacing: -0.5,
  },
  badgeRow: {
    flexDirection: "row",
    gap: themeTokens.spacing.s8,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: themeTokens.spacing.s4,
    paddingHorizontal: themeTokens.spacing.s10,
    paddingVertical: themeTokens.spacing.s4,
    borderRadius: themeTokens.radii.buttons,    // 8px
    backgroundColor: themeTokens.colors.cardWash,
    borderWidth: 1,
    borderColor: themeTokens.colors.borderHairline,
  },
  timerText: {
    fontFamily: themeTokens.typography.fontFamilies.mono,
    fontSize: 11,
    fontWeight: "500",
    color: themeTokens.colors.inkSecondary,
  },
  langPill: {
    paddingHorizontal: themeTokens.spacing.s10,
    paddingVertical: themeTokens.spacing.s4,
    borderRadius: themeTokens.radii.buttons,    // 8px
    backgroundColor: themeTokens.colors.card,
    borderWidth: 1,
    borderColor: themeTokens.colors.borderHairline,
  },
  langText: {
    fontFamily: themeTokens.typography.fontFamilies.mono,
    fontSize: 11,
    fontWeight: "500",
    color: themeTokens.colors.inkSecondary,
  },
  progressSection: {
    marginBottom: themeTokens.spacing.s10,
  },
  stageIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dotsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: themeTokens.spacing.s6,
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: themeTokens.colors.borderSubtle,
  },
  stageDotActive: {
    backgroundColor: "#10B981", // active emerald
    width: 18,
    borderRadius: 3,
  },
  stageDotDone: {
    backgroundColor: themeTokens.colors.inkSecondary,
  },
  stageLabel: {
    ...themeTokens.typography.monoLabel,
    fontSize: 10,
    lineHeight: 14,
    color: themeTokens.colors.inkMuted,
  },
  centerSection: {
    flex: 1,
    justifyContent: "center",
  },
  stageOneCtaContainer: {
    marginHorizontal: themeTokens.spacing.s16,
    marginTop: themeTokens.spacing.s8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: themeTokens.spacing.s20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: themeTokens.colors.card,
    borderRadius: themeTokens.radii.featureCards,// 30px
    padding: themeTokens.spacing.s32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: themeTokens.colors.borderHairline,
    ...themeTokens.shadows.lg,
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: themeTokens.colors.streakWash,
    borderWidth: 2,
    borderColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: themeTokens.spacing.s16,
  },
  modalTitle: {
    ...themeTokens.typography.headingLg,
    fontSize: 26,
    lineHeight: 30,
    color: themeTokens.colors.inkPrimary,
    textAlign: "center",
    marginBottom: themeTokens.spacing.s6,
  },
  modalSubtitle: {
    ...themeTokens.typography.bodySm,
    color: themeTokens.colors.inkSecondary,
    textAlign: "center",
    marginBottom: themeTokens.spacing.s20,
  },
  statsRow: {
    flexDirection: "row",
    gap: themeTokens.spacing.s10,
    width: "100%",
    marginBottom: themeTokens.spacing.s16,
  },
  statPill: {
    flex: 1,
    backgroundColor: themeTokens.colors.cardWash,
    borderRadius: themeTokens.radii.inputs,     // 8px
    paddingVertical: themeTokens.spacing.s8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: themeTokens.colors.borderHairline,
  },
  statValue: {
    fontFamily: themeTokens.typography.fontFamilies.mono,
    fontSize: 16,
    fontWeight: "700",
    color: themeTokens.colors.inkPrimary,
  },
  statName: {
    ...themeTokens.typography.monoLabel,
    fontSize: 9,
    lineHeight: 12,
    color: themeTokens.colors.inkMuted,
    marginTop: 2,
  },
  duoCard: {
    width: "100%",
    backgroundColor: themeTokens.colors.streakWash,
    borderRadius: themeTokens.radii.cards,      // 16px
    padding: themeTokens.spacing.s16,
    marginBottom: themeTokens.spacing.s20,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  duoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: themeTokens.spacing.s8,
  },
  duoLabel: {
    ...themeTokens.typography.uppercaseTracked,
    fontSize: 10,
    color: "#92400E",
  },
  duoCount: {
    fontFamily: themeTokens.typography.fontFamilies.serif,
    fontSize: 18,
    fontWeight: "400",
    color: themeTokens.colors.inkPrimary,
  },
  duoStatus: {
    ...themeTokens.typography.bodySm,
    fontSize: 13,
    lineHeight: 20,
    color: themeTokens.colors.inkSecondary,
  },
  modalButtonWrapper: {
    width: "100%",
  },
});


