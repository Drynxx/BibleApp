/**
 * Expo Push Notification Pipeline & Localized Message Builders
 * Supports bilingual (EN/RO) formatting, chunked dispatch, and Expo API validation.
 */

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  priority?: "default" | "normal" | "high";
  channelId?: string;
}

export interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

export interface ExpoPushResponse {
  data: ExpoPushTicket[];
}

export const EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Validates whether a given string is a plausible Expo push token.
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
 * Sends messages in chunks of up to 100 to Expo's Push API.
 */
export async function sendExpoPushNotifications(
  messages: ExpoPushMessage[],
  options?: {
    expoApiUrl?: string;
    accessToken?: string;
    fetchFn?: typeof fetch;
  }
): Promise<{ successCount: number; failureCount: number; tickets: ExpoPushTicket[] }> {
  const fetchImpl = options?.fetchFn || fetch;
  const apiUrl = options?.expoApiUrl || EXPO_PUSH_API_URL;
  const validMessages = messages.filter((m) => isValidExpoPushToken(m.to));

  if (validMessages.length === 0) {
    return { successCount: 0, failureCount: 0, tickets: [] };
  }

  const allTickets: ExpoPushTicket[] = [];
  const chunkSize = 100;

  for (let i = 0; i < validMessages.length; i += chunkSize) {
    const chunk = validMessages.slice(i, i + chunkSize);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    };

    if (options?.accessToken) {
      headers["Authorization"] = `Bearer ${options.accessToken}`;
    }

    try {
      const response = await fetchImpl(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ExpoPush] API Error HTTP ${response.status}: ${errorText}`);
        for (let j = 0; j < chunk.length; j++) {
          allTickets.push({
            status: "error",
            message: `HTTP ${response.status}: ${errorText}`,
          });
        }
        continue;
      }

      const json = (await response.json()) as ExpoPushResponse;
      if (Array.isArray(json.data)) {
        allTickets.push(...json.data);
      }
    } catch (err) {
      console.error("[ExpoPush] Network error:", err);
      for (let j = 0; j < chunk.length; j++) {
        allTickets.push({
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  const successCount = allTickets.filter((t) => t.status === "ok").length;
  const failureCount = allTickets.length - successCount;

  return { successCount, failureCount, tickets: allTickets };
}

// ─── Localized Notification Builders ──────────────────────────────────────────

export interface RescueNudgeOptions {
  recipientToken: string;
  partnerName: string;
  sharedStreak: number;
  covenantId: string;
  partnerId: string;
  locale?: "ro" | "en";
}

export function buildRescueNudgeNotification(options: RescueNudgeOptions): ExpoPushMessage {
  const isRo = (options.locale || "ro") === "ro";
  const title = isRo ? "🔥 Streak în pericol!" : "🔥 Streak at Risk!";
  const body = isRo
    ? `${options.partnerName} nu a înscris încă versetul de azi. Trimite-i un îndemn pentru a salva streak-ul de ${options.sharedStreak} zile!`
    : `${options.partnerName} hasn't inscribed today's verse yet. Send them a nudge to protect your ${options.sharedStreak}-day streak!`;

  return {
    to: options.recipientToken,
    title,
    body,
    sound: "default",
    priority: "high",
    channelId: "covenants",
    data: {
      screen: "Partner",
      covenantId: options.covenantId,
      partnerId: options.partnerId,
      notificationType: "rescue_nudge_10pm",
    },
  };
}

export interface SelfReminderOptions {
  recipientToken: string;
  partnerName: string;
  sharedStreak: number;
  covenantId: string;
  locale?: "ro" | "en";
}

export function buildSelfReminderNotification(options: SelfReminderOptions): ExpoPushMessage {
  const isRo = (options.locale || "ro") === "ro";
  const title = isRo ? "⏰ Ora 22:00 — Salvează legământul!" : "⏰ 10:00 PM — Keep the Covenant!";
  const body = isRo
    ? `Au mai rămas 2 ore din această zi! Înscrie versetul de azi pentru a păstra streak-ul de ${options.sharedStreak} zile alături de ${options.partnerName}.`
    : `2 hours left today! Inscribe today's verse to protect your ${options.sharedStreak}-day streak with ${options.partnerName}.`;

  return {
    to: options.recipientToken,
    title,
    body,
    sound: "default",
    priority: "high",
    channelId: "covenants",
    data: {
      screen: "Drill",
      covenantId: options.covenantId,
      notificationType: "self_reminder_10pm",
    },
  };
}

export interface ManualNudgeOptions {
  recipientToken: string;
  senderName: string;
  sharedStreak: number;
  covenantId: string;
  locale?: "ro" | "en";
}

export function buildManualNudgeNotification(options: ManualNudgeOptions): ExpoPushMessage {
  const isRo = (options.locale || "ro") === "ro";
  const title = isRo ? "⚡ Îndemn de la partener!" : "⚡ Partner Nudge!";
  const body = isRo
    ? `${options.senderName} te îndeamnă să înscrii versetul de azi pentru a salva streak-ul vostru de ${options.sharedStreak} zile!`
    : `${options.senderName} nudged you to inscribe today's verse and protect your ${options.sharedStreak}-day streak!`;

  return {
    to: options.recipientToken,
    title,
    body,
    sound: "default",
    priority: "high",
    channelId: "covenants",
    data: {
      screen: "Drill",
      covenantId: options.covenantId,
      notificationType: "manual_partner_nudge",
    },
  };
}

export interface StreakFreezeSavedOptions {
  recipientToken: string;
  sharedStreak: number;
  covenantId: string;
  locale?: "ro" | "en";
}

export function buildStreakFreezeSavedNotification(options: StreakFreezeSavedOptions): ExpoPushMessage {
  const isRo = (options.locale || "ro") === "ro";
  const title = isRo ? "🛡️ Înghețare salvatoare aplicată!" : "🛡️ Streak Saved by Grace!";
  const body = isRo
    ? `A fost folosită o rezervă de înghețare. Streak-ul vostru de ${options.sharedStreak} zile a fost păstrat!`
    : `An emergency streak freeze was applied. Your ${options.sharedStreak}-day streak is protected!`;

  return {
    to: options.recipientToken,
    title,
    body,
    sound: "default",
    priority: "high",
    channelId: "covenants",
    data: {
      screen: "Partner",
      covenantId: options.covenantId,
      notificationType: "streak_saved_freeze",
    },
  };
}

export interface StreakBrokenOptions {
  recipientToken: string;
  covenantId: string;
  locale?: "ro" | "en";
}

export function buildStreakBrokenNotification(options: StreakBrokenOptions): ExpoPushMessage {
  const isRo = (options.locale || "ro") === "ro";
  const title = isRo ? "💔 Legământ întrerupt" : "💔 Covenant Streak Reset";
  const body = isRo
    ? "Streak-ul comun s-a resetat la 0. Înscrieți astăzi pentru a începe un nou legământ!"
    : "Your shared streak has reset to 0. Inscribe today to start a new covenant streak!";

  return {
    to: options.recipientToken,
    title,
    body,
    sound: "default",
    priority: "high",
    channelId: "covenants",
    data: {
      screen: "Partner",
      covenantId: options.covenantId,
      notificationType: "streak_broken",
    },
  };
}
