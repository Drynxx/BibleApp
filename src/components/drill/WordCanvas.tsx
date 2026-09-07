import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { MaskedToken } from "@/engine/blanking";
import { tokens } from "@/theme/tokens";

interface WordCanvasProps {
  tokens: MaskedToken[];
  onBlankTap?: (token: MaskedToken, index: number) => void;
  activeBlankIndex?: number;
}

// Individual animated slot component for Duolingo-style spring pop & shake
const AnimatedSlot: React.FC<{
  token: MaskedToken;
  index: number;
  isCurrent: boolean;
  onPress?: () => void;
}> = ({ token, index, isCurrent, onPress }) => {
  const isFilled = Boolean(token.userPlacedText);
  const scaleAnim = useRef(new Animated.Value(isFilled ? 1 : 0.95)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pop-in spring animation when a word is placed
  useEffect(() => {
    if (isFilled) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFilled, token.userPlacedText]);

  // Shake animation on incorrect attempt
  useEffect(() => {
    if (token.isCorrect === false) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -3, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 3, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [token.isCorrect]);

  // Gentle breathing halo for active unfilled slot
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    if (isCurrent && !isFilled) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.98,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (pulseLoop) pulseLoop.stop();
    };
  }, [isCurrent, isFilled]);

  return (
    <Animated.View
      style={{
        transform: [{ translateX: shakeAnim }, { scale: isFilled ? scaleAnim : pulseAnim }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[
          styles.slotBase,
          isFilled ? styles.slotFilled : styles.slotEmpty,
          isCurrent && !isFilled && styles.slotCurrent,
          token.isCorrect === false && styles.slotError,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          isFilled ? `Placed word ${token.userPlacedText}` : "Blank word slot"
        }
      >
        <Text
          style={[
            styles.slotText,
            isFilled ? styles.slotTextFilled : styles.slotTextEmpty,
          ]}
        >
          {isFilled ? token.userPlacedText : "____"}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const WordCanvas: React.FC<WordCanvasProps> = ({
  tokens: tokenList,
  onBlankTap,
  activeBlankIndex,
}) => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.verseFlow}>
        {tokenList.map((token, index) => {
          if (token.isPunctuation) {
            return (
              <Text key={token.id} style={styles.punctuationText}>
                {token.raw}
              </Text>
            );
          }

          if (token.isMasked) {
            const isCurrent = index === activeBlankIndex;
            return (
              <AnimatedSlot
                key={token.id}
                token={token}
                index={index}
                isCurrent={isCurrent}
                onPress={() => onBlankTap && onBlankTap(token, index)}
              />
            );
          }

          return (
            <View key={token.id} style={styles.wordWrapper}>
              <Text
                style={[
                  styles.wordText,
                  token.isKeyword && styles.keywordText,
                ]}
              >
                {token.display}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: tokens.spacing.s24,
    paddingVertical: tokens.spacing.s32,
    backgroundColor: tokens.colors.card,       // #FFFFFF
    borderRadius: tokens.radii.featureCards,   // 30px tactile canvas
    marginHorizontal: tokens.spacing.s16,
    marginVertical: tokens.spacing.s16,
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline, // #E2E8F0
    minHeight: 220,
    justifyContent: "center",
    ...tokens.shadows.card,
  },
  verseFlow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  wordWrapper: {
    paddingVertical: tokens.spacing.s4,
    paddingHorizontal: 3,
  },
  wordText: {
    fontFamily: tokens.typography.fontFamilies.serif, // Lyon Display / DM Serif Display
    fontSize: 22,
    lineHeight: 36,
    color: tokens.colors.inkPrimary,
    letterSpacing: -0.2,
  },
  keywordText: {
    color: tokens.colors.inkPrimary,
    fontWeight: "600",
    borderBottomWidth: 1.5,
    borderColor: tokens.colors.streakFlame,
  },
  punctuationText: {
    fontFamily: tokens.typography.fontFamilies.serif,
    fontSize: 22,
    lineHeight: 36,
    color: tokens.colors.inkSecondary,
    marginRight: 4,
  },
  slotBase: {
    minWidth: 54,
    minHeight: 42,
    paddingHorizontal: tokens.spacing.s12,
    paddingVertical: tokens.spacing.s4,
    borderRadius: tokens.radii.pillButtons,    // 9999px
    marginHorizontal: 4,
    marginVertical: tokens.spacing.s4,
    justifyContent: "center",
    alignItems: "center",
  },
  slotEmpty: {
    backgroundColor: tokens.colors.cardWash,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: tokens.colors.borderHairline,
  },
  slotCurrent: {
    borderColor: tokens.colors.inkPrimary,
    borderWidth: 1.5,
    backgroundColor: "#EFF6FF", // gentle blue focus tint
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  slotFilled: {
    backgroundColor: tokens.colors.btnPrimaryBg, // #0F172A
    borderWidth: 1,
    borderColor: "#1E293B",
    ...tokens.shadows.subtle,
  },
  slotError: {
    backgroundColor: "#FEE2E2",
    borderColor: tokens.colors.error,
  },
  slotText: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  slotTextEmpty: {
    color: tokens.colors.inkMuted,
  },
  slotTextFilled: {
    color: tokens.colors.card,
  },
});


