import {
  DuoStreakStateMachine,
  transitionDuoStreak,
  createDuoStreakContext,
  normalizeTimezone,
  getLocalHour,
  getLocalDateString,
  getYesterdayDateString,
  getLocalEndOfDayUtc,
  getMutualGraceCutoff,
  isCutoffPassed,
  evaluateRescueWindow,
  DuoStreakContext,
} from '@/engine/duoStreak';

describe('Duo Streak State Machine & Timezone Normalization', () => {
  const refDateSummer = new Date('2026-09-12T12:00:00Z'); // 15:00 in Bucharest (UTC+3), 08:00 in New York (UTC-4)

  describe('Timezone Utilities', () => {
    it('normalizes valid and invalid timezones', () => {
      expect(normalizeTimezone('Europe/Bucharest')).toBe('Europe/Bucharest');
      expect(normalizeTimezone('America/New_York')).toBe('America/New_York');
      expect(normalizeTimezone('')).toBe('Europe/Bucharest');
      expect(normalizeTimezone(null)).toBe('Europe/Bucharest');
      expect(normalizeTimezone('Invalid/Zone_Name')).toBe('Europe/Bucharest');
    });

    it('computes local hours accurately across timezones', () => {
      // 12:00 UTC
      expect(getLocalHour('Europe/Bucharest', refDateSummer)).toBe(15);
      expect(getLocalHour('America/New_York', refDateSummer)).toBe(8);
      expect(getLocalHour('UTC', refDateSummer)).toBe(12);
    });

    it('computes local date and yesterday strings', () => {
      const bDate = getLocalDateString('Europe/Bucharest', refDateSummer);
      expect(bDate).toBe('2026-09-12');

      const bYesterday = getYesterdayDateString('Europe/Bucharest', refDateSummer);
      expect(bYesterday).toBe('2026-09-11');
    });

    it('computes exact UTC end-of-day timestamp for local midnight', () => {
      // For 2026-09-12 in Europe/Bucharest (UTC+3): 23:59:59.999 local is 20:59:59.999 UTC
      const bucharestMidnight = getLocalEndOfDayUtc('2026-09-12', 'Europe/Bucharest');
      expect(bucharestMidnight.toISOString()).toBe('2026-09-12T20:59:59.999Z');

      // For 2026-09-12 in America/New_York (UTC-4): 23:59:59.999 local is 03:59:59.999 UTC next day
      const nyMidnight = getLocalEndOfDayUtc('2026-09-12', 'America/New_York');
      expect(nyMidnight.toISOString()).toBe('2026-09-13T03:59:59.999Z');
    });

    it('enforces the Mutual Grace Cutoff Rule (later partner midnight wins)', () => {
      const cutoffInfo = getMutualGraceCutoff(
        '2026-09-12',
        'Europe/Bucharest',
        'America/New_York'
      );

      // New York midnight is 7 hours after Bucharest midnight
      expect(cutoffInfo.laterTimezone).toBe('America/New_York');
      expect(cutoffInfo.cutoffDate.toISOString()).toBe('2026-09-13T03:59:59.999Z');
      expect(cutoffInfo.graceDiffMs).toBe(7 * 60 * 60 * 1000); // exactly 7 hours difference
    });

    it('correctly detects if mutual cutoff has passed', () => {
      const targetDate = '2026-09-12';
      // Before cutoff (2026-09-12 22:00 UTC)
      const beforeCutoff = new Date('2026-09-12T22:00:00Z');
      expect(isCutoffPassed(beforeCutoff, targetDate, 'Europe/Bucharest', 'America/New_York')).toBe(false);

      // Past Bucharest midnight, but still before New York cutoff (2026-09-13 01:00 UTC)
      const betweenMidnights = new Date('2026-09-13T01:00:00Z');
      expect(isCutoffPassed(betweenMidnights, targetDate, 'Europe/Bucharest', 'America/New_York')).toBe(false);

      // After New York cutoff (2026-09-13 04:00 UTC)
      const afterBoth = new Date('2026-09-13T04:00:01Z');
      expect(isCutoffPassed(afterBoth, targetDate, 'Europe/Bucharest', 'America/New_York')).toBe(true);
    });
  });

  describe('Rescue Window Evaluation (10:00 PM / 22:00 rule)', () => {
    const partnerBucharest = {
      id: 'p-ro',
      displayName: 'Ana',
      timezone: 'Europe/Bucharest',
      completedToday: false,
      streakFreezesAvailable: 1,
    };
    const partnerNY = {
      id: 'p-ny',
      displayName: 'David',
      timezone: 'America/New_York',
      completedToday: false,
      streakFreezesAvailable: 1,
    };

    it('is not at risk during normal daytime hours', () => {
      // 12:00 UTC = 15:00 Bucharest, 08:00 NY
      const rescue = evaluateRescueWindow(refDateSummer, partnerBucharest, partnerNY);
      expect(rescue.isAtRisk).toBe(false);
      expect(rescue.partner1InRescueWindow).toBe(false);
      expect(rescue.partner2InRescueWindow).toBe(false);
    });

    it('flags AT_RISK and identifies sender/recipient when completed partner enters 22:00 window', () => {
      // 19:30 UTC = 22:30 Bucharest (Partner 1), 15:30 NY (Partner 2)
      const date22Bucharest = new Date('2026-09-12T19:30:00Z');

      const p1Done = { ...partnerBucharest, completedToday: true };
      const p2Pending = { ...partnerNY, completedToday: false };

      const rescue = evaluateRescueWindow(date22Bucharest, p1Done, p2Pending);
      expect(rescue.isAtRisk).toBe(true);
      expect(rescue.partner1InRescueWindow).toBe(true);
      expect(rescue.partner2InRescueWindow).toBe(false);
      expect(rescue.eligibleSenderId).toBe('p-ro');
      expect(rescue.targetRecipientId).toBe('p-ny');
    });

    it('is NOT at risk when both partners have completed', () => {
      const date22Bucharest = new Date('2026-09-12T19:30:00Z');
      const p1Done = { ...partnerBucharest, completedToday: true };
      const p2Done = { ...partnerNY, completedToday: true };

      const rescue = evaluateRescueWindow(date22Bucharest, p1Done, p2Done);
      expect(rescue.isAtRisk).toBe(false);
    });
  });

  describe('Duo Streak State Machine Transitions', () => {
    function makeInitialContext(): DuoStreakContext {
      return createDuoStreakContext({
        covenantId: 'cov-123',
        sharedStreak: 5,
        longestStreak: 10,
        freezeReserves: 1,
        targetDate: '2026-09-12',
        partner1: {
          id: 'u-1',
          displayName: 'Elena',
          timezone: 'Europe/Bucharest',
          completedToday: false,
          streakFreezesAvailable: 1,
        },
        partner2: {
          id: 'u-2',
          displayName: 'Mark',
          timezone: 'America/New_York',
          completedToday: false,
          streakFreezesAvailable: 0,
        },
      });
    }

    it('transitions WAITING_FOR_BOTH -> WAITING_FOR_PARTNER -> COMPLETED_BOTH', () => {
      const initialCtx = makeInitialContext();
      let state = 'WAITING_FOR_BOTH' as const;

      // 1. Partner 1 finishes drill at 14:00 local
      const step1 = transitionDuoStreak(
        state,
        { type: 'COMPLETE_DRILL', partnerId: 'u-1', completedAt: new Date('2026-09-12T11:00:00Z') },
        initialCtx
      );

      expect(step1.state).toBe('WAITING_FOR_PARTNER');
      expect(step1.context.partner1.completedToday).toBe(true);
      expect(step1.context.partner2.completedToday).toBe(false);
      expect(step1.context.sharedStreak).toBe(5); // Not yet incremented!

      // 2. Partner 2 finishes drill at 17:00 local
      const step2 = transitionDuoStreak(
        step1.state,
        { type: 'COMPLETE_DRILL', partnerId: 'u-2', completedAt: new Date('2026-09-12T21:00:00Z') },
        step1.context
      );

      expect(step2.state).toBe('COMPLETED_BOTH');
      expect(step2.context.partner2.completedToday).toBe(true);
      expect(step2.context.sharedStreak).toBe(6); // Incremented!
      expect(step2.context.lastStreakDate).toBe('2026-09-12');
      expect(step2.actions).toContainEqual({ type: 'INCREMENT_STREAK', newStreak: 6 });
      expect(step2.actions).toContainEqual({ type: 'NOTIFY_BOTH_COMPLETED', sharedStreak: 6 });
    });

    it('transitions to AT_RISK with SEND_RESCUE_NUDGE when 22:00 window opens', () => {
      const initialCtx = makeInitialContext();
      initialCtx.partner1.completedToday = true;

      // Check time window at 22:15 Bucharest time (19:15 UTC)
      const lateEvening = new Date('2026-09-12T19:15:00Z');
      const res = transitionDuoStreak(
        'WAITING_FOR_PARTNER',
        { type: 'CHECK_TIME_WINDOW', referenceDate: lateEvening },
        initialCtx
      );

      expect(res.state).toBe('AT_RISK');
      expect(res.actions).toContainEqual(
        expect.objectContaining({
          type: 'SEND_RESCUE_NUDGE',
          senderId: 'u-1',
          recipientId: 'u-2',
        })
      );
    });

    it('applies covenant freeze when cutoff is reached with an incomplete partner', () => {
      const initialCtx = makeInitialContext();
      initialCtx.partner1.completedToday = true;
      initialCtx.partner2.completedToday = false;
      initialCtx.freezeReserves = 1;

      // Midnight cutoff arrives
      const cutoffTime = new Date('2026-09-13T04:05:00Z');
      const res = transitionDuoStreak(
        'AT_RISK',
        { type: 'RESOLVE_MIDNIGHT', referenceDate: cutoffTime },
        initialCtx
      );

      expect(res.state).toBe('SAVED_BY_FREEZE');
      expect(res.context.sharedStreak).toBe(5); // Preserved!
      expect(res.context.freezeReserves).toBe(0); // Decremented
      expect(res.actions).toContainEqual({
        type: 'DECREMENT_FREEZE',
        remainingFreezes: 0,
        source: 'covenant',
      });
      expect(res.actions).toContainEqual({
        type: 'NOTIFY_SAVED_BY_FREEZE',
        remainingFreezes: 0,
        sharedStreak: 5,
      });
    });

    it('falls back to personal partner freeze when covenant reserves are 0', () => {
      const initialCtx = makeInitialContext();
      initialCtx.freezeReserves = 0; // No shared reserve
      initialCtx.partner1.streakFreezesAvailable = 1; // Partner 1 has a personal freeze
      initialCtx.partner1.completedToday = false;
      initialCtx.partner2.completedToday = false;

      const cutoffTime = new Date('2026-09-13T04:05:00Z');
      const res = transitionDuoStreak(
        'WAITING_FOR_BOTH',
        { type: 'RESOLVE_MIDNIGHT', referenceDate: cutoffTime },
        initialCtx
      );

      expect(res.state).toBe('SAVED_BY_FREEZE');
      expect(res.context.sharedStreak).toBe(5); // Preserved!
      expect(res.context.partner1.streakFreezesAvailable).toBe(0); // Personal freeze consumed
      expect(res.actions).toContainEqual({
        type: 'DECREMENT_FREEZE',
        remainingFreezes: 0,
        source: 'partner1',
      });
    });

    it('resets streak to 0 (BROKEN) when no freeze reserves are available', () => {
      const initialCtx = makeInitialContext();
      initialCtx.freezeReserves = 0;
      initialCtx.partner1.streakFreezesAvailable = 0;
      initialCtx.partner2.streakFreezesAvailable = 0;
      initialCtx.partner1.completedToday = true;
      initialCtx.partner2.completedToday = false;

      const cutoffTime = new Date('2026-09-13T04:05:00Z');
      const res = transitionDuoStreak(
        'AT_RISK',
        { type: 'RESOLVE_MIDNIGHT', referenceDate: cutoffTime },
        initialCtx
      );

      expect(res.state).toBe('BROKEN');
      expect(res.context.sharedStreak).toBe(0); // Reset to 0!
      expect(res.actions).toContainEqual({ type: 'RESET_STREAK', previousStreak: 5 });
      expect(res.actions).toContainEqual({ type: 'NOTIFY_STREAK_BROKEN', previousStreak: 5 });
    });

    it('starts new day cycle cleanly', () => {
      const initialCtx = makeInitialContext();
      initialCtx.sharedStreak = 6;
      initialCtx.partner1.completedToday = true;
      initialCtx.partner2.completedToday = true;

      const res = transitionDuoStreak(
        'COMPLETED_BOTH',
        { type: 'START_NEW_DAY', newDate: '2026-09-13' },
        initialCtx
      );

      expect(res.state).toBe('WAITING_FOR_BOTH');
      expect(res.context.targetDate).toBe('2026-09-13');
      expect(res.context.partner1.completedToday).toBe(false);
      expect(res.context.partner2.completedToday).toBe(false);
      expect(res.context.sharedStreak).toBe(6);
    });
  });

  describe('DuoStreakStateMachine Class API', () => {
    it('manages full lifecycle through high-level class methods', () => {
      const ctx = createDuoStreakContext({
        covenantId: 'cov-class-test',
        sharedStreak: 12,
        freezeReserves: 2,
        targetDate: '2026-09-12',
        partner1: { id: 'p1', displayName: 'Ana', timezone: 'Europe/Bucharest' },
        partner2: { id: 'p2', displayName: 'Bogdan', timezone: 'Europe/Bucharest' },
      });

      const sm = new DuoStreakStateMachine(ctx);
      expect(sm.getState()).toBe('WAITING_FOR_BOTH');

      // Partner 1 completes
      sm.completeDrill('p1');
      expect(sm.getState()).toBe('WAITING_FOR_PARTNER');

      // Partner 2 completes
      sm.completeDrill('p2');
      expect(sm.getState()).toBe('COMPLETED_BOTH');
      expect(sm.getContext().sharedStreak).toBe(13);

      // Next day starts
      sm.startNewDay('2026-09-13');
      expect(sm.getState()).toBe('WAITING_FOR_BOTH');
      expect(sm.getContext().targetDate).toBe('2026-09-13');

      // Add freeze reserve
      sm.addFreezeReserve(1);
      expect(sm.getContext().freezeReserves).toBe(3);

      // Query cutoff Date
      const cutoff = sm.getCutoffDate();
      expect(cutoff).toBeInstanceOf(Date);
    });
  });
});
