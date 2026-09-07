import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { tokens } from "@/theme/tokens";

export type NavTab = "home" | "library" | "partner";

interface BottomNavBarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const tabs: { id: NavTab; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { id: "home", label: "Today", icon: "book-open" },
    { id: "library", label: "Library", icon: "layers" },
    { id: "partner", label: "Duo Streak", icon: "zap" },
  ];

  return (
    <View style={styles.dockWrapper}>
      <View style={styles.segmentedDock}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <Feather
                name={tab.icon}
                size={16}
                color={isActive ? tokens.colors.btnPrimaryText : tokens.colors.inkSecondary}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockWrapper: {
    backgroundColor: "transparent",
    paddingHorizontal: tokens.spacing.s20,
    paddingBottom: tokens.spacing.s16,
    paddingTop: tokens.spacing.s8,
  },
  segmentedDock: {
    flexDirection: "row",
    backgroundColor: tokens.colors.card,      // #FFFFFF
    borderRadius: tokens.radii.pillButtons,  // 9999px floating dock
    padding: tokens.spacing.s4,
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
    ...tokens.shadows.card,
    justifyContent: "space-between",
    alignItems: "center",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.spacing.s12,
    borderRadius: tokens.radii.pillButtons,
    gap: tokens.spacing.s8,
  },
  tabButtonActive: {
    backgroundColor: tokens.colors.btnPrimaryBg, // #0F172A macOS carbon
    ...tokens.shadows.subtle,
  },
  icon: {
    marginTop: 1,
  },
  tabLabel: {
    fontSize: 13,
    letterSpacing: -0.2,
    fontFamily: tokens.typography.fontFamilies.sans,
  },
  tabLabelActive: {
    fontWeight: "500",
    color: tokens.colors.btnPrimaryText, // #FFFFFF
  },
  tabLabelInactive: {
    fontWeight: "400",
    color: tokens.colors.inkSecondary,   // #475569
  },
});
