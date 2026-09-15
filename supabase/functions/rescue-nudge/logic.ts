import { SupabaseClient } from "@supabase/supabase-js";
import {
  getLocalHour,
  getLocalDateString,
  normalizeTimezone,
} from "../_shared/timezone";
import {
  ExpoPushMessage,
  ExpoPushTicket,
  sendExpoPushNotifications,
  buildRescueNudgeNotification,
  buildSelfReminderNotification,
  buildManualNudgeNotification,
  isValidExpoPushToken,
} from "../_shared/expoPush";

export interface RescueNudgeResult {
  evaluatedCovenants: number;
  atRiskCount: number;
  nudgesDispatched: number;
  tickets: ExpoPushTicket[];
  details: Array<{
    covenantId: string;
    recipientId: string;
    type: "rescue_nudge_10pm" | "self_reminder_10pm";
    recipientName: string;
    partnerName: string;
    localHour: number;
    targetDate: string;
  }>;
}

export interface RescueNudgeOptions {
  referenceDate?: Date;
  pushDispatcher?: typeof sendExpoPushNotifications;
  dryRun?: boolean;
}

/**
 * Evaluates active covenants and triggers the 10:00 PM "Rescue Nudge"
 * and 10:00 PM self-recitation reminder strictly based on user timezones.
 */
export async function processRescueNudges(
  supabase: SupabaseClient,
  options: RescueNudgeOptions = {}
): Promise<RescueNudgeResult> {
  const refDate = options.referenceDate || new Date();
  const dispatcher = options.pushDispatcher || sendExpoPushNotifications;
  const dryRun = options.dryRun || false;

  // 1. Fetch active covenants with partner profiles
  const { data: covenants, error: covError } = await supabase
    .from("covenants")
    .select(`
      id,
      shared_streak,
      status,
      user_1_id,
      user_2_id,
      user_1:user_1_id (
        id, display_name, email, timezone, locale, push_token
      ),
      user_2:user_2_id (
        id, display_name, email, timezone, locale, push_token
      )
    `)
    .eq("status", "active")
    .not("user_2_id", "is", null);

  if (covError) {
    throw new Error(`Failed to query covenants: ${covError.message}`);
  }

  const result: RescueNudgeResult = {
    evaluatedCovenants: covenants?.length || 0,
    atRiskCount: 0,
    nudgesDispatched: 0,
    tickets: [],
    details: [],
  };

  const pendingMessages: ExpoPushMessage[] = [];
  const pendingLogs: Array<{
    covenant_id: string;
    recipient_id: string;
    partner_id: string;
    notification_type: "rescue_nudge_10pm" | "self_reminder_10pm";
    target_date: string;
    status: string;
  }> = [];

  for (const cov of covenants || []) {
    // Supabase can return arrays or objects depending on foreign key naming
    const u1 = Array.isArray(cov.user_1) ? cov.user_1[0] : cov.user_1;
    const u2 = Array.isArray(cov.user_2) ? cov.user_2[0] : cov.user_2;

    if (!u1 || !u2) continue;

    // Evaluate User 1
    const tz1 = normalizeTimezone(u1.timezone);
    const hour1 = getLocalHour(tz1, refDate);
    const dateStr1 = getLocalDateString(tz1, refDate);

    if (hour1 === 22) {
      const { data: reviews1 } = await supabase
        .from("covenant_daily_reviews")
        .select("user_id, status")
        .eq("covenant_id", cov.id)
        .eq("review_date", dateStr1);

      const u1Done = reviews1?.some((r) => r.user_id === u1.id && r.status === "completed") ?? false;
      const u2Done = reviews1?.some((r) => r.user_id === u2.id && r.status === "completed") ?? false;

      // Condition 1: User 1 is DONE, User 2 is NOT DONE -> Rescue Nudge to User 1
      if (u1Done && !u2Done) {
        result.atRiskCount++;
        const { data: existingLog } = await supabase
          .from("notification_logs")
          .select("id")
          .eq("covenant_id", cov.id)
          .eq("recipient_id", u1.id)
          .eq("notification_type", "rescue_nudge_10pm")
          .eq("target_date", dateStr1)
          .maybeSingle();

        if (!existingLog && isValidExpoPushToken(u1.push_token)) {
          pendingMessages.push(
            buildRescueNudgeNotification({
              recipientToken: u1.push_token,
              partnerName: u2.display_name,
              sharedStreak: cov.shared_streak,
              covenantId: cov.id,
              partnerId: u2.id,
              locale: u1.locale,
            })
          );
          pendingLogs.push({
            covenant_id: cov.id,
            recipient_id: u1.id,
            partner_id: u2.id,
            notification_type: "rescue_nudge_10pm",
            target_date: dateStr1,
            status: "sent",
          });
          result.details.push({
            covenantId: cov.id,
            recipientId: u1.id,
            type: "rescue_nudge_10pm",
            recipientName: u1.display_name,
            partnerName: u2.display_name,
            localHour: hour1,
            targetDate: dateStr1,
          });
        }
      } else if (!u1Done) {
        // Condition 2: User 1 is NOT DONE -> Self reminder at 10 PM
        const { data: existingLog } = await supabase
          .from("notification_logs")
          .select("id")
          .eq("covenant_id", cov.id)
          .eq("recipient_id", u1.id)
          .eq("notification_type", "self_reminder_10pm")
          .eq("target_date", dateStr1)
          .maybeSingle();

        if (!existingLog && isValidExpoPushToken(u1.push_token)) {
          pendingMessages.push(
            buildSelfReminderNotification({
              recipientToken: u1.push_token,
              partnerName: u2.display_name,
              sharedStreak: cov.shared_streak,
              covenantId: cov.id,
              locale: u1.locale,
            })
          );
          pendingLogs.push({
            covenant_id: cov.id,
            recipient_id: u1.id,
            partner_id: u2.id,
            notification_type: "self_reminder_10pm",
            target_date: dateStr1,
            status: "sent",
          });
          result.details.push({
            covenantId: cov.id,
            recipientId: u1.id,
            type: "self_reminder_10pm",
            recipientName: u1.display_name,
            partnerName: u2.display_name,
            localHour: hour1,
            targetDate: dateStr1,
          });
        }
      }
    }

    // Evaluate User 2
    const tz2 = normalizeTimezone(u2.timezone);
    const hour2 = getLocalHour(tz2, refDate);
    const dateStr2 = getLocalDateString(tz2, refDate);

    if (hour2 === 22) {
      const { data: reviews2 } = await supabase
        .from("covenant_daily_reviews")
        .select("user_id, status")
        .eq("covenant_id", cov.id)
        .eq("review_date", dateStr2);

      const u1Done = reviews2?.some((r) => r.user_id === u1.id && r.status === "completed") ?? false;
      const u2Done = reviews2?.some((r) => r.user_id === u2.id && r.status === "completed") ?? false;

      // Condition 1: User 2 is DONE, User 1 is NOT DONE -> Rescue Nudge to User 2
      if (u2Done && !u1Done) {
        result.atRiskCount++;
        const { data: existingLog } = await supabase
          .from("notification_logs")
          .select("id")
          .eq("covenant_id", cov.id)
          .eq("recipient_id", u2.id)
          .eq("notification_type", "rescue_nudge_10pm")
          .eq("target_date", dateStr2)
          .maybeSingle();

        if (!existingLog && isValidExpoPushToken(u2.push_token)) {
          pendingMessages.push(
            buildRescueNudgeNotification({
              recipientToken: u2.push_token,
              partnerName: u1.display_name,
              sharedStreak: cov.shared_streak,
              covenantId: cov.id,
              partnerId: u1.id,
              locale: u2.locale,
            })
          );
          pendingLogs.push({
            covenant_id: cov.id,
            recipient_id: u2.id,
            partner_id: u1.id,
            notification_type: "rescue_nudge_10pm",
            target_date: dateStr2,
            status: "sent",
          });
          result.details.push({
            covenantId: cov.id,
            recipientId: u2.id,
            type: "rescue_nudge_10pm",
            recipientName: u2.display_name,
            partnerName: u1.display_name,
            localHour: hour2,
            targetDate: dateStr2,
          });
        }
      } else if (!u2Done) {
        // Condition 2: User 2 is NOT DONE -> Self reminder at 10 PM
        const { data: existingLog } = await supabase
          .from("notification_logs")
          .select("id")
          .eq("covenant_id", cov.id)
          .eq("recipient_id", u2.id)
          .eq("notification_type", "self_reminder_10pm")
          .eq("target_date", dateStr2)
          .maybeSingle();

        if (!existingLog && isValidExpoPushToken(u2.push_token)) {
          pendingMessages.push(
            buildSelfReminderNotification({
              recipientToken: u2.push_token,
              partnerName: u1.display_name,
              sharedStreak: cov.shared_streak,
              covenantId: cov.id,
              locale: u2.locale,
            })
          );
          pendingLogs.push({
            covenant_id: cov.id,
            recipient_id: u2.id,
            partner_id: u1.id,
            notification_type: "self_reminder_10pm",
            target_date: dateStr2,
            status: "sent",
          });
          result.details.push({
            covenantId: cov.id,
            recipientId: u2.id,
            type: "self_reminder_10pm",
            recipientName: u2.display_name,
            partnerName: u1.display_name,
            localHour: hour2,
            targetDate: dateStr2,
          });
        }
      }
    }
  }

  // Dispatch push notifications
  if (!dryRun && pendingMessages.length > 0) {
    const dispatchResult = await dispatcher(pendingMessages);
    result.tickets = dispatchResult.tickets;
    result.nudgesDispatched = dispatchResult.successCount;

    // Attach expo ticket ids if available
    for (let i = 0; i < pendingLogs.length; i++) {
      if (dispatchResult.tickets[i]?.id) {
        (pendingLogs[i] as any).expo_ticket_id = dispatchResult.tickets[i].id;
      }
    }

    // Record logs in notification_logs
    if (pendingLogs.length > 0) {
      await supabase.from("notification_logs").insert(pendingLogs);
    }
  } else {
    result.nudgesDispatched = pendingMessages.length;
  }

  return result;
}

export interface ManualNudgeRequest {
  covenantId: string;
  senderId: string;
  partnerId: string;
  sharedStreak?: number;
}

export interface ManualNudgeResult {
  success: boolean;
  dispatched: boolean;
  ticket?: ExpoPushTicket;
  error?: string;
}

/**
 * Dispatches an instant manual nudge from one partner to another,
 * persisting the delivery record in notification_logs.
 */
export async function processManualPartnerNudge(
  supabase: SupabaseClient,
  params: ManualNudgeRequest,
  options: {
    pushDispatcher?: typeof sendExpoPushNotifications;
    dryRun?: boolean;
    referenceDate?: Date;
  } = {}
): Promise<ManualNudgeResult> {
  const refDate = options.referenceDate || new Date();
  const dispatcher = options.pushDispatcher || sendExpoPushNotifications;
  const dryRun = options.dryRun || false;

  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select("id, display_name, timezone, locale, push_token")
    .in("id", [params.senderId, params.partnerId]);

  if (profileErr || !profiles) {
    return {
      success: false,
      dispatched: false,
      error: `Failed to fetch partner profiles: ${profileErr?.message || "Not found"}`,
    };
  }

  const sender = profiles.find((p) => p.id === params.senderId);
  const partner = profiles.find((p) => p.id === params.partnerId);

  if (!sender || !partner) {
    return {
      success: false,
      dispatched: false,
      error: "Sender or partner profile not found",
    };
  }

  if (!isValidExpoPushToken(partner.push_token)) {
    return {
      success: false,
      dispatched: false,
      error: "Partner does not have a valid registered push token",
    };
  }

  const tz = normalizeTimezone(partner.timezone);
  const dateStr = getLocalDateString(tz, refDate);

  const message = buildManualNudgeNotification({
    recipientToken: partner.push_token,
    senderName: sender.display_name,
    sharedStreak: params.sharedStreak ?? 0,
    covenantId: params.covenantId,
    locale: partner.locale,
  });

  let ticket: ExpoPushTicket | undefined;

  if (!dryRun) {
    const dispatchResult = await dispatcher([message]);
    ticket = dispatchResult.tickets[0];

    await supabase.from("notification_logs").insert({
      covenant_id: params.covenantId,
      recipient_id: params.partnerId,
      partner_id: params.senderId,
      notification_type: "manual_partner_nudge",
      target_date: dateStr,
      status: ticket?.status === "error" ? "failed" : "sent",
      expo_ticket_id: ticket?.id,
    });
  }

  return {
    success: true,
    dispatched: true,
    ticket,
  };
}

