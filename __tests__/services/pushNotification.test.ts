jest.mock("react-native", () => ({
  Platform: {
    OS: "ios",
    select: (obj: any) => obj.ios ?? obj.default,
  },
}));

import {
  isValidExpoPushToken,
  registerDevicePushToken,
  syncUserLocaleAndTimezone,
  dispatchManualPartnerNudge,
} from "../../src/services/pushNotification";
import { supabase, isSupabaseConfigured } from "../../src/services/supabase";

jest.mock("../../src/services/supabase", () => {
  const mockAuth = {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: "test-user-id", email: "test@example.com" } },
      error: null,
    }),
  };

  const mockQueryBuilder: any = {
    select: jest.fn(() => mockQueryBuilder),
    update: jest.fn(() => mockQueryBuilder),
    upsert: jest.fn(() => mockQueryBuilder),
    eq: jest.fn().mockResolvedValue({ error: null }),
  };

  return {
    isSupabaseConfigured: true,
    supabase: {
      auth: mockAuth,
      rpc: jest.fn().mockResolvedValue({ error: null }),
      from: jest.fn(() => mockQueryBuilder),
      functions: {
        invoke: jest.fn().mockResolvedValue({ data: { success: true }, error: null }),
      },
    },
  };
});

describe("Client Push Notification Service (src/services/pushNotification.ts)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isValidExpoPushToken", () => {
    it("validates true on ExponentPushToken", () => {
      expect(isValidExpoPushToken("ExponentPushToken[Abcdefg1234567890]")).toBe(true);
    });

    it("validates false on invalid token", () => {
      expect(isValidExpoPushToken("not-a-token")).toBe(false);
      expect(isValidExpoPushToken("")).toBe(false);
      expect(isValidExpoPushToken(null)).toBe(false);
    });
  });

  describe("registerDevicePushToken", () => {
    it("successfully registers token via RPC when authenticated", async () => {
      const validToken = "ExponentPushToken[device_token_xyz_123]";
      const result = await registerDevicePushToken(validToken, "ios");

      expect(result.success).toBe(true);
      expect(result.token).toBe(validToken);
      expect(supabase.rpc).toHaveBeenCalledWith("register_device_token", {
        p_token: validToken,
        p_platform: "ios",
      });
    });

    it("rejects registration when token format is invalid", async () => {
      const result = await registerDevicePushToken("bad-token");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid Expo push token format");
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it("falls back to direct table upsert if RPC fails", async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        error: { message: "function not found" },
      });

      const validToken = "ExponentPushToken[device_token_xyz_123]";
      const result = await registerDevicePushToken(validToken, "android");

      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith("push_tokens");
      expect(supabase.from).toHaveBeenCalledWith("profiles");
    });
  });

  describe("syncUserLocaleAndTimezone", () => {
    it("updates user profile with detected or provided timezone", async () => {
      const result = await syncUserLocaleAndTimezone("ro", "Europe/Bucharest");
      expect(result.success).toBe(true);
      expect(result.timezone).toBe("Europe/Bucharest");
      expect(result.locale).toBe("ro");
      expect(supabase.from).toHaveBeenCalledWith("profiles");
    });
  });

  describe("dispatchManualPartnerNudge", () => {
    it("invokes rescue-nudge edge function with manual payload", async () => {
      const result = await dispatchManualPartnerNudge({
        covenantId: "cov-123",
        partnerId: "partner-456",
        partnerName: "Andrei",
        sharedStreak: 14,
      });

      expect(result.success).toBe(true);
      expect(supabase.functions.invoke).toHaveBeenCalledWith("rescue-nudge", {
        body: expect.objectContaining({
          manualTrigger: true,
          covenantId: "cov-123",
          partnerId: "partner-456",
          sharedStreak: 14,
        }),
      });
    });
  });
});
