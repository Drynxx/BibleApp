import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowRight,
  Award,
  Book,
  Check,
  Flame,
  Leaf,
  MoreVertical,
  RotateCcw,
  Share,
  Timer,
  Trash2,
  X,
  Zap,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
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
import {
  DrillStateMachine,
  createDrillStateMachine,
  DrillState,
  BlankingStage,
  MaskedToken,
  validateWord,
  normalizeDiacritics,
} from '../src/engine';
import { verseRepository, Verse } from '../src/services/db/verseRepository';
import { BottomSheetMenu } from '../src/components/BottomSheetMenu';

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
    scale.value = withSpring(0.94, { damping: 12, stiffness: 220 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 10, stiffness: 160 });
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
    scale.value = withSpring(0.97, { damping: 12, stiffness: 200 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 10, stiffness: 150 });
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

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function InscribeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ verseId?: string }>();

  const [activeVerse, setActiveVerse] = useState<Verse>(() => {
    if (params.verseId) {
      const found = verseRepository.getById(params.verseId);
      if (found) return found;
    }
    const defaultVdc = verseRepository.getAll('VDC')[0];
    if (defaultVdc) return defaultVdc;
    return {
      id: 'v-1',
      book: 'Proverbe',
      chapter: 3,
      verse_number: 3,
      translation: 'VDC',
      text: t('inscribe.verseText', 'Să nu te părăsească bunătatea și credincioșia: leagă-le la gât, scrie-le pe tăblița inimii tale!'),
      theme: 'Ințelepciune',
      difficulty: 'medium',
    };
  });

  const verseText = activeVerse.text;
  const verseRef = `${activeVerse.book} ${activeVerse.chapter}:${activeVerse.verse_number}`;

  const [level, setLevel] = useState<BlankingStage>(1);
  const [drillState, setDrillState] = useState<DrillState | null>(null);
  const drillRef = useRef<DrillStateMachine | null>(null);
  const [wrong, setWrong] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // Initialize and update DrillStateMachine for Levels 2, 3, and 4
  useEffect(() => {
    if (level === 1) {
      drillRef.current?.destroy();
      drillRef.current = null;
      setDrillState(null);
      setWrong(false);
      return;
    }

    const mode = level === 3 ? 'first_letter' : 'word_bank';
    const drill = createDrillStateMachine({
      verseText,
      verseReference: verseRef,
      stage: level,
      durationSeconds: 60,
      mode,
    });

    drillRef.current = drill;
    const unsub = drill.subscribe((st) => {
      setDrillState({ ...st });
    });

    // Start 60-second countdown timer automatically
    drill.start(true, 1000);

    return () => {
      unsub();
      drill.destroy();
    };
  }, [level, verseText, verseRef]);

  useEffect(() => {
    if (level === 3) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [level]);

  useEffect(() => {
    if (level === 3 && drillState && drillState.completedBlanks > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [drillState?.completedBlanks, level]);

  const close = () => router.back();

  const handleChooseWord = (word: string) => {
    if (!drillRef.current) return;

    const result = drillRef.current.submitWord(word);
    if (result.isCorrect) {
      setWrong(false);
      try {
        if (result.isComplete) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } catch {}
    } else {
      setWrong(true);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    }
  };

  const handleTypeLetter = (value: string) => {
    if (!drillRef.current) return;
    const char = value.slice(-1);
    if (!char) return;

    const result = drillRef.current.submitLetter(char);
    if (result.isCorrect) {
      setWrong(false);
      try {
        if (result.isComplete) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch {}
    } else {
      setWrong(true);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {}
    }
  };

  const handleFocusInput = () => {
    if (inputRef.current?.isFocused()) {
      inputRef.current?.blur();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      inputRef.current?.focus();
    }
  };

  const handleResetDrill = () => {
    if (drillRef.current) {
      drillRef.current.restart();
      drillRef.current.start(true, 1000);
      setWrong(false);
    }
  };

  const toggleTranslation = () => {
    const nextTrans = activeVerse.translation === 'VDC' ? 'WEB' : 'VDC';
    const found = verseRepository.getAll(nextTrans)[0];
    if (found) {
      setActiveVerse(found);
      setLevel(1);
    }
    setMenuVisible(false);
  };

  const menuOptions = [
    {
      label: t('inscribe.menu.share', 'Share Verse'),
      description: t('inscribe.menu.shareDesc', 'Send this beautiful verse to a friend.'),
      icon: <Share size={18} color={Palette.foreground} />,
      onPress: () => { setMenuVisible(false); }
    },
    {
      label: t('inscribe.menu.changeTranslation', 'Change Translation'),
      description: t('inscribe.menu.changeTranslationDesc', `Switch version (Current: ${activeVerse.translation}).`),
      icon: <Book size={18} color={Palette.foreground} />,
      onPress: toggleTranslation,
    },
    {
      label: t('inscribe.menu.resetProgress', 'Reset Progress'),
      description: t('inscribe.menu.resetProgressDesc', 'Restart from Level 1 (Read & Inscribe).'),
      icon: <RotateCcw size={18} color={Palette.foreground} />,
      onPress: () => { 
        setLevel(1);
        setMenuVisible(false);
      }
    },
    {
      label: t('inscribe.menu.removeQueue', 'Remove from Queue'),
      description: t('inscribe.menu.removeQueueDesc', 'I no longer want to memorize this verse.'),
      icon: <Trash2 size={18} color={Palette.destructive} />,
      destructive: true,
      onPress: () => { close(); }
    }
  ];

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 8, 20), paddingBottom: insets.bottom + 20 }]}>
      {/* Header with Navigation, Tabular Timer, and Streak Counters */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          onPress={close}
          accessibilityLabel="Close practice"
        >
          <X color={Palette.foreground} size={20} />
        </Pressable>
        
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map((item) => (
            <View
              key={item}
              style={[
                styles.progressDot,
                item <= level ? styles.progressDotActive : styles.progressDotInactive
              ]}
            />
          ))}
        </View>

        <View style={styles.headerRight}>
          {drillState && (drillState.status === 'running' || drillState.status === 'paused') && (
            <View style={styles.timerBadge}>
              <Timer
                size={13}
                color={drillState.timeRemaining <= 10 ? Palette.destructive : Palette.gold}
              />
              <Text
                style={[
                  styles.timerText,
                  drillState.timeRemaining <= 10 && styles.timerTextUrgent,
                ]}
              >
                {formatTime(drillState.timeRemaining)}
              </Text>
            </View>
          )}

          {drillState && drillState.streak > 0 && (
            <View style={styles.streakBadge}>
              <Flame size={13} color="#FF9600" />
              <Text style={styles.streakText}>{drillState.streak}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            onPress={() => setMenuVisible(true)}
            accessibilityLabel="More options"
          >
            <MoreVertical color={Palette.foreground} size={20} />
          </Pressable>
        </View>
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
        {level === 1 && (
          <LevelOne 
            t={t} 
            verseRef={verseRef} 
            verseText={verseText} 
            onNext={() => setLevel(2)} 
          />
        )}

        {level === 2 && (
          <LevelDrill 
            t={t}
            title={t('inscribe.completeVerse', 'Complete the Verse')}
            eyebrow="LEVEL 2 • 30% WORD DRILL"
            subtitle={t('inscribe.chooseMissing', 'Choose the missing words before the 60s timer expires')}
            drillState={drillState}
            wrong={wrong}
            onChoose={handleChooseWord}
            onReset={handleResetDrill}
            onNext={() => setLevel(3)}
          />
        )}

        {level === 3 && (
          <LevelFirstLetter
            t={t}
            verseRef={verseRef}
            drillState={drillState}
            inputRef={inputRef}
            onType={handleTypeLetter}
            onFocus={handleFocusInput}
            onReset={handleResetDrill}
            onNext={() => setLevel(4)}
          />
        )}

        {level === 4 && (
          <LevelDrill
            t={t}
            title="Full Blind Mastery"
            eyebrow="LEVEL 4 • 100% MASTERY DRILL"
            subtitle="All words masked. Complete the entire verse within 60 seconds!"
            drillState={drillState}
            wrong={wrong}
            onChoose={handleChooseWord}
            onReset={handleResetDrill}
            onNext={close}
            isFinalLevel={true}
          />
        )}
      </ScrollView>
    </View>
  );
}

function LevelOne({ t, verseRef, verseText, onNext }: { t: any, verseRef: string, verseText: string, onNext: () => void }) {
  return (
    <View style={styles.levelContainer}>
      <Text style={styles.eyebrow}>{t('inscribe.levelOneEyebrow', 'LEVEL 1 • INSCRIBE')}</Text>
      <Text style={styles.title}>{t('inscribe.readReflect', 'Read & Reflect')}</Text>
      
      <View style={styles.cardContainer}>
        <View style={styles.blobOne} />
        <View style={styles.blobTwo} />
        <Leaf color="rgba(158, 67, 36, 0.2)" size={90} strokeWidth={1} style={styles.bgIcon} />
        
        <Text style={styles.cardEyebrow}>{verseRef}</Text>
        <Text style={styles.quote}>“{verseText}”</Text>
      </View>
      
      <Text style={styles.description}>{t('inscribe.stayWithPhrase', 'Hold this Scripture close. In the next steps, we will practice active recall.')}</Text>
      
      <SpringButton style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>{t('inscribe.imReady', "I'm Ready for Drill")}</Text>
        <ArrowRight color="#fff" size={20} />
      </SpringButton>
    </View>
  );
}

interface LevelDrillProps {
  t: any;
  title: string;
  eyebrow: string;
  subtitle: string;
  drillState: DrillState | null;
  wrong: boolean;
  onChoose: (word: string) => void;
  onReset: () => void;
  onNext: () => void;
  isFinalLevel?: boolean;
}

function LevelDrill({
  t,
  title,
  eyebrow,
  subtitle,
  drillState,
  wrong,
  onChoose,
  onReset,
  onNext,
  isFinalLevel = false,
}: LevelDrillProps) {
  const isCompleted = drillState?.status === 'completed';
  const isTimeUp = drillState?.status === 'time_up';
  const tokens = drillState?.tokens ?? [];

  return (
    <View style={styles.levelContainer}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      
      {/* Dynamic Scripture Weave Area */}
      <View style={styles.weaveQuoteContainer}>
        <Text style={styles.weaveQuote}>
          {tokens.map((token) => {
            if (token.isPunctuation) {
              return <Text key={token.id}>{token.raw} </Text>;
            }

            if (token.isMasked) {
              return (
                <Text key={token.id}>
                  <Text style={[styles.blankText, wrong ? styles.blankWrong : styles.blankEmpty]}>
                    {token.firstLetter ? `${token.firstLetter}_____` : '______'}
                  </Text>
                  {' '}
                </Text>
              );
            }

            if (token.isCorrect) {
              return (
                <Text key={token.id}>
                  <Animated.Text 
                    entering={ZoomIn.springify().damping(12).stiffness(160)}
                    style={[styles.blankText, styles.blankFilled]}
                  >
                    {token.userPlacedText || token.raw}
                  </Animated.Text>
                  {' '}
                </Text>
              );
            }

            return <Text key={token.id}>{token.raw} </Text>;
          })}
        </Text>
      </View>

      {/* Completion or Time-Up Result Cards */}
      {isCompleted && (
        <View style={styles.finishContainer}>
          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Award color={Palette.gold} size={26} />
              <Text style={styles.scoreTitle}>Drill Completed!</Text>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>XP EARNED</Text>
                <Text style={styles.metricValue}>+{drillState?.score?.xpEarned ?? 25} XP</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>ACCURACY</Text>
                <Text style={styles.metricValue}>{drillState?.score?.accuracy ?? 100}%</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>TIME</Text>
                <Text style={styles.metricValue}>{drillState?.timeElapsed ?? 0}s</Text>
              </View>
            </View>

            {drillState?.score?.perfect && (
              <View style={styles.badgeRow}>
                <Zap size={14} color={Palette.gold} />
                <Text style={styles.badgeText}>✨ Perfect Recall Bonus (+10 XP)</Text>
              </View>
            )}

            {drillState?.score?.speedBonus && (
              <View style={styles.badgeRow}>
                <Timer size={14} color={Palette.sage} />
                <Text style={[styles.badgeText, { color: Palette.sage }]}>⚡ 60s Speed Bonus (+5 XP)</Text>
              </View>
            )}
          </View>

          <SpringButton style={styles.button} onPress={onNext}>
            <Text style={styles.buttonText}>
              {isFinalLevel ? t('inscribe.finish', 'Finish & Inscribe Verse') : t('inscribe.continue', 'Continue to Next Level')}
            </Text>
            <ArrowRight color="#fff" size={20} />
          </SpringButton>
        </View>
      )}

      {isTimeUp && (
        <View style={styles.finishContainer}>
          <View style={styles.timeUpCard}>
            <Timer color={Palette.destructive} size={30} />
            <Text style={styles.timeUpTitle}>Time’s Up!</Text>
            <Text style={styles.timeUpDesc}>
              The 60-second timer elapsed. You placed {drillState?.completedBlanks ?? 0} of {drillState?.totalBlanks ?? 0} blanks.
            </Text>
          </View>

          <SpringButton style={styles.button} onPress={onReset}>
            <RotateCcw color="#fff" size={20} />
            <Text style={styles.buttonText}>Retry 60s Drill</Text>
          </SpringButton>
        </View>
      )}

      {/* Interactive Word Bank Options with Spring Physics */}
      {!isCompleted && !isTimeUp && (
        <>
          <View style={styles.optionsContainer}>
            {drillState?.wordBank.map((word, idx) => (
              <SpringTile 
                key={`${word}-${idx}`} 
                word={word}
                disabled={drillState.status !== 'running'}
                onPress={() => onChoose(word)}
              />
            ))}
          </View>

          <View style={styles.statusContainer}>
            {wrong && <Text style={styles.statusWrong}>{t('inscribe.tryAnother', 'Try another word...')}</Text>}
          </View>

          <View style={styles.actionsRow}>
            <Pressable style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]} onPress={onReset}>
              <RotateCcw color={Palette.foreground} size={20} />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

interface LevelFirstLetterProps {
  t: any;
  verseRef: string;
  drillState: DrillState | null;
  inputRef: React.RefObject<TextInput | null>;
  onType: (value: string) => void;
  onFocus: () => void;
  onReset: () => void;
  onNext: () => void;
}

function LevelFirstLetter({
  t,
  verseRef,
  drillState,
  inputRef,
  onType,
  onFocus,
  onReset,
  onNext,
}: LevelFirstLetterProps) {
  const isCompleted = drillState?.status === 'completed';
  const isTimeUp = drillState?.status === 'time_up';
  const tokens = drillState?.tokens ?? [];

  return (
    <Pressable style={styles.levelContainer} onPress={onFocus}>
      <Text style={styles.eyebrow}>{t('inscribe.levelThreeEyebrow', 'LEVEL 3 • FIRST LETTER RECALL')}</Text>
      <Text style={styles.title}>{t('inscribe.recallWithin', 'Recall Within')}</Text>
      <Text style={styles.subtitle}>{t('inscribe.typeFirstLetter', 'Type the first letter of each word to reveal the verse')}</Text>
      
      <View style={styles.inscriptionContainer}>
        <Text style={styles.weaveQuote}>
          {tokens.map((token) => {
            if (token.isPunctuation) {
              return <Text key={token.id}>{token.raw} </Text>;
            }

            if (token.isMasked) {
              return (
                <Text key={token.id} style={styles.firstLetterPrompt}>
                  {token.firstLetter}__{' '}
                </Text>
              );
            }

            return (
              <Animated.Text
                key={token.id}
                entering={ZoomIn.springify().damping(12).stiffness(160)}
                style={styles.revealedWord}
              >
                {token.raw}{' '}
              </Animated.Text>
            );
          })}
          {!isCompleted && !isTimeUp && <Text style={styles.cursorPulse}>|</Text>}
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

      {isCompleted && (
        <View style={styles.finishContainer}>
          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Check color={Palette.sage} size={24} />
              <Text style={styles.scoreTitle}>{t('inscribe.isInscribed', { verse: verseRef })}</Text>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>XP EARNED</Text>
                <Text style={styles.metricValue}>+{drillState?.score?.xpEarned ?? 30} XP</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>ACCURACY</Text>
                <Text style={styles.metricValue}>{drillState?.score?.accuracy ?? 100}%</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>TIME</Text>
                <Text style={styles.metricValue}>{drillState?.timeElapsed ?? 0}s</Text>
              </View>
            </View>
          </View>

          <SpringButton style={styles.button} onPress={onNext}>
            <Text style={styles.buttonText}>Advance to Level 4</Text>
            <ArrowRight color="#fff" size={20} />
          </SpringButton>
        </View>
      )}

      {isTimeUp && (
        <View style={styles.finishContainer}>
          <View style={styles.timeUpCard}>
            <Timer color={Palette.destructive} size={30} />
            <Text style={styles.timeUpTitle}>Time’s Up!</Text>
            <Text style={styles.timeUpDesc}>The 60-second recitation period has expired.</Text>
          </View>
          <SpringButton style={styles.button} onPress={onReset}>
            <RotateCcw color="#fff" size={20} />
            <Text style={styles.buttonText}>Retry Recitation</Text>
          </SpringButton>
        </View>
      )}

      {!isCompleted && !isTimeUp && (
        <Pressable style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]} onPress={onFocus}>
          <Text style={styles.outlineButtonText}>{t('inscribe.tapHere', 'Tap to open keyboard & type')}</Text>
          <Text style={styles.countText}>{drillState?.completedBlanks ?? 0}/{drillState?.totalBlanks ?? 0}</Text>
        </Pressable>
      )}
    </Pressable>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    backgroundColor: Palette.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  timerText: {
    fontFamily: Typography.sansBold,
    fontSize: 12,
    color: Palette.foreground,
    fontVariant: ['tabular-nums'],
  },
  timerTextUrgent: {
    color: Palette.destructive,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 150, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 150, 0, 0.25)',
  },
  streakText: {
    fontFamily: Typography.sansBold,
    fontSize: 12,
    color: '#FF9600',
    fontVariant: ['tabular-nums'],
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
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    color: Palette.mutedForeground,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  cardContainer: {
    width: '100%',
    paddingVertical: 45,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginVertical: 18,
    position: 'relative',
  },
  blobOne: {
    position: 'absolute',
    width: '90%',
    height: 190,
    borderRadius: 95,
    backgroundColor: Palette.secondary,
    opacity: 0.45,
    transform: [{ rotate: '-3deg' }],
  },
  blobTwo: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
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
    maxWidth: '90%',
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
    height: 56,
    backgroundColor: Palette.primary,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
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
  blankWrong: {
    borderColor: Palette.destructive,
    color: Palette.destructive,
  },
  blankEmpty: {
    borderColor: Palette.gold,
    color: Palette.gold,
    fontFamily: Typography.sansMedium,
  },
  firstLetterPrompt: {
    color: Palette.gold,
    fontFamily: Typography.sansBold,
  },
  revealedWord: {
    color: Palette.foreground,
    fontFamily: Typography.serifMedium,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  optionBadge: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  optionBadgeActive: {
    borderColor: Palette.border,
    backgroundColor: Palette.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  optionBadgeDisabled: {
    borderColor: Palette.border,
    backgroundColor: Palette.secondary,
    opacity: 0.4,
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
    minHeight: 22,
    marginTop: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusWrong: {
    fontFamily: Typography.sansBold,
    fontSize: 13,
    color: Palette.destructive,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    marginTop: 12,
  },
  resetButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCard: {
    width: '100%',
    backgroundColor: Palette.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  scoreTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 20,
    color: Palette.foreground,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Palette.border,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Palette.mutedForeground,
  },
  metricValue: {
    fontFamily: Typography.sansBold,
    fontSize: 18,
    color: Palette.primary,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  badgeText: {
    fontFamily: Typography.sansMedium,
    fontSize: 13,
    color: Palette.gold,
  },
  timeUpCard: {
    width: '100%',
    backgroundColor: Palette.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  timeUpTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 22,
    color: Palette.destructive,
    marginTop: 10,
  },
  timeUpDesc: {
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    color: Palette.mutedForeground,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
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
  cursorPulse: {
    color: Palette.gold,
    fontSize: 26,
  },
  finishContainer: {
    width: '100%',
    marginTop: 16,
  },
  outlineButton: {
    height: 54,
    width: '100%',
    borderRadius: 27,
    borderWidth: 1,
    borderColor: Palette.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  outlineButtonText: {
    fontFamily: Typography.sansMedium,
    fontSize: 15,
    color: Palette.foreground,
  },
  countText: {
    fontFamily: Typography.sansBold,
    fontSize: 13,
    color: Palette.gold,
    fontVariant: ['tabular-nums'],
  },
});
