import React, { useRef } from "react";
import {
  Text,
  StyleSheet,
  Animated,
  Pressable,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import * as Haptics from "expo-haptics";
import { tokens } from "@/theme/tokens";

interface TactileButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary" | "streak" | "tile" | "success";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TactileButton: React.FC<TactileButtonProps> = ({
  title,
  children,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}) => {
  const animatedPress = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    Animated.timing(animatedPress, {
      toValue: 1,
      duration: 70,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(animatedPress, {
      toValue: 0,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  // Depress 3px on press
  const translateY = animatedPress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });

  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return {
          container: styles.secondaryContainer,
          text: styles.secondaryText,
          underlay: styles.secondaryUnderlay,
        };
      case "streak":
        return {
          container: styles.streakContainer,
          text: styles.streakText,
          underlay: styles.streakUnderlay,
        };
      case "success":
        return {
          container: styles.successContainer,
          text: styles.successText,
          underlay: styles.successUnderlay,
        };
      case "tile":
        return {
          container: styles.tileContainer,
          text: styles.tileText,
          underlay: styles.tileUnderlay,
        };
      case "primary":
      default:
        return {
          container: styles.primaryContainer,
          text: styles.primaryText,
          underlay: styles.primaryUnderlay,
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.rootWrapper,
        size === "sm" && styles.sizeSm,
        size === "md" && styles.sizeMd,
        size === "lg" && styles.sizeLg,
        disabled && styles.disabledWrapper,
        style,
      ]}
    >
      {/* 3D Physical Underlay Shadow (Duolingo Bevel) */}
      <Animated.View
        style={[
          styles.underlayLayer,
          vStyles.underlay,
          size === "sm" && styles.underlaySm,
          size === "md" && styles.underlayMd,
          size === "lg" && styles.underlayLg,
          disabled && styles.disabledUnderlay,
        ]}
      />

      {/* Depressable Face */}
      <Animated.View
        style={[
          styles.faceLayer,
          vStyles.container,
          size === "sm" && styles.faceSm,
          size === "md" && styles.faceMd,
          size === "lg" && styles.faceLg,
          disabled && styles.disabledFace,
          { transform: [{ translateY }] },
        ]}
      >
        {leftIcon}
        {title ? (
          <Text
            style={[
              styles.baseText,
              vStyles.text,
              size === "sm" && styles.textSm,
              size === "md" && styles.textMd,
              size === "lg" && styles.textLg,
              disabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        ) : (
          children
        )}
        {rightIcon}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  rootWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  sizeSm: {
    height: 38,
  },
  sizeMd: {
    height: 48,
  },
  sizeLg: {
    height: 54,
  },
  underlayLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: tokens.radii.buttons, // 8px
  },
  underlaySm: {
    height: 35,
  },
  underlayMd: {
    height: 44,
  },
  underlayLg: {
    height: 50,
  },
  faceLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    borderRadius: tokens.radii.buttons, // 8px
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.s8,
    borderWidth: 1,
  },
  faceSm: {
    height: 35,
    paddingHorizontal: tokens.spacing.s12,
  },
  faceMd: {
    height: 44,
    paddingHorizontal: tokens.spacing.s16,
  },
  faceLg: {
    height: 50,
    paddingHorizontal: tokens.spacing.s20,
  },

  // Primary: Obsidian Carbon Face + Deep Charcoal Underlay
  primaryContainer: {
    backgroundColor: tokens.colors.btnPrimaryBg, // #0F172A
    borderColor: "#1E293B",
  },
  primaryUnderlay: {
    backgroundColor: "#020617", // deep shadow lip
  },
  primaryText: {
    color: tokens.colors.btnPrimaryText,
  },

  // Secondary: White Card + Subtle Steel Bevel
  secondaryContainer: {
    backgroundColor: tokens.colors.card,
    borderColor: tokens.colors.borderHairline,
  },
  secondaryUnderlay: {
    backgroundColor: "#CBD5E1", // steel bottom lip
  },
  secondaryText: {
    color: tokens.colors.inkPrimary,
  },

  // Streak: Warm Amber Face + Rich Honey Underlay
  streakContainer: {
    backgroundColor: "#F59E0B",
    borderColor: "#D97706",
  },
  streakUnderlay: {
    backgroundColor: "#B45309",
  },
  streakText: {
    color: "#FFFFFF",
  },

  // Success: Emerald Face + Forest Underlay
  successContainer: {
    backgroundColor: "#10B981",
    borderColor: "#059669",
  },
  successUnderlay: {
    backgroundColor: "#047857",
  },
  successText: {
    color: "#FFFFFF",
  },

  // Tile: Tactile Card Chip for Word Bank
  tileContainer: {
    backgroundColor: tokens.colors.card,
    borderColor: tokens.colors.borderHairline,
    borderRadius: tokens.radii.pillButtons, // 9999px
  },
  tileUnderlay: {
    backgroundColor: "#CBD5E1",
    borderRadius: tokens.radii.pillButtons,
  },
  tileText: {
    color: tokens.colors.inkPrimary,
  },

  baseText: {
    fontFamily: tokens.typography.fontFamilies.sans,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  textSm: {
    fontSize: 12,
  },
  textMd: {
    fontSize: 14,
  },
  textLg: {
    fontSize: 16,
  },

  disabledWrapper: {
    opacity: 0.5,
  },
  disabledFace: {
    backgroundColor: tokens.colors.cardWash,
    borderColor: tokens.colors.borderHairline,
  },
  disabledUnderlay: {
    backgroundColor: tokens.colors.borderSubtle,
  },
  disabledText: {
    color: tokens.colors.inkMuted,
  },
});
