import fs from "fs";
import path from "path";

describe("Supabase Schema & RLS Policies Validation (20260912000001_inscribe_core_schema.sql)", () => {
  const migrationPath = path.resolve(
    __dirname,
    "../../supabase/migrations/20260912000001_inscribe_core_schema.sql"
  );
  const docsSchemaPath = path.resolve(__dirname, "../../docs/supabase_schema.sql");

  it("ensures migration and docs schema files exist and are non-empty", () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    expect(fs.existsSync(docsSchemaPath)).toBe(true);

    const migrationSql = fs.readFileSync(migrationPath, "utf-8");
    const docsSql = fs.readFileSync(docsSchemaPath, "utf-8");

    expect(migrationSql.length).toBeGreaterThan(1000);
    expect(docsSql.length).toBeGreaterThan(1000);
  });

  describe("Core Database Tables", () => {
    let sql: string;
    beforeAll(() => {
      sql = fs.readFileSync(migrationPath, "utf-8");
    });

    it("defines public.profiles with timezone, locale, push_token, and streak columns", () => {
      expect(sql).toMatch(/create table if not exists public\.profiles/i);
      expect(sql).toContain("timezone text not null default 'Europe/Bucharest'");
      expect(sql).toContain("locale text not null default 'ro'");
      expect(sql).toContain("push_token text");
      expect(sql).toContain("streak_freezes_available int not null default 1");
      expect(sql).toContain("longest_streak int not null default 0");
    });

    it("defines public.push_tokens table for secure multi-device token storage", () => {
      expect(sql).toMatch(/create table if not exists public\.push_tokens/i);
      expect(sql).toContain("user_id uuid references public.profiles(id)");
      expect(sql).toContain("token text unique not null");
      expect(sql).toContain("platform text not null");
    });

    it("defines public.covenants table with mutual accountability attributes", () => {
      expect(sql).toMatch(/create table if not exists public\.covenants/i);
      expect(sql).toContain("user_1_id uuid references public.profiles(id)");
      expect(sql).toContain("user_2_id uuid references public.profiles(id)");
      expect(sql).toContain("shared_streak int not null default 0");
      expect(sql).toContain("freeze_reserves int not null default 1");
      expect(sql).toContain("check_distinct_partners check (user_1_id <> user_2_id)");
    });

    it("defines public.covenant_daily_reviews table with unique constraint", () => {
      expect(sql).toMatch(/create table if not exists public\.covenant_daily_reviews/i);
      expect(sql).toContain("covenant_id uuid references public.covenants(id)");
      expect(sql).toContain("user_id uuid references public.profiles(id)");
      expect(sql).toContain("review_date date not null");
      expect(sql).toContain("unique_covenant_user_date unique(covenant_id, user_id, review_date)");
    });

    it("defines public.notification_logs table for rescue nudge deduplication", () => {
      expect(sql).toMatch(/create table if not exists public\.notification_logs/i);
      expect(sql).toContain("notification_type text not null");
      expect(sql).toContain("rescue_nudge_10pm");
      expect(sql).toContain("self_reminder_10pm");
      expect(sql).toContain("streak_saved_freeze");
      expect(sql).toContain("unique_notification_record unique(covenant_id, recipient_id, notification_type, target_date)");
    });
  });

  describe("Row-Level Security (RLS) Policies", () => {
    let sql: string;
    beforeAll(() => {
      sql = fs.readFileSync(migrationPath, "utf-8");
    });

    it("enables RLS on all core tables", () => {
      expect(sql).toContain("alter table public.profiles enable row level security;");
      expect(sql).toContain("alter table public.push_tokens enable row level security;");
      expect(sql).toContain("alter table public.covenants enable row level security;");
      expect(sql).toContain("alter table public.covenant_daily_reviews enable row level security;");
      expect(sql).toContain("alter table public.notification_logs enable row level security;");
    });

    it("enforces RLS policies for profiles, tokens, covenants, and reviews", () => {
      expect(sql).toContain('create policy "Public profiles are readable by authenticated users"');
      expect(sql).toContain('create policy "Users can update their own profile"');
      expect(sql).toContain('create policy "Users can view their own push tokens"');
      expect(sql).toContain('create policy "Users can view covenants they belong to"');
      expect(sql).toContain('create policy "Covenant partners can view mutual daily reviews"');
      expect(sql).toContain('create policy "Users can record their own daily review in covenant"');
    });
  });

  describe("Functions, Triggers, and Realtime Publications", () => {
    let sql: string;
    beforeAll(() => {
      sql = fs.readFileSync(migrationPath, "utf-8");
    });

    it("defines handle_new_user trigger and push_token synchronizer", () => {
      expect(sql).toContain("create or replace function public.handle_new_user()");
      expect(sql).toContain("create or replace function public.sync_push_token_to_profile()");
    });

    it("defines atomic stored procedures for review completion and token registration", () => {
      expect(sql).toContain("create or replace function public.register_device_token");
      expect(sql).toContain("create or replace function public.complete_daily_review");
      expect(sql).toContain("create or replace function public.join_covenant_by_code");
    });

    it("adds tables to supabase_realtime publication", () => {
      expect(sql).toContain("alter publication supabase_realtime add table public.covenants;");
      expect(sql).toContain("alter publication supabase_realtime add table public.covenant_daily_reviews;");
    });

    it("includes pg_cron schedule configuration", () => {
      expect(sql).toContain("cron.schedule");
      expect(sql).toContain("inscribe-hourly-nudges-and-streaks");
      expect(sql).toContain("0 * * * *");
    });
  });
});
