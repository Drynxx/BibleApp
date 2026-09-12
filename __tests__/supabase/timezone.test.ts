import {
  getLocalHour,
  getLocalDateString,
  getYesterdayDateString,
  isTimezoneAtHour,
  normalizeTimezone,
  DEFAULT_TIMEZONE,
} from "../../supabase/functions/_shared/timezone";

describe("Timezone Engine (_shared/timezone.ts)", () => {
  describe("normalizeTimezone", () => {
    it("returns default timezone for empty, null, or invalid inputs", () => {
      expect(normalizeTimezone(null)).toBe(DEFAULT_TIMEZONE);
      expect(normalizeTimezone(undefined)).toBe(DEFAULT_TIMEZONE);
      expect(normalizeTimezone("")).toBe(DEFAULT_TIMEZONE);
      expect(normalizeTimezone("Invalid/City")).toBe(DEFAULT_TIMEZONE);
    });

    it("preserves valid IANA timezones", () => {
      expect(normalizeTimezone("Europe/Bucharest")).toBe("Europe/Bucharest");
      expect(normalizeTimezone("America/New_York")).toBe("America/New_York");
      expect(normalizeTimezone("Asia/Tokyo")).toBe("Asia/Tokyo");
      expect(normalizeTimezone("UTC")).toBe("UTC");
    });
  });

  describe("getLocalHour", () => {
    it("computes accurate local hour in Europe/Bucharest (UTC+3 in summer)", () => {
      // 2026-09-12 19:00:00 UTC is 22:00:00 in Europe/Bucharest (EEST, UTC+3)
      const testUtcDate = new Date("2026-09-12T19:00:00Z");
      const hourBucharest = getLocalHour("Europe/Bucharest", testUtcDate);
      expect(hourBucharest).toBe(22);
    });

    it("computes accurate local hour in America/New_York (UTC-4 in summer)", () => {
      // 2026-09-12 19:00:00 UTC is 15:00:00 in America/New_York (EDT, UTC-4)
      const testUtcDate = new Date("2026-09-12T19:00:00Z");
      const hourNewYork = getLocalHour("America/New_York", testUtcDate);
      expect(hourNewYork).toBe(15);
    });

    it("computes midnight (0:00) accurately", () => {
      // 2026-09-12 21:00:00 UTC is 00:00:00 next day in Europe/Bucharest (UTC+3)
      const testUtcDate = new Date("2026-09-12T21:00:00Z");
      const hourBucharest = getLocalHour("Europe/Bucharest", testUtcDate);
      expect(hourBucharest).toBe(0);
    });
  });

  describe("getLocalDateString", () => {
    it("formats local date as YYYY-MM-DD", () => {
      const date = new Date("2026-09-12T19:00:00Z");
      expect(getLocalDateString("Europe/Bucharest", date)).toBe("2026-09-12");
    });

    it("correctly advances date past midnight in Eastern timezones", () => {
      // 2026-09-12 22:30:00 UTC is 2026-09-13 01:30:00 in Bucharest
      const date = new Date("2026-09-12T22:30:00Z");
      expect(getLocalDateString("Europe/Bucharest", date)).toBe("2026-09-13");
      // But still 2026-09-12 in New York
      expect(getLocalDateString("America/New_York", date)).toBe("2026-09-12");
    });
  });

  describe("getYesterdayDateString", () => {
    it("returns yesterday's calendar date string", () => {
      const date = new Date("2026-09-13T00:30:00Z");
      // In Europe/Bucharest (UTC+3), 00:30Z is 03:30 AM on Sept 13.
      // Yesterday was Sept 12.
      expect(getYesterdayDateString("Europe/Bucharest", date)).toBe("2026-09-12");
    });
  });

  describe("isTimezoneAtHour", () => {
    it("returns true only when hour matches target", () => {
      const date = new Date("2026-09-12T19:00:00Z"); // 22:00 in Bucharest
      expect(isTimezoneAtHour("Europe/Bucharest", 22, date)).toBe(true);
      expect(isTimezoneAtHour("Europe/Bucharest", 21, date)).toBe(false);
      expect(isTimezoneAtHour("America/New_York", 22, date)).toBe(false);
      expect(isTimezoneAtHour("America/New_York", 15, date)).toBe(true);
    });
  });
});
