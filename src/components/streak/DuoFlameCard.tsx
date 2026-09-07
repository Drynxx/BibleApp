import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Share, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { tokens } from "@/theme/tokens";

interface DuoFlameCardProps {
  streakCount: number;
  longestStreak: number;
  partnerName: string;
  userCompletedToday: boolean;
  partnerCompletedToday: boolean;
  onNudge?: () => void;
}

export const DuoFlameCard: React.FC<DuoFlameCardProps> = ({
  streakCount,
  longestStreak,
  partnerName,
  userCompletedToday,
  partnerCompletedToday,
  onNudge,
}) => {
  const [nudgeSent, setNudgeSent] = useState(false);
  const flameScale = useRef(new Animated.Value(1)).current;
  const isBothCompleted = userCompletedToday && partnerCompletedToday;
  const isAtRisk = userCompletedToday && !partnerCompletedToday;

  // Duolingo-style breathing flame pulse animation
  useEffect(() => {
    const flameLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameScale, {
          toValue: 1.18,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(flameScale, {
          toValue: 1.0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    flameLoop.start();
    return () => flameLoop.stop();
  }, []);

  const handleShareNudge = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setNudgeSent(true);
    setTimeout(() => setNudgeSent(false), 3000);

    try {
      await Share.share({
        message: `Hei ${partnerName}! Mai avem puțin timp să salvăm streak-ul nostru de ${streakCount} zile în Inscribe: inscribe://drill`,
      });
      if (onNudge) onNudge();
    } catch {}
  };

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={styles.badgeCluster}>
          <Animated.View
            style={[
              styles.flameIconBox,
              { transform: [{ scale: flameScale }] },
            ]}
          >
            <Feather name="zap" size={16} color="#D97706" />
          </Animated.View>
          <Text style={styles.metaLabel}>SHARED DUO STREAK</Text>
        </View>

        <View style={styles.bestPill}>
          <Text style={styles.bestText}>BEST {longestStreak}D</Text>
        </View>
      </View>

      {/* Hero Lyon Display Metric */}
      <View style={styles.metricRow}>
        <Text style={styles.streakNumber}>{streakCount}</Text>
        <Text style={styles.streakUnit}>days active</Text>
        <View style={styles.streakFlameTag}>
          <Text style={styles.streakFlameTagText}>🔥 ALIVE</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Partner Status Row */}
      <View style={styles.statusRow}>
        <View style={styles.statusColumn}>
          <View style={styles.statusItem}>
            <Feather
              name={userCompletedToday ? "check-circle" : "circle"}
              size={14}
              color={userCompletedToday ? "#059669" : tokens.colors.inkMuted}
            />
            <Text style={styles.statusText}>
              You: {userCompletedToday ? "Inscribed" : "Pending review"}
            </Text>
          </View>

          <View style={styles.statusItem}>
            <Feather
              name={partnerCompletedToday ? "check-circle" : "clock"}
              size={14}
              color={partnerCompletedToday ? "#059669" : "#D97706"}
            />
            <Text style={styles.statusText}>
              {partnerName}: {partnerCompletedToday ? "Inscribed" : "Pending review"}
            </Text>
          </View>
        </View>

        {isAtRisk && (
          <TouchableOpacity
            style={[styles.nudgeButton, nudgeSent && styles.nudgeButtonSent]}
            activeOpacity={0.8}
            onPress={handleShareNudge}
            accessibilityRole="button"
            accessibilityLabel={`Nudge ${partnerName}`}
          >
            <Text style={styles.nudgeButtonText}>
              {nudgeSent ? "Nudge Sent!" : `Nudge ${partnerName}`}
            </Text>
            <Feather
              name={nudgeSent ? "check" : "arrow-up-right"}
              size={13}
              color={tokens.colors.btnPrimaryText}
            />
          </TouchableOpacity>
        )}
      </View>

      {isBothCompleted && (
        <View style={styles.securedBanner}>
          <Feather name="shield" size={13} color="#059669" />
          <Text style={styles.securedText}>
            Mutual fate secured. Streak protected until tomorrow.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.card,        // #FFFFFF clean card
    borderRadius: tokens.radii.featureCards,    // 30px token
    padding: tokens.spacing.s24,
    marginHorizontal: tokens.spacing.s16,
    marginVertical: tokens.spacing.s8,
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
    ...tokens.shadows.card,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.s8,
  },
  flameIconBox: {
    width: 28,
    height: 28,
    borderRadius: tokens.radii.buttons,        // 8px
    backgroundColor: "#FEF3C7",                // Warm amber wash
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  metaLabel: {
    ...tokens.typography.uppercaseTracked,     // 11px with 0.182em tracking
    color: tokens.colors.inkSecondary,
  },
  bestPill: {
    paddingHorizontal: tokens.spacing.s8,
    paddingVertical: tokens.spacing.s4,
    borderRadius: tokens.radii.buttons,        // 8px
    backgroundColor: tokens.colors.cardWash,
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
  },
  bestText: {
    fontFamily: tokens.typography.fontFamilies.mono,
    fontSize: 10,
    fontWeight: "500",
    color: tokens.colors.inkSecondary,
    letterSpacing: 0.5,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: tokens.spacing.s8,
    marginTop: tokens.spacing.s16,
    marginBottom: tokens.spacing.s4,
  },
  streakNumber: {
    ...tokens.typography.headingLg,            // 38px Lyon Display, weight 300, 0.9 line-height
    color: tokens.colors.inkPrimary,
    fontSize: 44,
    lineHeight: 44,
  },
  streakUnit: {
    ...tokens.typography.subheading,           // 18px Suisse Int'l weight 300
    color: tokens.colors.inkMuted,
  },
  streakFlameTag: {
    paddingHorizontal: tokens.spacing.s8,
    paddingVertical: 2,
    borderRadius: tokens.radii.pillButtons,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginLeft: tokens.spacing.s4,
  },
  streakFlameTagText: {
    ...tokens.typography.monoLabel,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
    color: "#B45309",
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.borderSubtle,
    marginVertical: tokens.spacing.s16,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusColumn: {
    gap: tokens.spacing.s6,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.s6,
  },
  statusText: {
    ...tokens.typography.bodySm,
    color: tokens.colors.inkSecondary,
    fontSize: 13,
  },
  nudgeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.s4,
    paddingHorizontal: tokens.spacing.s12,
    paddingVertical: tokens.spacing.s8,
    borderRadius: tokens.radii.buttons,        // 8px button token
    backgroundColor: tokens.colors.btnPrimaryBg,
  },
  nudgeButtonSent: {
    backgroundColor: "#059669",
  },
  nudgeButtonText: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 12,
    fontWeight: "500",
    color: tokens.colors.btnPrimaryText,
  },
  securedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.s6,
    marginTop: tokens.spacing.s12,
    paddingVertical: tokens.spacing.s8,
    paddingHorizontal: tokens.spacing.s12,
    borderRadius: tokens.radii.buttons,
    backgroundColor: "#D1FAE5",
  },
  securedText: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 12,
    color: "#065F46",
    fontWeight: "500",
  },
});

