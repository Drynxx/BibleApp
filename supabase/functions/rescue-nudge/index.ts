import { createAdminClient } from "../_shared/supabaseClient";
import { processRescueNudges, processManualPartnerNudge } from "./logic";

/**
 * Supabase Edge Function Handler for 10:00 PM Rescue Nudge & Partner Nudge
 * Invoked hourly by pg_cron, Supabase webhooks, or manual in-app trigger.
 */
export default async function handler(req: Request): Promise<Response> {
  // Allow CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const supabase = createAdminClient();

    let referenceDate: Date | undefined;
    let dryRun = false;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.referenceDate) referenceDate = new Date(body.referenceDate);
        if (body.dryRun) dryRun = Boolean(body.dryRun);

        if (body.manualTrigger) {
          const manualResult = await processManualPartnerNudge(
            supabase,
            {
              covenantId: body.covenantId,
              senderId: body.senderId,
              partnerId: body.partnerId,
              sharedStreak: body.sharedStreak,
            },
            {
              referenceDate,
              dryRun,
            }
          );

          return new Response(JSON.stringify({ success: manualResult.success, result: manualResult }), {
            status: manualResult.success ? 200 : 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } catch {
        // Empty or non-JSON body is valid for cron ping
      }
    }

    const result = await processRescueNudges(supabase, {
      referenceDate,
      dryRun,
    });

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("[RescueNudge] Unhandled Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || String(err) }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

// Support Deno.serve when deployed to Supabase Edge Runtime
if (typeof (globalThis as any).Deno !== "undefined" && (globalThis as any).Deno.serve) {
  (globalThis as any).Deno.serve(handler);
}
