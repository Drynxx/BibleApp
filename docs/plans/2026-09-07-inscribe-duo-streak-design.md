# Inscribe: Bilingual Scripture Memory with Mutual Fate Duo Streak — Design Spec

## Summary
Inscribe (InScribe) is a production-grade, bilingual (English & Romanian) mobile scripture memorization app for iOS and Android built on React Native (Expo SDK 52+) and Supabase. The core product combines a high-retention 60-second interactive active-recall drill (Wordle-style progressive blanking with tactile haptics) with a viral "Mutual Fate Duo Streak" game loop where two accountability partners share a single streak that resets if either fails before midnight.

## Context
Traditional Bible memory apps suffer from steep drop-off rates due to passive reading mechanics, solitary accountability, and heavy cognitive friction. Inscribe solves this by grounding daily habits in relational accountability (Proverbs 3:3, Psalm 119:11).
Target users require:
- Offline-first capabilities for reading and drilling in church, planes, or subway commutes.
- Full diacritic support for Romanian (Versiunea Dumitru Cornilescu - VDC: *ă, î, ș, ț, â*) and English (World English Bible - WEB / KJV).
- Time-zone-aware automated nudges at 10:00 PM and midnight streak evaluations across partners living in different timezones (e.g. Romania UTC+2 vs. US EST UTC-5).

---

## Design

### Architecture

```
                                  +------------------------------------+
                                  |            EXPO CLIENT             |
                                  | (React Native, NativeWind, Reanimated)|
                                  +-----------------+------------------+
                                                    |
                         +--------------------------+--------------------------+
                         |                                                     |
                         v                                                     v
          +--------------+-------------+                         +-------------+--------------+
          |   Local SQLite & Sync Engine|                         |   Interactive Game Engine    |
          |  (Expo SQLite + TanStack)  |                         |  (Progressive Blanking, SRS)|
          +--------------+-------------+                         +-------------+--------------+
                         |                                                     |
                         | Realtime / HTTPS (JWT)                              | Haptics & Audio
                         v                                                     v
          +--------------+-----------------------------------------------------+--------------+
          |                                  SUPABASE BACKEND                                 |
          |                                                                                   |
          |  +------------------------+  +------------------------+  +---------------------+  |
          |  | PostgreSQL + RLS       |  | Supabase Realtime      |  | Edge Functions      |  |
          |  | - users & partnerships |  | - Instant streak sync  |  | - timezone nudges   |  |
          |  | - daily_partner_logs   |  | - live partner drills  |  | - streak evaluator |  |
          |  +------------------------+  +------------------------+  +----------+----------+  |
          +---------------------------------------------------------------------|-------------+
                                                                                |
                                                                                v
                                                                 +--------------+-------------+
                                                                 | Push Notification Services |
                                                                 | (Expo Push / APNs / FCM)   |
                                                                 +----------------------------+
```

### Components & File Hierarchy

| Component / File Path | Responsibility | Dependencies |
| :--- | :--- | :--- |
| `src/engine/blanking.ts` | Word-level parsing, punctuation preservation, Romanian diacritic normalization, 4-stage blanking | Pure TypeScript |
| `src/engine/srs.ts` | SuperMemo SM-2 interval scheduling for solo review queues | Pure TypeScript |
| `src/engine/timezone.ts` | Dual-user timezone calculation, 10 PM warning window, and partner cutoff detection | `date-fns-tz` |
| `src/components/drill/DrillContainer.tsx` | 60-second micro-session controller, timer, progress bar, haptic triggers | `react-native-reanimated`, `expo-haptics` |
| `src/components/drill/WordCanvas.tsx` | Interactive verse display rendering revealed words, blank tiles, and word-bank pickers | `react-native` |
| `src/components/drill/KeyboardPicker.tsx` | Tactile bottom tile tray for tapped active recall | `react-native-reanimated` |
| `src/components/streak/DuoFlame.tsx` | Dynamic animated flame badge showing streak count, status (`COMPLETED_BOTH`, `WAITING`, `AT_RISK`) | `lottie-react-native` / Reanimated |
| `src/components/streak/RescueBanner.tsx` | One-tap nudge button triggering in-app push and WhatsApp / iMessage invite | `expo-linking`, `expo-sharing` |
| `src/services/db/schema.ts` | Expo SQLite local tables for verses, translation indexes, offline drill logs | `expo-sqlite` |
| `src/services/sync/syncQueue.ts` | Mutation queue that batches offline completed drills and syncs to Supabase on reconnect | `expo-network`, TanStack Query |
| `src/services/supabase/client.ts` | Authenticated Supabase client and realtime channel subscriptions | `@supabase/supabase-js` |
| `supabase/functions/send-nudge/index.ts` | Edge Function dispatching automated/manual high-priority push notifications | Deno, Expo Push API |
| `supabase/functions/evaluate-streaks/index.ts` | Hourly cron worker evaluating midnight cutoffs across partner timezones | Deno, PostgreSQL RPC |
| `supabase/migrations/20260907_init.sql` | Postgres DDL, Row Level Security policies, indexes, and automated triggers | PostgreSQL 15 |

---

### Core Game Loop & Algorithmic Design

#### 1. Progressive Blanking & Active Recall Algorithm
The drill splits the target verse into linguistic tokens while preserving diacritics and punctuation. Users advance through 4 stages:
1. **Stage 1 (Familiarization - 10s):** Full verse rendered with key theological nouns and verbs highlighted.
2. **Stage 2 (Partial Masking - 20s):** ~30% of content words masked. User taps scrambled word tiles from a bottom bank or types first letters.
3. **Stage 3 (Advanced Recall - 20s):** ~70% of words masked. User fills in blanks sequentially.
4. **Stage 4 (Mastery - 10s):** 100% canvas blanked with only first-letter hints and punctuation markers.

```typescript
// src/engine/blanking.ts

export interface VerseToken {
  id: string;
  raw: string;           // e.g. "Cuvântul"
  clean: string;         // e.g. "cuvantul" (diacritic-normalized for matching)
  display: string;       // e.g. "Cuvântul"
  isPunctuation: boolean;
  isKeyword: boolean;
}

export type BlankingStage = 1 | 2 | 3 | 4;

export function normalizeDiacritics(text: string): string {
  // Normalize Romanian diacritics: ă/â -> a, î -> i, ș -> s, ț -> t
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function tokenizeVerse(verseText: string): VerseToken[] {
  // Regex splits words and keeps punctuation attached or separated
  const tokenRegex = /([a-zA-ZăîșțâĂÎȘȚÂ]+)|([^\s\w]+)/g;
  const tokens: VerseToken[] = [];
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = tokenRegex.exec(verseText)) !== null) {
    const raw = match[0];
    const isPunctuation = !/^[a-zA-ZăîșțâĂÎȘȚÂ]+$/.test(raw);
    tokens.push({
      id: `tok-${index++}`,
      raw,
      clean: normalizeDiacritics(raw),
      display: raw,
      isPunctuation,
      isKeyword: raw.length > 4 && !isPunctuation,
    });
  }
  return tokens;
}

export function generateMaskedTokens(
  tokens: VerseToken[],
  stage: BlankingStage
): { maskedTokens: (VerseToken & { isMasked: boolean })[]; wordBank: string[] } {
  let maskRatio = 0;
  if (stage === 2) maskRatio = 0.3;
  if (stage === 3) maskRatio = 0.7;
  if (stage === 4) maskRatio = 1.0;

  const eligibleIndices = tokens
    .map((t, idx) => (!t.isPunctuation ? idx : -1))
    .filter((idx) => idx !== -1);

  const numToMask = Math.floor(eligibleIndices.length * maskRatio);
  
  // Deterministic or pseudo-random mask selection based on verse length
  const shuffled = [...eligibleIndices].sort(() => 0.5 - Math.random());
  const maskedIndices = new Set(shuffled.slice(0, numToMask));

  const bank: string[] = [];
  const maskedTokens = tokens.map((token, idx) => {
    const isMasked = maskedIndices.has(idx);
    if (isMasked) {
      bank.push(token.raw);
    }
    return { ...token, isMasked };
  });

  return {
    maskedTokens,
    wordBank: bank.sort(() => 0.5 - Math.random()),
  };
}
```

#### 2. Duo Streak State Machine & Timezone Normalization
When Partner A is in Bucharest (`Europe/Bucharest` - UTC+2 / UTC+3 DST) and Partner B is in New York (`America/New_York` - UTC-5 / UTC-4 DST):
- **Mutual Grace Cutoff Rule:** A calendar day's streak is evaluated against **the later partner's midnight**.
  - Example: For day $D$, Partner A's midnight arrives 7 hours before Partner B's. To prevent unfair penalization of the partner in the earlier timezone, the daily log for Day $D$ remains open until 23:59:59 of whichever partner has the latest local midnight.
- **10:00 PM Warning Trigger:** Triggered in each partner's **individual** local timezone.
  - At 22:00:00 local time of Partner A, if Partner A has completed but Partner B has not, Partner A receives a "Rescue Alert" to nudge Partner B.
  - If Partner B's local time is already past 22:00:00 and Partner B has not completed, Partner B receives an urgent self-reminder.

```
                  +----------------------------------------+
                  |         WAITING_FOR_BOTH               |
                  | Both partners pending for current day  |
                  +-------------------+--------------------+
                                      |
                 User 1 finishes drill| User 2 finishes drill
                                      v
                  +----------------------------------------+
                  |       WAITING_FOR_PARTNER              |
                  | One partner done; waiting for other    |
                  +-------------------+--------------------+
                                      |
                      Local time >= 22:00 (10:00 PM)
                                      v
                  +----------------------------------------+
                  |                AT_RISK                 |
                  | Push rescue alert sent to completed user|
                  +-------------------+--------------------+
                                      |
            +-------------------------+-------------------------+
            | Both complete before cut| Cutoff reached with miss|
            v                         v                         v
+-----------------------+ +-----------------------+ +-----------------------+
|    COMPLETED_BOTH     | |    SAVED_BY_FREEZE    | |        BROKEN         |
| Streak increments +1  | | Freeze auto-applied;  | | Streak resets to 0;   |
| Flame badge shines    | | Freeze count decrements| Partner notified       |
+-----------------------+ +-----------------------+ +-----------------------+
```

---

### Data Model (Supabase / PostgreSQL)

```sql
-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. Users Table
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  avatar_url text,
  locale text not null default 'ro' check (locale in ('ro', 'en')),
  timezone text not null default 'Europe/Bucharest',
  push_token text,
  streak_freezes_available int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Partnerships (Shared Duo Streaks)
create table public.partnerships (
  id uuid primary key default uuid_generate_v4(),
  user_id_1 uuid not null references public.users(id) on delete cascade,
  user_id_2 uuid references public.users(id) on delete cascade,
  invite_code text unique not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'paused', 'dissolved')),
  shared_streak_count int not null default 0,
  longest_streak int not null default 0,
  last_streak_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint different_users check (user_id_1 != user_id_2)
);

create index idx_partnerships_users on public.partnerships(user_id_1, user_id_2);

-- 3. Verses Catalog
create table public.verses (
  id uuid primary key default uuid_generate_v4(),
  book text not null,               -- e.g. "Proverbe" / "Proverbs"
  chapter int not null,
  verse_number int not null,
  translation text not null check (translation in ('VDC', 'WEB', 'KJV')),
  text text not null,
  theme text not null,              -- e.g. "Pace", "Credinta", "Intelepciune"
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  created_at timestamptz not null default now()
);

create unique index idx_verse_ref on public.verses(book, chapter, verse_number, translation);

-- 4. User Verse Progress (Individual Spaced Repetition)
create table public.user_verse_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  verse_id uuid not null references public.verses(id) on delete cascade,
  mastery_level int not null default 1 check (mastery_level between 1 and 5),
  ease_factor float not null default 2.5,
  interval_days int not null default 1,
  repetitions int not null default 0,
  next_review_due date not null default current_date,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint unique_user_verse unique (user_id, verse_id)
);

create index idx_user_verse_due on public.user_verse_progress(user_id, next_review_due);

-- 5. Daily Partner Logs (Mutual Fate Verification)
create table public.daily_partner_logs (
  id uuid primary key default uuid_generate_v4(),
  partnership_id uuid not null references public.partnerships(id) on delete cascade,
  log_date date not null,
  user_1_completed boolean not null default false,
  user_1_completed_at timestamptz,
  user_2_completed boolean not null default false,
  user_2_completed_at timestamptz,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed_both', 'saved_by_freeze', 'broken')),
  created_at timestamptz not null default now(),
  constraint unique_partnership_day unique (partnership_id, log_date)
);

create index idx_daily_partner_date on public.daily_partner_logs(partnership_id, log_date);

-- 6. Nudges
create table public.nudges (
  id uuid primary key default uuid_generate_v4(),
  partnership_id uuid not null references public.partnerships(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  nudge_type text not null default 'manual' check (nudge_type in ('manual', 'auto_10pm', 'streak_freeze_alert')),
  verse_reference text,
  sent_at timestamptz not null default now()
);

-- Row Level Security (RLS) Policies
alter table public.users enable row level security;
alter table public.partnerships enable row level security;
alter table public.verses enable row level security;
alter table public.user_verse_progress enable row level security;
alter table public.daily_partner_logs enable row level security;
alter table public.nudges enable row level security;

-- Users: Read all public profiles, edit self
create policy "Users can read all profiles" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- Partnerships: Partners can read and update their own partnership
create policy "Partners can read shared partnership" on public.partnerships
  for select using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

create policy "Partners can update shared partnership" on public.partnerships
  for update using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

-- Verses: Read-only for authenticated users
create policy "Authenticated users read verses" on public.verses for select to authenticated using (true);

-- User Progress: Strictly private to user
create policy "Users manage own verse progress" on public.user_verse_progress
  for all using (auth.uid() = user_id);

-- Daily Logs: Visible to both partners
create policy "Partners read daily logs" on public.daily_partner_logs
  for select using (
    exists (
      select 1 from public.partnerships p
      where p.id = daily_partner_logs.partnership_id
      and (p.user_id_1 = auth.uid() or p.user_id_2 = auth.uid())
    )
  );
```

---

### Interfaces & API Surface

#### 1. RPC: Atomic Daily Drill Completion
```sql
create or replace function public.complete_daily_drill(
  p_verse_id uuid,
  p_score int,              -- 1 to 5 SM-2 rating
  p_duration_seconds int
)
returns json
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_partnership record;
  v_log record;
  v_today date := current_date;
  v_both_done boolean := false;
  v_new_streak int;
begin
  -- 1. Update personal verse SM-2 progress
  update public.user_verse_progress
  set
    repetitions = repetitions + 1,
    ease_factor = greatest(1.3, ease_factor + (0.1 - (5 - p_score) * (0.08 + (5 - p_score) * 0.02))),
    interval_days = case when repetitions = 0 then 1 when repetitions = 1 then 6 else round(interval_days * ease_factor) end,
    next_review_due = current_date + (case when repetitions = 0 then 1 when repetitions = 1 then 6 else round(interval_days * ease_factor) end)::int,
    last_reviewed_at = now()
  where user_id = v_user_id and verse_id = p_verse_id;

  -- 2. Find active partnership
  select * into v_partnership
  from public.partnerships
  where (user_id_1 = v_user_id or user_id_2 = v_user_id)
    and status = 'active'
  limit 1;

  if found then
    -- Lock or create today's daily log
    insert into public.daily_partner_logs (partnership_id, log_date, user_1_completed, user_2_completed)
    values (
      v_partnership.id,
      v_today,
      case when v_partnership.user_id_1 = v_user_id then true else false end,
      case when v_partnership.user_id_2 = v_user_id then true else false end
    )
    on conflict (partnership_id, log_date) do update
    set
      user_1_completed = case when v_partnership.user_id_1 = v_user_id then true else daily_partner_logs.user_1_completed end,
      user_1_completed_at = case when v_partnership.user_id_1 = v_user_id then now() else daily_partner_logs.user_1_completed_at end,
      user_2_completed = case when v_partnership.user_id_2 = v_user_id then true else daily_partner_logs.user_2_completed end,
      user_2_completed_at = case when v_partnership.user_id_2 = v_user_id then now() else daily_partner_logs.user_2_completed_at end
    returning * into v_log;

    -- Check if both completed
    if v_log.user_1_completed and v_log.user_2_completed and v_log.status != 'completed_both' then
      v_both_done := true;
      v_new_streak := v_partnership.shared_streak_count + 1;
      
      update public.daily_partner_logs
      set status = 'completed_both'
      where id = v_log.id;

      update public.partnerships
      set
        shared_streak_count = v_new_streak,
        longest_streak = greatest(longest_streak, v_new_streak),
        last_streak_date = v_today,
        updated_at = now()
      where id = v_partnership.id;
    end if;
  end if;

  return json_build_object(
    'success', true,
    'both_completed', v_both_done,
    'current_streak', coalesce(v_new_streak, v_partnership.shared_streak_count)
  );
end;
$$;
```

#### 2. Edge Function: 10:00 PM Rescue Nudge & Midnight Reset
```typescript
// supabase/functions/evaluate-streaks/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  // Executed hourly by pg_cron
  const now = new Date();

  // 1. Fetch all active partnerships with user timezones
  const { data: partnerships } = await supabase
    .from("partnerships")
    .select(`
      id, shared_streak_count,
      user_1:user_id_1(id, full_name, timezone, push_token, streak_freezes_available),
      user_2:user_id_2(id, full_name, timezone, push_token, streak_freezes_available)
    `)
    .eq("status", "active");

  for (const p of partnerships || []) {
    // Determine local hour for each user
    const u1Hour = getLocalHour(p.user_1.timezone);
    const u2Hour = getLocalHour(p.user_2.timezone);

    // Fetch today's log
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: log } = await supabase
      .from("daily_partner_logs")
      .select("*")
      .eq("partnership_id", p.id)
      .eq("log_date", todayStr)
      .maybeSingle();

    const u1Done = log?.user_1_completed ?? false;
    const u2Done = log?.user_2_completed ?? false;

    // A. 10:00 PM Nudge Loop (Check if someone is at risk)
    if (u1Hour === 22 && u1Done && !u2Done) {
      await sendPush(p.user_1.push_token, {
        title: "🔥 Streak at Risk!",
        body: `${p.user_2.full_name} hasn't inscribed today's verse yet. Send them a nudge to protect your ${p.shared_streak_count}-day streak!`,
        data: { screen: "PartnerNudge", partnerId: p.user_2.id },
      });
    }

    if (u2Hour === 22 && u2Done && !u1Done) {
      await sendPush(p.user_2.push_token, {
        title: "🔥 Streak at Risk!",
        body: `${p.user_1.full_name} hasn't inscribed today's verse yet. Tap to nudge!`,
        data: { screen: "PartnerNudge", partnerId: p.user_1.id },
      });
    }

    // B. Midnight Cutoff & Freeze Handler
    // Only evaluate cutoff when the later partner's day ends (hour === 0)
    const isCutoffHour = Math.max(u1Hour, u2Hour) === 0;
    if (isCutoffHour && (!u1Done || !u2Done)) {
      if (p.user_1.streak_freezes_available > 0 || p.user_2.streak_freezes_available > 0) {
        // Apply Freeze
        await supabase.from("daily_partner_logs").upsert({
          partnership_id: p.id,
          log_date: todayStr,
          status: "saved_by_freeze",
        });
        // Decrement freeze
        const freezeUser = p.user_1.streak_freezes_available > 0 ? p.user_1 : p.user_2;
        await supabase
          .from("users")
          .update({ streak_freezes_available: freezeUser.streak_freezes_available - 1 })
          .eq("id", freezeUser.id);
      } else {
        // Reset streak to 0
        await supabase
          .from("partnerships")
          .update({ shared_streak_count: 0 })
          .eq("id", p.id);

        await supabase.from("daily_partner_logs").upsert({
          partnership_id: p.id,
          log_date: todayStr,
          status: "broken",
        });
      }
    }
  }

  return new Response(JSON.stringify({ status: "ok" }), { headers: { "Content-Type": "application/json" } });
});

function getLocalHour(timezone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone });
  return parseInt(formatter.format(new Date()), 10);
}

async function sendPush(token: string | null, payload: any) {
  if (!token) return;
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: token, sound: "default", ...payload }),
  });
}
```

---

### Data Flow

```
1. SOLO 60s DRILL FLOW
User selects verse -> Local SQLite loads tokens -> WordCanvas renders Stage 1 (Full)
  -> 10s Timer advances to Stage 2 (30% blank) -> User taps tiles in KeyboardPicker
  -> Haptic light impact on correct word / error vibration on miss
  -> Advances to Stage 3 (70%) & Stage 4 (Mastery)
  -> Drill complete: mutation enqueued in local SQLite & dispatched to complete_daily_drill RPC.

2. REALTIME DUO SYNC FLOW
Partner A finishes drill -> Supabase daily_partner_logs updated
  -> Supabase Realtime emits event to channel `partnership:<id>`
  -> Partner B's device receives event in background/foreground
  -> Partner B's DuoFlame updates: "Andrei finished! Your turn to save the streak."

3. 10:00 PM VIRAL RESCUE FLOW
Hourly cron worker detects 22:00 in Partner A's timezone -> Partner B is incomplete
  -> High-priority push sent to Partner A
  -> Partner A taps notification -> RescueBanner opens
  -> Partner A taps "Nudge via WhatsApp"
  -> Expo Linking opens WhatsApp with pre-filled localized message & deep-link:
     "Hei Andrei! Mai avem 2 ore să salvăm streak-ul nostru de 18 zile în Inscribe: https://inscribe.app/drill"
```

---

### Scripture Ingestion & 30-Verse Starter Catalog

#### Scripture Data Format (`verses.json`)
```json
[
  {
    "book": "Proverbe",
    "chapter": 3,
    "verse_number": 3,
    "translation": "VDC",
    "text": "Să nu te părăsească bunătatea și credincioșia: leagă-le la gât, scrie-le pe tăblița inimii tale!",
    "theme": "Înțelepciune",
    "difficulty": "medium"
  },
  {
    "book": "Proverbs",
    "chapter": 3,
    "verse_number": 3,
    "translation": "WEB",
    "text": "Don't let kindness and truth forsake you. Bind them around your neck. Write them on the tablet of your heart.",
    "theme": "Wisdom",
    "difficulty": "medium"
  }
]
```

#### Curated 30-Verse Starter Track (Bilingual)

| # | Theme (RO / EN) | Reference | Romanian (VDC) Key Excerpt | English (WEB) Key Excerpt |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Fundament / Anchor | Prov 3:3 | *...scrie-le pe tăblița inimii tale!* | *...Write them on the tablet of your heart.* |
| 2 | Fundament / Anchor | Ps 119:11 | *Strâng Cuvântul Tău în inima mea...* | *I have hidden your word in my heart...* |
| 3 | Pace / Peace | Filipeni 4:6-7 | *Nu vă îngrijorați de nimic...* | *In nothing be anxious...* |
| 4 | Pace / Peace | Ioan 14:27 | *Vă las pacea, vă dau pacea Mea.* | *Peace I leave with you. My peace I give to you.* |
| 5 | Pace / Peace | Isaia 26:3 | *Celui cu inima tare, Tu-i chezășuiești pacea...* | *You will keep him in perfect peace...* |
| 6 | Pace / Peace | Matei 11:28 | *Veniți la Mine, toți cei trudiți și împovărați...* | *Come to me, all you who labor and are heavy laden...* |
| 7 | Pace / Peace | Ps 23:1 | *Domnul este Păstorul meu: nu voi duce lipsă de nimic.* | *Yahweh is my shepherd: I shall lack nothing.* |
| 8 | Credință / Faith | Evrei 11:1 | *Și credința este o încredere neclintită...* | *Now faith is assurance of things hoped for...* |
| 9 | Credință / Faith | Romani 8:28 | *De altă parte, știm că toate lucrurile lucrează...* | *We know that all things work together for good...* |
| 10 | Credință / Faith | 2 Corinteni 5:7 | *...pentru că umblăm prin credință, nu prin vedere.* | *...for we walk by faith, not by sight.* |
| 11 | Credință / Faith | Marcu 9:23 | *Toate lucrurile sunt cu putință celui ce crede!* | *All things are possible to him who believes.* |
| 12 | Credință / Faith | Prov 3:5-6 | *Încrede-te în Domnul din toată inima ta...* | *Trust in Yahweh with all your heart...* |
| 13 | Curăție / Purity | Ps 119:9 | *Cum își va ține tânărul curată cărarea?* | *How can a young man keep his way pure?* |
| 14 | Curăție / Purity | 1 Corinteni 6:19-20 | *...trupul vostru este Templul Duhului Sfânt...* | *...your body is a temple of the Holy Spirit...* |
| 15 | Curăție / Purity | Filipeni 4:8 | *...tot ce este adevărat, tot ce este vrednic de cinste...* | *...whatever things are true, whatever things are honorable...* |
| 16 | Curăție / Purity | Ps 51:10 | *Zidește în mine o inimă curată, Dumnezeule...* | *Create in me a clean heart, O God...* |
| 17 | Curăție / Purity | Matei 5:8 | *Ferice de cei cu inima curată, căci ei vor vedea pe Dumnezeu!* | *Blessed are the pure in heart, for they shall see God.* |
| 18 | Înțelepciune / Wisdom | Iacov 1:5 | *Dacă vreunuia dintre voi îi lipsește înțelepciunea...* | *If any of you lacks wisdom, let him ask of God...* |
| 19 | Înțelepciune / Wisdom | Prov 9:10 | *Începutul înțelepciunii este frica de Domnul...* | *The fear of Yahweh is the beginning of wisdom...* |
| 20 | Înțelepciune / Wisdom | Ps 90:12 | *Învață-ne să ne numărăm bine zilele...* | *So teach us to count our days...* |
| 21 | Înțelepciune / Wisdom | Coloseni 3:16 | *Cuvântul lui Hristos să locuiască din belșug în voi...* | *Let the word of Christ dwell in you richly...* |
| 22 | Înțelepciune / Wisdom | Iacov 3:17 | *Înțelepciunea care vine de sus este mai întâi curată...* | *Wisdom that is from above is first pure...* |
| 23 | Căsătorie / Marriage | Efeseni 4:32 | *Dimpotrivă, fiți buni unii cu alții, miloși...* | *Be kind to one another, tenderhearted...* |
| 24 | Căsătorie / Marriage | 1 Corinteni 13:4 | *Dragostea este îndelung răbdătoare, este plină de bunătate...* | *Love is patient and is kind; love doesn't envy...* |
| 25 | Căsătorie / Marriage | Coloseni 3:14 | *Dar mai presus de toate acestea, îmbrăcați-vă cu dragostea...* | *Above all these things, walk in love...* |
| 26 | Căsătorie / Marriage | Eclesiastul 4:9-10 | *Mai bine doi decât unul... dacă se întâmplă să cadă...* | *Two are better than one... For if they fall...* |
| 27 | Laudă / Praise | Ps 103:1 | *Binecuvântează, suflete, pe Domnul, și tot ce este în mine...* | *Praise Yahweh, my soul! All that is within me...* |
| 28 | Laudă / Praise | 1 Tesaloniceni 5:16-18 | *Bucurați-vă întotdeauna. Rugați-vă neîncetat.* | *Rejoice always. Pray without ceasing.* |
| 29 | Laudă / Praise | Ps 100:4 | *Intrați cu laude pe porțile Lui...* | *Enter into his gates with thanksgiving...* |
| 30 | Biruință / Victory | Romani 8:37 | *Totuși, în toate aceste lucruri, noi suntem mai mult decât biruitori...* | *No, in all these things, we are more than conquerors...* |

---

### Offline-First & Sync Strategy

1. **Local SQLite Store (`expo-sqlite/next`):**
   - Stores pre-seeded `verses` table (instant full-text search without internet).
   - Stores `offline_queue` table holding completed drill mutations:
     `{ id, verse_id, score, completed_at, synced: 0 }`.
2. **Sync Queue Engine:**
   - Listens to network connectivity events via `expo-network`.
   - On connection restoration: flushes pending records in FIFO order via `complete_daily_drill` RPC.
   - Idempotency key `(user_id, verse_id, log_date)` prevents duplicate streak increments.

---

### Error Handling & Edge Cases

| Failure Mode | Root Cause | Mitigation Strategy |
| :--- | :--- | :--- |
| **Offline Drill at 23:55** | User drills offline just before midnight; syncs at 08:00 AM next morning | Client signs payload with local device timestamp `completed_at`. Server RPC grants grace if `completed_at` was before partner cutoff. |
| **Partner Drops Out / Inactive** | One partner abandons the app, freezing the other partner's streak | Option to "Pause Partnership" or "Switch to Solo Mode" preserving personal verse retention history while archiving the shared streak. |
| **Push Token Invalidated** | User reinstalls app or disables notifications | Client updates `push_token` in `users` table on every cold app start via `Notifications.getExpoPushTokenAsync()`. |
| **Diacritic Input Mismatch** | User types `a` instead of `ă` or `s` instead of `ș` on standard keyboard | `normalizeDiacritics()` strips accents for matching validation; UI displays correct grammatical Romanian form. |
| **Timezone Boundary Skew** | Partner crosses international dateline (e.g. flight) | Timezone updated in user profile upon each app foreground event; server recalculates cutoffs dynamically. |

---

### Testing Strategy

- **Unit Tests (Jest):**
  - Blanking algorithm: 100% test coverage on `tokenizeVerse()` and `generateMaskedTokens()` verifying diacritic preservation and stage token distributions.
  - Timezone calculations: Tests covering multi-timezone edge cases (Bucharest + New York, London + Tokyo).
  - SM-2 algorithm calculations: Ease factor bounds and repetition scheduling.
- **Integration Tests (Supabase Local Dev / pgTAP):**
  - Verification of `complete_daily_drill` RPC under concurrency (two partners finishing at the exact same second).
  - RLS policy test matrix verifying partner isolation.
- **E2E Tests (Maestro / Detox):**
  - Full flow: Onboarding -> Auth -> 60s interactive drill -> Tap word tiles -> Haptic feedback trigger -> Home dashboard streak count verification.

---

### Phased Implementation Roadmap

```
Phase 1: Core 60s Drill (Solo Experience) [Weeks 1-2]
├── Scaffold Expo SDK 52 project with NativeWind & TypeScript
├── Bundle SQLite seed database with 30 starter verses (RO & EN)
├── Build interactive WordCanvas & KeyboardPicker with Reanimated 3
└── Implement Expo Haptics and local SM-2 queue

Phase 2: The Duo Engine (Partnerships & Realtime) [Weeks 3-4]
├── Supabase Auth integration (Apple, Google, Email)
├── Implement invite code generator and deep-linking (inscribe://invite/:code)
├── Supabase Realtime channel setup for instant dual-screen streak sync
└── Build DuoFlame animated status component

Phase 3: The Nudge & Cron System [Weeks 5-6]
├── Set up Expo Push Notifications token lifecycle
├── Implement Supabase Edge Function: 10:00 PM Timezone Rescue Nudge
├── Implement Supabase pg_cron hourly streak evaluator & freeze deductions
└── WhatsApp / iMessage 1-tap share intent integration

Phase 4: Onboarding, Polish & Launch Readiness [Weeks 7-8]
├── Refine Material 3 / iOS design language, typography scales, and dark theme
├── Ambient audio soundscapes and sound effects on drill completion
├── App Store & Google Play metadata, screenshots, and privacy policy
└── EAS Build configuration for Android App Bundle (.aab) and iOS IPA
```

---

## Decision Log

| Decision | Options Considered | Chosen | Rationale |
| :--- | :--- | :--- | :--- |
| **Mobile Tech Stack** | Flutter, React Native (CLI), Expo React Native | **Expo (SDK 52+)** | Fastest cross-platform development, seamless EAS Google Play/App Store build pipeline, native Reanimated 3 & Haptics support. |
| **Backend & Sync** | Firebase, Custom Node.js, Supabase | **Supabase** | Built-in PostgreSQL, Row Level Security, Edge Functions for cron execution, and Realtime engine for instant duo synchronization. |
| **Offline Storage** | WatermelonDB, AsyncStorage, Expo SQLite (next) | **Expo SQLite (next)** | Zero complex native build configuration in Expo, robust relational querying for full-text Bible search, fast local performance. |
| **Streak Freeze Policy** | Strict zero-tolerance, 1 freeze per 14 days | **1 Freeze per 14 days** | Prevents total motivation collapse from genuine emergencies while preserving mutual accountability pressure. |
| **Onboarding Sequence** | Guest-first drill, Auth-first | **Auth-first** | Essential for reliable partner pairing, push notification token attribution, and multi-device cloud sync from day one. |
| **Romanian Scripture** | Modern copyright translations, VDC | **VDC (Dumitru Cornilescu)** | Gold-standard beloved translation among Romanian evangelical believers, completely in the public domain. |
