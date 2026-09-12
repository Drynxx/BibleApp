import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAuth } from '../src/services/authContext';
import { Typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
  FadeOutUp,
  FadeIn
} from 'react-native-reanimated';

// Reanimated Button Component
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SpringButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  disabled?: boolean;
}

const SpringButton: React.FC<SpringButtonProps> = ({ onPress, children, style, disabled }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: scale.value }] };
  });

  const handlePressIn = () => {
    if (disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch { }
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
      style={[style, animatedStyle, disabled && { opacity: 0.6 }]}
    >
      {children}
    </AnimatedPressable>
  );
};

// Main Login Screen
export default function LoginScreen() {
  const videoSource = require('../Paper_pages_rustling_in_breeze_20260912153325.mp4');
  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const { signInWithGoogle, signInWithOtp, verifyOtp } = useAuth();
  const { t, i18n } = useTranslation();

  const [mode, setMode] = useState<'IDLE' | 'EMAIL_INPUT' | 'OTP_INPUT'>('IDLE');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ro' ? 'en' : 'ro';
    i18n.changeLanguage(nextLang);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const { error: signInError } = await signInWithGoogle();
    if (signInError) setError(signInError);
    setLoading(false);
  };

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setError(t('login.invalidEmail'));
      return;
    }
    setLoading(true);
    setError('');
    const { error: otpError } = await signInWithOtp(email);
    if (otpError) {
      setError(otpError);
    } else {
      setMode('OTP_INPUT');
      setOtp('');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (code: string) => {
    if (code.length !== 6) return;
    setLoading(true);
    setError('');
    const { error: verifyError } = await verifyOtp(email, code);
    if (verifyError) {
      setError(verifyError);
      setLoading(false);
    }
    // If successful, authContext will update session and router will redirect
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <VideoView
        style={{ position: 'absolute', width: '100%', height: '100%' }}
        player={player}
        nativeControls={false}
        contentFit="cover"
      />
      {/* Dark overlay to ensure text readability */}
      <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(9, 9, 11, 0.5)' }} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >

          {/* Header */}
          <Pressable onPress={toggleLanguage} style={styles.langToggle}>
            <Text style={styles.langToggleText}>{t('login.switchLang')}</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>{t('login.title')}</Text>
            <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
          </View>

          {/* Dynamic Content Area */}
          <View style={styles.formContainer}>
            {mode === 'IDLE' && (
              <Animated.View entering={FadeInDown.springify().damping(14)} exiting={FadeOutUp} style={styles.modeView}>
                <SpringButton style={styles.googleButton} onPress={handleGoogleLogin} disabled={loading}>
                  {loading ? <ActivityIndicator color="#09090B" /> : <Text style={styles.googleButtonText}>{t('login.googleBtn')}</Text>}
                </SpringButton>

                <SpringButton style={styles.emailButton} onPress={() => setMode('EMAIL_INPUT')} disabled={loading}>
                  <Text style={styles.emailButtonText}>{t('login.emailBtn')}</Text>
                </SpringButton>
              </Animated.View>
            )}

            {mode === 'EMAIL_INPUT' && (
              <Animated.View entering={FadeInDown.springify().damping(14)} exiting={FadeOutUp} style={styles.modeView}>
                <Text style={styles.inputLabel}>{t('login.emailLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#52525B"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoFocus
                />
                <SpringButton style={styles.googleButton} onPress={handleSendOtp} disabled={loading}>
                  {loading ? <ActivityIndicator color="#09090B" /> : <Text style={styles.googleButtonText}>{t('login.sendCode')}</Text>}
                </SpringButton>

                <Pressable style={styles.backButton} onPress={() => { setMode('IDLE'); setError(''); }}>
                  <Text style={styles.backButtonText}>{t('login.back')}</Text>
                </Pressable>
              </Animated.View>
            )}

            {mode === 'OTP_INPUT' && (
              <Animated.View entering={FadeInDown.springify().damping(14)} exiting={FadeOutUp} style={styles.modeView}>
                <Text style={styles.inputLabel}>{t('login.otpLabel', { email })}</Text>

                <View style={styles.otpContainer}>
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const digit = otp[index] || '';
                    return (
                      <View key={index} style={[styles.otpBox, digit ? styles.otpBoxActive : null]}>
                        <Text style={styles.otpText}>{digit}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Hidden input to handle keyboard easily */}
                <TextInput
                  style={styles.hiddenInput}
                  value={otp}
                  onChangeText={(val) => {
                    const clean = val.replace(/[^0-9]/g, '').slice(0, 6);
                    setOtp(clean);
                    if (clean.length === 6) {
                      Keyboard.dismiss();
                      handleVerifyOtp(clean);
                    }
                  }}
                  keyboardType="number-pad"
                  autoFocus
                  maxLength={6}
                />

                {loading && <ActivityIndicator color="#F4F4F5" style={{ marginTop: 20 }} />}

                <Pressable style={[styles.backButton, { marginTop: 24 }]} onPress={() => { setMode('EMAIL_INPUT'); setOtp(''); setError(''); }}>
                  <Text style={styles.backButtonText}>{t('login.diffEmail')}</Text>
                </Pressable>
              </Animated.View>
            )}

            {error ? (
              <Animated.Text entering={FadeIn} style={styles.errorText}>
                {error}
              </Animated.Text>
            ) : null}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 120, // Pushed down
  },
  langToggle: {
    position: 'absolute',
    top: 40,
    right: 24,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    zIndex: 10,
  },
  langToggleText: {
    color: '#F4F4F5',
    fontFamily: Typography.sansMedium,
    fontSize: 14,
  },
  title: {
    fontFamily: Typography.serifMedium,
    fontSize: 52, // Accentuated dimension
    color: '#F4F4F5', // zinc-100
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Typography.sans,
    fontSize: 18, // Accentuated dimension
    color: '#A1A1AA', // zinc-400
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
    minHeight: 250,
    justifyContent: 'flex-end',
  },
  modeView: {
    width: '100%',
  },
  googleButton: {
    backgroundColor: '#F4F4F5', // White-ish zinc
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  googleButtonText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: '#09090B',
  },
  emailButton: {
    backgroundColor: '#27272A', // zinc-800
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailButtonText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: '#F4F4F5',
  },
  inputLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    color: '#E4E4E7', // zinc-200
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#18181B', // zinc-900
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    fontFamily: Typography.sans,
    fontSize: 16,
    color: '#F4F4F5',
    textAlign: 'center',
  },
  backButton: {
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontFamily: Typography.sans,
    fontSize: 14,
    color: '#A1A1AA',
  },
  errorText: {
    fontFamily: Typography.sans,
    fontSize: 14,
    color: '#EF4444', // red-500
    marginTop: 16,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: '#F4F4F5',
  },
  otpText: {
    fontFamily: Typography.sansMedium,
    fontSize: 24,
    color: '#F4F4F5',
    fontVariant: ['tabular-nums'],
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  }
});
