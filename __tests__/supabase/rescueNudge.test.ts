import {
  processRescueNudges,
  processManualPartnerNudge,
} from "../../supabase/functions/rescue-nudge/logic";
import { ExpoPushMessage } from "../../supabase/functions/_shared/expoPush";

describe("10:00 PM Rescue Nudge Workflow (rescue-nudge/logic.ts)", () => {
  const refTime22Bucharest = new Date("2026-09-12T19:00:00Z"); // 22:00 in Europe/Bucharest (UTC+3)

  function createQueryBuilderMock(resolvedData: any) {
    const builder: any = {
      select: jest.fn(() => builder),
      eq: jest.fn(() => builder),
      not: jest.fn(async () => ({ data: resolvedData, error: null })),
      in: jest.fn(() => builder),
      maybeSingle: jest.fn(async () => ({ data: resolvedData, error: null })),
      insert: jest.fn(async () => ({ error: null })),
    };
    // If resolvedData is returned directly when awaited
    builder.then = (resolve: any) => resolve({ data: resolvedData, error: null });
    return builder;
  }

  it("dispatches rescue nudge to User 1 when User 1 is done but User 2 is incomplete at 10 PM", async () => {
    const mockCovenants = [
      {
        id: "cov-1",
        shared_streak: 12,
        status: "active",
        user_1_id: "user-1",
        user_2_id: "user-2",
        user_1: {
          id: "user-1",
          display_name: "Mihai",
          email: "mihai@example.com",
          timezone: "Europe/Bucharest",
          locale: "ro",
          push_token: "ExponentPushToken[mihai_token]",
        },
        user_2: {
          id: "user-2",
          display_name: "Andrei",
          email: "andrei@example.com",
          timezone: "Europe/Bucharest",
          locale: "ro",
          push_token: "ExponentPushToken[andrei_token]",
        },
      },
    ];

    // Reviews: user-1 is completed, user-2 is missing
    const mockReviews = [
      { user_id: "user-1", status: "completed" },
    ];

    const insertedLogs: any[] = [];
    const dispatchedMessages: ExpoPushMessage[] = [];

    const mockSupabase: any = {
      from: (table: string) => {
        if (table === "covenants") {
          return createQueryBuilderMock(mockCovenants);
        }
        if (table === "covenant_daily_reviews") {
          return createQueryBuilderMock(mockReviews);
        }
        if (table === "notification_logs") {
          const logMock = createQueryBuilderMock(null); // No previous log
          logMock.insert = jest.fn(async (records: any[]) => {
            insertedLogs.push(...records);
            return { error: null };
          });
          return logMock;
        }
        return createQueryBuilderMock(null);
      },
    };

    const mockDispatcher = jest.fn().mockImplementation(async (messages: ExpoPushMessage[]) => {
      dispatchedMessages.push(...messages);
      return {
        successCount: messages.length,
        failureCount: 0,
        tickets: messages.map((m, i) => ({ status: "ok", id: `ticket-${i}` })),
      };
    });

    const result = await processRescueNudges(mockSupabase, {
      referenceDate: refTime22Bucharest,
      pushDispatcher: mockDispatcher as any,
    });

    expect(result.evaluatedCovenants).toBe(1);
    expect(result.atRiskCount).toBe(1);
    expect(result.nudgesDispatched).toBe(2); // Mihai gets rescue nudge; Andrei gets self-reminder

    const rescueNudge = dispatchedMessages.find((m) => m.to === "ExponentPushToken[mihai_token]");
    expect(rescueNudge).toBeDefined();
    expect(rescueNudge?.title).toBe("🔥 Streak în pericol!");
    expect(rescueNudge?.body).toContain("Andrei nu a înscris încă versetul de azi");
    expect(rescueNudge?.body).toContain("12 zile");

    const selfReminder = dispatchedMessages.find((m) => m.to === "ExponentPushToken[andrei_token]");
    expect(selfReminder).toBeDefined();
    expect(selfReminder?.title).toBe("⏰ Ora 22:00 — Salvează legământul!");

    expect(insertedLogs.length).toBe(2);
    expect(insertedLogs[0].notification_type).toBe("rescue_nudge_10pm");
    expect(insertedLogs[1].notification_type).toBe("self_reminder_10pm");
  });

  it("does not send duplicate nudges if already logged in notification_logs", async () => {
    const mockCovenants = [
      {
        id: "cov-1",
        shared_streak: 5,
        status: "active",
        user_1_id: "user-1",
        user_2_id: "user-2",
        user_1: {
          id: "user-1",
          display_name: "Elena",
          timezone: "Europe/Bucharest",
          locale: "en",
          push_token: "ExponentPushToken[elena_token]",
        },
        user_2: {
          id: "user-2",
          display_name: "Maria",
          timezone: "Europe/Bucharest",
          locale: "en",
          push_token: "ExponentPushToken[maria_token]",
        },
      },
    ];

    const mockReviews = [{ user_id: "user-1", status: "completed" }];

    const mockSupabase: any = {
      from: (table: string) => {
        if (table === "covenants") {
          return createQueryBuilderMock(mockCovenants);
        }
        if (table === "covenant_daily_reviews") {
          return createQueryBuilderMock(mockReviews);
        }
        if (table === "notification_logs") {
          // Return an existing log record
          return createQueryBuilderMock({ id: "existing-log-uuid" });
        }
        return createQueryBuilderMock(null);
      },
    };

    const mockDispatcher = jest.fn();

    const result = await processRescueNudges(mockSupabase, {
      referenceDate: refTime22Bucharest,
      pushDispatcher: mockDispatcher as any,
    });

    expect(mockDispatcher).not.toHaveBeenCalled();
    expect(result.nudgesDispatched).toBe(0);
  });

  it("does not nudge when both partners have completed for today", async () => {
    const mockCovenants = [
      {
        id: "cov-1",
        shared_streak: 15,
        status: "active",
        user_1_id: "user-1",
        user_2_id: "user-2",
        user_1: {
          id: "user-1",
          display_name: "Mihai",
          timezone: "Europe/Bucharest",
          locale: "ro",
          push_token: "ExponentPushToken[mihai_token]",
        },
        user_2: {
          id: "user-2",
          display_name: "Andrei",
          timezone: "Europe/Bucharest",
          locale: "ro",
          push_token: "ExponentPushToken[andrei_token]",
        },
      },
    ];

    // Both completed
    const mockReviews = [
      { user_id: "user-1", status: "completed" },
      { user_id: "user-2", status: "completed" },
    ];

    const mockSupabase: any = {
      from: (table: string) => {
        if (table === "covenants") {
          return createQueryBuilderMock(mockCovenants);
        }
        if (table === "covenant_daily_reviews") {
          return createQueryBuilderMock(mockReviews);
        }
        return createQueryBuilderMock(null);
      },
    };

    const mockDispatcher = jest.fn();

    const result = await processRescueNudges(mockSupabase, {
      referenceDate: refTime22Bucharest,
      pushDispatcher: mockDispatcher as any,
    });

    expect(mockDispatcher).not.toHaveBeenCalled();
    expect(result.atRiskCount).toBe(0);
    expect(result.nudgesDispatched).toBe(0);
  });

  it("is timezone-aware: ignores partner whose timezone is not at 22:00", async () => {
    const mockCovenants = [
      {
        id: "cov-nyc",
        shared_streak: 8,
        status: "active",
        user_1_id: "user-nyc-1",
        user_2_id: "user-nyc-2",
        user_1: {
          id: "user-nyc-1",
          display_name: "John",
          timezone: "America/New_York",
          locale: "en",
          push_token: "ExponentPushToken[john_token]",
        },
        user_2: {
          id: "user-nyc-2",
          display_name: "David",
          timezone: "America/New_York",
          locale: "en",
          push_token: "ExponentPushToken[david_token]",
        },
      },
    ];

    const mockSupabase: any = {
      from: (table: string) => {
        if (table === "covenants") {
          return createQueryBuilderMock(mockCovenants);
        }
        return createQueryBuilderMock(null);
      },
    };

    const mockDispatcher = jest.fn();

    const result = await processRescueNudges(mockSupabase, {
      referenceDate: refTime22Bucharest, // 19:00 UTC = 15:00 in America/New_York
      pushDispatcher: mockDispatcher as any,
    });

    expect(mockDispatcher).not.toHaveBeenCalled();
    expect(result.atRiskCount).toBe(0);
    expect(result.nudgesDispatched).toBe(0);
  });

  describe("Manual Partner Nudge Workflow", () => {
    it("dispatches an instant manual nudge to the partner and logs the record", async () => {
      const mockProfiles = [
        {
          id: "sender-1",
          display_name: "Daniel",
          timezone: "Europe/Bucharest",
          locale: "ro",
          push_token: "ExponentPushToken[daniel_token]",
        },
        {
          id: "partner-2",
          display_name: "Elena",
          timezone: "Europe/Bucharest",
          locale: "ro",
          push_token: "ExponentPushToken[elena_token]",
        },
      ];

      const insertedLogs: any[] = [];
      const dispatchedMessages: ExpoPushMessage[] = [];

      const mockSupabase: any = {
        from: (table: string) => {
          if (table === "profiles") {
            const builder: any = {
              select: jest.fn(() => builder),
              in: jest.fn(async () => ({ data: mockProfiles, error: null })),
            };
            return builder;
          }
          if (table === "notification_logs") {
            return {
              insert: jest.fn(async (rec: any) => {
                insertedLogs.push(rec);
                return { error: null };
              }),
            };
          }
          return createQueryBuilderMock(null);
        },
      };

      const mockDispatcher = jest.fn().mockImplementation(async (messages: ExpoPushMessage[]) => {
        dispatchedMessages.push(...messages);
        return {
          successCount: messages.length,
          failureCount: 0,
          tickets: [{ status: "ok", id: "ticket-manual-1" }],
        };
      });

      const res = await processManualPartnerNudge(
        mockSupabase,
        {
          covenantId: "cov-123",
          senderId: "sender-1",
          partnerId: "partner-2",
          sharedStreak: 7,
        },
        {
          pushDispatcher: mockDispatcher as any,
          referenceDate: refTime22Bucharest,
        }
      );

      expect(res.success).toBe(true);
      expect(res.dispatched).toBe(true);
      expect(res.ticket?.id).toBe("ticket-manual-1");

      expect(dispatchedMessages.length).toBe(1);
      expect(dispatchedMessages[0].to).toBe("ExponentPushToken[elena_token]");
      expect(dispatchedMessages[0].title).toBe("⚡ Îndemn de la partener!");
      expect(dispatchedMessages[0].body).toContain("Daniel te îndeamnă să înscrii");
      expect(dispatchedMessages[0].body).toContain("7 zile");

      expect(insertedLogs.length).toBe(1);
      expect(insertedLogs[0].notification_type).toBe("manual_partner_nudge");
      expect(insertedLogs[0].recipient_id).toBe("partner-2");
      expect(insertedLogs[0].partner_id).toBe("sender-1");
      expect(insertedLogs[0].expo_ticket_id).toBe("ticket-manual-1");
    });

    it("returns error if partner has no registered push token", async () => {
      const mockProfiles = [
        {
          id: "sender-1",
          display_name: "Daniel",
          timezone: "Europe/Bucharest",
          locale: "ro",
          push_token: "ExponentPushToken[daniel_token]",
        },
        {
          id: "partner-2",
          display_name: "Elena",
          timezone: "Europe/Bucharest",
          locale: "ro",
          push_token: null, // No token!
        },
      ];

      const mockSupabase: any = {
        from: (table: string) => {
          if (table === "profiles") {
            const builder: any = {
              select: jest.fn(() => builder),
              in: jest.fn(async () => ({ data: mockProfiles, error: null })),
            };
            return builder;
          }
          return createQueryBuilderMock(null);
        },
      };

      const mockDispatcher = jest.fn();

      const res = await processManualPartnerNudge(
        mockSupabase,
        {
          covenantId: "cov-123",
          senderId: "sender-1",
          partnerId: "partner-2",
          sharedStreak: 7,
        },
        {
          pushDispatcher: mockDispatcher as any,
        }
      );

      expect(res.success).toBe(false);
      expect(res.dispatched).toBe(false);
      expect(res.error).toContain("valid registered push token");
      expect(mockDispatcher).not.toHaveBeenCalled();
    });
  });

  describe("Cross-Timezone 10:00 PM Behavior", () => {
    it("notifies Bucharest partner at 22:00 Bucharest time, and New York partner at 22:00 NY time", async () => {
      const mockCovenants = [
        {
          id: "cov-cross-tz-nudge",
          shared_streak: 25,
          status: "active",
          user_1_id: "u-ro",
          user_2_id: "u-ny",
          user_1: {
            id: "u-ro",
            display_name: "Mihai",
            timezone: "Europe/Bucharest",
            locale: "ro",
            push_token: "ExponentPushToken[mihai_ro]",
          },
          user_2: {
            id: "u-ny",
            display_name: "Sarah",
            timezone: "America/New_York",
            locale: "en",
            push_token: "ExponentPushToken[sarah_ny]",
          },
        },
      ];

      // Mihai is completed; Sarah is pending
      const mockReviews = [{ user_id: "u-ro", status: "completed" }];

      const mockSupabase: any = {
        from: (table: string) => {
          if (table === "covenants") return createQueryBuilderMock(mockCovenants);
          if (table === "covenant_daily_reviews") return createQueryBuilderMock(mockReviews);
          if (table === "notification_logs") {
            const builder = createQueryBuilderMock(null);
            builder.insert = jest.fn(async () => ({ error: null }));
            return builder;
          }
          return createQueryBuilderMock(null);
        },
      };

      // 1. At 19:00 UTC (22:00 in Bucharest, 15:00 in New York)
      const refBucharestEvening = new Date("2026-09-12T19:00:00Z");
      const messagesBucharest: ExpoPushMessage[] = [];
      const dispatcherBucharest = jest.fn().mockImplementation(async (msgs: ExpoPushMessage[]) => {
        messagesBucharest.push(...msgs);
        return { successCount: msgs.length, failureCount: 0, tickets: msgs.map(() => ({ status: "ok" })) };
      });

      const resBucharest = await processRescueNudges(mockSupabase, {
        referenceDate: refBucharestEvening,
        pushDispatcher: dispatcherBucharest as any,
      });

      // Mihai gets rescue nudge; Sarah is at 15:00 so she does NOT get 10 PM reminder yet
      expect(resBucharest.atRiskCount).toBe(1);
      expect(resBucharest.nudgesDispatched).toBe(1);
      expect(messagesBucharest[0].to).toBe("ExponentPushToken[mihai_ro]");
      expect(messagesBucharest[0].title).toBe("🔥 Streak în pericol!");
      expect(messagesBucharest[0].body).toContain("Sarah nu a înscris încă versetul de azi");

      // 2. At 02:00 UTC next day (22:00 in New York, 05:00 next day in Bucharest)
      const refNyEvening = new Date("2026-09-13T02:00:00Z");
      const messagesNy: ExpoPushMessage[] = [];
      const dispatcherNy = jest.fn().mockImplementation(async (msgs: ExpoPushMessage[]) => {
        messagesNy.push(...msgs);
        return { successCount: msgs.length, failureCount: 0, tickets: msgs.map(() => ({ status: "ok" })) };
      });

      const resNy = await processRescueNudges(mockSupabase, {
        referenceDate: refNyEvening,
        pushDispatcher: dispatcherNy as any,
      });

      // Sarah now reaches 22:00 in New York and gets self reminder!
      expect(resNy.nudgesDispatched).toBe(1);
      expect(messagesNy[0].to).toBe("ExponentPushToken[sarah_ny]");
      expect(messagesNy[0].title).toBe("⏰ 10:00 PM — Keep the Covenant!");
      expect(messagesNy[0].body).toContain("2 hours left today!");
    });
  });
});

