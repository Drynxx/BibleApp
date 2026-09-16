import {
  createDuoStreakContext,
  DuoStreakStateMachine,
  getMutualGraceCutoff,
  evaluateRescueWindow,
} from '@/engine/duoStreak';
import { createDrillSession } from '@/engine/drillSession';
import { verseRepository } from '@/services/db/verseRepository';

describe('Duo Dashboard & 60s Drill Screen Integration', () => {
  const mockBucharestTz = 'Europe/Bucharest';
  const mockNewYorkTz = 'America/New_York';
  const targetDate = '2026-09-12';

  describe('Duo Dashboard State Machine Evaluation', () => {
    it('evaluates covenant in WAITING_FOR_PARTNER and triggers AT_RISK when 22:00 window opens', () => {
      const ctx = createDuoStreakContext({
        covenantId: 'cov-screen-test',
        sharedStreak: 7,
        longestStreak: 14,
        freezeReserves: 2,
        targetDate,
        partner1: {
          id: 'user-me',
          displayName: 'You',
          timezone: mockBucharestTz,
          completedToday: true, // You have completed
        },
        partner2: {
          id: 'user-partner',
          displayName: 'Sarah',
          timezone: mockNewYorkTz,
          completedToday: false, // Partner is pending
        },
      });

      const sm = new DuoStreakStateMachine(ctx);

      // Afternoon (14:00 in Bucharest = 11:00 UTC): waiting for partner
      const afternoon = new Date('2026-09-12T11:00:00Z');
      const afternoonRes = sm.checkTimeWindow(afternoon);
      expect(afternoonRes.state).toBe('WAITING_FOR_PARTNER');

      // Late evening (22:30 in Bucharest = 19:30 UTC): enters AT_RISK window
      const lateEvening = new Date('2026-09-12T19:30:00Z');
      const eveningRes = sm.checkTimeWindow(lateEvening);
      expect(eveningRes.state).toBe('AT_RISK');

      // Rescue nudge event dispatched
      expect(eveningRes.actions).toContainEqual(
        expect.objectContaining({
          type: 'SEND_RESCUE_NUDGE',
          senderId: 'user-me',
          recipientId: 'user-partner',
        })
      );
    });

    it('displays accurate mutual grace cutoff countdown between Europe and US partners', () => {
      const cutoff = getMutualGraceCutoff(targetDate, mockBucharestTz, mockNewYorkTz);

      // New York end-of-day is 03:59:59.999 UTC of next day
      expect(cutoff.cutoffDate.toISOString()).toBe('2026-09-13T03:59:59.999Z');
      expect(cutoff.laterTimezone).toBe(mockNewYorkTz);

      // Verify mutual grace window gives 7 additional hours past Bucharest midnight
      expect(cutoff.graceDiffMs).toBe(7 * 60 * 60 * 1000);
    });

    it('evaluates COMPLETED_BOTH when both partners finish their daily drill', () => {
      const ctx = createDuoStreakContext({
        covenantId: 'cov-both-done',
        sharedStreak: 21,
        longestStreak: 21,
        targetDate,
        partner1: {
          id: 'u1',
          displayName: 'You',
          timezone: mockBucharestTz,
          completedToday: true,
        },
        partner2: {
          id: 'u2',
          displayName: 'Sarah',
          timezone: mockBucharestTz,
          completedToday: false,
        },
      });

      const sm = new DuoStreakStateMachine(ctx);
      const res = sm.completeDrill('u2');

      expect(res.state).toBe('COMPLETED_BOTH');
      expect(res.context.sharedStreak).toBe(22);
      expect(res.context.longestStreak).toBe(22);
      expect(res.actions).toContainEqual({ type: 'INCREMENT_STREAK', newStreak: 22 });
      expect(res.actions).toContainEqual({ type: 'NOTIFY_BOTH_COMPLETED', sharedStreak: 22 });
    });
  });

  describe('60-Second Drill Screen Interactive Flow', () => {
    it('runs through Levels 1 to 4 with Romanian VDC scripture and awards 60s speed bonus', () => {
      const vdcVerse = verseRepository.getAll('VDC')[0];
      expect(vdcVerse).toBeDefined();

      const session = createDrillSession({
        verseText: vdcVerse.text,
        initialStage: 1,
        timeLimitSeconds: 60,
      });

      session.start();
      expect(session.getState().status).toBe('in_progress');
      expect(session.getState().currentStage).toBe(1);

      // Advance to Level 2
      session.advanceStage(2);
      expect(session.getState().currentStage).toBe(2);
      let blanks = session.getState().maskedTokens.filter((t) => t.isMasked);
      expect(blanks.length).toBeGreaterThan(0);

      // Solve Level 2 blanks using Romanian diacritic-tolerant submission
      blanks.forEach((b) => {
        // User types clean unaccented string
        const res = session.submitWord(b.clean, b.id);
        expect(res.success).toBe(true);
      });
      expect(session.getState().status).toBe('stage_completed');

      // Advance to Level 3
      session.advanceStage(3);
      expect(session.getState().currentStage).toBe(3);
      blanks = session.getState().maskedTokens.filter((t) => t.isMasked);
      blanks.forEach((b) => {
        session.submitWord(b.raw, b.id);
      });
      expect(session.getState().status).toBe('stage_completed');

      // Advance to Level 4 (Mastery)
      session.advanceStage(4);
      expect(session.getState().currentStage).toBe(4);
      blanks = session.getState().maskedTokens.filter((t) => t.isMasked);

      // Fast forward 35 seconds (under 60s limit)
      session.tick(35);

      blanks.forEach((b) => {
        session.submitWord(b.raw, b.id);
      });

      // Verification of score and bonuses
      const finalState = session.getState();
      expect(finalState.status).toBe('drill_completed');
      expect(finalState.score).not.toBeNull();
      expect(finalState.score?.perfect).toBe(true);
      expect(finalState.score?.speedBonus).toBe(true);
      expect(finalState.score?.accuracy).toBe(100);
      expect(finalState.score?.xpEarned).toBe(40 + 10 + 5); // 40 base + 10 perfect + 5 speed = 55
    });
  });
});
