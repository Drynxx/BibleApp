import React, { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { tokens } from "@/theme/tokens";

export interface BankItem {
  id: string;
  word: string;
  used: boolean;
}

interface WordTileTrayProps {
  bank: BankItem[];
  onSelectWord: (item: BankItem) => void;
  onHint?: () => void;
  disabled?: boolean;
}

// Interactive 3D Tile Component with physical Duolingo push-down
const TactileWordTile: React.FC<{
  item: BankItem;
  disabled: boolean;
  onPress: () => void;
}> = ({ item, disabled, onPress }) => {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled || item.used) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: 60,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || item.used) return;
    Animated.spring(pressAnim, {
      toValue: 0,
      friction: 4,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  const translateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });

  if (item.used) {
    return (
      <View style={[styles.tileWrapper, styles.tileWrapperUsed]}>
        <View style={styles.tileUsedPlaceholder}>
          <Text style={styles.tileTextUsed}>{item.word}</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={styles.tileWrapper}
      accessibilityRole="button"
      accessibilityLabel={`Word tile ${item.word}`}
    >
      {/* 3D Underlay Shadow */}
      <View style={styles.tileUnderlay} />

      {/* Depressable Face */}
      <Animated.View style={[styles.tileFace, { transform: [{ translateY }] }]}>
        <Text style={styles.tileText}>{item.word}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const WordTileTray: React.FC<WordTileTrayProps> = ({
  bank,
  onSelectWord,
  onHint,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Feather name="layers" size={13} color={tokens.colors.inkMuted} />
          <Text style={styles.trayTitle}>SELECT MISSING WORD</Text>
        </View>

        {onHint && (
          <TouchableOpacity
            style={styles.hintButton}
            onPress={onHint}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Reveal first letter hint"
          >
            <Feather name="help-circle" size={13} color={tokens.colors.inkSecondary} />
            <Text style={styles.hintText}>Hint</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.chipGrid}
        showsVerticalScrollIndicator={false}
      >
        {bank.map((item) => (
          <TactileWordTile
            key={item.id}
            item={item}
            disabled={disabled}
            onPress={() => onSelectWord(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing.s20,
    paddingTop: tokens.spacing.s16,
    paddingBottom: tokens.spacing.s32,
    backgroundColor: tokens.colors.card,       // #FFFFFF
    borderTopWidth: 1,
    borderColor: tokens.colors.borderHairline, // #E2E8F0
    minHeight: 180,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacing.s14,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.s6,
  },
  trayTitle: {
    ...tokens.typography.uppercaseTracked,     // 11px, 0.1820em tracking
    color: tokens.colors.inkMuted,
  },
  hintButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.s4,
    paddingVertical: tokens.spacing.s4,
    paddingHorizontal: tokens.spacing.s10,
    borderRadius: tokens.radii.buttons,        // 8px
    backgroundColor: tokens.colors.cardWash,
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
  },
  hintText: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 12,
    color: tokens.colors.inkSecondary,
    fontWeight: "500",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: tokens.spacing.s10,
  },

  // Duolingo-style 3D Tile Structure
  tileWrapper: {
    minWidth: 54,
    height: 48,
    position: "relative",
    justifyContent: "center",
    marginVertical: tokens.spacing.s4,
  },
  tileWrapperUsed: {
    opacity: 0.35,
  },
  tileUnderlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 44,
    borderRadius: tokens.radii.buttons,        // 8px rounded block
    backgroundColor: "#CBD5E1",                // Steel 3D bevel shadow
  },
  tileFace: {
    height: 44,
    paddingHorizontal: tokens.spacing.s16,
    borderRadius: tokens.radii.buttons,
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
    justifyContent: "center",
    alignItems: "center",
  },
  tileUsedPlaceholder: {
    height: 44,
    paddingHorizontal: tokens.spacing.s16,
    borderRadius: tokens.radii.buttons,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: tokens.colors.borderSubtle,
    justifyContent: "center",
    alignItems: "center",
  },
  tileText: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 16,
    fontWeight: "600",
    color: tokens.colors.inkPrimary,
    letterSpacing: -0.2,
  },
  tileTextUsed: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 16,
    color: tokens.colors.borderHairline,
  },
});


