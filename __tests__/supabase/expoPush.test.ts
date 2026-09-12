import {
  isValidExpoPushToken,
  buildRescueNudgeNotification,
  buildSelfReminderNotification,
  buildManualNudgeNotification,
  buildStreakFreezeSavedNotification,
  buildStreakBrokenNotification,
  sendExpoPushNotifications,
  ExpoPushMessage,
} from "../../supabase/functions/_shared/expoPush";

describe("Expo Push Notification Pipeline (_shared/expoPush.ts)", () => {
  describe("isValidExpoPushToken", () => {
    it("recognizes standard ExponentPushToken format", () => {
      expect(isValidExpoPushToken("ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]")).toBe(true);
      expect(isValidExpoPushToken("ExpoPushToken[1234567890abcdef]")).toBe(true);
    });

    it("rejects null, undefined, empty, or short strings", () => {
      expect(isValidExpoPushToken(null)).toBe(false);
      expect(isValidExpoPushToken(undefined)).toBe(false);
      expect(isValidExpoPushToken("")).toBe(false);
      expect(isValidExpoPushToken("short-invalid")).toBe(false);
    });
  });

  describe("Localized Message Builders", () => {
    const baseOptions = {
      recipientToken: "ExponentPushToken[user_a_token]",
      partnerName: "Andrei",
      sharedStreak: 14,
      covenantId: "covenant-uuid-123",
      partnerId: "partner-uuid-456",
    };

    it("builds Romanian 10 PM rescue nudge with authentic diacritics", () => {
      const msg = buildRescueNudgeNotification({ ...baseOptions, locale: "ro" });
      expect(msg.to).toBe("ExponentPushToken[user_a_token]");
      expect(msg.title).toBe("🔥 Streak în pericol!");
      expect(msg.body).toContain("Andrei nu a înscris încă versetul de azi");
      expect(msg.body).toContain("14 zile");
      expect(msg.data?.covenantId).toBe("covenant-uuid-123");
      expect(msg.priority).toBe("high");
    });

    it("builds English 10 PM rescue nudge", () => {
      const msg = buildRescueNudgeNotification({ ...baseOptions, locale: "en" });
      expect(msg.title).toBe("🔥 Streak at Risk!");
      expect(msg.body).toContain("Andrei hasn't inscribed today's verse yet");
      expect(msg.body).toContain("14-day streak");
    });

    it("builds Romanian 10 PM self reminder", () => {
      const msg = buildSelfReminderNotification({
        recipientToken: "ExponentPushToken[user_a_token]",
        partnerName: "Andrei",
        sharedStreak: 21,
        covenantId: "covenant-uuid-123",
        locale: "ro",
      });
      expect(msg.title).toBe("⏰ Ora 22:00 — Salvează legământul!");
      expect(msg.body).toContain("Au mai rămas 2 ore din această zi");
      expect(msg.body).toContain("21 zile alături de Andrei");
    });

    it("builds English 10 PM self reminder", () => {
      const msg = buildSelfReminderNotification({
        recipientToken: "ExponentPushToken[user_a_token]",
        partnerName: "Andrei",
        sharedStreak: 21,
        covenantId: "covenant-uuid-123",
        locale: "en",
      });
      expect(msg.title).toBe("⏰ 10:00 PM — Keep the Covenant!");
      expect(msg.body).toContain("2 hours left today!");
    });

    it("builds Romanian manual partner nudge", () => {
      const msg = buildManualNudgeNotification({
        recipientToken: "ExponentPushToken[partner_token]",
        senderName: "Mihai",
        sharedStreak: 7,
        covenantId: "cov-1",
        locale: "ro",
      });
      expect(msg.title).toBe("⚡ Îndemn de la partener!");
      expect(msg.body).toContain("Mihai te îndeamnă să înscrii versetul de azi");
    });

    it("builds Streak Freeze Saved notification in Romanian", () => {
      const msg = buildStreakFreezeSavedNotification({
        recipientToken: "ExponentPushToken[user_token]",
        sharedStreak: 30,
        covenantId: "cov-1",
        locale: "ro",
      });
      expect(msg.title).toBe("🛡️ Înghețare salvatoare aplicată!");
      expect(msg.body).toContain("Streak-ul vostru de 30 zile a fost păstrat");
    });

    it("builds Streak Broken notification in Romanian and English", () => {
      const msgRo = buildStreakBrokenNotification({
        recipientToken: "ExponentPushToken[user_token]",
        covenantId: "cov-1",
        locale: "ro",
      });
      expect(msgRo.title).toBe("💔 Legământ întrerupt");
      expect(msgRo.body).toContain("Streak-ul comun s-a resetat la 0");

      const msgEn = buildStreakBrokenNotification({
        recipientToken: "ExponentPushToken[user_token]",
        covenantId: "cov-1",
        locale: "en",
      });
      expect(msgEn.title).toBe("💔 Covenant Streak Reset");
    });
  });

  describe("sendExpoPushNotifications", () => {
    it("dispatches messages via HTTP fetch and parses ticket response", async () => {
      const mockFetch: typeof fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { status: "ok", id: "ticket-1" },
            { status: "ok", id: "ticket-2" },
          ],
        }),
      } as any);

      const messages: ExpoPushMessage[] = [
        {
          to: "ExponentPushToken[valid_token_1]",
          title: "Test Title 1",
          body: "Test Body 1",
        },
        {
          to: "ExponentPushToken[valid_token_2]",
          title: "Test Title 2",
          body: "Test Body 2",
        },
      ];

      const result = await sendExpoPushNotifications(messages, { fetchFn: mockFetch });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.tickets.length).toBe(2);
      expect(result.tickets[0].id).toBe("ticket-1");
    });

    it("ignores invalid push tokens gracefully", async () => {
      const mockFetch = jest.fn();
      const messages: ExpoPushMessage[] = [
        {
          to: "invalid-token",
          title: "Invalid",
          body: "Invalid",
        },
      ];

      const result = await sendExpoPushNotifications(messages, { fetchFn: mockFetch as any });
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(0);
    });

    it("handles HTTP error responses from Expo API", async () => {
      const mockFetch: typeof fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      } as any);

      const messages: ExpoPushMessage[] = [
        {
          to: "ExponentPushToken[valid_token_1]",
          title: "Test",
          body: "Test",
        },
      ];

      const result = await sendExpoPushNotifications(messages, { fetchFn: mockFetch });
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(1);
      expect(result.tickets[0].status).toBe("error");
      expect(result.tickets[0].message).toContain("HTTP 500");
    });
  });
});
