import { Platform } from "react-native";
import { supabase, isSupabaseConfigured } from "./supabase";

export interface PushRegistrationResult {
  success: boolean;
  token?: string;
  error?: string;
}

/**
 * Validates Expo push token structure: ExponentPushToken[...] or ExpoPushToken[...]
 */
export function isValidExpoPushToken(token?: string | null): boolean {
  if (!token || typeof token !== "string") return false;
  const trimmed = token.trim();
  return (
    trimmed.startsWith("ExponentPushToken[") ||
    trimmed.startsWith("ExpoPushToken[") ||
    /^[a-zA-Z0-9-_]{20,}$/.test(trimmed)
  );
}

/**
 * Registers device push token securely with Supabase.
 * Upserts token to public.push_tokens and sets public.profiles.push_token.
 */
export async function registerDevicePushToken(
  token: string,
  platformOverride?: "ios" | "android" | "web" | "unknown"
): Promise<PushRegistrationResult> {
  if (!isValidExpoPushToken(token)) {
    return { success: false, error: "Invalid Expo push token format" };
  }

  if (!isSupabaseConfigured) {
    return { success: true, token };
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "User is not authenticated" };
    }

    const platform =
      platformOverride ||
      (Platform.OS === "ios"
        ? "ios"
        : Platform.OS === "android"
        ? "android"
        : Platform.OS === "web"
        ? "web"
        : "unknown");

    // Invoke atomic register_device_token RPC
    const { error: rpcError } = await supabase.rpc("register_device_token", {
      p_token: token,
      p_platform: platform,
    });

    if (rpcError) {
      // Fallback: direct table operations
      const { error: insertError } = await supabase.from("push_tokens").upsert(
        {
          user_id: user.id,
          token,
          platform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "token" }
      );

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      await supabase
        .from("profiles")
        .update({ push_token: token, updated_at: new Date().toISOString() })
        .eq("id", user.id);
    }

    return { success: true, token };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Automatically synchronizes device locale and IANA timezone to user profile in Supabase.
 */
export async function syncUserLocaleAndTimezone(
  locale: "ro" | "en" = "ro",
  explicitTimezone?: string
): Promise<{ success: boolean; timezone: string; locale: string }> {
  const detectedTz =
    explicitTimezone ||
    (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Bucharest";
      } catch {
        return "Europe/Bucharest";
      }
    })();

  if (!isSupabaseConfigured) {
    return { success: true, timezone: detectedTz, locale };
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({
          timezone: detectedTz,
          locale,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    return { success: true, timezone: detectedTz, locale };
  } catch {
    return { success: false, timezone: detectedTz, locale };
  }
}

/**
 * Dispatches an instant manual rescue nudge to accountability partner.
 */
export async function dispatchManualPartnerNudge(params: {
  covenantId: string;
  partnerId: string;
  partnerName: string;
  sharedStreak: number;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Call Supabase Edge Function send-nudge or log notification
    const { data, error } = await supabase.functions.invoke("rescue-nudge", {
      body: {
        manualTrigger: true,
        covenantId: params.covenantId,
        senderId: user.id,
        partnerId: params.partnerId,
        sharedStreak: params.sharedStreak,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
