import { useRouter } from "expo-router";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  Languages,
  Mail,
  Moon,
  ShieldCheck,
  Trash2,
  Type,
  Vibrate,
  Volume2,
  LogOut,
  BookOpen,
  Eraser,
  FileText,
} from "lucide-react-native";
import React, { useState, type ReactNode } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, Easing, ActivityIndicator, Alert, TouchableWithoutFeedback } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Palette, Typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../src/services/authContext';
import { databaseManager } from '../src/services/db/databaseManager';

type Option = { value: string; label: string };

function GroupLabel({ children }: { children: string }) {
  return (
    <Text style={styles.groupLabel}>{children}</Text>
  );
}

function GroupCard({ children }: { children: ReactNode }) {
  return (
    <View style={styles.groupCard}>
      {children}
    </View>
  );
}

function Row({
  icon: Icon,
  label,
  detail,
  control,
  destructive = false,
  last = false,
  onClick,
}: {
  icon: any;
  label: string;
  detail?: string;
  control?: ReactNode;
  destructive?: boolean;
  last?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <View style={[styles.rowIconBox, destructive ? styles.rowIconBoxDestructive : styles.rowIconBoxPrimary]}>
        <Icon color={destructive ? Palette.destructive : Palette.primary} size={17} strokeWidth={1.8} />
      </View>
      <View style={styles.rowTextContainer}>
        <Text style={[styles.rowLabel, destructive && { color: Palette.destructive }]}>
          {label}
        </Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      {control}
    </>
  );

  const containerStyle = [
    styles.rowContainer,
    !last && styles.rowBorder
  ];

  if (onClick) {
    return (
      <Pressable 
        style={({ pressed }) => [containerStyle, pressed && styles.rowPressed]} 
        onPress={onClick}
      >
        {body}
      </Pressable>
    );
  }
  return <View style={containerStyle}>{body}</View>;
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.segmentedContainer}>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.segmentedButton,
              isSelected && styles.segmentedButtonActive
            ]}
          >
            <Text style={[
              styles.segmentedText,
              isSelected && styles.segmentedTextActive
            ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function CustomSwitch({ value, onValueChange }: { value: boolean, onValueChange: (val: boolean) => void }) {
  const [anim] = React.useState(new Animated.Value(value ? 1 : 0));
  
  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [value]);

  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [Palette.border, Palette.primary]
  });

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22]
  });

  return (
    <TouchableWithoutFeedback onPress={() => { Haptics.selectionAsync(); onValueChange(!value); }}>
      <Animated.View style={[styles.switchTrack, { backgroundColor }]}>
        <Animated.View style={[styles.switchThumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

function ValueChevron({ value }: { value: string }) {
  return (
    <View style={styles.valueChevron}>
      <Text style={styles.valueChevronText}>{value}</Text>
      <ChevronRight color={Palette.mutedForeground} size={16} />
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { signOut, updateLanguage } = useAuth();

  const [theme, setTheme] = useState("light");
  const [textSize, setTextSize] = useState("medium");
  const [bibleLang, setBibleLang] = useState("niv");
  const [dailyNudge, setDailyNudge] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [sounds, setSounds] = useState(false);
  const [isDownloadingVDCC, setIsDownloadingVDCC] = useState(false);

  const interfaceLang = i18n.language === 'ro' ? 'romanian' : 'english';

  const handleLanguageChange = (val: string) => {
    const langCode = val === 'romanian' ? 'ro' : 'en';
    if (i18n.language === langCode) return;
    Haptics.selectionAsync();
    i18n.changeLanguage(langCode);
    updateLanguage(langCode);
  };

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
  };

  const downloadVDCC = async () => {
    if (isDownloadingVDCC) return;
    try {
      setIsDownloadingVDCC(true);
      await databaseManager.ensureDbExists('vdcc');
      Alert.alert('Success', 'VDCC Translation downloaded successfully.');
    } catch (e) {
      Alert.alert('Download Failed', 'Could not download translation.');
    } finally {
      setIsDownloadingVDCC(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 8, 20), paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <ChevronLeft color={Palette.mutedForeground} size={20} strokeWidth={1.8} />
          </Pressable>
          <View>
            <Text style={styles.headerEyebrow}>{t('settings.eyebrow', 'Control room')}</Text>
            <Text style={styles.headerTitle}>{t('settings.title', 'Settings')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <GroupLabel>{t('settings.appearance', 'Appearance & Accessibility')}</GroupLabel>
          <GroupCard>
            <Row
              icon={Moon}
              label={t('settings.theme', 'Theme')}
              control={
                <SegmentedControl
                  options={[
                    { value: "light", label: "Light" },
                    { value: "dark", label: "Dark" },
                    { value: "system", label: "Auto" },
                  ]}
                  value={theme}
                  onChange={setTheme}
                />
              }
            />
            <Row
              icon={Type}
              label={t('settings.textSize', 'Text size')}
              last
              control={
                <SegmentedControl
                  options={[
                    { value: "small", label: "S" },
                    { value: "medium", label: "M" },
                    { value: "large", label: "L" },
                  ]}
                  value={textSize}
                  onChange={setTextSize}
                />
              }
            />
          </GroupCard>
        </View>

        <View style={styles.section}>
          <GroupLabel>{t('settings.languageAndPractice', 'Language & Practice')}</GroupLabel>
          <GroupCard>
            <Row
              icon={Languages}
              label={t('settings.appLanguage', 'App language')}
              control={
                <SegmentedControl
                  options={[
                    { value: "english", label: "EN" },
                    { value: "romanian", label: "RO" },
                  ]}
                  value={interfaceLang}
                  onChange={handleLanguageChange}
                />
              }
            />
            <Row
              icon={BookOpen}
              label={t('settings.bibleText', 'Bible text')}
              control={
                <SegmentedControl
                  options={[
                    { value: "niv", label: "NIV" },
                    { value: "kjv", label: "KJV" },
                    { value: "vdcc", label: "VDCC" },
                  ]}
                  value={bibleLang}
                  onChange={setBibleLang}
                />
              }
            />
            <Row
              icon={Bell}
              label={t('settings.dailyNudge', 'Daily nudge')}
              detail={t('settings.nudgeDetail', 'Remind me at 8:00 AM')}
              control={
                <CustomSwitch value={dailyNudge} onValueChange={setDailyNudge} />
              }
            />
            <Row
              icon={Vibrate}
              label={t('settings.haptics', 'Haptic feedback')}
              control={
                <CustomSwitch value={haptics} onValueChange={setHaptics} />
              }
            />
            <Row
              icon={Volume2}
              label={t('settings.sounds', 'Sound effects')}
              last
              control={
                <CustomSwitch value={sounds} onValueChange={setSounds} />
              }
            />
          </GroupCard>
        </View>

        <View style={styles.section}>
          <GroupLabel>{t('settings.dataStorage', 'Data & Storage')}</GroupLabel>
          <GroupCard>
            <Row
              icon={Download}
              label={t('settings.exportData', 'Export my data')}
              detail={t('settings.exportDetail', 'Saved and mastered verses as a text file')}
              onClick={() => {}}
              control={<ChevronRight color={Palette.mutedForeground} size={16} />}
            />
            <Row
              icon={Download}
              label={t('profile.downloadVdcc', 'Download VDCC Database')}
              detail={isDownloadingVDCC ? t('profile.downloading', 'Downloading...') : ''}
              onClick={downloadVDCC}
              control={isDownloadingVDCC ? <ActivityIndicator size="small" color={Palette.primary} /> : <ChevronRight color={Palette.mutedForeground} size={16} />}
            />
            <Row
              icon={Eraser}
              label={t('settings.clearCache', 'Clear cache')}
              last
              onClick={() => {}}
              control={<ValueChevron value="12.4 MB" />}
            />
          </GroupCard>
        </View>

        <View style={styles.section}>
          <GroupLabel>{t('settings.accountSupport', 'Account & Support')}</GroupLabel>
          <GroupCard>
            <Row
              icon={Mail}
              label={t('settings.contactSupport', 'Contact support')}
              onClick={() => {}}
              control={<ChevronRight color={Palette.mutedForeground} size={16} />}
            />
            <Row
              icon={ShieldCheck}
              label={t('settings.privacyPolicy', 'Privacy policy')}
              onClick={() => {}}
              control={<ChevronRight color={Palette.mutedForeground} size={16} />}
            />
            <Row
              icon={FileText}
              label={t('settings.termsOfService', 'Terms of service')}
              onClick={() => {}}
              control={<ChevronRight color={Palette.mutedForeground} size={16} />}
            />
            <Row
              icon={LogOut}
              label={t('settings.signOut', 'Sign out')}
              onClick={handleSignOut}
              control={<ChevronRight color={Palette.mutedForeground} size={16} />}
            />
            <Row icon={Trash2} label={t('settings.deleteAccount', 'Delete account')} destructive last onClick={() => {}} />
          </GroupCard>
        </View>

        <Text style={styles.versionText}>Verse v1.0.2 (Build 44)</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.card,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  backButtonPressed: {
    backgroundColor: Palette.border,
  },
  headerEyebrow: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2.2,
    color: Palette.mutedForeground,
  },
  headerTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 30,
    color: Palette.foreground,
    lineHeight: 34,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  groupLabel: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2.2,
    color: Palette.mutedForeground,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  groupCard: {
    backgroundColor: Palette.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(231, 222, 206, 0.55)', // border/55
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 2,
    overflow: 'hidden',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Palette.card,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  rowPressed: {
    backgroundColor: Palette.paper,
  },
  rowIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowIconBoxPrimary: {
    backgroundColor: Palette.primaryLight,
  },
  rowIconBoxDestructive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  rowTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  rowLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    color: Palette.foreground,
  },
  rowDetail: {
    fontFamily: Typography.sans,
    fontSize: 11.5,
    color: Palette.mutedForeground,
    marginTop: 2,
  },
  segmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 247, 242, 0.7)', // bg-background/70
    borderWidth: 1,
    borderColor: 'rgba(231, 222, 206, 0.6)', // border/60
    borderRadius: 16,
    padding: 2,
  },
  segmentedButton: {
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedButtonActive: {
    backgroundColor: Palette.primary,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 1,
  },
  segmentedText: {
    fontFamily: Typography.sansMedium,
    fontSize: 11,
    color: Palette.mutedForeground,
  },
  segmentedTextActive: {
    color: '#FFF',
  },
  valueChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueChevronText: {
    fontFamily: Typography.sans,
    fontSize: 12,
    color: Palette.mutedForeground,
  },
  versionText: {
    fontFamily: Typography.sans,
    fontSize: 11,
    color: Palette.mutedForeground,
    textAlign: 'center',
    marginTop: 32,
    opacity: 0.8,
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  }
});
