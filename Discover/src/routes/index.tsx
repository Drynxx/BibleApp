import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Flame, Leaf, MoreVertical, Sun } from "lucide-react";
import { useState } from "react";

import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verse — Daily Bible Memorization" },
      { name: "description", content: "Memorize Bible verses through short, encouraging daily practice." },
      { property: "og:title", content: "Verse — Daily Bible Memorization" },
      { property: "og:description", content: "Memorize Bible verses through short, encouraging daily practice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

const week = [
  { day: "Mon", done: true }, { day: "Tue", done: true }, { day: "Wed", done: true },
  { day: "Thu", done: true }, { day: "Fri", done: true }, { day: "Sat", done: true },
  { day: "Sun", done: false },
];

const collections = [
  { title: "Psalms of\nComfort", icon: Leaf, tone: "bg-sage/10 text-sage" },
  { title: "Fruit of\nthe Spirit", icon: "fruit", tone: "bg-primary/8 text-gold" },
  { title: "Proverbs\nWisdom", icon: Sun, tone: "bg-gold/12 text-gold" },
];

function Index() {
  const [started, setStarted] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <main className="min-h-screen pb-28 text-foreground sm:pb-10">
        <div className="mx-auto w-full max-w-6xl px-5 pt-6 sm:px-8 sm:pt-10">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative grid size-11 shrink-0 place-items-center text-gold" aria-hidden="true">
                <Leaf className="size-9 -rotate-12" strokeWidth={1.7} />
              </div>
              <div className="min-w-0">
                <p className="font-serif text-3xl font-semibold leading-none">Verse</p>
                <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.23em] text-primary">Small steps. Deeper faith.</p>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu" className="size-11 rounded-full"><MoreVertical className="size-5" /></Button>
              </TooltipTrigger>
              <TooltipContent>Menu</TooltipContent>
            </Tooltip>
          </header>

          <section className="relative mt-12 animate-gentle-rise sm:mt-16">
            <Leaf className="absolute right-3 top-0 hidden size-28 rotate-12 text-gold/30 sm:block" strokeWidth={1} aria-hidden="true" />
            <h1 className="text-3xl font-semibold leading-tight sm:text-5xl">Good morning, Sarah</h1>
            <p className="mt-2 flex items-center gap-2 text-xl font-medium text-primary sm:text-2xl">Day 12 streak <Flame className="size-7 fill-primary text-primary" aria-hidden="true" /></p>
          </section>

          <div className="mt-9 grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
            <section className="animate-gentle-rise rounded-[1.35rem] border border-border/70 bg-card/90 p-5 shadow-[0_10px_35px_color-mix(in_oklab,var(--foreground)_7%,transparent)] sm:p-7" style={{ animationDelay: "80ms" }} aria-labelledby="streak-title">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-4">
                    <div className="grid size-16 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Flame className="size-9 fill-primary" /></div>
                    <div><h2 id="streak-title" className="text-3xl font-semibold">12 days</h2><p className="mt-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary/75">Keep going</p></div>
                  </div>
                </div>
                <p className="hidden max-w-24 border-l border-border pl-5 text-[10px] font-semibold uppercase leading-5 tracking-[0.22em] text-primary/65 sm:block">Consistency builds a brighter tomorrow</p>
              </div>
              <div className="mt-7 grid grid-cols-7 gap-2" aria-label="This week's practice">
                {week.map((item) => <div key={item.day} className="text-center"><span className={`mx-auto grid size-5 place-items-center rounded-full border-2 ${item.done ? "border-primary bg-primary" : "border-border bg-background"}`}>{item.done && <Check className="size-3 text-primary-foreground" />}</span><span className="mt-2 block text-xs font-medium">{item.day}</span></div>)}
              </div>
            </section>

            <Link to="/verse" className="relative block min-h-64 overflow-hidden rounded-[1.35rem] border border-border/60 bg-paper p-7 shadow-[inset_0_0_45px_color-mix(in_oklab,var(--gold)_7%,transparent)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-9" aria-labelledby="daily-verse">
              <div className="absolute -bottom-20 right-[-8%] h-52 w-[70%] rotate-[-7deg] rounded-[50%] bg-secondary/70" aria-hidden="true" />
              <div className="absolute bottom-[-5rem] right-[28%] h-40 w-[55%] rotate-[10deg] rounded-[50%] bg-card/55" aria-hidden="true" />
              <div className="absolute right-10 top-10 size-12 rounded-full bg-gold/20" aria-hidden="true" />
              <p className="relative inline-flex rounded-sm bg-gold px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground">John 3:16</p>
              <blockquote id="daily-verse" className="relative mt-6 max-w-xl font-serif text-[1.9rem] font-medium leading-[1.08] sm:text-4xl">“For God so loved the world, that he gave his one and only Son...”</blockquote>
              <p className="relative mt-5 text-[10px] font-semibold uppercase tracking-[0.23em] text-primary/70">A love that changes everything</p>
            </Link>
          </div>

          <Button asChild onClick={() => setStarted(true)} className="mt-5 h-16 w-full rounded-full text-lg font-semibold shadow-none transition-transform active:scale-[0.99] sm:h-16 sm:text-xl">
            <Link to="/inscribe">
              {started ? <><Check className="size-5" /> Ready to practice</> : <>Start today’s verse <ArrowRight className="ml-auto size-5" /></>}
            </Link>
          </Button>

          <section className="mt-9" aria-labelledby="journey-title">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4"><h2 id="journey-title" className="truncate text-xl font-semibold sm:text-2xl">Continue your journey</h2><Button variant="link" className="shrink-0 px-0 text-primary">See all <ArrowRight /></Button></div>
            <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-5">
              {collections.map((item) => {
                const Icon = item.icon;
                return <Link key={item.title} to="/verse" className={`group block min-w-0 overflow-hidden rounded-2xl border border-border/60 p-4 text-center shadow-[0_5px_20px_color-mix(in_oklab,var(--foreground)_5%,transparent)] transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6 ${item.tone}`} aria-label={`Open ${item.title.replace("\n", " ")}`}>
                  <div className="mx-auto grid h-16 place-items-center" aria-hidden="true">{Icon === "fruit" ? <div className="relative size-12"><span className="absolute bottom-1 left-1 size-7 rounded-full bg-primary/70"/><span className="absolute right-1 top-2 size-6 rounded-full bg-gold/65"/><Leaf className="absolute -top-1 right-3 size-6 rotate-45 text-sage" /></div> : <Icon className="size-11" strokeWidth={1.5} />}</div>
                  <h3 className="mt-2 whitespace-pre-line font-serif text-lg font-semibold leading-5 text-foreground sm:text-2xl sm:leading-6">{item.title}</h3><p className="mt-3 text-[9px] font-bold uppercase tracking-[0.2em] text-primary/80 sm:text-[11px]">7 verses</p>
                </Link>;
              })}
            </div>
          </section>
        </div>

        <BottomNav />
      </main>
    </TooltipProvider>
  );
}