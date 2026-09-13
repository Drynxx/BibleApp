import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Check,
  Leaf,
  MoreVertical,
  RotateCcw,
} from 'lucide-react-native';
import React, { useMemo, useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette, Typography } from '@/constants/theme';
import { useCovenant } from '../../src/services/covenantContext';
import { useTranslation } from 'react-i18next';
import { verseRepository } from '../../src/services/db/verseRepository';
import { recallEngine, PracticeToken } from '../../src/services/practice/recallEngine';

export default function PracticeScreen() {
  const { t, i18n } = useTranslation();
  
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [tokens, setTokens] = useState<PracticeToken[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);

  const [picked, setPicked] = useState<string[]>([]);
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const { completeDailyReview } = useCovenant();

  useEffect(() => {
    let isMounted = true;
    async function loadVerse() {
      // Hardcode Romans 8:28 for testing
      const translation = i18n.language === 'ro' ? 'vdcc' : 'kjv';
      const rawText = await verseRepository.getVerse(45, 8, 28, translation);
      
      if (!isMounted) return;

      if (rawText && !rawText.startsWith('[')) {
        const langCode = i18n.language === 'ro' ? 'ro' : 'en';
        const generated = recallEngine.generateRecallPractice(rawText, 2, langCode); // Difficulty 2 = 2 blanks
        setTokens(generated);
        
        const blankTokens = generated.filter(t => t.type === 'blank');
        setAnswers(blankTokens.map(t => t.value));
        
        let allOptions = new Set<string>();
        blankTokens.forEach(t => t.options?.forEach(opt => allOptions.add(opt)));
        setOptions(Array.from(allOptions).sort(() => Math.random() - 0.5));
      } else {
        setTokens([{ type: 'text', value: rawText || 'Database not available.' }]);
        setAnswers([]);
        setOptions([]);
      }
    }
    loadVerse();
    return () => { isMounted = false; };
  }, [i18n.language]);

  const filled = answers.length > 0 && picked.length === answers.length;
  const isCorrect = useMemo(
    () => answers.length > 0 && picked.length === answers.length && picked.every((w, i) => w === answers[i]),
    [picked, answers],
  );

  const pick = (word: string) => {
    if (result !== 'idle') return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // safe fallback on unsupported environments
    }

    setPicked((prev) =>
      prev.includes(word)
        ? prev.filter((w) => w !== word)
        : prev.length < answers.length
          ? [...prev, word]
          : prev,
    );
  };

  const handleCheck = async () => {
    if (isCorrect) {
      setSubmitting(true);
      try {
        await completeDailyReview();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch { }
      setResult('correct');
      setSubmitting(false);
    } else {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch { }
      setResult('wrong');
    }
  };

  const reset = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch { }
    setPicked([]);
    setResult('idle');
  };

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
            <Text style={styles.brandTitle}>Inscribe</Text>
            <Text style={styles.brandSubtitle}>SMALL STEPS. DEEPER FAITH.</Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          accessibilityLabel="Open menu"
        >
          <MoreVertical color={Palette.foreground} size={20} />
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '6.25%' }]} />
        </View>
        <Text style={styles.progressText}>1/16</Text>
      </View>

      {/* Reference Badge */}
      <View style={styles.refBadge}>
        <Text style={styles.refBadgeText}>{i18n.language === 'ro' ? 'Romani 8:28' : 'Romans 8:28'}</Text>
      </View>

      {/* Verse with Blanks Container */}
      <View style={styles.verseBox}>
        {/* Background decorative blob */}
        <View style={styles.verseBlob} />
        <Leaf
          color={Palette.gold}
          size={140}
          strokeWidth={1}
          style={styles.verseWatermark}
        />

        <Text style={styles.verseText}>
          {tokens.map((token, index) => {
            if (token.type === 'text') {
              return <Text key={index}>{token.value}</Text>;
            } else {
              const blankIndex = tokens.slice(0, index).filter(t => t.type === 'blank').length;
              const pickedWord = picked[blankIndex];
              return (
                <Text
                  key={index}
                  style={[
                    styles.blankWord,
                    pickedWord && (result === 'wrong' ? styles.blankWrong : styles.blankActive),
                  ]}
                >
                  {pickedWord ? pickedWord : '______'}
                </Text>
              );
            }
          })}
        </Text>
      </View>

      <Text style={styles.instructionText}>{t('practice.tapWord', 'Tap a word to fill in the blanks')}</Text>

      {/* Word options */}
      <View style={styles.optionsWrap}>
        {options.map((word) => {
          const active = picked.includes(word);
          return (
            <Pressable
              key={word}
              style={({ pressed }) => [
                styles.optionChip,
                active ? styles.optionChipActive : styles.optionChipInactive,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
              onPress={() => pick(word)}
            >
              <Text
                style={[
                  styles.optionText,
                  active ? styles.optionTextActive : styles.optionTextInactive,
                ]}
              >
                {word}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Feedback Status */}
      {result !== 'idle' && (
        <Text
          style={[
            styles.statusMessage,
            result === 'correct' ? styles.statusCorrect : styles.statusWrong,
          ]}
        >
          {result === 'correct'
            ? t('practice.feedbackCorrect', "Well done — that's exactly right.")
            : t('practice.feedbackWrong', 'Not quite. Try those blanks again.')}
        </Text>
      )}

      {/* Bottom Controls */}
      <View style={styles.actionRow}>
        <Pressable
          style={({ pressed }) => [
            styles.checkButton,
            (!filled || result === 'correct') && styles.checkButtonDisabled,
            result === 'correct' && styles.checkButtonSuccess,
            pressed && filled && result !== 'correct' && { opacity: 0.9, transform: [{ scale: 0.99 }] },
          ]}
          disabled={!filled || result === 'correct' || submitting}
          onPress={handleCheck}
        >
          {submitting ? (
            <Text style={styles.checkButtonText}>{t('practice.saving', 'Saving...')}</Text>
          ) : result === 'correct' ? (
            <View style={styles.buttonInner}>
              <Check color="#FFFFFF" size={20} strokeWidth={2.5} />
              <Text style={styles.checkButtonText}>{t('practice.correct', 'Correct')}</Text>
            </View>
          ) : (
            <Text style={styles.checkButtonText}>{t('practice.checkAnswer', 'Check answer')}</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
          onPress={reset}
          accessibilityLabel="Reset answers"
        >
          <RotateCcw color={Palette.foreground} size={20} />
        </Pressable>
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
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    backgroundColor: Palette.secondary,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Palette.primary,
    borderRadius: 5,
  },
  progressText: {
    fontFamily: Typography.sansBold,
    fontSize: 14,
    color: Palette.primary,
  },
  refBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginTop: 22,
  },
  refBadgeText: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#FFFFFF',
  },
  verseBox: {
    marginTop: 18,
    backgroundColor: Palette.paper,
    borderRadius: 24,
    padding: 24,
    minHeight: 180,
    borderWidth: 1,
    borderColor: Palette.border,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  verseBlob: {
    position: 'absolute',
    bottom: -40,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Palette.secondary,
    opacity: 0.35,
    transform: [{ rotate: '-8deg' }],
  },
  verseWatermark: {
    position: 'absolute',
    bottom: -20,
    right: 10,
    opacity: 0.15,
    transform: [{ rotate: '25deg' }],
  },
  verseText: {
    fontFamily: Typography.serifMedium,
    fontSize: 24,
    lineHeight: 36,
    color: Palette.foreground,
  },
  blankWord: {
    fontFamily: Typography.serifSemiBold,
    textDecorationLine: 'underline',
    color: Palette.mutedForeground,
  },
  blankActive: {
    color: Palette.primary,
    fontWeight: 'bold',
  },
  blankWrong: {
    color: Palette.destructive,
    fontWeight: 'bold',
  },
  instructionText: {
    fontFamily: Typography.sansMedium,
    fontSize: 13,
    color: Palette.mutedForeground,
    marginTop: 18,
    textAlign: 'center',
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
  },
  optionChip: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  optionChipInactive: {
    backgroundColor: Palette.card,
    borderColor: Palette.border,
  },
  optionChipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  optionText: {
    fontSize: 15,
  },
  optionTextInactive: {
    fontFamily: Typography.sansMedium,
    color: Palette.foreground,
  },
  optionTextActive: {
    fontFamily: Typography.sansBold,
    color: '#FFFFFF',
  },
  statusMessage: {
    fontFamily: Typography.sansBold,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
  statusCorrect: {
    color: Palette.primary,
  },
  statusWrong: {
    color: Palette.destructive,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 22,
  },
  checkButton: {
    flex: 1,
    height: 58,
    borderRadius: 29,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonDisabled: {
    opacity: 0.45,
  },
  checkButtonSuccess: {
    backgroundColor: Palette.sage,
  },
  checkButtonText: {
    fontFamily: Typography.sansBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
