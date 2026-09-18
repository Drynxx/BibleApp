import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Palette, Typography } from '@/constants/theme';
import { useOnboarding } from '../../src/services/onboardingContext';

const OPTIONS_EN = [
  { id: 'WEB', label: 'World English Bible', subtext: 'Modern, highly accessible' },
  { id: 'KJV', label: 'King James Version', subtext: 'Classic, poetic language' },
];

const OPTIONS_RO = [
  { id: 'VDCC', label: 'Dumitru Cornilescu', subtext: 'Versiunea clasică, tradițională' },
  { id: 'NTR', label: 'Noua Traducere', subtext: 'Limbaj modern, accesibil' },
];

export default function TranslationScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const { setTranslation } = useOnboarding();

  const options = i18n.language === 'en' ? OPTIONS_EN : OPTIONS_RO;

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTranslation(id);
    router.push('/mini-lesson');
  };

  return (
    <View style={styles.container}>
      <Animated.Text entering={FadeIn.duration(600)} style={styles.title}>
        {i18n.language === 'en' ? 'Which voice resonates with you?' : 'Ce voce rezonează cu tine?'}
      </Animated.Text>

      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <Animated.View key={option.id} entering={FadeIn.duration(600)}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.optionCard}
              onPress={() => handleSelect(option.id)}
            >
              <View style={styles.textContainer}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionSubtext}>{option.subtext}</Text>
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
  optionLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: 18,
    color: Palette.foreground,
    textAlign: 'center',
    marginBottom: 4,
  },
  optionSubtext: {
    fontFamily: Typography.sans,
    fontSize: 14,
    color: Palette.mutedForeground,
    textAlign: 'center',
  },
});
