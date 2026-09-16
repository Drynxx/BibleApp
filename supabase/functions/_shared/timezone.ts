/**
 * Timezone-Aware Chronological Engine for Inscribe Background Workers
 * Accurately computes local hours, dates, and cutoffs across diverse user locales.
 */

export const DEFAULT_TIMEZONE = "Europe/Bucharest";

/**
 * Validates and normalizes IANA timezone identifier.
 * Defaults to 'Europe/Bucharest' if empty or invalid.
 */
export function normalizeTimezone(timezone?: string | null): string {
  if (!timezone || typeof timezone !== "string" || !timezone.trim()) {
    return DEFAULT_TIMEZONE;
  }
  const clean = timezone.trim();
  try {
    // Validate with Intl
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
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    hourCycle: "h23",
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
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(referenceDate);
}

/**
 * Returns the calendar date string (YYYY-MM-DD) for yesterday in the target timezone.
 * Takes 24 hours prior to referenceDate and computes its local date in that timezone.
 */
export function getYesterdayDateString(timezone: string, referenceDate: Date = new Date()): string {
  const tz = normalizeTimezone(timezone);
  const yesterday = new Date(referenceDate.getTime() - 24 * 60 * 60 * 1000);
  return getLocalDateString(tz, yesterday);
}

/**
 * Checks if the current local time in the specified timezone matches the target hour.
 */
export function isTimezoneAtHour(
  timezone: string,
  targetHour: number,
  referenceDate: Date = new Date()
): boolean {
  return getLocalHour(timezone, referenceDate) === targetHour;
}

/**
 * Internal helper to compute timezone offset in milliseconds at a given UTC moment.
 */
export function getTzOffsetMs(date: Date, timezone: string): number {
  const tz = normalizeTimezone(timezone);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const partMap: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
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
 * Computes exact UTC Date corresponding to 23:59:59.999 local time on dateString in timezone.
 */
export function getLocalEndOfDayUtc(dateString: string, timezone: string): Date {
  const tz = normalizeTimezone(timezone);
  const [year, month, day] = dateString.split("-").map(Number);
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

export interface PartnerProgressSnapshot {
  id: string;
  timezone: string;
  completedToday: boolean;
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
 */
export function evaluateRescueWindow(
  referenceDate: Date,
  partner1: PartnerProgressSnapshot,
  partner2: PartnerProgressSnapshot
): RescueWindowInfo {
  const h1 = getLocalHour(partner1.timezone, referenceDate);
  const h2 = getLocalHour(partner2.timezone, referenceDate);

  const p1InWindow = h1 >= 22;
  const p2InWindow = h2 >= 22;

  let eligibleSenderId: string | null = null;
  let targetRecipientId: string | null = null;

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
