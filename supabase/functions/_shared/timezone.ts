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
