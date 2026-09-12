import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates an administrative Supabase client using the service role key.
 * Compatible with Deno runtime, Node runtime, and injected mock clients.
 */
export function createAdminClient(customUrl?: string, customKey?: string): SupabaseClient {
  const getEnv = (key: string): string | undefined => {
    // Check Deno global
    if (typeof (globalThis as any).Deno !== "undefined" && (globalThis as any).Deno.env) {
      return (globalThis as any).Deno.env.get(key);
    }
    // Check Node process.env
    if (typeof process !== "undefined" && process.env) {
      return process.env[key];
    }
    return undefined;
  };

  const url = customUrl || getEnv("SUPABASE_URL") || getEnv("EXPO_PUBLIC_SUPABASE_URL") || "http://localhost:54321";
  const serviceKey = customKey || getEnv("SUPABASE_SERVICE_ROLE_KEY") || getEnv("SUPABASE_ANON_KEY") || "service-role-placeholder";

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
