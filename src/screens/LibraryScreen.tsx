import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { tokens } from "@/theme/tokens";
import { verseRepository, Verse } from "@/services/db/verseRepository";
import { normalizeDiacritics } from "@/engine/blanking";

interface LibraryScreenProps {
  onSelectVerse: (verseId: string) => void;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ onSelectVerse }) => {
  const [selectedLang, setSelectedLang] = useState<"VDC" | "WEB">("VDC");
  const [selectedTheme, setSelectedTheme] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const allVerses = useMemo(
    () => verseRepository.getAll(selectedLang),
    [selectedLang]
  );

  const themes = useMemo(() => {
    const rawThemes = Array.from(new Set(allVerses.map((v) => v.theme)));
    return ["All", ...rawThemes];
  }, [allVerses]);

  const filteredVerses = useMemo(() => {
    return allVerses.filter((v) => {
      const matchesTheme =
        selectedTheme === "All" ||
        v.theme.toLowerCase() === selectedTheme.toLowerCase();

      if (!matchesTheme) return false;

      if (!searchQuery.trim()) return true;

      const normQuery = normalizeDiacritics(searchQuery);
      const normText = normalizeDiacritics(v.text);
      const normBook = normalizeDiacritics(v.book);
      const normCitation = `${normBook} ${v.chapter}:${v.verse_number}`;

      return normText.includes(normQuery) || normCitation.includes(normQuery);
    });
  }, [allVerses, selectedTheme, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>Library</Text>
          <Text style={styles.brandSubtitle}>CURATED SCRIPTURE CATALOG</Text>
        </View>

        {/* Translation Toggle Pill - macOS Segmented Control */}
        <View style={styles.langToggle}>
          <TouchableOpacity
            style={[styles.langOption, selectedLang === "VDC" && styles.langOptionActive]}
            onPress={() => setSelectedLang("VDC")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.langOptionText,
                selectedLang === "VDC" && styles.langOptionTextActive,
              ]}
            >
              VDC (RO)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langOption, selectedLang === "WEB" && styles.langOptionActive]}
            onPress={() => setSelectedLang("WEB")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.langOptionText,
                selectedLang === "WEB" && styles.langOptionTextActive,
              ]}
            >
              WEB (EN)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input with 8px Radius & Feather Icon */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={15} color={tokens.colors.inkMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by keyword, book, or reference..."
          placeholderTextColor={tokens.colors.inkMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearch}
            onPress={() => setSearchQuery("")}
            activeOpacity={0.7}
          >
            <Feather name="x" size={14} color={tokens.colors.inkSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Theme Filter Chips */}
      <View style={styles.themeContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.themeScroll}
        >
          {themes.map((theme) => {
            const isSelected = selectedTheme === theme;
            return (
              <TouchableOpacity
                key={theme}
                style={[styles.themeChip, isSelected && styles.themeChipSelected]}
                onPress={() => setSelectedTheme(theme)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.themeChipText,
                    isSelected && styles.themeChipTextSelected,
                  ]}
                >
                  {theme}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Verse List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listHeader}>
          <Text style={styles.countText}>
            {filteredVerses.length} {filteredVerses.length === 1 ? "VERSE FOUND" : "VERSES FOUND"}
          </Text>
        </View>

        {filteredVerses.map((v) => (
          <TouchableOpacity
            key={v.id}
            style={styles.verseCard}
            activeOpacity={0.8}
            onPress={() => onSelectVerse(v.id)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.reference}>
                {v.book} {v.chapter}:{v.verse_number}
              </Text>
              <View style={styles.badgeRow}>
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>{v.difficulty}</Text>
                </View>
                <View style={styles.themeBadge}>
                  <Text style={styles.themeBadgeText}>{v.theme}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.verseText} numberOfLines={3}>
              "{v.text}"
            </Text>

            <View style={styles.cardFooter}>
              <View style={styles.footerInfo}>
                <Feather name="clock" size={12} color={tokens.colors.inkMuted} />
                <Text style={styles.footerTime}>60s recall</Text>
              </View>
              <View style={styles.inscribeAction}>
                <Text style={styles.inscribeActionText}>Inscribe</Text>
                <Feather name="arrow-right" size={12} color={tokens.colors.inkPrimary} />
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredVerses.length === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="search" size={24} color={tokens.colors.inkMuted} />
            </View>
            <Text style={styles.emptyTitle}>No matching verses</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search query or theme filter.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.canvas, // #F8F9FA macOS canvas
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: tokens.spacing.s20,
    paddingTop: tokens.spacing.s16,
    paddingBottom: tokens.spacing.s12,
  },
  brandTitle: {
    ...tokens.typography.headingLg,        // 38px Lyon Display, weight 300, 0.9 line-height
    color: tokens.colors.inkPrimary,
  },
  brandSubtitle: {
    ...tokens.typography.uppercaseTracked, // 11px with 0.1820em tracking
    color: tokens.colors.inkMuted,
    marginTop: tokens.spacing.s4,
  },
  langToggle: {
    flexDirection: "row",
    backgroundColor: tokens.colors.cardWash,
    borderRadius: tokens.radii.navItems,   // 8px
    padding: 3,
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
  },
  langOption: {
    paddingHorizontal: tokens.spacing.s10,
    paddingVertical: tokens.spacing.s4,
    borderRadius: 6,
  },
  langOptionActive: {
    backgroundColor: tokens.colors.inkPrimary,
    ...tokens.shadows.subtle,
  },
  langOptionText: {
    fontFamily: tokens.typography.fontFamilies.mono,
    fontSize: 11,
    fontWeight: "500",
    color: tokens.colors.inkSecondary,
  },
  langOptionTextActive: {
    color: tokens.colors.card,
  },
  searchContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: tokens.spacing.s16,
    marginVertical: tokens.spacing.s8,
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.inputs,     // 8px
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
    paddingHorizontal: tokens.spacing.s12,
    ...tokens.shadows.subtle,
  },
  searchIcon: {
    marginRight: tokens.spacing.s8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: tokens.spacing.s10,
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 14,
    color: tokens.colors.inkPrimary,
  },
  clearSearch: {
    padding: tokens.spacing.s4,
  },
  themeContainer: {
    marginTop: tokens.spacing.s4,
    marginBottom: tokens.spacing.s8,
  },
  themeScroll: {
    paddingHorizontal: tokens.spacing.s16,
    gap: tokens.spacing.s8,
  },
  themeChip: {
    paddingHorizontal: tokens.spacing.s14,
    paddingVertical: tokens.spacing.s6,
    borderRadius: tokens.radii.pillButtons, // 9999px
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
    ...tokens.shadows.subtle,
  },
  themeChipSelected: {
    backgroundColor: tokens.colors.inkPrimary,
    borderColor: tokens.colors.inkPrimary,
  },
  themeChipText: {
    ...tokens.typography.uppercaseTracked,
    fontSize: 10,
    color: tokens.colors.inkSecondary,
  },
  themeChipTextSelected: {
    color: tokens.colors.card,
  },
  listContent: {
    paddingHorizontal: tokens.spacing.s16,
    paddingBottom: tokens.spacing.s32,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: tokens.spacing.s8,
    marginBottom: tokens.spacing.s8,
  },
  countText: {
    ...tokens.typography.uppercaseTracked,
    fontSize: 10,
    color: tokens.colors.inkMuted,
  },
  verseCard: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.cards,      // 16px
    padding: tokens.spacing.s20,
    marginBottom: tokens.spacing.s12,
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
    ...tokens.shadows.subtle,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacing.s12,
  },
  reference: {
    fontFamily: tokens.typography.fontFamilies.serif,
    fontSize: 18,
    fontWeight: "400",
    color: tokens.colors.inkPrimary,
    letterSpacing: -0.3,
  },
  badgeRow: {
    flexDirection: "row",
    gap: tokens.spacing.s6,
  },
  difficultyBadge: {
    paddingHorizontal: tokens.spacing.s8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: tokens.colors.cardWash,
  },
  difficultyText: {
    ...tokens.typography.monoLabel,
    fontSize: 9,
    lineHeight: 12,
    color: tokens.colors.inkSecondary,
  },
  themeBadge: {
    paddingHorizontal: tokens.spacing.s8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: tokens.colors.cardWash,
    borderWidth: 1,
    borderColor: tokens.colors.borderSubtle,
  },
  themeBadgeText: {
    ...tokens.typography.uppercaseTracked,
    fontSize: 9,
    color: tokens.colors.inkPrimary,
  },
  verseText: {
    ...tokens.typography.bodySm,           // 14px, 1.67 line-height
    color: tokens.colors.inkPrimary,
    lineHeight: 22,
  },
  cardFooter: {
    marginTop: tokens.spacing.s14,
    borderTopWidth: 1,
    borderColor: tokens.colors.borderSubtle,
    paddingTop: tokens.spacing.s10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.s4,
  },
  footerTime: {
    fontFamily: tokens.typography.fontFamilies.mono,
    fontSize: 10,
    color: tokens.colors.inkMuted,
  },
  inscribeAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.s4,
  },
  inscribeActionText: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 12,
    fontWeight: "500",
    color: tokens.colors.inkPrimary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: tokens.spacing.s48,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: tokens.colors.cardWash,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: tokens.spacing.s12,
  },
  emptyTitle: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 15,
    fontWeight: "500",
    color: tokens.colors.inkPrimary,
  },
  emptySubtitle: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 13,
    color: tokens.colors.inkMuted,
    marginTop: tokens.spacing.s4,
    textAlign: "center",
  },
});

