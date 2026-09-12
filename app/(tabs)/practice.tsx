import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Check,
  Leaf,
  MoreVertical,
  RotateCcw,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
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

const verses = {
  en: {
    reference: 'Romans 8:28',
    before: 'And we know that in all things God works for the',
    middle: 'of those who',
    after: 'him',
    answers: ['good', 'love'],
    options: ['good', 'love', 'glory', 'fear', 'serve']
  },
  ro: {
    reference: 'Romani 8:28',
    before: 'De altă parte, știm că toate lucrurile lucrează spre',
    middle: 'celor ce',
    after: 'pe Dumnezeu',
    answers: ['binele', 'iubesc'],
    options: ['binele', 'iubesc', 'slava', 'frica', 'slujesc']
  }
};

export default function PracticeScreen() {
  const { i18n } = useTranslation();
  const lang = (i18n.language === 'ro') ? 'ro' : 'en';
  const { reference, before, middle, after, answers, options } = verses[lang];

  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [picked, setPicked] = useState<string[]>([]);
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const { completeDailyReview } = useCovenant();

  const filled = picked.length === answers.length;
  const isCorrect = useMemo(
    () => picked.length === answers.length && picked.every((w, i) => w === answers[i]),
    [picked],
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
      } catch {}
      setResult('correct');
      setSubmitting(false);
    } else {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      setResult('wrong');
    }
  };

  const reset = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
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
        <Text style={styles.refBadgeText}>{reference}</Text>
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
          {before}{' '}
          <Text
            style={[
              styles.blankWord,
              picked[0] && (result === 'wrong' ? styles.blankWrong : styles.blankActive),
            ]}
          >
            {picked[0] ? picked[0] : '______'}
          </Text>{' '}
          {middle}{' '}
          <Text
            style={[
              styles.blankWord,
              picked[1] && (result === 'wrong' ? styles.blankWrong : styles.blankActive),
            ]}
          >
            {picked[1] ? picked[1] : '______'}
          </Text>{' '}
          {after}
        </Text>
      </View>

      <Text style={styles.instructionText}>Tap a word to fill in the blanks</Text>

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
            ? "Well done — that's exactly right."
            : 'Not quite. Try those blanks again.'}
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
            <Text style={styles.checkButtonText}>Saving...</Text>
          ) : result === 'correct' ? (
            <View style={styles.buttonInner}>
              <Check color="#FFFFFF" size={20} strokeWidth={2.5} />
              <Text style={styles.checkButtonText}>Correct</Text>
            </View>
          ) : (
            <Text style={styles.checkButtonText}>Check answer</Text>
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
