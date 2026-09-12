import { processMidnightStreakResolution } from "../../supabase/functions/resolve-streaks/logic";
import { ExpoPushMessage } from "../../supabase/functions/_shared/expoPush";

describe("Midnight Streak Resolution Worker (resolve-streaks/logic.ts)", () => {
  // Midnight (00:00) in Europe/Bucharest (UTC+3 in summer) is 21:00:00 UTC previous day
  const refMidnightBucharest = new Date("2026-09-12T21:00:00Z");

  function createQueryBuilderMock(resolvedData: any) {
    const builder: any = {
      select: jest.fn(() => builder),
      eq: jest.fn(() => builder),
      not: jest.fn(async () => ({ data: resolvedData, error: null })),
      in: jest.fn(() => builder),
      lt: jest.fn(async () => ({ data: resolvedData, error: null })),
      update: jest.fn(() => builder),
      upsert: jest.fn(async () => ({ error: null })),
      maybeSingle: jest.fn(async () => ({ data: resolvedData, error: null })),
      insert: jest.fn(async () => ({ error: null })),
    };
    builder.then = (resolve: any) => resolve({ data: resolvedData, error: null });
    return builder;
  }

  it("increments shared streak when both partners completed yesterday's drill", async () => {
    const mockCovenants = [
      {
        id: "cov-both",
        shared_streak: 10,
        longest_streak: 10,
        freeze_reserves: 1,
        status: "active",
        last_streak_date: "2026-09-11",
        user_1_id: "u-1",
        user_2_id: "u-2",
        user_1: {
          id: "u-1",
          display_name: "Ana",
          timezone: "Europe/Bucharest",
          locale: "ro",
          push_token: "ExponentPushToken[ana]",
          streak_freezes_available: 1,
        },
        user_2: {
          id: "u-2",
          display_name: "Bogdan",
          timezone: "Europe/Bucharest",
          locale: "ro",
          push_token: "ExponentPushToken[bogdan]",
          streak_freezes_available: 1,
        },
      },
    ];

    // Both completed
    const mockReviews = [
      { user_id: "u-1", status: "completed" },
      { user_id: "u-2", status: "completed" },
    ];

    let updatedCovenantFields: any = null;

    const mockSupabase: any = {
      from: (table: string) => {
        if (table === "covenants") {
          const qb = createQueryBuilderMock(mockCovenants);
          qb.update = jest.fn((fields: any) => {
            updatedCovenantFields = fields;
            return {
              eq: async () => ({ error: null }),
            };
          });
          return qb;
        }
        if (table === "covenant_daily_reviews") {
          return createQueryBuilderMock(mockReviews);
        }
        if (table === "notification_logs") {
          return createQueryBuilderMock(null);
        }
        if (table === "profiles") {
          const qb = createQueryBuilderMock(null);
          qb.update = jest.fn(() => ({
            in: () => ({
              lt: async () => ({ error: null }),
            }),
          }));
          return qb;
        }
        return createQueryBuilderMock(null);
      },
    };

    const mockDispatcher = jest.fn();

    const result = await processMidnightStreakResolution(mockSupabase, {
      referenceDate: refMidnightBucharest,
      pushDispatcher: mockDispatcher as any,
    });

    expect(result.streaksIncremented).toBe(1);
    expect(result.freezesApplied).toBe(0);
    expect(result.streaksReset).toBe(0);
    expect(result.details[0].outcome).toBe("both_completed");
    expect(result.details[0].sharedStreak).toBe(11);
    expect(updatedCovenantFields?.shared_streak).toBe(11);
    expect(updatedCovenantFields?.longest_streak).toBe(11);
  });

  it("applies grace freeze when one partner failed and freeze reserve is available", async () => {
    const mockCovenants = [
      {
        id: "cov-freeze",
        shared_streak: 20,
        longest_streak: 20,
        freeze_reserves: 1, // Has 1 freeze available!
        status: "active",
        last_streak_date: "2026-09-11",
        user_1_id: "u-1",
        user_2_id: "u-2",
        user_1: {
          id: "u-1",
          display_name: "Ana",
          timezone: "Europe/Bucharest",
          locale: "ro",
          push_token: "ExponentPushToken[ana]",
          streak_freezes_available: 0,
        },
        user_2: {
          id: "u-2",
          display_name: "Bogdan",
          timezone: "Europe/Bucharest",
          locale: "ro",
          push_token: "ExponentPushToken[bogdan]",
          streak_freezes_available: 0,
        },
      },
    ];

    // Only u-1 completed; u-2 missed
    const mockReviews = [{ user_id: "u-1", status: "completed" }];

    let updatedCovenantFields: any = null;
    const upsertedReviewRows: any[] = [];
    const dispatchedMessages: ExpoPushMessage[] = [];

    const mockSupabase: any = {
      from: (table: string) => {
        if (table === "covenants") {
          const qb = createQueryBuilderMock(mockCovenants);
          qb.update = jest.fn((fields: any) => {
            updatedCovenantFields = fields;
            return { eq: async () => ({ error: null }) };
          });
          return qb;
        }
        if (table === "covenant_daily_reviews") {
          const qb = createQueryBuilderMock(mockReviews);
          qb.upsert = jest.fn(async (rows: any[]) => {
            upsertedReviewRows.push(...rows);
            return { error: null };
          });
          return qb;
        }
        if (table === "notification_logs") {
          const qb = createQueryBuilderMock(null);
          qb.insert = jest.fn(async () => ({ error: null }));
          return qb;
        }
        return createQueryBuilderMock(null);
      },
    };

    const mockDispatcher = jest.fn().mockImplementation(async (messages: ExpoPushMessage[]) => {
      dispatchedMessages.push(...messages);
      return { successCount: messages.length, failureCount: 0, tickets: [] };
    });

    const result = await processMidnightStreakResolution(mockSupabase, {
      referenceDate: refMidnightBucharest,
      pushDispatcher: mockDispatcher as any,
    });

    expect(result.freezesApplied).toBe(1);
    expect(result.streaksReset).toBe(0);
    expect(result.details[0].outcome).toBe("freeze_applied");
    expect(result.details[0].sharedStreak).toBe(20); // Streak preserved!

    // Freeze reserve decremented
    expect(updatedCovenantFields?.freeze_reserves).toBe(0);

    // Freeze review inserted for u-2
    expect(upsertedReviewRows.length).toBe(1);
    expect(upsertedReviewRows[0].user_id).toBe("u-2");
    expect(upsertedReviewRows[0].status).toBe("freeze_applied");

    // Notifications sent
    expect(dispatchedMessages.length).toBe(2);
    expect(dispatchedMessages[0].title).toBe("🛡️ Înghețare salvatoare aplicată!");
  });

  it("resets streak to 0 when one partner failed and no freeze reserve is available", async () => {
    const mockCovenants = [
      {
        id: "cov-break",
        shared_streak: 15,
        longest_streak: 15,
        freeze_reserves: 0, // No freezes left
        status: "active",
        last_streak_date: "2026-09-11",
        user_1_id: "u-1",
        user_2_id: "u-2",
        user_1: {
          id: "u-1",
          display_name: "Ana",
          timezone: "Europe/Bucharest",
          locale: "ro",
          push_token: "ExponentPushToken[ana]",
          streak_freezes_available: 0,
        },
        user_2: {
          id: "u-2",
          display_name: "Bogdan",
          timezone: "Europe/Bucharest",
          locale: "ro",
          push_token: "ExponentPushToken[bogdan]",
          streak_freezes_available: 0,
        },
      },
    ];

    // u-2 missed
    const mockReviews = [{ user_id: "u-1", status: "completed" }];

    let updatedCovenantFields: any = null;
    const dispatchedMessages: ExpoPushMessage[] = [];

    const mockSupabase: any = {
      from: (table: string) => {
        if (table === "covenants") {
          const qb = createQueryBuilderMock(mockCovenants);
          qb.update = jest.fn((fields: any) => {
            updatedCovenantFields = fields;
            return { eq: async () => ({ error: null }) };
          });
          return qb;
        }
        if (table === "covenant_daily_reviews") {
          return createQueryBuilderMock(mockReviews);
        }
        if (table === "notification_logs") {
          const qb = createQueryBuilderMock(null);
          qb.insert = jest.fn(async () => ({ error: null }));
          return qb;
        }
        return createQueryBuilderMock(null);
      },
    };

    const mockDispatcher = jest.fn().mockImplementation(async (messages: ExpoPushMessage[]) => {
      dispatchedMessages.push(...messages);
      return { successCount: messages.length, failureCount: 0, tickets: [] };
    });

    const result = await processMidnightStreakResolution(mockSupabase, {
      referenceDate: refMidnightBucharest,
      pushDispatcher: mockDispatcher as any,
    });

    expect(result.streaksReset).toBe(1);
    expect(result.freezesApplied).toBe(0);
    expect(result.details[0].outcome).toBe("streak_reset");
    expect(result.details[0].sharedStreak).toBe(0);
    expect(updatedCovenantFields?.shared_streak).toBe(0);

    // Broken notification sent
    expect(dispatchedMessages.length).toBe(2);
    expect(dispatchedMessages[0].title).toBe("💔 Legământ întrerupt");
    expect(dispatchedMessages[0].body).toContain("Streak-ul comun s-a resetat la 0");
  });

  it("skips covenant if local hour is not midnight", async () => {
    const mockCovenants = [
      {
        id: "cov-daytime",
        shared_streak: 5,
        status: "active",
        user_1_id: "u-1",
        user_2_id: "u-2",
        user_1: { id: "u-1", timezone: "Europe/Bucharest" },
        user_2: { id: "u-2", timezone: "Europe/Bucharest" },
      },
    ];

    const daytimeRef = new Date("2026-09-12T12:00:00Z"); // 15:00 in Bucharest

    const mockSupabase: any = {
      from: () => createQueryBuilderMock(mockCovenants),
    };

    const result = await processMidnightStreakResolution(mockSupabase, {
      referenceDate: daytimeRef,
    });

    expect(result.details[0].outcome).toBe("not_midnight");
    expect(result.streaksIncremented).toBe(0);
    expect(result.streaksReset).toBe(0);
  });
});
