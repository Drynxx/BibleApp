import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Book,
  Check,
  Flame,
  Leaf,
  Lightbulb,
  MoreVertical,
  RotateCcw,
  Share,
  Sparkles,
  Timer,
  Trash2,
  X,
  Zap,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated';

import { Palette, Typography } from '@/constants/theme';
import { useDrillEngine } from '../src/hooks/useDrillEngine';
import { useCovenant } from '../src/services/covenantContext';
import { BottomSheetMenu } from '../src/components/BottomSheetMenu';
import { BlankingStage, DrillScoreResult } from '../src/engine/blanking';
import { DuoFlame } from '../src/components/streak/DuoFlame';
import { useDailyPractice } from '../src/hooks/useDailyPractice';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SpringTileProps {
  word: string;
  disabled?: boolean;
  onPress: () => void;
}

const SpringTile: React.FC<SpringTileProps> = ({ word, disabled, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    scale.value = withSpring(0.93, { damping: 12, stiffness: 240 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 10, stiffness: 180 });
  };

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.optionBadge,
        disabled ? styles.optionBadgeDisabled : styles.optionBadgeActive,
        animatedStyle,
      ]}
    >
      <Text style={[styles.optionText, disabled && styles.optionTextDisabled]}>
        {word}
      </Text>
    </AnimatedPressable>
  );
};

interface SpringButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  disabled?: boolean;
}

const SpringButton: React.FC<SpringButtonProps> = ({ onPress, children, style, disabled }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    scale.value = withSpring(0.97, { damping: 12, stiffness: 220 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 10, stiffness: 160 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[style, animatedStyle, disabled && { opacity: 0.5 }]}
    >
      {children}
    </AnimatedPressable>
  );
};

export default function InscribeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeDailyReview, activeCovenant } = useCovenant();
  const { verse } = useDailyPractice();

  const verseText = verse.text;
  const verseRef = verse.reference;

  const [menuVisible, setMenuVisible] = useState(false);
  const [drillCompleted, setDrillCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState<DrillScoreResult | null>(null);

  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Core Engine Integration
  const {
    state,
    start,
    submitWord,
    undoPlacement,
    selectBlank,
    useFirstLetterHint,
    advanceStage,
    finishDrill,
    reset,
  } = useDrillEngine({
    verseText,
    verseRef,
    initialStage: 1,
    timeLimitSeconds: 60,
    onDrillComplete: async (score) => {
      setFinalScore(score);
      setDrillCompleted(true);
      // Sync covenant streak progression
      try {
        await completeDailyReview();
      } catch {}
    },
  });

  const level = state.currentStage;

  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    if (level === 4) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [level]);

  const close = () => router.back();

  const menuOptions = [
    {
      label: t('inscribe.menu.share', 'Share Verse'),
      description: t('inscribe.menu.shareDesc', 'Send this beautiful verse to a friend.'),
      icon: <Share size={18} color={Palette.foreground} />,
      onPress: () => {},
    },
    {
      label: t('inscribe.menu.changeTranslation', 'Change Translation'),
      description: t('inscribe.menu.changeTranslationDesc', 'Switch this specific verse to another version.'),
      icon: <Book size={18} color={Palette.foreground} />,
      onPress: () => {},
    },
    {
      label: t('inscribe.menu.resetProgress', 'Reset Progress'),
      description: t('inscribe.menu.resetProgressDesc', 'I totally forgot this one; drop it back to Step 1.'),
      icon: <RotateCcw size={18} color={Palette.foreground} />,
      onPress: () => {
        reset(1);
        setDrillCompleted(false);
      },
    },
    {
      label: t('inscribe.menu.removeQueue', 'Remove from Queue'),
      description: t('inscribe.menu.removeQueueDesc', 'I no longer want to memorize this verse.'),
      icon: <Trash2 size={18} color="#EF4444" />,
      destructive: true,
      onPress: () => {
        close();
      },
    },
  ];

  // Level 4 typing handler
  const handleTypeLetter = (value: string) => {
    const rawLetter = value.slice(-1);
    if (!rawLetter) return;

    const activeBlank =
      state.maskedTokens.find((t) => t.isMasked && !t.isCorrect) || null;

    if (activeBlank) {
      submitWord(rawLetter, activeBlank.id);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top + 8, 20),
          paddingBottom: insets.bottom + 20,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          onPress={close}
          accessibilityLabel="Close practice"
        >
          <X color={Palette.foreground} size={20} />
        </Pressable>

        {/* 4-Stage Progressive Dots */}
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map((stageNum) => (
            <View
              key={stageNum}
              style={[
                styles.progressDot,
                stageNum <= level ? styles.progressDotActive : styles.progressDotInactive,
              ]}
            />
          ))}
        </View>

        {/* 60s Micro-Timer Counter */}
        <View style={styles.timerBadge}>
          <Timer size={13} color={state.elapsedSeconds <= 60 ? Palette.primary : '#EF4444'} />
          <Text
            style={[
              styles.timerText,
              state.elapsedSeconds > 60 && { color: '#EF4444' },
            ]}
          >
            {state.elapsedSeconds}s
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          onPress={() => setMenuVisible(true)}
          accessibilityLabel="More options"
        >
          <MoreVertical color={Palette.foreground} size={20} />
        </Pressable>
      </View>

      <BottomSheetMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        options={menuOptions}
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
      >
        {drillCompleted ? (
          <CompletionView
            score={finalScore}
            streak={activeCovenant?.shared_streak || 1}
            onFinish={close}
            onPracticeAgain={() => {
              setDrillCompleted(false);
              reset(1);
            }}
          />
        ) : (
          <>
            {level === 1 && (
              <LevelOne
                verseRef={verseRef}
                verseText={verseText}
                onNext={() => advanceStage(2)}
              />
            )}

            {level === 2 && (
              <LevelInteractive
                stageNumber={2}
                eyebrow="Step 2 of 4 • Partial Masking"
                title="Fill the Blanks"
                subtitle="Tap words from the bank to complete the scripture."
                maskedTokens={state.maskedTokens}
                wordBank={state.wordBank}
                isStageComplete={state.status === 'stage_completed'}
                onChoose={(word) => submitWord(word)}
                onUndo={(id) => undoPlacement(id)}
                onReset={() => reset(2)}
                onNext={() => advanceStage(3)}
              />
            )}

            {level === 3 && (
              <LevelInteractive
                stageNumber={3}
                eyebrow="Step 3 of 4 • Deep Recall"
                title="Advanced Retention"
                subtitle="Over 70% of words are concealed. Trust your memory."
                maskedTokens={state.maskedTokens}
                wordBank={state.wordBank}
                isStageComplete={state.status === 'stage_completed'}
                onChoose={(word) => submitWord(word)}
                onUndo={(id) => undoPlacement(id)}
                onReset={() => reset(3)}
                onNext={() => advanceStage(4)}
              />
            )}

            {level === 4 && (
              <LevelFourMastery
                maskedTokens={state.maskedTokens}
                inputRef={inputRef}
                onType={handleTypeLetter}
                onHint={() => useFirstLetterHint()}
                onFinish={() => finishDrill()}
                onRestart={() => reset(1)}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Level 1: Read & Reflect (0% masked familiarization)
function LevelOne({
  verseRef,
  verseText,
  onNext,
}: {
  verseRef: string;
  verseText: string;
  onNext: () => void;
}) {
  return (
    <View style={styles.levelContainer}>
      <Text style={styles.eyebrow}>Step 1 of 4 • Familiarization</Text>
      <Text style={styles.title}>Read & Reflect</Text>

      <View style={styles.cardContainer}>
        <View style={styles.blobOne} />
        <View style={styles.blobTwo} />
        <Leaf color="rgba(158, 67, 36, 0.2)" size={90} strokeWidth={1} style={styles.bgIcon} />

        <Text style={styles.cardEyebrow}>{verseRef}</Text>
        <Text style={styles.quote}>“{verseText}”</Text>
      </View>

      <Text style={styles.description}>
        Read the verse slowly. Commit the cadence and truth of the Word to your heart.
      </Text>

      <SpringButton style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>I'm Ready</Text>
        <ArrowRight color="#fff" size={20} />
      </SpringButton>
    </View>
  );
}

// Interactive Levels (Stage 2 & Stage 3)
function LevelInteractive({
  eyebrow,
  title,
  subtitle,
  maskedTokens,
  wordBank,
  isStageComplete,
  onChoose,
  onUndo,
  onReset,
  onNext,
}: {
  stageNumber: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  maskedTokens: any[];
  wordBank: string[];
  isStageComplete: boolean;
  onChoose: (word: string) => void;
  onUndo: (tokenId: string) => void;
  onReset: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.levelContainer}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {/* Interactive Verse Canvas */}
      <View style={styles.weaveQuoteContainer}>
        <Text style={styles.weaveQuote}>
          {maskedTokens.map((token, idx) => {
            if (!token.isMasked) {
              return <Text key={token.id || idx}>{token.raw} </Text>;
            }

            const isFilled = token.isCorrect && !!token.userPlacedText;

            return (
              <Text key={token.id || idx}>
                {isFilled ? (
                  <Animated.Text
                    entering={ZoomIn.springify().damping(12).stiffness(160)}
                    onPress={() => onUndo(token.id)}
                    style={[styles.blankText, styles.blankFilled]}
                  >
                    {token.userPlacedText}
                  </Animated.Text>
                ) : (
                  <Text style={[styles.blankText, styles.blankEmpty]}>
                    {token.firstLetter ? `${token.firstLetter}____` : '_____'}
                  </Text>
                )}
                {' '}
              </Text>
            );
          })}
        </Text>
      </View>

      {/* Scrambled Word Bank Tiles */}
      <View style={styles.optionsContainer}>
        {wordBank.map((word, idx) => (
          <SpringTile
            key={`${word}-${idx}`}
            word={word}
            disabled={isStageComplete}
            onPress={() => onChoose(word)}
          />
        ))}
      </View>

      {/* Status Bar */}
      <View style={styles.statusContainer}>
        {isStageComplete && (
          <Text style={styles.statusCorrect}>Well done! Verse inscribed accurately.</Text>
        )}
      </View>

      {/* Bottom Action Buttons */}
      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
          onPress={onReset}
        >
          <RotateCcw color={Palette.foreground} size={20} />
        </Pressable>
        <SpringButton
          disabled={!isStageComplete}
          style={[styles.continueButton, !isStageComplete && styles.disabledBtn]}
          onPress={onNext}
        >
          <Text style={styles.buttonText}>Continue</Text>
          <ArrowRight color="#fff" size={20} />
        </SpringButton>
      </View>
    </View>
  );
}

// Level 4: Mastery (100% canvas masked / first-letter prompt recitation)
function LevelFourMastery({
  maskedTokens,
  inputRef,
  onType,
  onHint,
  onFinish,
  onRestart,
}: {
  maskedTokens: any[];
  inputRef: React.RefObject<TextInput | null>;
  onType: (val: string) => void;
  onHint: () => void;
  onFinish: () => void;
  onRestart: () => void;
}) {
  const solvedCount = maskedTokens.filter((t) => t.isMasked && t.isCorrect).length;
  const totalBlanks = maskedTokens.filter((t) => t.isMasked).length;
  const isComplete = solvedCount === totalBlanks && totalBlanks > 0;

  return (
    <View style={styles.levelContainer}>
      <Text style={styles.eyebrow}>Step 4 of 4 • Full Mastery</Text>
      <Text style={styles.title}>Inscribe from Memory</Text>
      <Text style={styles.subtitle}>Recite the verse entirely from your heart.</Text>

      <View style={styles.inscriptionContainer}>
        <Text style={styles.weaveQuote}>
          {maskedTokens.map((token, idx) => {
            if (!token.isMasked) {
              return <Text key={token.id || idx}>{token.raw} </Text>;
            }
            if (token.isCorrect) {
              return (
                <Text key={token.id || idx} style={styles.masteredWord}>
                  {token.raw}{' '}
                </Text>
              );
            }
            return (
              <Text key={token.id || idx} style={styles.blankPrompt}>
                {token.firstLetter || '_'}{'_'.repeat(Math.max(1, token.raw.length - 1))}{' '}
              </Text>
            );
          })}
        </Text>
      </View>

      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect={false}
        onChangeText={onType}
        value=""
      />

      {isComplete ? (
        <View style={styles.finishContainer}>
          <SpringButton style={styles.button} onPress={onFinish}>
            <Text style={styles.buttonText}>Complete & Record</Text>
            <Sparkles size={18} color="#FFF" />
          </SpringButton>
        </View>
      ) : (
        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
            onPress={onHint}
          >
            <Lightbulb color={Palette.gold} size={20} />
          </Pressable>
          <SpringButton
            style={styles.continueButton}
            onPress={() => inputRef.current?.focus()}
          >
            <Text style={styles.buttonText}>Tap to Type ({solvedCount}/{totalBlanks})</Text>
          </SpringButton>
        </View>
      )}
    </View>
  );
}

// Celebratory Drill Completion Summary
function CompletionView({
  score,
  streak,
  onFinish,
  onPracticeAgain,
}: {
  score: DrillScoreResult | null;
  streak: number;
  onFinish: () => void;
  onPracticeAgain: () => void;
}) {
  return (
    <View style={styles.completionContainer}>
      <DuoFlame streak={streak} state="COMPLETED_BOTH" size="large" />

      <Text style={styles.completionTitle}>Verse Inscribed!</Text>
      <Text style={styles.completionSubtitle}>
        Your daily devotion is complete. Mutual fate covenant preserved!
      </Text>

      {/* Score Cards Breakdown */}
      <View style={styles.scoreGrid}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreValue}>{score?.accuracy ?? 100}%</Text>
          <Text style={styles.scoreLabel}>Accuracy</Text>
        </View>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreValue}>+{score?.xpEarned ?? 45}</Text>
          <Text style={styles.scoreLabel}>XP Earned</Text>
        </View>
      </View>

      {/* Speed Bonus Badge */}
      {score?.speedBonus && (
        <View style={styles.bonusBadge}>
          <Zap size={14} color="#F59E0B" />
          <Text style={styles.bonusText}>60-Second Speed Bonus (+5 XP)</Text>
        </View>
      )}

      <SpringButton style={[styles.button, { marginTop: 24 }]} onPress={onFinish}>
        <Text style={styles.buttonText}>Finish & Sync</Text>
        <Check size={20} color="#FFF" />
      </SpringButton>

      <Pressable
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        onPress={onPracticeAgain}
      >
        <Text style={styles.secondaryButtonText}>Practice Again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  progressDot: {
    height: 6,
    width: 28,
    borderRadius: 3,
  },
  progressDotActive: {
    backgroundColor: Palette.primary,
  },
  progressDotInactive: {
    backgroundColor: Palette.border,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerText: {
    fontFamily: Typography.sansBold,
    fontVariant: ['tabular-nums'],
    fontSize: 11,
    color: Palette.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  levelContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 16,
  },
  eyebrow: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    letterSpacing: 2,
    color: Palette.gold,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 32,
    color: Palette.foreground,
    marginTop: 8,
  },
  subtitle: {
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    color: Palette.mutedForeground,
    marginTop: 6,
    textAlign: 'center',
  },
  cardContainer: {
    width: '100%',
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginVertical: 20,
    position: 'relative',
  },
  blobOne: {
    position: 'absolute',
    width: '90%',
    height: 180,
    borderRadius: 90,
    backgroundColor: Palette.secondary,
    opacity: 0.45,
    transform: [{ rotate: '-3deg' }],
  },
  blobTwo: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Palette.gold,
    opacity: 0.15,
  },
  bgIcon: {
    position: 'absolute',
    bottom: 12,
    left: 20,
    transform: [{ rotate: '-12deg' }],
  },
  cardEyebrow: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    letterSpacing: 2.5,
    color: Palette.primary,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  quote: {
    fontFamily: Typography.serifMedium,
    fontSize: 28,
    lineHeight: 38,
    color: Palette.foreground,
    textAlign: 'center',
    maxWidth: '92%',
  },
  description: {
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    lineHeight: 22,
    color: Palette.mutedForeground,
    textAlign: 'center',
    maxWidth: '85%',
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    height: 58,
    backgroundColor: Palette.primary,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 10,
    shadowColor: Palette.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    fontFamily: Typography.sansBold,
    fontSize: 17,
    color: '#fff',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  weaveQuoteContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    paddingVertical: 16,
    width: '100%',
  },
  weaveQuote: {
    fontFamily: Typography.serifMedium,
    fontSize: 28,
    lineHeight: 44,
    color: Palette.foreground,
    textAlign: 'center',
  },
  blankText: {
    borderBottomWidth: 2,
    minWidth: 70,
    textAlign: 'center',
  },
  blankFilled: {
    borderColor: Palette.primary,
    color: Palette.primary,
    fontFamily: Typography.serifSemiBold,
  },
  blankEmpty: {
    borderColor: Palette.gold,
    color: Palette.mutedForeground,
    opacity: 0.6,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  optionBadge: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  optionBadgeActive: {
    borderColor: Palette.border,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  optionBadgeDisabled: {
    borderColor: Palette.border,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  optionText: {
    fontFamily: Typography.sansMedium,
    fontSize: 15,
    color: Palette.foreground,
  },
  optionTextDisabled: {
    color: Palette.mutedForeground,
  },
  statusContainer: {
    minHeight: 24,
    marginTop: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCorrect: {
    fontFamily: Typography.sansBold,
    fontSize: 13,
    color: Palette.sage,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
  resetButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    flex: 1,
    height: 58,
    borderRadius: 29,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  disabledBtn: {
    opacity: 0.45,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
    bottom: 0,
  },
  inscriptionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    paddingTop: 30,
    paddingBottom: 60,
  },
  masteredWord: {
    color: Palette.foreground,
  },
  blankPrompt: {
    color: Palette.gold,
    letterSpacing: 1,
  },
  finishContainer: {
    width: '100%',
    marginTop: 16,
  },
  secondaryButton: {
    height: 48,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    fontFamily: Typography.sansMedium,
    fontSize: 15,
    color: Palette.mutedForeground,
  },
  completionContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  completionTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 32,
    color: Palette.foreground,
    marginTop: 18,
  },
  completionSubtitle: {
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    color: Palette.mutedForeground,
    textAlign: 'center',
    maxWidth: '80%',
    marginTop: 6,
  },
  scoreGrid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
    width: '100%',
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  scoreValue: {
    fontFamily: Typography.sansBold,
    fontVariant: ['tabular-nums'],
    fontSize: 26,
    color: Palette.primary,
  },
  scoreLabel: {
    fontFamily: Typography.sans,
    fontSize: 12,
    color: Palette.mutedForeground,
    marginTop: 4,
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 14,
  },
  bonusText: {
    fontFamily: Typography.sansBold,
    fontSize: 11,
    color: '#D97706',
  },
});
