import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/services/authContext';
import { databaseManager } from '../../src/services/db/databaseManager';
import { Palette, Typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { signOut, updateLanguage } = useAuth();
  const [isDownloadingVDCC, setIsDownloadingVDCC] = useState(false);

  const handleLanguageChange = (lang: string) => {
    if (i18n.language === lang) return;
    Haptics.selectionAsync();
    i18n.changeLanguage(lang);
    updateLanguage(lang);
  };

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
  };

  const downloadVDCC = async () => {
    try {
      setIsDownloadingVDCC(true);
      await databaseManager.ensureDbExists('vdcc');
      Alert.alert('Success', 'Romanian translation downloaded successfully!');
    } catch (e) {
      Alert.alert('Download Failed', 'Could not download the database. Please try again.');
    } finally {
      setIsDownloadingVDCC(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 100 }]}>
      <Text style={styles.title}>{t('profile.title')}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
        <View style={styles.optionsRow}>
          <Pressable 
            style={[styles.optionBtn, i18n.language === 'en' && styles.optionBtnActive]} 
            onPress={() => handleLanguageChange('en')}
          >
            <Text style={[styles.optionText, i18n.language === 'en' && styles.optionTextActive]}>English (EN)</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.optionBtn, i18n.language === 'ro' && styles.optionBtnActive]} 
            onPress={() => handleLanguageChange('ro')}
          >
            <Text style={[styles.optionText, i18n.language === 'ro' && styles.optionTextActive]}>Română (RO)</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bible Translations</Text>
        <Pressable 
          style={[styles.downloadBtn, isDownloadingVDCC && styles.downloadBtnDisabled]} 
          onPress={downloadVDCC}
          disabled={isDownloadingVDCC}
        >
          {isDownloadingVDCC ? (
            <ActivityIndicator color={Palette.foreground} size="small" />
          ) : (
            <Text style={styles.downloadBtnText}>Download Romanian (VDCC)</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    padding: 24,
  },
  title: {
    fontFamily: Typography.serifMedium,
    fontSize: 32,
    color: Palette.foreground,
    marginBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: Palette.mutedForeground,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Palette.card,
    alignItems: 'center',
  },
  optionBtnActive: {
    backgroundColor: Palette.card,
    borderColor: Palette.foreground,
  },
  optionText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: Palette.mutedForeground,
  },
  optionTextActive: {
    color: Palette.foreground,
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 20,
    alignItems: 'center',
  },
  signOutBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  signOutText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: '#EF4444',
  },
  downloadBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Palette.card,
    backgroundColor: Palette.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtnDisabled: {
    opacity: 0.7,
  },
  downloadBtnText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: Palette.foreground,
  }
});
