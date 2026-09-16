/**
 * Inscribe Duo Streak State Machine & Timezone Normalization Engine
 *
 * Implements the "Mutual Fate Duo Streak" game loop where two accountability partners
 * share a single streak. Features:
 * - Mutual Grace Cutoff Rule: Day evaluates against the later partner's midnight.
 * - 10:00 PM (22:00) Warning Window / Rescue Nudge trigger per partner's local timezone.
 * - Grace freeze auto-application and decrement before resetting to 0.
 * - Pure, dependency-free TypeScript logic for isolated testability and shared client/edge runtime.
 */

export type DuoStreakState =
  | 'WAITING_FOR_BOTH'
  | 'WAITING_FOR_PARTNER'
  | 'AT_RISK'
  | 'COMPLETED_BOTH'
  | 'SAVED_BY_FREEZE'
  | 'BROKEN';

export interface PartnerProgress {
  id: string;
  displayName: string;
  timezone: string;
  completedToday: boolean;
  completedAt?: string;
  streakFreezesAvailable: number;
}

export interface DuoStreakContext {
  covenantId: string;
  sharedStreak: number;
  longestStreak: number;
  freezeReserves: number;
  lastStreakDate: string | null;
  targetDate: string; // YYYY-MM-DD
  partner1: PartnerProgress;
  partner2: PartnerProgress;
}

export type DuoStreakEventType =
  | 'COMPLETE_DRILL'
  | 'CHECK_TIME_WINDOW'
  | 'RESOLVE_MIDNIGHT'
  | 'APPLY_FREEZE'
  | 'START_NEW_DAY'
  | 'ADD_FREEZE_RESERVE';

export interface CompleteDrillEvent {
  type: 'COMPLETE_DRILL';
  partnerId: string;
  completedAt?: Date | string;
}

export interface CheckTimeWindowEvent {
  type: 'CHECK_TIME_WINDOW';
  referenceDate?: Date;
}

export interface ResolveMidnightEvent {
  type: 'RESOLVE_MIDNIGHT';
  referenceDate?: Date;
  force?: boolean;
}

export interface ApplyFreezeEvent {
  type: 'APPLY_FREEZE';
  source?: 'covenant_reserve' | 'partner1_personal' | 'partner2_personal';
}

export interface StartNewDayEvent {
  type: 'START_NEW_DAY';
  newDate: string; // YYYY-MM-DD
}

export interface AddFreezeReserveEvent {
  type: 'ADD_FREEZE_RESERVE';
  amount?: number;
}

export type DuoStreakEvent =
  | CompleteDrillEvent
  | CheckTimeWindowEvent
  | ResolveMidnightEvent
  | ApplyFreezeEvent
  | StartNewDayEvent
  | AddFreezeReserveEvent;

export type DuoStreakAction =
  | { type: 'INCREMENT_STREAK'; newStreak: number }
  | { type: 'RESET_STREAK'; previousStreak: number }
  | { type: 'DECREMENT_FREEZE'; remainingFreezes: number; source: 'covenant' | 'partner1' | 'partner2' }
  | { type: 'SEND_RESCUE_NUDGE'; senderId: string; recipientId: string; senderTz: string; recipientTz: string }
  | { type: 'NOTIFY_SAVED_BY_FREEZE'; remainingFreezes: number; sharedStreak: number }
  | { type: 'NOTIFY_STREAK_BROKEN'; previousStreak: number }
  | { type: 'NOTIFY_BOTH_COMPLETED'; sharedStreak: number };

export interface DuoStreakTransitionResult {
  previousState: DuoStreakState;
  state: DuoStreakState;
  context: DuoStreakContext;
  actions: DuoStreakAction[];
}

export const DEFAULT_TIMEZONE = 'Europe/Bucharest';

/**
 * Validates and normalizes IANA timezone identifier.
 */
export function normalizeTimezone(timezone?: string | null): string {
  if (!timezone || typeof timezone !== 'string' || !timezone.trim()) {
    return DEFAULT_TIMEZONE;
  }
  const clean = timezone.trim();
  try {
    Intl.DateTimeFormat(undefined, { timeZone: clean });
    return clean;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/**
 * Returns the current local hour (0–23) in the target timezone.
 */
export function getLocalHour(timezone: string, referenceDate: Date = new Date()): number {
  const tz = normalizeTimezone(timezone);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    hourCycle: 'h23',
  });
  const hourPart = formatter.format(referenceDate);
  const parsed = parseInt(hourPart, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Returns the local date in YYYY-MM-DD format for the target timezone.
 */
export function getLocalDateString(timezone: string, referenceDate: Date = new Date()): string {
  const tz = normalizeTimezone(timezone);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(referenceDate);
}

/**
 * Returns the calendar date string (YYYY-MM-DD) for yesterday in the target timezone.
 */
export function getYesterdayDateString(timezone: string, referenceDate: Date = new Date()): string {
  const tz = normalizeTimezone(timezone);
  const yesterday = new Date(referenceDate.getTime() - 24 * 60 * 60 * 1000);
  return getLocalDateString(tz, yesterday);
}

/**
 * Internal helper to compute the timezone offset in milliseconds at a given UTC moment.
 */
function getTzOffsetMs(date: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(date);
  const partMap: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      partMap[part.type] = parseInt(part.value, 10);
    }
  }
  const localAsUtc = Date.UTC(
    partMap.year,
    partMap.month - 1,
    partMap.day,
    partMap.hour,
    partMap.minute,
    partMap.second,
    date.getUTCMilliseconds()
  );
  return localAsUtc - date.getTime();
}

/**
 * Computes the exact UTC Date corresponding to 23:59:59.999 local time on dateString in timezone.
 */
export function getLocalEndOfDayUtc(dateString: string, timezone: string): Date {
  const tz = normalizeTimezone(timezone);
  const [year, month, day] = dateString.split('-').map(Number);
  const targetLocalTime = Date.UTC(year, month - 1, day, 23, 59, 59, 999);
  const approxDate = new Date(targetLocalTime);
  const offset = getTzOffsetMs(approxDate, tz);
  const exactUtcTime = targetLocalTime - offset;
  const refinedDate = new Date(exactUtcTime);
  const refinedOffset = getTzOffsetMs(refinedDate, tz);
  return new Date(targetLocalTime - refinedOffset);
}

export interface MutualGraceCutoffInfo {
  cutoffDate: Date;
  laterTimezone: string;
  partner1MidnightUtc: Date;
  partner2MidnightUtc: Date;
  graceDiffMs: number;
}

/**
 * Mutual Grace Cutoff Rule:
 * A calendar day's streak is evaluated against the later partner's midnight.
 * To prevent unfair penalization of the partner in the earlier timezone, the daily log
 * remains open until 23:59:59 of whichever partner has the latest local midnight in UTC.
 */
export function getMutualGraceCutoff(
  dateString: string,
  timezone1: string,
  timezone2: string
): MutualGraceCutoffInfo {
  const tz1 = normalizeTimezone(timezone1);
  const tz2 = normalizeTimezone(timezone2);

  const midnight1 = getLocalEndOfDayUtc(dateString, tz1);
  const midnight2 = getLocalEndOfDayUtc(dateString, tz2);

  const isTz2Later = midnight2.getTime() >= midnight1.getTime();
  const cutoffDate = isTz2Later ? midnight2 : midnight1;
  const laterTimezone = isTz2Later ? tz2 : tz1;
  const graceDiffMs = Math.abs(midnight2.getTime() - midnight1.getTime());

  return {
    cutoffDate,
    laterTimezone,
    partner1MidnightUtc: midnight1,
    partner2MidnightUtc: midnight2,
    graceDiffMs,
  };
}

/**
 * Checks if the mutual cutoff deadline has passed for the given target date.
 */
export function isCutoffPassed(
  referenceDate: Date,
  targetDateString: string,
  timezone1: string,
  timezone2: string
): boolean {
  const { cutoffDate } = getMutualGraceCutoff(targetDateString, timezone1, timezone2);
  return referenceDate.getTime() >= cutoffDate.getTime();
}

export interface RescueWindowInfo {
  isAtRisk: boolean;
  partner1InRescueWindow: boolean;
  partner2InRescueWindow: boolean;
  eligibleSenderId: string | null;
  targetRecipientId: string | null;
}

/**
 * Evaluates the 10:00 PM (22:00) Warning Trigger per partner's local timezone.
 * At 22:00:00 local time:
 * - If Partner A completed but Partner B has not, Partner A receives / can trigger a Rescue Alert to nudge Partner B.
 * - If Partner B's local time is already past 22:00:00 and Partner B has not completed, partner is at risk.
 */
export function evaluateRescueWindow(
  referenceDate: Date,
  partner1: PartnerProgress,
  partner2: PartnerProgress
): RescueWindowInfo {
  const h1 = getLocalHour(partner1.timezone, referenceDate);
  const h2 = getLocalHour(partner2.timezone, referenceDate);

  const p1InWindow = h1 >= 22;
  const p2InWindow = h2 >= 22;

  let eligibleSenderId: string | null = null;
  let targetRecipientId: string | null = null;

  // One completed, other pending
  if (partner1.completedToday && !partner2.completedToday) {
    if (p1InWindow || p2InWindow) {
      eligibleSenderId = partner1.id;
      targetRecipientId = partner2.id;
    }
  } else if (!partner1.completedToday && partner2.completedToday) {
    if (p1InWindow || p2InWindow) {
      eligibleSenderId = partner2.id;
      targetRecipientId = partner1.id;
    }
  }

  const isAtRisk =
    (!partner1.completedToday || !partner2.completedToday) && (p1InWindow || p2InWindow);

  return {
    isAtRisk,
    partner1InRescueWindow: p1InWindow,
    partner2InRescueWindow: p2InWindow,
    eligibleSenderId,
    targetRecipientId,
  };
}

/**
 * Pure transition function for the Duo Streak state machine.
 */
export function transitionDuoStreak(
  currentState: DuoStreakState,
  event: DuoStreakEvent,
  context: DuoStreakContext
): DuoStreakTransitionResult {
  const nextContext: DuoStreakContext = {
    ...context,
    partner1: { ...context.partner1 },
    partner2: { ...context.partner2 },
  };

  const actions: DuoStreakAction[] = [];
  let nextState: DuoStreakState = currentState;

  switch (event.type) {
    case 'COMPLETE_DRILL': {
      const { partnerId, completedAt } = event;
      const timeStr =
        completedAt instanceof Date
          ? completedAt.toISOString()
          : completedAt || new Date().toISOString();

      if (nextContext.partner1.id === partnerId) {
        nextContext.partner1.completedToday = true;
        nextContext.partner1.completedAt = timeStr;
      } else if (nextContext.partner2.id === partnerId) {
        nextContext.partner2.completedToday = true;
        nextContext.partner2.completedAt = timeStr;
      }

      const bothDone = nextContext.partner1.completedToday && nextContext.partner2.completedToday;

      if (bothDone) {
        nextState = 'COMPLETED_BOTH';
        // Only increment if not already resolved for target date
        if (nextContext.lastStreakDate !== nextContext.targetDate) {
          nextContext.sharedStreak += 1;
          nextContext.longestStreak = Math.max(nextContext.longestStreak, nextContext.sharedStreak);
          nextContext.lastStreakDate = nextContext.targetDate;
          actions.push({ type: 'INCREMENT_STREAK', newStreak: nextContext.sharedStreak });
        }
        actions.push({ type: 'NOTIFY_BOTH_COMPLETED', sharedStreak: nextContext.sharedStreak });
      } else {
        // Exactly one partner is done
        const refDate = completedAt instanceof Date ? completedAt : new Date();
        const rescue = evaluateRescueWindow(refDate, nextContext.partner1, nextContext.partner2);

        if (rescue.isAtRisk) {
          nextState = 'AT_RISK';
          if (rescue.eligibleSenderId && rescue.targetRecipientId) {
            const senderTz =
              rescue.eligibleSenderId === nextContext.partner1.id
                ? nextContext.partner1.timezone
                : nextContext.partner2.timezone;
            const recipientTz =
              rescue.targetRecipientId === nextContext.partner1.id
                ? nextContext.partner1.timezone
                : nextContext.partner2.timezone;

            actions.push({
              type: 'SEND_RESCUE_NUDGE',
              senderId: rescue.eligibleSenderId,
              recipientId: rescue.targetRecipientId,
              senderTz,
              recipientTz,
            });
          }
        } else {
          nextState = 'WAITING_FOR_PARTNER';
        }
      }
      break;
    }

    case 'CHECK_TIME_WINDOW': {
      const refDate = event.referenceDate || new Date();
      const cutoffPassed = isCutoffPassed(
        refDate,
        nextContext.targetDate,
        nextContext.partner1.timezone,
        nextContext.partner2.timezone
      );

      // If already completed for the day, preserve state
      if (currentState === 'COMPLETED_BOTH' && nextContext.lastStreakDate === nextContext.targetDate) {
        nextState = 'COMPLETED_BOTH';
        break;
      }

      if (cutoffPassed) {
        // Cutoff passed without both completed -> auto trigger resolve
        return transitionDuoStreak(currentState, { type: 'RESOLVE_MIDNIGHT', referenceDate: refDate }, nextContext);
      }

      const bothDone = nextContext.partner1.completedToday && nextContext.partner2.completedToday;
      if (bothDone) {
        nextState = 'COMPLETED_BOTH';
      } else {
        const rescue = evaluateRescueWindow(refDate, nextContext.partner1, nextContext.partner2);
        if (rescue.isAtRisk) {
          nextState = 'AT_RISK';
          if (
            rescue.eligibleSenderId &&
            rescue.targetRecipientId &&
            currentState !== 'AT_RISK'
          ) {
            const senderTz =
              rescue.eligibleSenderId === nextContext.partner1.id
                ? nextContext.partner1.timezone
                : nextContext.partner2.timezone;
            const recipientTz =
              rescue.targetRecipientId === nextContext.partner1.id
                ? nextContext.partner1.timezone
                : nextContext.partner2.timezone;

            actions.push({
              type: 'SEND_RESCUE_NUDGE',
              senderId: rescue.eligibleSenderId,
              recipientId: rescue.targetRecipientId,
              senderTz,
              recipientTz,
            });
          }
        } else if (nextContext.partner1.completedToday || nextContext.partner2.completedToday) {
          nextState = 'WAITING_FOR_PARTNER';
        } else {
          nextState = 'WAITING_FOR_BOTH';
        }
      }
      break;
    }

    case 'RESOLVE_MIDNIGHT': {
      // If already resolved for target date, do nothing
      if (
        (currentState === 'COMPLETED_BOTH' ||
          currentState === 'SAVED_BY_FREEZE' ||
          currentState === 'BROKEN') &&
        nextContext.lastStreakDate === nextContext.targetDate &&
        !event.force
      ) {
        break;
      }

      const bothDone = nextContext.partner1.completedToday && nextContext.partner2.completedToday;

      if (bothDone) {
        nextState = 'COMPLETED_BOTH';
        if (nextContext.lastStreakDate !== nextContext.targetDate) {
          nextContext.sharedStreak += 1;
          nextContext.longestStreak = Math.max(nextContext.longestStreak, nextContext.sharedStreak);
          nextContext.lastStreakDate = nextContext.targetDate;
          actions.push({ type: 'INCREMENT_STREAK', newStreak: nextContext.sharedStreak });
        }
        actions.push({ type: 'NOTIFY_BOTH_COMPLETED', sharedStreak: nextContext.sharedStreak });
      } else {
        // One or both failed! Check freeze reserves
        if (nextContext.freezeReserves > 0) {
          nextContext.freezeReserves -= 1;
          nextState = 'SAVED_BY_FREEZE';
          nextContext.lastStreakDate = nextContext.targetDate;
          actions.push({
            type: 'DECREMENT_FREEZE',
            remainingFreezes: nextContext.freezeReserves,
            source: 'covenant',
          });
          actions.push({
            type: 'NOTIFY_SAVED_BY_FREEZE',
            remainingFreezes: nextContext.freezeReserves,
            sharedStreak: nextContext.sharedStreak,
          });
        } else if (nextContext.partner1.streakFreezesAvailable > 0) {
          nextContext.partner1.streakFreezesAvailable -= 1;
          nextState = 'SAVED_BY_FREEZE';
          nextContext.lastStreakDate = nextContext.targetDate;
          actions.push({
            type: 'DECREMENT_FREEZE',
            remainingFreezes: nextContext.partner1.streakFreezesAvailable,
            source: 'partner1',
          });
          actions.push({
            type: 'NOTIFY_SAVED_BY_FREEZE',
            remainingFreezes: nextContext.partner1.streakFreezesAvailable,
            sharedStreak: nextContext.sharedStreak,
          });
        } else if (nextContext.partner2.streakFreezesAvailable > 0) {
          nextContext.partner2.streakFreezesAvailable -= 1;
          nextState = 'SAVED_BY_FREEZE';
          nextContext.lastStreakDate = nextContext.targetDate;
          actions.push({
            type: 'DECREMENT_FREEZE',
            remainingFreezes: nextContext.partner2.streakFreezesAvailable,
            source: 'partner2',
          });
          actions.push({
            type: 'NOTIFY_SAVED_BY_FREEZE',
            remainingFreezes: nextContext.partner2.streakFreezesAvailable,
            sharedStreak: nextContext.sharedStreak,
          });
        } else {
          // No freeze available: streak resets to 0!
          const prev = nextContext.sharedStreak;
          nextContext.sharedStreak = 0;
          nextState = 'BROKEN';
          nextContext.lastStreakDate = nextContext.targetDate;
          actions.push({ type: 'RESET_STREAK', previousStreak: prev });
          actions.push({ type: 'NOTIFY_STREAK_BROKEN', previousStreak: prev });
        }
      }
      break;
    }

    case 'START_NEW_DAY': {
      nextContext.targetDate = event.newDate;
      nextContext.partner1.completedToday = false;
      nextContext.partner1.completedAt = undefined;
      nextContext.partner2.completedToday = false;
      nextContext.partner2.completedAt = undefined;
      nextState = 'WAITING_FOR_BOTH';
      break;
    }

    case 'APPLY_FREEZE': {
      const source = event.source || 'covenant_reserve';
      if (source === 'covenant_reserve' && nextContext.freezeReserves > 0) {
        nextContext.freezeReserves -= 1;
        nextState = 'SAVED_BY_FREEZE';
        actions.push({
          type: 'DECREMENT_FREEZE',
          remainingFreezes: nextContext.freezeReserves,
          source: 'covenant',
        });
      } else if (source === 'partner1_personal' && nextContext.partner1.streakFreezesAvailable > 0) {
        nextContext.partner1.streakFreezesAvailable -= 1;
        nextState = 'SAVED_BY_FREEZE';
        actions.push({
          type: 'DECREMENT_FREEZE',
          remainingFreezes: nextContext.partner1.streakFreezesAvailable,
          source: 'partner1',
        });
      } else if (source === 'partner2_personal' && nextContext.partner2.streakFreezesAvailable > 0) {
        nextContext.partner2.streakFreezesAvailable -= 1;
        nextState = 'SAVED_BY_FREEZE';
        actions.push({
          type: 'DECREMENT_FREEZE',
          remainingFreezes: nextContext.partner2.streakFreezesAvailable,
          source: 'partner2',
        });
      }
      break;
    }

    case 'ADD_FREEZE_RESERVE': {
      const amount = event.amount ?? 1;
      nextContext.freezeReserves += amount;
      break;
    }
  }

  return {
    previousState: currentState,
    state: nextState,
    context: nextContext,
    actions,
  };
}

/**
 * Creates an initial DuoStreakContext with safe defaults.
 */
export function createDuoStreakContext(params: {
  covenantId: string;
  sharedStreak?: number;
  longestStreak?: number;
  freezeReserves?: number;
  lastStreakDate?: string | null;
  targetDate: string;
  partner1: {
    id: string;
    displayName: string;
    timezone?: string;
    completedToday?: boolean;
    streakFreezesAvailable?: number;
  };
  partner2: {
    id: string;
    displayName: string;
    timezone?: string;
    completedToday?: boolean;
    streakFreezesAvailable?: number;
  };
}): DuoStreakContext {
  return {
    covenantId: params.covenantId,
    sharedStreak: params.sharedStreak ?? 0,
    longestStreak: params.longestStreak ?? 0,
    freezeReserves: params.freezeReserves ?? 1,
    lastStreakDate: params.lastStreakDate ?? null,
    targetDate: params.targetDate,
    partner1: {
      id: params.partner1.id,
      displayName: params.partner1.displayName,
      timezone: normalizeTimezone(params.partner1.timezone),
      completedToday: params.partner1.completedToday ?? false,
      streakFreezesAvailable: params.partner1.streakFreezesAvailable ?? 0,
    },
    partner2: {
      id: params.partner2.id,
      displayName: params.partner2.displayName,
      timezone: normalizeTimezone(params.partner2.timezone),
      completedToday: params.partner2.completedToday ?? false,
      streakFreezesAvailable: params.partner2.streakFreezesAvailable ?? 0,
    },
  };
}

/**
 * Object-oriented state machine wrapper for the Duo Streak game loop.
 */
export class DuoStreakStateMachine {
  private state: DuoStreakState;
  private context: DuoStreakContext;

  constructor(
    context: DuoStreakContext,
    initialState: DuoStreakState = 'WAITING_FOR_BOTH'
  ) {
    this.context = { ...context };
    this.state = initialState;
  }

  public getState(): DuoStreakState {
    return this.state;
  }

  public getContext(): Readonly<DuoStreakContext> {
    return this.context;
  }

  public transition(event: DuoStreakEvent): DuoStreakTransitionResult {
    const result = transitionDuoStreak(this.state, event, this.context);
    this.state = result.state;
    this.context = result.context;
    return result;
  }

  public completeDrill(partnerId: string, timestamp?: Date): DuoStreakTransitionResult {
    return this.transition({ type: 'COMPLETE_DRILL', partnerId, completedAt: timestamp });
  }

  public checkTimeWindow(referenceDate?: Date): DuoStreakTransitionResult {
    return this.transition({ type: 'CHECK_TIME_WINDOW', referenceDate });
  }

  public resolveMidnight(referenceDate?: Date, force?: boolean): DuoStreakTransitionResult {
    return this.transition({ type: 'RESOLVE_MIDNIGHT', referenceDate, force });
  }

  public applyFreeze(
    source?: 'covenant_reserve' | 'partner1_personal' | 'partner2_personal'
  ): DuoStreakTransitionResult {
    return this.transition({ type: 'APPLY_FREEZE', source });
  }

  public startNewDay(newDate: string): DuoStreakTransitionResult {
    return this.transition({ type: 'START_NEW_DAY', newDate });
  }

  public addFreezeReserve(amount?: number): DuoStreakTransitionResult {
    return this.transition({ type: 'ADD_FREEZE_RESERVE', amount });
  }

  public isAtRisk(referenceDate?: Date): boolean {
    const ref = referenceDate || new Date();
    const info = evaluateRescueWindow(ref, this.context.partner1, this.context.partner2);
    return info.isAtRisk;
  }

  public getCutoffDate(): Date {
    const info = getMutualGraceCutoff(
      this.context.targetDate,
      this.context.partner1.timezone,
      this.context.partner2.timezone
    );
    return info.cutoffDate;
  }

  public getTimeUntilCutoffMs(referenceDate: Date = new Date()): number {
    const cutoff = this.getCutoffDate();
    return Math.max(0, cutoff.getTime() - referenceDate.getTime());
  }
}
