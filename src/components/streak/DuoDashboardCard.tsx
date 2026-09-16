import React, { useMemo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Check, Clock, ShieldCheck, User } from 'lucide-react-native';
import { Palette, Typography } from '../../../constants/theme';
import { useCovenant } from '../../services/covenantContext';
import { useAuth } from '../../services/authContext';
import {
  createDuoStreakContext,
  DuoStreakStateMachine,
  getMutualGraceCutoff,
} from '../../engine/duoStreak';
import { DuoFlame } from './DuoFlame';
import { RescueBanner } from './RescueBanner';

interface DuoDashboardCardProps {
  onPressDrill?: () => void;
  onManagePartner?: () => void;
}

export const DuoDashboardCard: React.FC<DuoDashboardCardProps> = ({
  onPressDrill,
  onManagePartner,
}) => {
  const { user } = useAuth();
  const { activeCovenant, partnerProfile, myTodayReview, partnerTodayReview } = useCovenant();

  const partnerName = partnerProfile?.display_name || 'Partner';
  const partnerId = partnerProfile?.id || '';
  const myDone = myTodayReview?.status === 'completed';
  const partnerDone = partnerTodayReview?.status === 'completed';

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Initialize and evaluate Duo Streak State Machine
  const { stateMachine, streakState, cutoffInfo } = useMemo(() => {
    const tz1 = 'Europe/Bucharest';
    const tz2 = 'America/New_York'; // or partner profile timezone

    const ctx = createDuoStreakContext({
      covenantId: activeCovenant?.id || 'default-cov',
      sharedStreak: activeCovenant?.shared_streak || 0,
      longestStreak: activeCovenant?.longest_streak || 0,
      freezeReserves: activeCovenant?.freeze_reserves ?? 1,
      lastStreakDate: activeCovenant?.last_streak_date || null,
      targetDate: todayStr,
      partner1: {
        id: user?.id || 'me',
        displayName: 'You',
        timezone: tz1,
        completedToday: myDone,
      },
      partner2: {
        id: partnerId || 'partner',
        displayName: partnerName,
        timezone: tz2,
        completedToday: partnerDone,
      },
    });

    const sm = new DuoStreakStateMachine(ctx);
    sm.checkTimeWindow(new Date());

    const cutoff = getMutualGraceCutoff(todayStr, tz1, tz2);

    return {
      stateMachine: sm,
      streakState: sm.getState(),
      cutoffInfo: cutoff,
    };
  }, [activeCovenant, user?.id, partnerId, partnerName, myDone, partnerDone, todayStr]);

  const sharedStreak = activeCovenant?.shared_streak || 0;
  const longestStreak = activeCovenant?.longest_streak || sharedStreak;
  const freezeReserves = activeCovenant?.freeze_reserves ?? 1;

  // Format mutual grace cutoff text
  const cutoffTimeText = useMemo(() => {
    const cutoffDate = cutoffInfo.cutoffDate;
    const now = new Date();
    const diffMs = cutoffDate.getTime() - now.getTime();
    if (diffMs <= 0) return 'Midnight cutoff reached';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `Day closes in ${hours}h ${minutes}m (${cutoffInfo.laterTimezone.split('/')[1] || 'midnight'})`;
  }, [cutoffInfo]);

  if (!partnerProfile && !activeCovenant) {
    return null;
  }

  return (
    <View style={styles.card}>
      {/* Top Meta Bar */}
      <View style={styles.headerRow}>
        <View style={styles.titleBadge}>
          <Text style={styles.eyebrow}>MUTUAL FATE COVENANT</Text>
        </View>

        <View style={styles.freezeBadge}>
          <ShieldCheck size={13} color={Palette.gold} />
          <Text style={styles.freezeText}>
            {freezeReserves} {freezeReserves === 1 ? 'Freeze' : 'Freezes'}
          </Text>
        </View>
      </View>

      {/* Center Duo Flame & Longest Streak Counter */}
      <View style={styles.heroSection}>
        <DuoFlame
          streak={sharedStreak}
          state={streakState}
          size="large"
          onPress={onPressDrill}
        />

        <View style={styles.longestStreakRow}>
          <Text style={styles.longestStreakLabel}>All-Time Best:</Text>
          <Text style={styles.longestStreakValue}>{longestStreak} days</Text>
        </View>
      </View>

      {/* Dual Partners Row */}
      <View style={styles.partnersRow}>
        {/* You */}
        <View style={[styles.partnerSlot, myDone && styles.partnerSlotCompleted]}>
          <View style={[styles.avatarCircle, myDone && styles.avatarCompleted]}>
            {myDone ? (
              <Check size={18} color="#FFF" />
            ) : (
              <User size={18} color={Palette.foreground} />
            )}
          </View>
          <View style={styles.partnerMeta}>
            <Text style={styles.partnerName}>You</Text>
            <Text style={[styles.partnerStatus, myDone && styles.statusCompletedText]}>
              {myDone ? 'Completed' : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Divider icon */}
        <View style={styles.partnerDivider}>
          <Text style={styles.dividerAmpersand}>&</Text>
        </View>

        {/* Partner */}
        <View style={[styles.partnerSlot, partnerDone && styles.partnerSlotCompleted]}>
          <View style={[styles.avatarCircle, partnerDone && styles.avatarCompleted]}>
            {partnerDone ? (
              <Check size={18} color="#FFF" />
            ) : (
              <Text style={styles.avatarInitial}>{partnerName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.partnerMeta}>
            <Text style={styles.partnerName} numberOfLines={1}>
              {partnerName}
            </Text>
            <Text style={[styles.partnerStatus, partnerDone && styles.statusCompletedText]}>
              {partnerDone ? 'Completed' : 'Pending'}
            </Text>
          </View>
        </View>
      </View>

      {/* Mutual Grace Timezone Footer */}
      <View style={styles.cutoffRow}>
        <Clock size={12} color={Palette.mutedForeground} />
        <Text style={styles.cutoffLabel}>{cutoffTimeText}</Text>
      </View>

      {/* Rescue Banner if partner has not completed */}
      {myDone && !partnerDone && activeCovenant && (
        <RescueBanner
          covenantId={activeCovenant.id}
          partnerId={partnerId}
          partnerName={partnerName}
          sharedStreak={sharedStreak}
          timeRemainingText={cutoffTimeText}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleBadge: {
    backgroundColor: 'rgba(158, 67, 36, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eyebrow: {
    fontFamily: Typography.sansBold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Palette.primary,
  },
  freezeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(198, 139, 53, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freezeText: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    color: Palette.gold,
    letterSpacing: 0.5,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  longestStreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  longestStreakLabel: {
    fontFamily: Typography.sans,
    fontSize: 11,
    color: Palette.mutedForeground,
  },
  longestStreakValue: {
    fontFamily: Typography.sansBold,
    fontVariant: ['tabular-nums'],
    fontSize: 11,
    color: Palette.foreground,
  },
  partnersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    gap: 8,
  },
  partnerSlot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  partnerSlotCompleted: {
    backgroundColor: 'rgba(90, 119, 94, 0.08)',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCompleted: {
    backgroundColor: Palette.sage,
  },
  avatarInitial: {
    fontFamily: Typography.sansBold,
    fontSize: 14,
    color: Palette.foreground,
  },
  partnerMeta: {
    flex: 1,
  },
  partnerName: {
    fontFamily: Typography.sansBold,
    fontSize: 13,
    color: Palette.foreground,
  },
  partnerStatus: {
    fontFamily: Typography.sans,
    fontSize: 11,
    color: Palette.mutedForeground,
    marginTop: 1,
  },
  statusCompletedText: {
    color: Palette.sage,
    fontFamily: Typography.sansMedium,
  },
  partnerDivider: {
    paddingHorizontal: 4,
  },
  dividerAmpersand: {
    fontFamily: Typography.serifMedium,
    fontSize: 14,
    color: Palette.mutedForeground,
  },
  cutoffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  cutoffLabel: {
    fontFamily: Typography.sans,
    fontSize: 11,
    color: Palette.mutedForeground,
  },
});
