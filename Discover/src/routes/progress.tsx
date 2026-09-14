import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flame,
  Leaf,
  Moon,
  MoreVertical,
} from "lucide-react";
import { useState } from "react";

import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Verse Bible Memorization" },
      { name: "description", content: "Track your practice days, achievements, streak, and recently mastered Bible verses." },
      { property: "og:title", content: "Progress — Verse Bible Memorization" },
      {
        property: "og:description",
        content: "Track your practice days, achievements, streak, and recently mastered Bible verses.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Progress,
});

const months = ["October 2024", "November 2024", "December 2024"];
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const activity = [
  0, 1, 1, 1, 1, 1, 0,
  1, 1, 1, 0, 0, 1, 1,
  1, 1, 1, 1, 1, 1, 1,
  1, 0, 0, 1, 1, 0, 0,
  0, 0, 1, 0, 0, 1, 0,
];

const achievements = [
  { label: "7-Day Streak", Icon: Flame, tile: "bg-primary/10", medallion: "bg-primary/15", icon: "text-primary fill-primary/80" },
  { label: "First Book Complete", Icon: BookOpen, tile: "bg-gold/10", medallion: "bg-gold/20", icon: "text-gold fill-gold/55" },
  { label: "Night Owl", Icon: Moon, tile: "bg-sage/10", medallion: "bg-sage/25", icon: "text-foreground/70 fill-foreground/60" },
  { label: "Psalms Master", Icon: Crown, tile: "bg-gold/10", medallion: "bg-gold/20", icon: "text-gold fill-gold/35" },
];

const mastered = ["Philippians 4:13", "Psalm 23:1", "Jeremiah 29:11"];

function Progress() {
  const [monthIndex, setMonthIndex] = useState(1);
  const currentMonth = months[monthIndex] ?? "November 2024";

  return (
    <main className="min-h-screen pb-28 text-foreground sm:pb-10">
      <div className="mx-auto w-full max-w-3xl px-5 pt-5 sm:px-8 sm:pt-10">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <Leaf className="size-10 -rotate-12 shrink-0 text-gold" strokeWidth={1.7} aria-hidden="true" />
            <span className="min-w-0">
              <span className="block font-serif text-3xl font-semibold leading-none">Verse</span>
              <span className="mt-1.5 block truncate text-[10px] font-semibold uppercase tracking-[0.23em] text-primary">
                Small steps. Deeper faith.
              </span>
            </span>
          </Link>
          <Button variant="ghost" size="icon" aria-label="Open menu" className="size-11 rounded-full">
            <MoreVertical className="size-5" />
          </Button>
        </header>

        <section className="relative mt-9 min-h-40 overflow-hidden" aria-labelledby="progress-heading">
          <div className="relative z-10 max-w-[70%]">
            <h1 id="progress-heading" className="text-[3.75rem] font-semibold leading-[0.88] sm:text-7xl">47</h1>
            <p className="mt-2 text-[1.75rem] font-medium leading-tight sm:text-3xl">verses memorized</p>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              A brighter you, day by day.
            </p>
          </div>
          <div className="pointer-events-none absolute bottom-2 right-1 flex items-end gap-2 text-gold/45" aria-hidden="true">
            <Leaf className="size-28 rotate-[28deg]" strokeWidth={1.15} />
            <span className="mb-2 border-b border-gold/45 pb-3 text-[9px] font-semibold uppercase leading-[1.9] tracking-[0.28em] text-primary/75">
              Grow<br />in his<br />word
            </span>
          </div>
        </section>

        <section className="mt-3 rounded-[1.25rem] border border-border/65 bg-card/85 p-5 shadow-[0_8px_28px_color-mix(in_oklab,var(--foreground)_5%,transparent)] sm:p-7" aria-labelledby="practice-days-heading">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="practice-days-heading" className="text-xl font-semibold">Practice Days</h2>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">{currentMonth}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full"
                aria-label="Previous month"
                disabled={monthIndex === 0}
                onClick={() => setMonthIndex((value) => Math.max(0, value - 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-24 rounded-full bg-secondary/55 px-3 py-2 text-center text-xs font-medium">
                {currentMonth.replace("ember", "")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full"
                aria-label="Next month"
                disabled={monthIndex === months.length - 1}
                onClick={() => setMonthIndex((value) => Math.min(months.length - 1, value + 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_7.25rem] gap-5 sm:grid-cols-[minmax(0,1fr)_9rem]">
            <div className="min-w-0">
              <div className="grid grid-cols-7 gap-x-2 text-center text-[11px] font-medium sm:gap-x-4">
                {weekdays.map((day) => <span key={day}>{day}</span>)}
              </div>
              <div className="mt-4 grid grid-cols-7 gap-x-2 gap-y-3 sm:gap-x-4">
                {activity.map((active, index) => (
                  <span
                    key={index}
                    className={`mx-auto size-5 rounded-full sm:size-6 ${active ? "bg-primary/90" : "bg-secondary/65"}`}
                    aria-label={`${weekdays[index % 7]} week ${Math.floor(index / 7) + 1}: ${active ? "practiced" : "no practice"}`}
                  />
                ))}
              </div>
            </div>

            <div className="border-l border-border pl-5">
              <p className="text-3xl font-medium leading-none">18</p>
              <p className="mt-1 text-[9px] font-semibold uppercase leading-[1.55] tracking-[0.24em] text-primary">Days<br />this month</p>
              <span className="my-3 block h-px w-4 bg-gold" />
              <p className="text-3xl font-medium leading-none">5</p>
              <p className="mt-1 text-[9px] font-semibold uppercase leading-[1.55] tracking-[0.24em] text-primary">Day streak</p>
              <span className="my-3 block h-px w-4 bg-gold" />
              <p className="text-[8px] font-semibold uppercase leading-[1.65] tracking-[0.22em] text-primary/80">
                Consistency builds a brighter tomorrow
              </p>
            </div>
          </div>
        </section>

        <section className="mt-7" aria-labelledby="achievements-heading">
          <div className="flex items-center justify-between">
            <h2 id="achievements-heading" className="text-xl font-semibold">Achievements</h2>
            <Button variant="ghost" className="h-10 gap-1 px-1 text-primary hover:text-primary">
              See all <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2.5">
            {achievements.map(({ label, Icon, tile, medallion, icon }) => (
              <article key={label} className={`flex min-h-36 flex-col items-center rounded-xl border border-border/35 px-2 py-4 text-center ${tile}`}>
                <span className={`grid size-14 place-items-center rounded-full ${medallion}`}>
                  <Icon className={`size-8 ${icon}`} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <h3 className="mt-3 font-serif text-[0.95rem] leading-[1.15] sm:text-lg">{label}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-7" aria-labelledby="mastered-heading">
          <div className="flex items-center justify-between">
            <h2 id="mastered-heading" className="text-xl font-semibold">Recently Mastered</h2>
            <Button variant="ghost" className="h-10 gap-1 px-1 text-primary hover:text-primary">
              See all <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="mt-2 rounded-[1.25rem] border border-border/60 bg-card/85 px-5 py-1 shadow-[0_8px_28px_color-mix(in_oklab,var(--foreground)_4%,transparent)]">
            {mastered.map((verse, index) => (
              <Button
                key={verse}
                variant="ghost"
                className={`h-16 w-full justify-start rounded-none px-0 hover:bg-transparent ${index < mastered.length - 1 ? "border-b border-border/70" : ""}`}
                aria-label={`${verse}, mastered`}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sage/70 text-primary-foreground">
                  <Check className="size-5" strokeWidth={1.8} />
                </span>
                <span className="ml-4 min-w-0 truncate text-base font-medium sm:text-lg">{verse}</span>
                <span className="ml-2 shrink-0 text-sm font-normal text-primary">— mastered</span>
                <ChevronRight className="ml-auto size-5 shrink-0 text-muted-foreground" />
              </Button>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}