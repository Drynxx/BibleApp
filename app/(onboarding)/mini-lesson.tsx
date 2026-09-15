import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Palette, Typography } from '@/constants/theme';

const LESSON_EN = {
  reference: "John 3:16",
  parts: [
    "For God so ",
    { id: "1", type: "blank", answer: "loved" },
    " the world, that he gave his only Son, that whoever ",
    { id: "2", type: "blank", answer: "believes" },
    " in him should not perish but have eternal life."
  ],
  options: ["loved", "believes", "saves", "trusts"]
};

const LESSON_RO = {
  reference: "Ioan 3:16",
  parts: [
    "Fiindcă atât de mult a ",
    { id: "1", type: "blank", answer: "iubit" },
    " Dumnezeu lumea, că a dat pe singurul Lui Fiu, pentru ca oricine ",
    { id: "2", type: "blank", answer: "crede" },
    " în El, să nu piară, ci să aibă viața veșnică."
  ],
  options: ["iubit", "crede", "caută", "speră"]
};

export default function MiniLessonScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const lesson = i18n.language === 'en' ? LESSON_EN : LESSON_RO;

  const [filledBlanks, setFilledBlanks] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const totalBlanks = lesson.parts.filter(p => typeof p !== 'string').length;
  const isComplete = Object.keys(filledBlanks).length === totalBlanks;

  const handleOptionPress = (word: string) => {
    if (isComplete) return;

    // Find the next unfilled blank
    const blanks = lesson.parts.filter(p => typeof p !== 'string') as any[];
    const nextBlank = blanks.find(b => !filledBlanks[b.id]);

    if (nextBlank) {
      if (nextBlank.answer === word) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setFilledBlanks(prev => ({ ...prev, [nextBlank.id]: word }));
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // Provide visual feedback for error if needed, but keeping it simple for now
      }
    }
  };

  const renderVerse = () => {
    return (
      <View style={styles.verseContainer}>
        <Text style={styles.verseText}>
          {lesson.parts.map((part, idx) => {
            if (typeof part === 'string') {
              return <Text key={idx}>{part}</Text>;
            }
            const filledWord = filledBlanks[part.id];
            if (filledWord) {
              return (
                <Text key={idx} style={styles.filledBlank}>
                  {filledWord}
                </Text>
              );
            }
            return (
              <Text key={idx} style={styles.emptyBlank}>
                {"        "}
              </Text>
            );
          })}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.Text entering={FadeIn.duration(600)} style={styles.title}>
        {i18n.language === 'en' 
          ? "Let’s try a daily practice. Tap the missing words." 
          : "Să încercăm o practică. Alege cuvintele lipsă."}
      </Animated.Text>

      <Animated.View entering={FadeIn.duration(600)} style={styles.card}>
        <Text style={styles.reference}>{lesson.reference}</Text>
        {renderVerse()}
      </Animated.View>

      <View style={styles.footer}>
        {!isComplete ? (
          <Animated.View entering={FadeIn} style={styles.optionsContainer}>
            {lesson.options.map((option, idx) => {
              const isUsed = Object.values(filledBlanks).includes(option);
              return (
                <Pressable
                  key={idx}
                  style={[styles.optionPill, isUsed && styles.optionPillUsed]}
                  onPress={() => handleOptionPress(option)}
                  disabled={isUsed}
                >
                  <Text style={[styles.optionPillText, isUsed && styles.optionPillTextUsed]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(600)}>
            <Pressable style={styles.continueButton} onPress={() => router.push('/signup')}>
              <Text style={styles.continueButtonText}>
                {i18n.language === 'en' ? 'Continue' : 'Continuă'}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    padding: 24,
    paddingTop: 80,
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: Typography.serifMedium,
    fontSize: 28,
    color: Palette.foreground,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 36,
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(231, 222, 206, 0.6)',
  },
  reference: {
    fontFamily: Typography.sansBold,
    fontSize: 12,
    color: Palette.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  verseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  verseText: {
    fontFamily: Typography.serifMedium,
    fontSize: 24,
    lineHeight: 36,
    color: Palette.foreground,
  },
  emptyBlank: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.mutedForeground,
    backgroundColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
    borderRadius: 4,
  },
  filledBlank: {
    color: Palette.primary,
  },
  footer: {
    minHeight: 120,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  optionPill: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(231, 222, 206, 0.6)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  optionPillUsed: {
    backgroundColor: 'rgba(231, 222, 206, 0.1)',
    borderColor: 'rgba(231, 222, 206, 0.2)',
  },
  optionPillText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: Palette.foreground,
  },
  optionPillTextUsed: {
    color: Palette.mutedForeground,
  },
  continueButton: {
    backgroundColor: Palette.foreground,
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  continueButtonText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: Palette.background,
  },
});
