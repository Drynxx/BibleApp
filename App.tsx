import React, { useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LibraryScreen } from "./src/screens/LibraryScreen";
import { PartnerScreen } from "./src/screens/PartnerScreen";
import { DrillScreen } from "./src/screens/DrillScreen";
import { BottomNavBar, NavTab } from "./src/components/navigation/BottomNavBar";
import { tokens } from "./src/theme/tokens";

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>("home");
  const [activeDrillVerseId, setActiveDrillVerseId] = useState<string | null>(null);

  const handleStartDrill = (verseId?: string) => {
    setActiveDrillVerseId(verseId || "v-1");
  };

  const handleExitDrill = () => {
    setActiveDrillVerseId(null);
  };

  const handleFinishDrill = () => {
    setActiveDrillVerseId(null);
    setCurrentTab("home");
  };

  return (
    <View style={styles.windowContainer}>
      <StatusBar style="dark" />

      {/* macOS Window Top Chrome */}
      <View style={styles.macTitleBar}>
        <View style={styles.trafficLights}>
          <View style={[styles.trafficDot, { backgroundColor: "#FF5F56" }]} />
          <View style={[styles.trafficDot, { backgroundColor: "#FFBD2E" }]} />
          <View style={[styles.trafficDot, { backgroundColor: "#27C93F" }]} />
        </View>
        <Text style={styles.macTitleText}>Inscribe</Text>
        <View style={styles.trafficLightsSpacer} />
      </View>

      {activeDrillVerseId ? (
        <DrillScreen
          initialVerseId={activeDrillVerseId}
          onBack={handleExitDrill}
          onFinish={handleFinishDrill}
        />
      ) : (
        <View style={styles.tabContent}>
          {currentTab === "home" && (
            <HomeScreen
              onStartDrill={handleStartDrill}
              onOpenLibrary={() => setCurrentTab("library")}
            />
          )}
          {currentTab === "library" && (
            <LibraryScreen onSelectVerse={handleStartDrill} />
          )}
          {currentTab === "partner" && <PartnerScreen />}

          <BottomNavBar
            currentTab={currentTab}
            onSelectTab={(tab) => setCurrentTab(tab)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  windowContainer: {
    flex: 1,
    backgroundColor: tokens.colors.canvas,
  },
  macTitleBar: {
    height: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tokens.spacing.s16,
    backgroundColor: tokens.colors.card,
    borderBottomWidth: 1,
    borderColor: tokens.colors.borderHairline,
  },
  trafficLights: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 60,
  },
  trafficDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  macTitleText: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 12,
    fontWeight: "500",
    color: tokens.colors.inkSecondary,
    letterSpacing: -0.1,
  },
  trafficLightsSpacer: {
    width: 60,
  },
  tabContent: {
    flex: 1,
    justifyContent: "space-between",
  },
});

