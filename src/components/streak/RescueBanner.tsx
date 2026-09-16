import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BellRing, Check, Send } from 'lucide-react-native';
import { Palette, Typography } from '../../../constants/theme';
import { dispatchManualPartnerNudge } from '../../services/pushNotification';

interface RescueBannerProps {
  covenantId: string;
  partnerId: string;
  partnerName: string;
  sharedStreak: number;
  timeRemainingText?: string;
  onNudgeSent?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const RescueBanner: React.FC<RescueBannerProps> = ({
  covenantId,
  partnerId,
  partnerName,
  sharedStreak,
  timeRemainingText,
  onNudgeSent,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (isSending || sent) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    scale.value = withSpring(0.96, { damping: 12, stiffness: 220 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 180 });
  };

  const handleSendNudge = async () => {
    if (isSending || sent) return;
    setIsSending(true);

    try {
      const res = await dispatchManualPartnerNudge({
        covenantId,
        partnerId,
        partnerName,
        sharedStreak,
      });

      if (res.success) {
        setSent(true);
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        if (onNudgeSent) onNudgeSent();
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <BellRing size={16} color="#DC2626" />
          <Text style={styles.titleText}>Rescue Nudge Active</Text>
        </View>
        <Text style={styles.descText}>
          {sent
            ? `Reminder sent to ${partnerName}! 🕊️`
            : `${partnerName} hasn't completed today's verse yet.`}
        </Text>
        {timeRemainingText && !sent && (
          <Text style={styles.cutoffText}>{timeRemainingText}</Text>
        )}
      </View>

      <AnimatedPressable
        onPress={handleSendNudge}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isSending || sent}
        style={[
          styles.nudgeButton,
          sent ? styles.nudgeButtonSent : styles.nudgeButtonActive,
          animatedStyle,
        ]}
      >
        {sent ? (
          <>
            <Check size={14} color="#FFF" />
            <Text style={styles.nudgeButtonText}>Sent</Text>
          </>
        ) : (
          <>
            <Send size={14} color="#FFF" />
            <Text style={styles.nudgeButtonText}>
              {isSending ? 'Sending...' : 'Nudge'}
            </Text>
          </>
        )}
      </AnimatedPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 18,
    padding: 14,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  titleText: {
    fontFamily: Typography.sansBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#DC2626',
  },
  descText: {
    fontFamily: Typography.sansMedium,
    fontSize: 13,
    color: Palette.foreground,
    lineHeight: 18,
  },
  cutoffText: {
    fontFamily: Typography.sans,
    fontSize: 11,
    color: Palette.mutedForeground,
    marginTop: 2,
  },
  nudgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#EF4444',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  nudgeButtonActive: {
    backgroundColor: '#DC2626',
  },
  nudgeButtonSent: {
    backgroundColor: Palette.sage,
  },
  nudgeButtonText: {
    fontFamily: Typography.sansBold,
    fontSize: 12,
    color: '#FFF',
    letterSpacing: 0.5,
  },
});
