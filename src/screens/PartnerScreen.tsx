import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { tokens } from "@/theme/tokens";
import { TactileButton } from "@/components/ui/TactileButton";

export const PartnerScreen: React.FC = () => {
  const [inviteCode] = useState("INSC-7X9P");
  const [partnerLinked, setPartnerLinked] = useState(true);

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `Te invit să fim parteneri de memorare a Scripturii pe Inscribe! Folosește codul meu: ${inviteCode} sau deschide: inscribe://invite/${inviteCode}`,
      });
    } catch {}
  };

  const handleCopyCode = () => {
    Alert.alert("Code Copied", `Invite code ${inviteCode} copied to clipboard!`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* macOS Window Header */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>Accountability</Text>
          <Text style={styles.brandSubtitle}>MUTUAL FATE DUO STREAK • ECCL 4:9</Text>
        </View>

        {/* Current Partner Card - 30px Feature Card */}
        {partnerLinked ? (
          <View style={styles.partnerFeatureCard}>
            <View style={styles.partnerHeader}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>A</Text>
              </View>
              <View style={styles.partnerInfo}>
                <Text style={styles.partnerName}>Andrei M.</Text>
                <Text style={styles.partnerTimezone}>New York • UTC-5</Text>
              </View>
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeBadgeText}>ACTIVE</Text>
              </View>
            </View>

            {/* Streak Hero Block inside Partner Card */}
            <View style={styles.streakBanner}>
              <View style={styles.zapIconBox}>
                <Feather name="zap" size={20} color={tokens.colors.streakFlame} />
              </View>
              <View style={styles.streakDetails}>
                <View style={styles.streakCountRow}>
                  <Text style={styles.streakNumber}>21</Text>
                  <Text style={styles.streakLabel}>Day Shared Streak</Text>
                </View>
                <Text style={styles.streakMeta}>
                  LONGEST: 42 DAYS • NEXT MILESTONE: 30 DAYS
                </Text>
              </View>
            </View>

            {/* Action Row */}
            <View style={styles.actionRow}>
              <TactileButton
                title="Send Encouragement"
                onPress={handleShareInvite}
                variant="primary"
                size="md"
                leftIcon={<Feather name="send" size={14} color="#FFFFFF" />}
              />
            </View>
          </View>
        ) : (
          <View style={styles.unlinkedFeatureCard}>
            <View style={styles.unlinkedIconBox}>
              <Feather name="users" size={28} color={tokens.colors.inkPrimary} />
            </View>
            <Text style={styles.unlinkedTitle}>Pair with a Prayer Partner</Text>
            <Text style={styles.unlinkedSubtitle}>
              Commit together. Both of you must inscribe 60 seconds daily before midnight to keep the shared flame alive.
            </Text>

            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>YOUR INVITE CODE</Text>
              <Text style={styles.codeText}>{inviteCode}</Text>
            </View>

            <TactileButton
              title="Share Invite Code"
              onPress={handleShareInvite}
              variant="primary"
              size="md"
              leftIcon={<Feather name="share-2" size={14} color="#FFFFFF" />}
            />
          </View>
        )}

        {/* Rules & Mutual Fate Mechanics - 16px Card */}
        <View style={styles.rulesCard}>
          <Text style={styles.sectionTitle}>THE MUTUAL FATE RULES</Text>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>01</Text>
            <View style={styles.ruleTextContainer}>
              <Text style={styles.ruleHeading}>Daily 60-Second Review</Text>
              <Text style={styles.ruleDescription}>
                Both partners must complete at least one active-recall drill before midnight.
              </Text>
            </View>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>02</Text>
            <View style={styles.ruleTextContainer}>
              <Text style={styles.ruleHeading}>10:00 PM Rescue Nudge</Text>
              <Text style={styles.ruleDescription}>
                If one partner hasn't completed by 10:00 PM in their timezone, the other gets alerted to rescue the streak.
              </Text>
            </View>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>03</Text>
            <View style={styles.ruleTextContainer}>
              <Text style={styles.ruleHeading}>Automated Streak Freezes</Text>
              <Text style={styles.ruleDescription}>
                Earn 1 Streak Freeze every 14 days of consistency to protect against unexpected emergencies.
              </Text>
            </View>
          </View>
        </View>

        {/* Invite Code Box */}
        <View style={styles.inviteBox}>
          <View>
            <Text style={styles.inviteBoxTitle}>YOUR PARTNER CODE</Text>
            <Text style={styles.inviteBoxCode}>{inviteCode}</Text>
          </View>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyCode}
            activeOpacity={0.75}
          >
            <Feather name="copy" size={13} color={tokens.colors.inkPrimary} />
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.canvas, // #F8F9FA macOS canvas
  },
  scrollContent: {
    paddingBottom: tokens.spacing.s32,
  },
  header: {
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
  partnerFeatureCard: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.featureCards,// 30px
    padding: tokens.spacing.s24,
    marginHorizontal: tokens.spacing.s16,
    marginVertical: tokens.spacing.s8,
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
    ...tokens.shadows.card,
  },
  partnerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: tokens.radii.inputs,     // 8px
    backgroundColor: tokens.colors.cardWash,
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
    alignItems: "center",
    justifyContent: "center",
    marginRight: tokens.spacing.s12,
  },
  avatarText: {
    fontFamily: tokens.typography.fontFamilies.serif,
    fontSize: 18,
    fontWeight: "500",
    color: tokens.colors.inkPrimary,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 16,
    fontWeight: "500",
    color: tokens.colors.inkPrimary,
  },
  partnerTimezone: {
    ...tokens.typography.monoLabel,
    fontSize: 11,
    lineHeight: 16,
    color: tokens.colors.inkMuted,
    textTransform: "none",
    marginTop: 2,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.s6,
    paddingHorizontal: tokens.spacing.s8,
    paddingVertical: tokens.spacing.s4,
    borderRadius: tokens.radii.buttons,    // 8px
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#059669",
  },
  activeBadgeText: {
    ...tokens.typography.monoLabel,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "600",
    color: "#065F46",
  },
  streakBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: tokens.colors.streakWash, // #FEF3C7 warm streak background
    borderRadius: tokens.radii.cards,          // 16px
    padding: tokens.spacing.s16,
    marginTop: tokens.spacing.s16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  zapIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF9C3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: tokens.spacing.s12,
  },
  streakDetails: {
    flex: 1,
  },
  streakCountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: tokens.spacing.s6,
  },
  streakNumber: {
    fontFamily: tokens.typography.fontFamilies.serif,
    fontSize: 26,
    fontWeight: "300",                     // Lyon Display light
    color: tokens.colors.inkPrimary,
    lineHeight: 30,
  },
  streakLabel: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 15,
    fontWeight: "500",
    color: tokens.colors.inkPrimary,
  },
  streakMeta: {
    ...tokens.typography.monoLabel,
    fontSize: 10,
    lineHeight: 14,
    color: "#92400E",
    marginTop: tokens.spacing.s4,
  },
  actionRow: {
    marginTop: tokens.spacing.s16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.s6,
    backgroundColor: tokens.colors.btnPrimaryBg,
    paddingVertical: tokens.spacing.s12,
    borderRadius: tokens.radii.buttons,    // 8px
    ...tokens.shadows.subtle,
  },
  actionButtonText: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 13,
    fontWeight: "500",
    color: tokens.colors.btnPrimaryText,
  },
  unlinkedFeatureCard: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.featureCards,// 30px
    padding: tokens.spacing.s24,
    marginHorizontal: tokens.spacing.s16,
    marginVertical: tokens.spacing.s8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
    ...tokens.shadows.card,
  },
  unlinkedIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: tokens.colors.cardWash,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: tokens.spacing.s16,
  },
  unlinkedTitle: {
    ...tokens.typography.headingLg,
    fontSize: 24,
    lineHeight: 28,
    color: tokens.colors.inkPrimary,
    textAlign: "center",
    marginBottom: tokens.spacing.s6,
  },
  unlinkedSubtitle: {
    ...tokens.typography.bodySm,
    color: tokens.colors.inkSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: tokens.spacing.s16,
  },
  codeContainer: {
    backgroundColor: tokens.colors.cardWash,
    borderRadius: tokens.radii.inputs,     // 8px
    paddingVertical: tokens.spacing.s10,
    paddingHorizontal: tokens.spacing.s24,
    alignItems: "center",
    marginBottom: tokens.spacing.s16,
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
  },
  codeLabel: {
    ...tokens.typography.uppercaseTracked,
    fontSize: 10,
    color: tokens.colors.inkMuted,
  },
  codeText: {
    fontFamily: tokens.typography.fontFamilies.mono,
    fontSize: 22,
    fontWeight: "500",
    color: tokens.colors.inkPrimary,
    letterSpacing: 2,
    marginTop: 2,
  },
  rulesCard: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.cards,      // 16px
    padding: tokens.spacing.s20,
    marginHorizontal: tokens.spacing.s16,
    marginTop: tokens.spacing.s12,
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
    ...tokens.shadows.subtle,
  },
  sectionTitle: {
    ...tokens.typography.uppercaseTracked,
    color: tokens.colors.inkMuted,
    marginBottom: tokens.spacing.s16,
  },
  ruleItem: {
    flexDirection: "row",
    marginBottom: tokens.spacing.s16,
  },
  ruleNumber: {
    fontFamily: tokens.typography.fontFamilies.mono,
    fontSize: 13,
    fontWeight: "500",
    color: tokens.colors.inkMuted,
    width: 28,
    paddingTop: 2,
  },
  ruleTextContainer: {
    flex: 1,
  },
  ruleHeading: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 14,
    fontWeight: "500",
    color: tokens.colors.inkPrimary,
    marginBottom: 2,
  },
  ruleDescription: {
    ...tokens.typography.bodySm,
    fontSize: 13,
    lineHeight: 18,
    color: tokens.colors.inkSecondary,
  },
  inviteBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.cards,      // 16px
    padding: tokens.spacing.s16,
    marginHorizontal: tokens.spacing.s16,
    marginTop: tokens.spacing.s12,
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
    ...tokens.shadows.subtle,
  },
  inviteBoxTitle: {
    ...tokens.typography.uppercaseTracked,
    fontSize: 10,
    color: tokens.colors.inkMuted,
  },
  inviteBoxCode: {
    fontFamily: tokens.typography.fontFamilies.mono,
    fontSize: 16,
    fontWeight: "500",
    color: tokens.colors.inkPrimary,
    letterSpacing: 1,
    marginTop: 2,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.s4,
    paddingHorizontal: tokens.spacing.s12,
    paddingVertical: tokens.spacing.s6,
    borderRadius: tokens.radii.buttons,    // 8px
    backgroundColor: tokens.colors.cardWash,
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
  },
  copyButtonText: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 12,
    fontWeight: "500",
    color: tokens.colors.inkPrimary,
  },
});

