import { createAdminClient } from "../_shared/supabaseClient";
import { processMidnightStreakResolution } from "./logic";

/**
 * Supabase Edge Function Handler for Midnight Streak Resolution & Freeze Worker
 * Invoked hourly by pg_cron or Supabase webhooks.
 */
export default async function handler(req: Request): Promise<Response> {
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
      } catch {
        // Valid for empty body
      }
    }

    const result = await processMidnightStreakResolution(supabase, {
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
    console.error("[ResolveStreaks] Unhandled Error:", err);
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
