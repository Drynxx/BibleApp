import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowRight,
  Book,
  Check,
  Flame,
  Leaf,
  MoreVertical,
  RotateCcw,
  Share,
  Trash2,
  X,
} from 'lucide-react-native';
import { getBookName } from '../src/constants/bibleBooks';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
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
import { validateWord, normalizeDiacritics } from '../src/engine/blanking';
import { BottomSheetMenu } from '../src/components/BottomSheetMenu';
import { useDailyPractice } from '../src/hooks/useDailyPractice';
import { useAuth } from '../src/services/authContext';
import { VerseRepository } from '../src/services/db/verseRepository';
import { RecallEngine, RecallToken } from '../src/services/practice/recallEngine';
import { QueueManager, QueueGrade } from '../src/services/practice/queueManager';

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

export default function InscribeScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { queueId, book, chapter, verse, planId } = useLocalSearchParams();
  const { currentSession } = useDailyPractice();
  const { profile } = useAuth();
  
  const selectedTranslation = profile?.translation?.toLowerCase() || 'kjv';

  const formatReference = (bookId: number, chapter: number, verse: number) => {
    const langToUse = i18n.language === 'ro' ? 'vdcc' : 'kjv';
    const bookName = getBookName(bookId, langToUse);
    return `${bookName} ${chapter}:${verse}`;
  };

  const [b, setB] = useState<number>(book ? parseInt(book as string) : currentSession.verse.bookId);
  const [c, setC] = useState<number>(chapter ? parseInt(chapter as string) : currentSession.verse.chapter);
  const [v, setV] = useState<number>(verse ? parseInt(verse as string) : currentSession.verse.verse);
  const [activeQueueId, setActiveQueueId] = useState<string | undefined>(queueId as string);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [isInitializing, setIsInitializing] = useState(!!planId && !book);

  useEffect(() => {
    if (planId && !book && profile?.id) {
      QueueManager.getDueVerse(profile.id, planId as string).then(due => {
        if (due) {
          setB(due.book);
          setC(due.chapter);
          setV(due.verse);
          setActiveQueueId(due.id);
        } else {
          setIsSessionComplete(true);
        }
        setIsInitializing(false);
      });
    }
  }, [planId, book, profile?.id]);

  const verseRef = formatReference(b, c, v);
  const [dbVerseText, setDbVerseText] = useState(currentSession.verse.text);
  const [recallTokens, setRecallTokens] = useState<RecallToken[]>([]);

  useEffect(() => {
    const fetchVerse = async () => {
      const text = await VerseRepository.getVerse(
        b, c, v,
        selectedTranslation as 'kjv' | 'vdcc' | 'cornilescu'
      );
      setDbVerseText(text);
      const tokens = RecallEngine.generateRecallPractice(text, 3, selectedTranslation);
      setRecallTokens(tokens);
    };
    fetchVerse();
  }, [b, c, v, selectedTranslation]);

  const words = dbVerseText.split(/\s+/);
  const answers = recallTokens.filter(t => t.type === 'blank').map(t => t.value);
  const options = React.useMemo(() => {
    const allOptions = recallTokens.filter(t => t.type === 'blank').flatMap(t => t.options || []);
    return Array.from(new Set(allOptions)).sort(() => 0.5 - Math.random());
  }, [recallTokens]);
  
  const referenceOptions = React.useMemo(() => {
    return RecallEngine.generateReferenceQuiz(b, c, v, selectedTranslation);
  }, [b, c, v, selectedTranslation]);
  
  const [level, setLevel] = useState(1);
  const [picked, setPicked] = useState<string[]>([]);
  const [wrong, setWrong] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const complete = revealed >= words.length;
  const [menuVisible, setMenuVisible] = useState(false);

  const menuOptions = [
    {
      label: t('inscribe.menu.share', 'Share Verse'),
      description: t('inscribe.menu.shareDesc', 'Send this beautiful verse to a friend.'),
      icon: <Share size={18} color={Palette.foreground} />,
      onPress: () => { /* TODO: trigger share */ }
    },
    {
      label: t('inscribe.menu.changeTranslation', 'Change Translation'),
      description: t('inscribe.menu.changeTranslationDesc', 'Switch this specific verse to another version.'),
      icon: <Book size={18} color={Palette.foreground} />,
      onPress: () => { /* TODO: trigger change translation */ }
    },
    {
      label: t('inscribe.menu.resetProgress', 'Reset Progress'),
      description: t('inscribe.menu.resetProgressDesc', 'I totally forgot this one; drop it back to Step 1.'),
      icon: <RotateCcw size={18} color={Palette.foreground} />,
      onPress: () => { 
        setLevel(1);
        setPicked([]);
        setRevealed(0);
      }
    },
    {
      label: t('inscribe.menu.removeQueue', 'Remove from Queue'),
      description: t('inscribe.menu.removeQueueDesc', 'I no longer want to memorize this verse.'),
      icon: <Trash2 size={18} color="#EF4444" />,
      destructive: true,
      onPress: async () => { 
        if (activeQueueId) {
          try {
            await QueueManager.removeFromQueue(activeQueueId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {
            console.error("Failed to remove verse:", e);
            alert("Could not remove from queue.");
            return;
          }
        }
        close(); 
      }
    }
  ];

  if (planId) {
    menuOptions.push({
      label: t('inscribe.menu.clearPlan', 'Clear this Plan'),
      description: t('inscribe.menu.clearPlanDesc', 'Stop learning this plan and remove its verses from my queue.'),
      icon: <Trash2 size={18} color="#EF4444" />,
      destructive: true,
      onPress: async () => {
        try {
          if (profile?.id) {
            await QueueManager.removePlan(profile.id, planId as string);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push('/');
          }
        } catch (e) {
          console.error("Failed to clear plan:", e);
          alert("Could not clear plan.");
        }
      }
    });
  }

  useEffect(() => {
    if (level === 3) {
      setTimeout(() => inputRef.current?.focus(), 500);
    }
  }, [level]);

  useEffect(() => {
    if (level === 3 && revealed > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [revealed, level]);

  const loadNextVerse = async () => {
    if (!profile?.id || !planId) {
      router.back();
      return;
    }
    
    setLoadingNext(true);
    try {
      const due = await QueueManager.getDueVerse(profile.id, planId as string);
      if (due) {
        setB(due.book);
        setC(due.chapter);
        setV(due.verse);
        setActiveQueueId(due.id);
        setLevel(1);
        setPicked([]);
        setWrong(false);
        setRevealed(0);
      } else {
        setIsSessionComplete(true);
      }
    } catch (e) {
      console.error(e);
      router.back();
    } finally {
      setLoadingNext(false);
    }
  };

  const handleGrade = async (grade: QueueGrade) => {
    if (activeQueueId) {
      try {
        await QueueManager.updateVerseProgress(activeQueueId, grade);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        console.error("Error updating SRS progress", e);
      }
    }
    if (planId) {
      loadNextVerse();
    } else {
      router.back();
    }
  };

  const close = () => {
    router.back();
  };
  
  const choose = (word: string) => {
    if (picked.length >= answers.length || picked.some((p) => validateWord(p, word))) return;
    const expected = answers[picked.length];
    if (validateWord(word, expected)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setWrong(false);
      setPicked((current) => [...current, word]);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setWrong(true);
    }
  };

  const typeLetter = (value: string) => {
    const rawLetter = value.slice(-1);
    const letter = normalizeDiacritics(rawLetter);
    const targetWord = words[revealed] ?? "";
    const firstCharMatch = targetWord.match(/[a-zA-Z0-9ăîșțâĂÎȘȚÂşţŞŢ]/)?.[0] ?? "";
    const expected = normalizeDiacritics(firstCharMatch);
    
    if (letter && expected && letter === expected) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRevealed((current) => Math.min(words.length, current + 1));
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const handleFocus = () => {
    if (inputRef.current?.isFocused()) {
      inputRef.current?.blur();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      inputRef.current?.focus();
    }
  };

  if (isInitializing) {
    return (
      <View style={[styles.container, styles.completeContainer]}>
        <ActivityIndicator size="large" color={Palette.gold} />
      </View>
    );
  }

  if (isSessionComplete) {
    return (
      <View style={[styles.container, styles.completeContainer]}>
        <View style={styles.completeContent}>
          <View style={styles.completeIcon}>
            <Flame color={Palette.primary} size={64} fill={Palette.primary} />
          </View>
          <Text style={styles.completeTitle}>{t('inscribe.sessionComplete', 'Session Complete!')}</Text>
          <Text style={styles.completeSubtitle}>{t('inscribe.sessionCompleteDesc', "You've completed your practice for this plan today.")}</Text>
        </View>
        <SpringButton style={styles.completeButton} onPress={() => router.push('/')}>
          <Text style={styles.completeButtonText}>{t('inscribe.returnHome', 'Return Home')}</Text>
        </SpringButton>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 8, 20), paddingBottom: insets.bottom + 20 }]}>
      {/* Header */}
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
            <View key={item} style={[styles.progressDot, item <= level ? styles.progressDotActive : styles.progressDotInactive]} />
          ))}
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
        {level === 1 && <LevelOne t={t} verseRef={verseRef} verseText={dbVerseText} onNext={() => setLevel(2)} />}
        {level === 2 && <LevelTwo t={t} recallTokens={recallTokens} answers={answers} options={options} picked={picked} wrong={wrong} onChoose={choose} onReset={() => { setPicked([]); setWrong(false); }} onNext={() => setLevel(3)} />}
        {level === 3 && <LevelThree t={t} words={words} revealed={revealed} complete={complete} inputRef={inputRef} onType={typeLetter} onFocus={handleFocus} onRestart={() => { setLevel(1); setPicked([]); setRevealed(0); }} onNext={() => { setLevel(4); setRevealed(0); }} />}
        {level === 4 && <LevelFour t={t} words={words} onRestart={() => { setLevel(1); setPicked([]); setRevealed(0); }} onClose={close} onGrade={handleGrade} isQueue={!!activeQueueId} referenceOptions={referenceOptions} correctReference={verseRef} />}
      </ScrollView>
    </View>
  );
}

function LevelOne({ t, verseRef, verseText, onNext }: { t: any, verseRef: string, verseText: string, onNext: () => void }) {
  return (
    <View style={styles.levelContainer}>
      <Text style={styles.eyebrow}>{t('inscribe.levelOneEyebrow')}</Text>
      <Text style={styles.title}>{t('inscribe.readReflect')}</Text>
      
      <View style={styles.cardContainer}>
        <View style={styles.blobOne} />
        <View style={styles.blobTwo} />
        <Leaf color="rgba(158, 67, 36, 0.2)" size={90} strokeWidth={1} style={styles.bgIcon} />
        
        <Text style={styles.cardEyebrow}>{verseRef}</Text>
        <Text style={styles.quote}>“{verseText}”</Text>
      </View>
      
      <Text style={styles.description}>{t('inscribe.stayWithPhrase')}</Text>
      
      <SpringButton style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>{t('inscribe.imReady')}</Text>
        <ArrowRight color="#fff" size={20} />
      </SpringButton>
    </View>
  );
}

function LevelTwo({ t, recallTokens, answers, options, picked, wrong, onChoose, onReset, onNext }: { t: any, recallTokens: RecallToken[], answers: string[], options: string[], picked: string[]; wrong: boolean; onChoose: (word: string) => void; onReset: () => void; onNext: () => void }) {
  const done = picked.length === answers.length && answers.length > 0;
  let blank = 0;
  
  return (
    <View style={styles.levelContainer}>
      <Text style={styles.eyebrow}>{t('inscribe.levelTwoEyebrow')}</Text>
      <Text style={styles.title}>{t('inscribe.completeVerse')}</Text>
      <Text style={styles.subtitle}>{t('inscribe.chooseMissing')}</Text>
      
      <View style={styles.weaveQuoteContainer}>
        <Text style={styles.weaveQuote}>
          {recallTokens.map((token, index) => {
            if (token.type === 'text') {
              return <Text key={index}>{token.value}</Text>;
            }
            
            const value = picked[blank];
            const current = blank;
            blank += 1;
            
            const isWrong = current === picked.length && wrong;
            const isFilled = !!value;
            
            return (
              <Text key={index}>
                {isFilled ? (
                  <Animated.Text 
                    entering={ZoomIn.springify().damping(12).stiffness(160)}
                    style={[styles.blankText, styles.blankFilled]}
                  >
                    {value}
                  </Animated.Text>
                ) : (
                  <Text 
                    style={[
                      styles.blankText,
                      isWrong ? styles.blankWrong : styles.blankEmpty
                    ]}
                  >
                    {"______"}
                  </Text>
                )}
              </Text>
            );
          })}
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {options.map((word) => (
          <SpringTile 
            key={word} 
            word={word}
            disabled={picked.some((p) => validateWord(p, word)) || done}
            onPress={() => onChoose(word)}
          />
        ))}
      </View>

      <View style={styles.statusContainer}>
        {wrong && <Text style={styles.statusWrong}>{t('inscribe.tryAnother')}</Text>}
        {done && <Text style={styles.statusCorrect}>{t('inscribe.wovenTogether')}</Text>}
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]} onPress={onReset}>
          <RotateCcw color={Palette.foreground} size={20} />
        </Pressable>
        <SpringButton 
          disabled={!done}
          style={[styles.continueButton, !done && styles.disabledBtn]} 
          onPress={onNext}
        >
          <Text style={styles.buttonText}>{t('inscribe.continue')}</Text>
          <ArrowRight color="#fff" size={20} />
        </SpringButton>
      </View>
    </View>
  );
}

function LevelThree({ t, words, revealed, complete, inputRef, onType, onFocus, onRestart, onNext }: { t: any, words: string[], revealed: number; complete: boolean; inputRef: React.RefObject<TextInput | null>; onType: (value: string) => void; onFocus: () => void; onRestart: () => void; onNext: () => void }) {
  return (
    <Pressable style={styles.levelContainer} onPress={onFocus}>
      <Text style={styles.eyebrow}>{t('inscribe.levelThreeEyebrow')}</Text>
      <Text style={styles.title}>{t('inscribe.recallWithin')}</Text>
      <Text style={styles.subtitle}>{t('inscribe.typeFirstLetter')}</Text>
      
      <View style={styles.inscriptionContainer}>
        <Text style={styles.weaveQuote}>
          {revealed === 0 ? <Text style={styles.cursorPulse}>|</Text> : words.slice(0, revealed).join(" ")}
          {revealed > 0 && !complete && <Text style={styles.cursorPulse}> |</Text>}
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

      {complete ? (
        <View style={styles.finishContainer}>
          <View style={styles.finishStatus}>
            <Check color={Palette.sage} size={20} />
            <Text style={styles.statusCorrect}>{t('inscribe.wovenTogether', 'Beautifully done.')}</Text>
          </View>
          <SpringButton style={styles.button} onPress={onNext}>
            <Text style={styles.buttonText}>{t('inscribe.continue', 'Continue')}</Text>
            <ArrowRight color="#fff" size={20} />
          </SpringButton>
          <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={onRestart}>
            <Text style={styles.secondaryButtonText}>{t('inscribe.practiceAgain')}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]} onPress={onFocus}>
          <Text style={styles.outlineButtonText}>{t('inscribe.tapHere')}</Text>
          <Text style={styles.countText}>{revealed}/{words.length}</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

function ReferenceButton({ option, correct, onCorrect }: { option: string; correct: string; onCorrect: () => void }) {
  const [status, setStatus] = useState<'idle' | 'wrong' | 'correct'>('idle');
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (status !== 'idle') return;

    if (option === correct) {
      setStatus('correct');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCorrect();
    } else {
      setStatus('wrong');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      scale.value = withSpring(0.9, { damping: 10, stiffness: 200 }, () => {
        scale.value = withSpring(1);
      });
      setTimeout(() => setStatus('idle'), 1000);
    }
  };

  let bgColor = 'rgba(255,255,255,0.8)';
  if (status === 'correct') bgColor = '#D1FAE5';
  if (status === 'wrong') bgColor = '#FEE2E2';

  return (
    <AnimatedPressable 
      onPress={handlePress}
      style={[
        styles.referenceBtn,
        { backgroundColor: bgColor },
        animatedStyle
      ]}
    >
      <Text style={[styles.referenceBtnText, status === 'correct' && { color: '#047857' }, status === 'wrong' && { color: '#B91C1C' }]}>{option}</Text>
    </AnimatedPressable>
  );
}

function LevelFour({ t, words, onRestart, onClose, onGrade, isQueue, referenceOptions, correctReference }: { t: any, words: string[]; onRestart: () => void; onClose: () => void; onGrade?: (grade: QueueGrade) => void; isQueue?: boolean; referenceOptions: string[]; correctReference: string }) {
  const [passedQuiz, setPassedQuiz] = useState(false);

  return (
    <View style={styles.levelContainer}>
      <Text style={styles.eyebrow}>{t('inscribe.whereFound', 'Where is this verse found?')}</Text>
      <Text style={styles.title}>{passedQuiz ? correctReference : '???'}</Text>
      
      <View style={styles.inscriptionContainer}>
        <Text style={styles.weaveQuote}>
          {words.join(" ")}
        </Text>
      </View>

      <View style={styles.finishContainer}>
        {!passedQuiz ? (
          <View style={{ width: '100%', gap: 12, marginTop: 20 }}>
            {referenceOptions.map(opt => (
              <ReferenceButton 
                key={opt}
                option={opt}
                correct={correctReference}
                onCorrect={() => setPassedQuiz(true)}
              />
            ))}
          </View>
        ) : (
          <>
            <View style={styles.finishStatus}>
              <Check color={Palette.sage} size={20} />
              <Text style={styles.statusCorrect}>{t('inscribe.isInscribed', { verse: correctReference })}</Text>
            </View>
            {isQueue && onGrade ? (
              <View style={styles.gradeContainer}>
                <Text style={styles.gradePrompt}>{t('inscribe.howHard', 'How hard was it to remember?')}</Text>
                <View style={styles.gradeButtons}>
                  <Pressable style={[styles.gradeBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => onGrade('hard')}>
                    <Text style={[styles.gradeBtnText, { color: '#B91C1C' }]}>{t('inscribe.hard', 'Hard')}</Text>
                  </Pressable>
                  <Pressable style={[styles.gradeBtn, { backgroundColor: '#FEF3C7' }]} onPress={() => onGrade('good')}>
                    <Text style={[styles.gradeBtnText, { color: '#B45309' }]}>{t('inscribe.good', 'Good')}</Text>
                  </Pressable>
                  <Pressable style={[styles.gradeBtn, { backgroundColor: '#D1FAE5' }]} onPress={() => onGrade('easy')}>
                    <Text style={[styles.gradeBtnText, { color: '#047857' }]}>{t('inscribe.easy', 'Easy')}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <SpringButton style={styles.button} onPress={onClose}>
                <Text style={styles.buttonText}>{t('inscribe.finish')}</Text>
              </SpringButton>
            )}
            <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={onRestart}>
              <Text style={styles.secondaryButtonText}>{t('inscribe.practiceAgain')}</Text>
            </Pressable>
          </>
        )}
      </View>
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
    marginBottom: 20,
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
    gap: 8,
    alignItems: 'center',
  },
  progressDot: {
    height: 6,
    width: 40,
    borderRadius: 3,
  },
  progressDotActive: {
    backgroundColor: Palette.primary,
  },
  progressDotInactive: {
    backgroundColor: Palette.border,
  },
  progressText: {
    fontFamily: Typography.sansBold,
    fontSize: 12,
    color: Palette.primary,
    width: 44,
    textAlign: 'right',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  levelContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 30,
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
    fontSize: 34,
    color: Palette.foreground,
    marginTop: 12,
  },
  subtitle: {
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    color: Palette.mutedForeground,
    marginTop: 8,
  },
  cardContainer: {
    width: '100%',
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginVertical: 20,
    position: 'relative',
  },
  blobOne: {
    position: 'absolute',
    width: '90%',
    height: 200,
    borderRadius: 100,
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
    marginBottom: 20,
  },
  quote: {
    fontFamily: Typography.serifMedium,
    fontSize: 32,
    lineHeight: 40,
    color: Palette.foreground,
    textAlign: 'center',
    maxWidth: '90%',
  },
  description: {
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    lineHeight: 24,
    color: Palette.mutedForeground,
    textAlign: 'center',
    maxWidth: '80%',
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: Palette.primary,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
  },
  buttonText: {
    fontFamily: Typography.sansBold,
    fontSize: 18,
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
    marginVertical: 20,
    paddingVertical: 20,
    width: '100%',
  },
  weaveQuote: {
    fontFamily: Typography.serifMedium,
    fontSize: 30,
    lineHeight: 46,
    color: Palette.foreground,
    textAlign: 'center',
  },
  blankText: {
    borderBottomWidth: 2,
    minWidth: 80,
    textAlign: 'center',
  },
  blankFilled: {
    borderColor: Palette.primary,
    color: Palette.primary,
  },
  blankWrong: {
    borderColor: Palette.destructive,
    color: Palette.destructive,
  },
  blankEmpty: {
    borderColor: Palette.gold,
    color: 'rgba(0,0,0,0)',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
  },
  optionBadge: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  optionBadgeActive: {
    borderColor: Palette.border,
    backgroundColor: Palette.background,
  },
  optionBadgeDisabled: {
    borderColor: Palette.border,
    backgroundColor: Palette.secondary,
  },
  optionText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: Palette.foreground,
  },
  optionTextDisabled: {
    color: Palette.mutedForeground,
  },
  statusContainer: {
    minHeight: 24,
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusWrong: {
    fontFamily: Typography.sansBold,
    fontSize: 14,
    color: Palette.destructive,
  },
  statusCorrect: {
    fontFamily: Typography.sansBold,
    fontSize: 14,
    color: Palette.sage,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
  resetButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    flex: 1,
    height: 60,
    borderRadius: 30,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  hiddenInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
  completeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  completeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  completeIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  completeTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 32,
    color: Palette.foreground,
    marginBottom: 12,
    textAlign: 'center',
  },
  completeSubtitle: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: Palette.mutedForeground,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '80%',
  },
  completeButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  completeButtonText: {
    fontFamily: Typography.sansBold,
    fontSize: 16,
    color: Palette.background,
  },
  inscriptionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    paddingTop: 40,
    paddingBottom: 80,
  },
  cursorPulse: {
    color: Palette.gold,
  },
  finishContainer: {
    width: '100%',
    marginTop: 20,
  },
  finishStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  secondaryButton: {
    height: 50,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: Palette.foreground,
  },
  outlineButton: {
    height: 60,
    width: '100%',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Palette.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  outlineButtonText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: Palette.foreground,
    flex: 1,
  },
  countText: {
    fontFamily: Typography.sansMedium,
    fontSize: 12,
    color: Palette.mutedForeground,
  },
  gradeContainer: {
    width: '100%',
    marginVertical: 12,
  },
  gradePrompt: {
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    color: Palette.mutedForeground,
    textAlign: 'center',
    marginBottom: 12,
  },
  gradeButtons: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  gradeBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeBtnText: {
    fontFamily: Typography.sansBold,
    fontSize: 14,
  },
  referenceBtn: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referenceBtnText: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 18,
    color: Palette.foreground,
  },
});
