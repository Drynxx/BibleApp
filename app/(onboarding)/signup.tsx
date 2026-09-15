import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/services/authContext';
import { useOnboarding } from '../../src/services/onboardingContext';
import { Palette, Typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeOutUp,
  FadeIn
} from 'react-native-reanimated';
import { Flame } from 'lucide-react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SpringButton: React.FC<{ onPress: () => void; children: React.ReactNode; style?: any; disabled?: boolean }> = ({ onPress, children, style, disabled }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  
  const handlePressIn = () => {
    if (disabled) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { }
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

export default function SignupScreen() {
  const router = useRouter();
  const { signInWithGoogle, signInWithOtp, verifyOtp, updateOnboardingProfile } = useAuth();
  const { state } = useOnboarding();
  const { t, i18n } = useTranslation();

  const [mode, setMode] = useState<'IDLE' | 'EMAIL_INPUT' | 'OTP_INPUT'>('IDLE');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onAuthSuccess = async () => {
    // Write onboarding state to profile
    if (state.translation) {
      await updateOnboardingProfile(state.translation);
    }
    // AuthContext will handle routing since user session is set
    router.replace('/(tabs)');
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const { error: signInError } = await signInWithGoogle();
    if (signInError) {
      setError(signInError);
      setLoading(false);
    } else {
      // In a real OAuth flow with redirects, this might not trigger immediately here. 
      // Auth context listener will pick up the session.
      await onAuthSuccess();
    }
  };

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setError(i18n.language === 'en' ? 'Invalid email' : 'Email invalid');
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
    } else {
      await onAuthSuccess();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled" bounces={false}>
        
        <View style={styles.header}>
          <Animated.View entering={FadeIn.duration(600)} style={styles.iconContainer}>
            <Flame size={48} color={Palette.primary} />
          </Animated.View>
          <Animated.Text entering={FadeIn.duration(600)} style={styles.title}>
            {i18n.language === 'en' ? 'You’ve taken your first step.' : 'Ai făcut primul pas.'}
          </Animated.Text>
          <Animated.Text entering={FadeIn.duration(600)} style={styles.subtitle}>
            {i18n.language === 'en' 
              ? 'Create an account to save your streak and invite a companion to your Cord.' 
              : 'Creează un cont pentru a salva progresul și a invita un prieten.'}
          </Animated.Text>
        </View>

        <View style={styles.formContainer}>
          {mode === 'IDLE' && (
            <Animated.View entering={FadeIn.duration(600)} exiting={FadeOutUp} style={styles.modeView}>
              <SpringButton style={styles.googleButton} onPress={handleGoogleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color={Palette.foreground} /> : <Text style={styles.googleButtonText}>{t('login.googleBtn')}</Text>}
              </SpringButton>

              <SpringButton style={styles.emailButton} onPress={() => setMode('EMAIL_INPUT')} disabled={loading}>
                <Text style={styles.emailButtonText}>{t('login.emailBtn')}</Text>
              </SpringButton>
            </Animated.View>
          )}

          {mode === 'EMAIL_INPUT' && (
            <Animated.View entering={FadeIn.duration(600)} exiting={FadeOutUp} style={styles.modeView}>
              <Text style={styles.inputLabel}>{t('login.emailLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor={Palette.mutedForeground}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus
              />
              <SpringButton style={styles.googleButton} onPress={handleSendOtp} disabled={loading}>
                {loading ? <ActivityIndicator color={Palette.foreground} /> : <Text style={styles.googleButtonText}>{t('login.sendCode')}</Text>}
              </SpringButton>

              <Pressable style={styles.backButton} onPress={() => { setMode('IDLE'); setError(''); }}>
                <Text style={styles.backButtonText}>{t('login.back')}</Text>
              </Pressable>
            </Animated.View>
          )}

          {mode === 'OTP_INPUT' && (
            <Animated.View entering={FadeIn.duration(600)} exiting={FadeOutUp} style={styles.modeView}>
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

              {loading && <ActivityIndicator color={Palette.primary} style={{ marginTop: 20 }} />}

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
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
    marginTop: 80,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontFamily: Typography.serifMedium,
    fontSize: 40,
    color: Palette.foreground,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 48,
  },
  subtitle: {
    fontFamily: Typography.sans,
    fontSize: 16,
    color: Palette.mutedForeground,
    textAlign: 'center',
    lineHeight: 24,
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
    backgroundColor: Palette.foreground,
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  googleButtonText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: Palette.background,
  },
  emailButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(231, 222, 206, 0.6)',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailButtonText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: Palette.foreground,
  },
  inputLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    color: Palette.foreground,
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(231, 222, 206, 0.6)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    fontFamily: Typography.sans,
    fontSize: 16,
    color: Palette.foreground,
    textAlign: 'center',
  },
  backButton: {
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontFamily: Typography.sans,
    fontSize: 14,
    color: Palette.mutedForeground,
  },
  errorText: {
    fontFamily: Typography.sans,
    fontSize: 14,
    color: '#EF4444',
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
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(231, 222, 206, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: Palette.primary,
  },
  otpText: {
    fontFamily: Typography.sansMedium,
    fontSize: 24,
    color: Palette.foreground,
    fontVariant: ['tabular-nums'],
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  }
});
