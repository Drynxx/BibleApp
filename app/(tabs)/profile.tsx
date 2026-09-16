import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Typography } from '@/constants/theme';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Leaf,
  Settings,
  Bookmark,
  FolderHeart,
  Feather,
  LockKeyhole,
  Eye,
  Trash2,
  Plus,
  ChevronRight,
  BookOpen
} from 'lucide-react-native';
import { useProfileLibrary } from '../../src/hooks/useProfileLibrary';

type LibraryView = "saved" | "packs" | "reflections";

const libraryTabs: Array<{ value: LibraryView; label: string }> = [
  { value: "saved", label: "Saved verses" },
  { value: "packs", label: "My packs" },
  { value: "reflections", label: "Reflections" },
];

function LibraryHeading({ eyebrow, title, count, icon: Icon }: { eyebrow: string; title: string; count: string; icon: any }) {
  return (
    <View style={styles.headingContainer}>
      <View>
        <Text style={styles.headingEyebrow}>{eyebrow}</Text>
        <Text style={styles.headingTitle}>{title}</Text>
      </View>
      <View style={styles.headingCountBox}>
        <Icon color="#D4AF37" size={14} />
        <Text style={styles.headingCountText}>{count}</Text>
      </View>
    </View>
  );
}

function EmptyState({ icon: Icon, title, copy }: { icon: any; title: string; copy: string }) {
  return (
    <View style={styles.emptyStateContainer}>
      <Icon color="#D4AF37" size={24} />
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateCopy}>{copy}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { savedVerses, customPacks, reflections } = useProfileLibrary();

  const [activeView, setActiveView] = useState<LibraryView>("saved");
  const [visibleVerses, setVisibleVerses] = useState(savedVerses);

  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 8, 20), paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={styles.headerEyebrow}>Personal library</Text>
            <Text style={styles.headerTitleMain}>Profile</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.settingsBtn, pressed && styles.settingsBtnPressed]}
            onPress={() => router.push('/settings')}
          >
            <Settings color={Palette.mutedForeground} size={19} strokeWidth={1.8} />
          </Pressable>
        </View>

        <View style={styles.identityCard}>
          <View style={styles.identityTop}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>M</Text>
              </View>
              <View style={styles.avatarBadge} />
            </View>
            <View style={styles.identityTextContainer}>
              <Text style={styles.identityName}>Mattias</Text>
              <Text style={styles.identityDescription}>Joined March 2024</Text>
            </View>
          </View>
        </View>

        <View style={styles.navContainer}>
          <View style={styles.tabList}>
            {libraryTabs.map((tab) => {
              const selected = activeView === tab.value;
              return (
                <Pressable
                  key={tab.value}
                  style={[styles.tabButton, selected && styles.tabButtonActive]}
                  onPress={() => setActiveView(tab.value)}
                >
                  <Text style={[styles.tabText, selected && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.panelContainer}>
          {activeView === "saved" && (
            <View>
              <LibraryHeading eyebrow="Your library" title="Saved verses" count={`${visibleVerses.length} passages`} icon={Bookmark} />
              {visibleVerses.length > 0 ? (
                <View style={styles.versesList}>
                  {visibleVerses.map((verse) => (
                    <View key={verse.reference} style={styles.verseCard}>
                      <View style={styles.verseCardInner}>
                        <View style={styles.verseCardTop}>
                          <View>
                            <View style={styles.privateLabelBox}>
                              <LockKeyhole color={Palette.mutedForeground} size={12} />
                              <Text style={styles.privateLabel}>Private</Text>
                            </View>
                            <Text style={styles.verseReference}>{verse.reference}</Text>
                          </View>
                        </View>
                        <View style={styles.blockquote}>
                          <Text style={styles.blockquoteText}>“{verse.snippet}”</Text>
                        </View>
                      </View>
                      <View style={styles.verseCardFooter}>
                        <Pressable style={styles.openPassageBtn}>
                          <Eye color={Palette.primary} size={16} />
                          <Text style={styles.openPassageText}>Open passage</Text>
                        </Pressable>
                        <Pressable
                          style={styles.trashBtn}
                          onPress={() => setVisibleVerses((current) => current.filter((item) => item.reference !== verse.reference))}
                        >
                          <Trash2 color={Palette.mutedForeground} size={16} />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyState icon={Bookmark} title="No saved verses yet" copy="Verses you save will gather here for quiet return." />
              )}
            </View>
          )}

          {activeView === "packs" && (
            <View>
              <LibraryHeading eyebrow="Collections" title="My packs" count={`${customPacks.length} collections`} icon={FolderHeart} />
              <View style={styles.versesList}>
                {customPacks.map((pack) => (
                  <Pressable key={pack.title} style={styles.packCard}>
                    <ImageBackground source={pack.image} style={styles.packImage}>
                      <View style={styles.packImageGradient} />
                    </ImageBackground>
                    <View style={styles.packContent}>
                      <View style={styles.packTextContainer}>
                        <Text style={styles.packEyebrow}>Personal pack · {pack.verses} verses</Text>
                        <Text style={styles.packTitle}>{pack.title}</Text>
                      </View>
                      <ChevronRight color={Palette.mutedForeground} size={20} />
                    </View>
                  </Pressable>
                ))}
                <Pressable style={styles.newPackBtn}>
                  <Plus color={Palette.mutedForeground} size={16} />
                  <Text style={styles.newPackText}>New pack</Text>
                </Pressable>
              </View>
            </View>
          )}

          {activeView === "reflections" && (
            <View>
              <LibraryHeading eyebrow="Private notes" title="Reflections" count={`${reflections.length} entries`} icon={Feather} />
              <View style={styles.versesList}>
                {reflections.map((entry) => (
                  <View key={entry.id} style={styles.reflectionCard}>
                    <View style={styles.reflectionTop}>
                      <View>
                        <View style={styles.privateLabelBox}>
                          <LockKeyhole color={Palette.mutedForeground} size={12} />
                          <Text style={styles.privateLabel}>Private reflection</Text>
                        </View>
                        <Text style={styles.reflectionReference}>{entry.title}</Text>
                      </View>
                      <Text style={styles.reflectionDate}>{entry.date}</Text>
                    </View>
                    <View style={styles.reflectionQuote}>
                      <Text style={styles.reflectionNote}>{entry.snippet}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
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
    justifyContent: 'space-between',
    paddingTop: 28,
    marginBottom: 24,
  },
  headerEyebrow: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: Palette.primary,
  },
  headerTitleMain: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 44,
    lineHeight: 48,
    color: Palette.foreground,
    marginTop: 6,
  },
  headerSubtitle: {
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    color: Palette.mutedForeground,
    marginTop: 10,
    lineHeight: 20,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(231, 222, 206, 0.65)',
    backgroundColor: Palette.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingsBtnPressed: {
    backgroundColor: Palette.border,
  },
  identityCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(231, 222, 206, 0.6)',
    backgroundColor: Palette.card,
    overflow: 'hidden',
    shadowColor: Palette.foreground,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 22,
    elevation: 3,
    marginBottom: 20,
  },
  identityTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(158, 67, 36, 0.15)',
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 27,
    color: Palette.primary,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: Palette.card,
    backgroundColor: Palette.sage,
  },
  identityTextContainer: {
    flex: 1,
  },
  identityEyebrow: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: Palette.primary,
  },
  identityName: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 29,
    lineHeight: 34,
    color: Palette.foreground,
    marginTop: 4,
  },
  identityDescription: {
    fontFamily: Typography.sansMedium,
    fontSize: 12,
    color: Palette.mutedForeground,
    marginTop: 4,
  },
  navContainer: {
    marginBottom: 24,
  },
  tabList: {
    flexDirection: 'row',
    backgroundColor: 'rgba(240, 234, 225, 0.45)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(231, 222, 206, 0.6)',
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: Palette.card,
    shadowColor: Palette.foreground,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontFamily: Typography.sansBold,
    fontSize: 11.5,
    color: Palette.mutedForeground,
  },
  tabTextActive: {
    color: Palette.primary,
  },
  panelContainer: {
    paddingTop: 8,
  },
  headingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headingEyebrow: {
    fontFamily: Typography.sansBold,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: Palette.mutedForeground,
  },
  headingTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 27,
    lineHeight: 32,
    color: Palette.foreground,
    marginTop: 4,
  },
  headingCountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4,
  },
  headingCountText: {
    fontFamily: Typography.sans,
    fontSize: 10,
    color: Palette.mutedForeground,
  },
  versesList: {
    gap: 16,
  },
  verseCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(231, 222, 206, 0.55)',
    backgroundColor: Palette.card,
    overflow: 'hidden',
    shadowColor: Palette.foreground,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 3,
  },
  verseCardInner: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 20,
  },
  verseCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  privateLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privateLabel: {
    fontFamily: Typography.sansBold,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    color: Palette.mutedForeground,
  },
  verseReference: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 27,
    color: Palette.foreground,
    marginTop: 8,
    lineHeight: 32,
  },
  savedDate: {
    fontFamily: Typography.sans,
    fontSize: 10,
    color: Palette.mutedForeground,
  },
  blockquote: {
    marginTop: 20,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(158, 67, 36, 0.65)',
    paddingLeft: 16,
  },
  blockquoteText: {
    fontFamily: Typography.serif,
    fontSize: 20,
    lineHeight: 31,
    color: '#333333', // warm-copy
  },
  verseCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(231, 222, 206, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  openPassageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: 8,
  },
  openPassageText: {
    fontFamily: Typography.sansMedium,
    fontSize: 12,
    color: Palette.primary,
  },
  trashBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(231, 222, 206, 0.55)',
    backgroundColor: Palette.card,
    overflow: 'hidden',
    shadowColor: Palette.foreground,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 3,
  },
  packImage: {
    height: 150,
    width: '100%',
    position: 'relative',
  },
  packImageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(40, 35, 29, 0.45)', // Palette.foreground 45%
  },
  packContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  packTextContainer: {
    flex: 1,
  },
  packEyebrow: {
    fontFamily: Typography.sansBold,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    color: Palette.primary,
  },
  packTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 23,
    lineHeight: 28,
    color: Palette.foreground,
    marginTop: 4,
  },
  packDescription: {
    fontFamily: Typography.sans,
    fontSize: 12,
    lineHeight: 18,
    color: Palette.mutedForeground,
    marginTop: 4,
  },
  newPackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Palette.border,
    backgroundColor: 'transparent',
  },
  newPackText: {
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    color: Palette.mutedForeground,
  },
  reflectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(231, 222, 206, 0.5)',
    backgroundColor: Palette.paper,
    padding: 20,
    shadowColor: Palette.foreground,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 3,
  },
  reflectionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reflectionReference: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 24,
    color: Palette.foreground,
    marginTop: 8,
  },
  reflectionDate: {
    fontFamily: Typography.sansMedium,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: Palette.mutedForeground,
  },
  reflectionQuote: {
    marginTop: 16,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(90, 119, 94, 0.55)',
    paddingLeft: 16,
  },
  reflectionNote: {
    fontFamily: Typography.serif,
    fontSize: 17,
    fontStyle: 'italic',
    lineHeight: 28,
    color: '#333333', // warm-copy
  },
  emptyStateContainer: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Palette.border,
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 21,
    color: Palette.foreground,
    marginTop: 12,
  },
  emptyStateCopy: {
    fontFamily: Typography.sans,
    fontSize: 12,
    lineHeight: 18,
    color: Palette.mutedForeground,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  }
});
