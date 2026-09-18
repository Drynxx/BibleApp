import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Palette, Typography } from '@/constants/theme';
import { useOnboarding } from '../../src/services/onboardingContext';

const OPTIONS = [
  { id: 'memorize', en: 'I want to memorize Scripture.', ro: 'Vreau să memorez Scriptura.' },
  { id: 'peace', en: "I'm looking for daily peace.", ro: 'Caut pacea zilnică.' },
  { id: 'habit', en: 'I want to build a habit with a friend.', ro: 'Vreau să-mi construiesc un obicei alături de un prieten.' },
];

export default function IntentScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const { setIntent } = useOnboarding();

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIntent(id);
    router.push('/translation');
  };

  return (
    <View style={styles.container}>
      <Animated.Text entering={FadeIn.duration(600)} style={styles.title}>
        {i18n.language === 'en' ? 'What brings you to Inscribe today?' : 'Ce te aduce azi la Inscribe?'}
      </Animated.Text>

      <View style={styles.optionsContainer}>
        {OPTIONS.map((option, index) => (
          <Animated.View key={option.id} entering={FadeIn.duration(600)}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.optionCard}
              onPress={() => handleSelect(option.id)}
            >
              <View style={styles.textContainer}>
                <Text style={styles.optionText}>
                  {i18n.language === 'en' ? option.en : option.ro}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontFamily: Typography.serifMedium,
    fontSize: 32,
    color: Palette.foreground,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 40,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(231, 222, 206, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: Palette.foreground,
    textAlign: 'center',
  },
});
