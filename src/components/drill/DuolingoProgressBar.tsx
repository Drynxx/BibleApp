import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { tokens } from "@/theme/tokens";

interface DuolingoProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  height?: number;
}

export const DuolingoProgressBar: React.FC<DuolingoProgressBarProps> = ({
  progress,
  color = "#10B981", // Emerald green
  height = 14,
}) => {
  const animatedWidth = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.spring(animatedWidth, {
      toValue: Math.max(2, Math.min(100, progress)),
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: widthInterpolation,
            backgroundColor: color,
            borderRadius: height / 2,
          },
        ]}
      >
        {/* Glossy Top Highlight Reflection */}
        <View style={styles.glossHighlight} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: "100%",
    backgroundColor: tokens.colors.cardWash, // #F1F3F6
    borderWidth: 1,
    borderColor: tokens.colors.borderHairline,
    overflow: "hidden",
    position: "relative",
  },
  fill: {
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },
  glossHighlight: {
    position: "absolute",
    top: 2,
    left: 4,
    right: 4,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    borderRadius: 2,
  },
});
