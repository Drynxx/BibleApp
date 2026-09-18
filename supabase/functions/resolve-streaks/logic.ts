import { SupabaseClient } from "@supabase/supabase-js";
import {
  getLocalHour,
  getLocalDateString,
  getYesterdayDateString,
  normalizeTimezone,
} from "../_shared/timezone";
import {
  ExpoPushMessage,
  ExpoPushTicket,
  sendExpoPushNotifications,
  buildStreakFreezeSavedNotification,
  buildStreakBrokenNotification,
  isValidExpoPushToken,
} from "../_shared/expoPush";

export interface ResolveStreaksResult {
  evaluatedCovenants: number;
  streaksIncremented: number;
  freezesApplied: number;
  streaksReset: number;
  tickets: ExpoPushTicket[];
  details: Array<{
    covenantId: string;
    outcome: "both_completed" | "freeze_applied" | "streak_reset" | "already_resolved" | "not_midnight";
    targetDate: string;
    sharedStreak: number;
  }>;
}

export interface ResolveStreaksOptions {
  referenceDate?: Date;
  pushDispatcher?: typeof sendExpoPushNotifications;
  dryRun?: boolean;
}

/**
 * Midnight background worker evaluating all partnerships:
 * - Increments streak if both completed.
 * - Applies grace freeze if available when one or both failed.
 * - Resets streak to 0 if one or both failed with no freeze.
 * All logic is strictly timezone-aware based on user locales.
 */
export async function processMidnightStreakResolution(
  supabase: SupabaseClient,
  options: ResolveStreaksOptions = {}
): Promise<ResolveStreaksResult> {
  const refDate = options.referenceDate || new Date();
  const dispatcher = options.pushDispatcher || sendExpoPushNotifications;
  const dryRun = options.dryRun || false;

  // 1. Fetch active covenants
  const { data: covenants, error: covError } = await supabase
    .from("covenants")
    .select(`
      id,
      shared_streak,
      longest_streak,
      freeze_reserves,
      status,
      last_streak_date,
      user_1_id,
      user_2_id,
      user_1:user_1_id (
        id, display_name, email, timezone, locale, push_token, streak_freezes_available
      ),
      user_2:user_2_id (
        id, display_name, email, timezone, locale, push_token, streak_freezes_available
      )
    `)
    .eq("status", "active")
    .not("user_2_id", "is", null);

  if (covError) {
    throw new Error(`Failed to query covenants: ${covError.message}`);
  }

  const result: ResolveStreaksResult = {
    evaluatedCovenants: covenants?.length || 0,
    streaksIncremented: 0,
    freezesApplied: 0,
    streaksReset: 0,
    tickets: [],
    details: [],
  };

  const pendingMessages: ExpoPushMessage[] = [];
  const pendingLogs: Array<{
    covenant_id: string;
    recipient_id: string;
    partner_id: string | null;
    notification_type: "streak_saved_freeze" | "streak_broken";
    target_date: string;
    status: string;
  }> = [];

  for (const cov of covenants || []) {
    const u1 = Array.isArray(cov.user_1) ? cov.user_1[0] : cov.user_1;
    const u2 = Array.isArray(cov.user_2) ? cov.user_2[0] : cov.user_2;

    if (!u1 || !u2) continue;

    const tz1 = normalizeTimezone(u1.timezone);
    const tz2 = normalizeTimezone(u2.timezone);

    const hour1 = getLocalHour(tz1, refDate);
    const hour2 = getLocalHour(tz2, refDate);
    const date1 = getLocalDateString(tz1, refDate);
    const date2 = getLocalDateString(tz2, refDate);

    // Day ends at midnight (hour === 0) in the covenant's operational timezone.
    // In multi-timezone pairs, resolve when both partners have concluded the calendar day
    // (date1 === date2) and at least one is currently at hour 0, using the midnight timezone.
    const bothInNewDay = date1 === date2;
    const isU1Midnight = hour1 === 0 && bothInNewDay;
    const isU2Midnight = hour2 === 0 && bothInNewDay;

    if (!isU1Midnight && !isU2Midnight) {
      result.details.push({
        covenantId: cov.id,
        outcome: "not_midnight",
        targetDate: getYesterdayDateString(tz1, refDate),
        sharedStreak: cov.shared_streak,
      });
      continue;
    }

    const midnightTz = isU1Midnight ? tz1 : tz2;
    const yesterdayDate = getYesterdayDateString(midnightTz, refDate);

    // Check if already resolved for yesterday
    if (cov.last_streak_date && cov.last_streak_date >= yesterdayDate) {
      result.details.push({
        covenantId: cov.id,
        outcome: "already_resolved",
        targetDate: yesterdayDate,
        sharedStreak: cov.shared_streak,
      });
      continue;
    }

    // Check if a freeze or break was already recorded for yesterday
    const { data: existingResolutionLog } = await supabase
      .from("notification_logs")
      .select("id")
      .eq("covenant_id", cov.id)
      .in("notification_type", ["streak_saved_freeze", "streak_broken"])
      .eq("target_date", yesterdayDate)
      .maybeSingle();

    if (existingResolutionLog) {
      result.details.push({
        covenantId: cov.id,
        outcome: "already_resolved",
        targetDate: yesterdayDate,
        sharedStreak: cov.shared_streak,
      });
      continue;
    }

    // Fetch yesterday's reviews
    const { data: reviews } = await supabase
      .from("covenant_daily_reviews")
      .select("user_id, status")
      .eq("covenant_id", cov.id)
      .eq("review_date", yesterdayDate);

    const u1Completed = reviews?.some((r) => r.user_id === u1.id && r.status === "completed") ?? false;
    const u2Completed = reviews?.some((r) => r.user_id === u2.id && r.status === "completed") ?? false;

    // SCENARIO 1: Both partners completed yesterday's drill
    if (u1Completed && u2Completed) {
      const newStreak = cov.shared_streak + 1;
      const newLongest = Math.max(cov.longest_streak, newStreak);

      if (!dryRun) {
        await supabase
          .from("covenants")
          .update({
            shared_streak: newStreak,
            longest_streak: newLongest,
            last_streak_date: yesterdayDate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", cov.id);

        // Update profiles longest streak
        await supabase
          .from("profiles")
          .update({ longest_streak: newLongest, updated_at: new Date().toISOString() })
          .in("id", [u1.id, u2.id])
          .lt("longest_streak", newLongest);
      }

      result.streaksIncremented++;
      result.details.push({
        covenantId: cov.id,
        outcome: "both_completed",
        targetDate: yesterdayDate,
        sharedStreak: newStreak,
      });
    } else {
      // SCENARIO 2: One or both failed!
      const totalFreezesAvailable =
        (cov.freeze_reserves || 0) +
        (u1.streak_freezes_available || 0) +
        (u2.streak_freezes_available || 0);

      if (cov.shared_streak > 0 && totalFreezesAvailable > 0) {
        // Sub-case A: Streak Freeze saves the streak!
        let remainingCovenantFreezes = cov.freeze_reserves || 0;
        let u1Freezes = u1.streak_freezes_available || 0;
        let u2Freezes = u2.streak_freezes_available || 0;

        if (remainingCovenantFreezes > 0) {
          remainingCovenantFreezes -= 1;
        } else if (u1Freezes > 0) {
          u1Freezes -= 1;
          if (!dryRun) {
            await supabase
              .from("profiles")
              .update({ streak_freezes_available: u1Freezes, updated_at: new Date().toISOString() })
              .eq("id", u1.id);
          }
        } else if (u2Freezes > 0) {
          u2Freezes -= 1;
          if (!dryRun) {
            await supabase
              .from("profiles")
              .update({ streak_freezes_available: u2Freezes, updated_at: new Date().toISOString() })
              .eq("id", u2.id);
          }
        }

        if (!dryRun) {
          // Decrement covenant freeze reserve
          await supabase
            .from("covenants")
            .update({
              freeze_reserves: remainingCovenantFreezes,
              last_streak_date: yesterdayDate,
              updated_at: new Date().toISOString(),
            })
            .eq("id", cov.id);

          // Record freeze review rows for missing partners
          const freezeInserts: Array<{
            covenant_id: string;
            user_id: string;
            review_date: string;
            duration_seconds: number;
            status: string;
          }> = [];

          if (!u1Completed) {
            freezeInserts.push({
              covenant_id: cov.id,
              user_id: u1.id,
              review_date: yesterdayDate,
              duration_seconds: 0,
              status: "freeze_applied",
            });
          }
          if (!u2Completed) {
            freezeInserts.push({
              covenant_id: cov.id,
              user_id: u2.id,
              review_date: yesterdayDate,
              duration_seconds: 0,
              status: "freeze_applied",
            });
          }

          if (freezeInserts.length > 0) {
            await supabase.from("covenant_daily_reviews").upsert(freezeInserts);
          }
        }

        // Notify both partners of freeze salvation
        if (isValidExpoPushToken(u1.push_token)) {
          pendingMessages.push(
            buildStreakFreezeSavedNotification({
              recipientToken: u1.push_token,
              sharedStreak: cov.shared_streak,
              covenantId: cov.id,
              locale: u1.locale,
            })
          );
          pendingLogs.push({
            covenant_id: cov.id,
            recipient_id: u1.id,
            partner_id: u2.id,
            notification_type: "streak_saved_freeze",
            target_date: yesterdayDate,
            status: "sent",
          });
        }

        if (isValidExpoPushToken(u2.push_token)) {
          pendingMessages.push(
            buildStreakFreezeSavedNotification({
              recipientToken: u2.push_token,
              sharedStreak: cov.shared_streak,
              covenantId: cov.id,
              locale: u2.locale,
            })
          );
          pendingLogs.push({
            covenant_id: cov.id,
            recipient_id: u2.id,
            partner_id: u1.id,
            notification_type: "streak_saved_freeze",
            target_date: yesterdayDate,
            status: "sent",
          });
        }

        result.freezesApplied++;
        result.details.push({
          covenantId: cov.id,
          outcome: "freeze_applied",
          targetDate: yesterdayDate,
          sharedStreak: cov.shared_streak,
        });
      } else {
        // Sub-case B: No freeze available -> Streak reset to 0
        if (!dryRun) {
          await supabase
            .from("covenants")
            .update({
              shared_streak: 0,
              updated_at: new Date().toISOString(),
            })
            .eq("id", cov.id);
        }

        // Notify both partners of streak reset
        if (isValidExpoPushToken(u1.push_token)) {
          pendingMessages.push(
            buildStreakBrokenNotification({
              recipientToken: u1.push_token,
              covenantId: cov.id,
              locale: u1.locale,
            })
          );
          pendingLogs.push({
            covenant_id: cov.id,
            recipient_id: u1.id,
            partner_id: u2.id,
            notification_type: "streak_broken",
            target_date: yesterdayDate,
            status: "sent",
          });
        }

        if (isValidExpoPushToken(u2.push_token)) {
          pendingMessages.push(
            buildStreakBrokenNotification({
              recipientToken: u2.push_token,
              covenantId: cov.id,
              locale: u2.locale,
            })
          );
          pendingLogs.push({
            covenant_id: cov.id,
            recipient_id: u2.id,
            partner_id: u1.id,
            notification_type: "streak_broken",
            target_date: yesterdayDate,
            status: "sent",
          });
        }

        result.streaksReset++;
        result.details.push({
          covenantId: cov.id,
          outcome: "streak_reset",
          targetDate: yesterdayDate,
          sharedStreak: 0,
        });
      }
    }
  }

  // Dispatch push notifications
  if (!dryRun && pendingMessages.length > 0) {
    const dispatchResult = await dispatcher(pendingMessages);
    result.tickets = dispatchResult.tickets;

    for (let i = 0; i < pendingLogs.length; i++) {
      if (dispatchResult.tickets[i]?.id) {
        (pendingLogs[i] as any).expo_ticket_id = dispatchResult.tickets[i].id;
      }
    }

    if (pendingLogs.length > 0) {
      await supabase.from("notification_logs").insert(pendingLogs);
    }
  }

  return result;
}
