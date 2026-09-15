import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Typography } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SpringButton: React.FC<{ onPress: () => void; children: React.ReactNode; style?: any }> = ({
  onPress,
  children,
  style,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: scale.value }] };
  });

  const handlePressIn = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch { }
    scale.value = withSpring(0.97, { damping: 12, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
};

export default function WelcomeScreen() {
  const videoSource = require('../../Paper_pages_rustling_in_breeze_20260912153325.mp4');
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const router = useRouter();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ro' ? 'en' : 'ro';
    i18n.changeLanguage(nextLang);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <VideoView
        style={{ position: 'absolute', width: '100%', height: '100%' }}
        player={player}
        nativeControls={false}
        contentFit="cover"
      />
      <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(9, 9, 11, 0.4)' }} />

      <Pressable onPress={toggleLanguage} style={styles.langToggle}>
        <Globe size={20} color="#F4F4F5" />
      </Pressable>

      <View style={styles.content}>
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <Text style={styles.title}>Inscribe</Text>
          <Text style={styles.subtitle}>
            {i18n.language === 'en' ? 'SMALL STEPS. DEEPER FAITH.' : 'PAȘI MICI. CREDINȚĂ PROFUNDĂ.'}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(600)} style={styles.footer}>
          <SpringButton style={styles.primaryButton} onPress={() => router.push('/intent')}>
            <Text style={styles.primaryButtonText}>
              {i18n.language === 'en' ? 'Begin Journey' : 'Începe Călătoria'}
            </Text>
          </SpringButton>

          <Pressable style={styles.secondaryLink} onPress={() => router.push('/signup')}>
            <Text style={styles.secondaryLinkText}>
              {i18n.language === 'en' ? 'Already have an account? Log in' : 'Ai deja un cont? Autentifică-te'}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  langToggle: {
    position: 'absolute',
    top: 60,
    right: 24,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginTop: 140,
  },
  title: {
    fontFamily: Typography.serifMedium,
    fontSize: 56,
    color: '#F4F4F5',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Typography.sansBold,
    fontSize: 12,
    color: '#E4E4E7',
    letterSpacing: 3,
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#F4F4F5',
    width: '100%',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  primaryButtonText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: '#09090B',
  },
  secondaryLink: {
    padding: 12,
  },
  secondaryLinkText: {
    fontFamily: Typography.sans,
    fontSize: 14,
    color: '#A1A1AA',
  },
});
