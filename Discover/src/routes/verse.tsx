import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Leaf, MoreVertical } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/verse")({
  head: () => ({
    meta: [
      { title: "John 3:16 — Verse Detail | Verse" },
      {
        name: "description",
        content: "Read John 3:16, track how much of it you have memorized, and keep practicing.",
      },
      { property: "og:title", content: "John 3:16 — Verse Detail | Verse" },
      {
        property: "og:description",
        content: "Read John 3:16, track how much of it you have memorized, and keep practicing.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerseDetail,
});

const PROGRESS = 60;
const R = 42;
const C = 2 * Math.PI * R;

function VerseDetail() {
  const router = useRouter();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(PROGRESS));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <main className="min-h-screen pb-12 text-foreground">
      <div className="mx-auto w-full max-w-2xl px-5 pt-4 sm:px-8 sm:pt-8">
        <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Go back"
            className="size-11 rounded-full"
            onClick={() => router.history.back()}
          >
            <ArrowLeft className="size-6" />
          </Button>
          <h1 className="truncate text-[1.25rem] font-medium tracking-tight">Verse Detail</h1>
          <Button variant="ghost" size="icon" aria-label="Open menu" className="size-11 rounded-full">
            <MoreVertical className="size-5" />
          </Button>
        </header>

        <div className="mt-8 flex items-center gap-4">
          <span className="rounded-md bg-gold px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground">
            John 3:16
          </span>
          <span className="h-7 w-px bg-border" aria-hidden="true" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">NIV</span>
        </div>

        <blockquote className="mt-7 font-serif text-[2rem] font-normal leading-[1.32] sm:text-[2.5rem]">
          For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish
          but have eternal life.
        </blockquote>

        <section
          className="mt-9 grid grid-cols-[auto_1px_minmax(0,1fr)] items-center gap-6 rounded-[1.35rem] border border-border/60 bg-card/90 p-6 shadow-[0_8px_28px_color-mix(in_oklab,var(--foreground)_5%,transparent)]"
          aria-label="Memorization progress"
        >
          <div className="relative size-24 shrink-0">
            <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
              <circle cx="50" cy="50" r={R} fill="none" stroke="var(--secondary)" strokeWidth="7" opacity="0.5" />
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C - (C * shown) / 100}
                className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-1000 motion-safe:ease-out"
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center text-xl font-semibold">{PROGRESS}%</span>
          </div>
          <span className="h-16 w-px bg-border" aria-hidden="true" />
          <div className="min-w-0">
            <p className="whitespace-nowrap text-lg font-semibold sm:text-xl">{PROGRESS}% memorized</p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.24em] text-gold">Keep going</p>
          </div>
        </section>

        <section
          className="relative mt-5 overflow-hidden rounded-[1.35rem] border border-border/50 bg-paper p-6 sm:p-7"
          aria-label="Reflection"
        >
          <div className="pointer-events-none absolute bottom-[-5.5rem] right-[-8%] h-40 w-[68%] rotate-[-4deg] rounded-[50%] bg-secondary/50" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-[-5rem] right-[24%] h-32 w-[46%] rotate-[6deg] rounded-[50%] bg-card/40" aria-hidden="true" />
          <div className="pointer-events-none absolute right-10 top-5 size-11 rounded-full bg-gold/25" aria-hidden="true" />
          <p className="relative flex items-center gap-3">
            <Leaf className="size-6 -rotate-12 text-gold" strokeWidth={1.7} aria-hidden="true" />
            <span className="text-[11px] font-bold uppercase tracking-[0.26em] text-gold">Reflection</span>
          </p>
          <p className="relative mt-4 max-w-md text-base leading-7 text-foreground/85">
            This verse is the heart of the gospel — God’s love expressed through sacrifice.
          </p>
        </section>

        <Button
          asChild
          className="mt-6 h-16 w-full rounded-full text-lg font-semibold shadow-none transition-transform active:scale-[0.99]"
        >
          <Link to="/inscribe" className="relative w-full">
            <span className="block w-full text-center">Continue practicing</span>
            <ArrowRight className="absolute right-6 top-1/2 size-5 -translate-y-1/2" />
          </Link>
        </Button>
      </div>
    </main>
  );
}
