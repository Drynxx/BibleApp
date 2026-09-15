import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bookmark,
  BookOpen,
  ChevronRight,
  Eye,
  Feather,
  FolderHeart,
  Leaf,
  LockKeyhole,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import planAnxiety from "@/assets/plan-anxiety.jpg";
import planGrief from "@/assets/plan-grief.jpg";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — Verse" },
      { name: "description", content: "Your saved verses, custom packs, and private reflections in one quiet place." },
      { property: "og:title", content: "Your Profile — Verse" },
      { property: "og:description", content: "Your saved verses, custom packs, and private reflections in one quiet place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

type LibraryView = "saved" | "packs" | "reflections";

const libraryTabs: Array<{ value: LibraryView; label: string }> = [
  { value: "saved", label: "Saved verses" },
  { value: "packs", label: "My packs" },
  { value: "reflections", label: "Reflections" },
];

const savedVerses = [
  {
    reference: "Psalm 23:1",
    translation: "NIV",
    saved: "Saved Mar 12",
    text: "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters.",
  },
  {
    reference: "Isaiah 41:10",
    translation: "NIV",
    saved: "Saved Mar 8",
    text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you.",
  },
  {
    reference: "Matthew 11:28",
    translation: "NIV",
    saved: "Saved Feb 27",
    text: "Come to me, all you who are weary and burdened, and I will give you rest.",
  },
];

const customPacks = [
  {
    name: "Verses for my family",
    count: 5,
    description: "Promises and prayers to return to together.",
    image: planAnxiety,
    alt: "Soft terracotta brushwork on textured paper",
  },
  {
    name: "Sunday school",
    count: 8,
    description: "A growing collection for weekly teaching.",
    image: planGrief,
    alt: "Layered sage paper shapes in a quiet abstract composition",
  },
];

const reflections = [
  {
    reference: "John 3:16",
    date: "Mar 9",
    note: "Sat with the word “gave” today. Love that costs something — a gift before it is a rule. I want to carry that generosity into this week.",
  },
  {
    reference: "Psalm 34:18",
    date: "Mar 4",
    note: "Close to the brokenhearted. He is nearer in the hard weeks, not farther. This verse felt less like an answer and more like companionship.",
  },
];

function Profile() {
  const [activeView, setActiveView] = useState<LibraryView>("saved");
  const [visibleVerses, setVisibleVerses] = useState(savedVerses);

  return (
    <main className="min-h-screen bg-background pb-[120px] font-sans text-foreground">
      <div className="mx-auto w-full max-w-[573px] px-6 pt-7">
        <header className="flex items-center justify-between gap-4 font-profile-sans">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-gold-soft/70" aria-hidden="true">
              <Leaf className="size-5 -rotate-12 text-gold" strokeWidth={1.8} />
            </span>
            <div>
              <p className="font-profile-serif text-[21px] font-bold leading-none">Verse</p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Personal library</p>
            </div>
          </div>
          <Button asChild variant="outline" size="icon" className="size-11 rounded-lg border-border/65 bg-card/75 text-muted-foreground shadow-sm hover:border-primary/30 hover:text-foreground">
            <Link to="/settings" aria-label="Open settings">
              <Settings className="size-[19px]" strokeWidth={1.8} />
            </Link>
          </Button>
        </header>

        <section aria-label="Your identity" className="mt-6 overflow-hidden rounded-lg border border-border/60 bg-card/75 font-profile-sans shadow-[0_6px_22px_color-mix(in_oklab,var(--foreground)_4%,transparent)]">
          <div className="flex items-center gap-4 px-5 py-5">
            <div className="relative shrink-0" aria-hidden="true">
              <div className="grid size-[72px] place-items-center rounded-full border border-primary/15 bg-primary-soft font-profile-serif text-[27px] font-bold text-primary shadow-[inset_0_0_0_5px_color-mix(in_oklab,var(--card)_60%,transparent)]">
                M
              </div>
              <span className="absolute bottom-0 right-0 size-4 rounded-full border-[3px] border-card bg-sage" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Your profile</p>
              <h1 className="mt-1 font-profile-serif text-[29px] font-bold leading-tight">Mattias</h1>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">A quiet place for the verses and reflections you keep.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-border/60 bg-paper/35">
            <div className="px-5 py-3.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Member since</p>
              <p className="mt-1 font-profile-serif text-[14px] font-bold text-foreground">March 2024</p>
            </div>
            <div className="border-l border-border/60 px-5 py-3.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Mastered</p>
              <p className="mt-1 font-profile-serif text-[14px] font-bold text-foreground"><span className="text-primary">47</span> verses</p>
            </div>
          </div>
        </section>

        <nav aria-label="Profile library" className="mt-5 font-profile-sans">
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-border/60 bg-muted/45 p-1" role="tablist">
            {libraryTabs.map((tab) => {
              const selected = activeView === tab.value;
              return (
                <Button
                  key={tab.value}
                  type="button"
                  variant="ghost"
                  role="tab"
                  id={`profile-tab-${tab.value}`}
                  aria-selected={selected}
                  aria-controls={`profile-panel-${tab.value}`}
                  onClick={() => setActiveView(tab.value)}
                  className={`h-10 rounded-md px-1 text-[11.5px] font-semibold transition-[background-color,color,box-shadow] hover:bg-card/60 ${
                    selected ? "bg-card text-primary shadow-sm hover:bg-card" : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </nav>

        <div className="pt-6">
          {activeView === "saved" ? (
            <section id="profile-panel-saved" role="tabpanel" aria-labelledby="profile-tab-saved">
              <LibraryHeading eyebrow="Your library" title="Saved verses" count={`${visibleVerses.length} passages`} icon={Bookmark} />
              {visibleVerses.length ? (
                <div className="mt-4 grid gap-4">
                  {visibleVerses.map((verse) => (
                    <article key={verse.reference} className="overflow-hidden rounded-lg border border-border/55 bg-card/85 shadow-[0_5px_18px_color-mix(in_oklab,var(--foreground)_4%,transparent)]">
                      <div className="px-5 pb-4 pt-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              <LockKeyhole className="size-3" aria-hidden="true" /> Private · {verse.translation}
                            </div>
                            <h2 className="mt-2 font-serif text-[27px] font-semibold leading-none">{verse.reference}</h2>
                          </div>
                          <span className="shrink-0 text-[10px] text-muted-foreground">{verse.saved}</span>
                        </div>
                        <blockquote className="mt-5 border-l-2 border-primary/65 pl-4 font-serif text-[20px] leading-[1.55] text-warm-copy">
                          “{verse.text}”
                        </blockquote>
                      </div>
                      <div className="flex items-center justify-between border-t border-border/55 px-3 py-2">
                        <Button asChild variant="ghost" className="h-10 px-2 text-[12px] text-primary">
                          <Link to="/verse" aria-label={`Open ${verse.reference}`}>
                            <Eye className="size-4" /> Open passage
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-10 text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${verse.reference} from saved verses`}
                          onClick={() => setVisibleVerses((current) => current.filter((item) => item.reference !== verse.reference))}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Bookmark} title="No saved verses yet" copy="Verses you save will gather here for quiet return." />
              )}
            </section>
          ) : null}

          {activeView === "packs" ? (
            <section id="profile-panel-packs" role="tabpanel" aria-labelledby="profile-tab-packs">
              <LibraryHeading eyebrow="Collections" title="My packs" count={`${customPacks.length} collections`} icon={FolderHeart} />
              <div className="mt-4 grid gap-4">
                {customPacks.map((pack) => (
                  <Link
                    key={pack.name}
                    to="/practice"
                    aria-label={`Open ${pack.name}`}
                    className="group overflow-hidden rounded-lg border border-border/55 bg-card/85 shadow-[0_5px_18px_color-mix(in_oklab,var(--foreground)_4%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <div className="relative h-[150px] overflow-hidden">
                      <img src={pack.image} alt={pack.alt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none" width={1024} height={1024} loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/45 via-transparent to-transparent" aria-hidden="true" />
                    </div>
                    <div className="flex items-center gap-3 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-primary">Personal pack · {pack.count} verses</p>
                        <h2 className="mt-1 font-serif text-[23px] font-semibold leading-tight">{pack.name}</h2>
                        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{pack.description}</p>
                      </div>
                      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                    </div>
                  </Link>
                ))}
                <Button type="button" variant="outline" className="h-14 rounded-lg border-dashed border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:text-primary">
                  <Plus className="size-4" /> New pack
                </Button>
              </div>
            </section>
          ) : null}

          {activeView === "reflections" ? (
            <section id="profile-panel-reflections" role="tabpanel" aria-labelledby="profile-tab-reflections">
              <LibraryHeading eyebrow="Private notes" title="Reflections" count={`${reflections.length} entries`} icon={Feather} />
              <div className="mt-4 grid gap-4">
                {reflections.map((entry) => (
                  <article key={entry.reference} className="rounded-lg border border-border/50 bg-paper/80 px-5 py-5 shadow-[0_5px_18px_color-mix(in_oklab,var(--foreground)_4%,transparent)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          <LockKeyhole className="size-3" aria-hidden="true" /> Private reflection
                        </div>
                        <h2 className="mt-2 font-serif text-[24px] font-semibold">{entry.reference}</h2>
                      </div>
                      <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{entry.date}</span>
                    </div>
                    <p className="mt-4 border-l-2 border-sage/55 pl-4 font-serif text-[17px] italic leading-[1.65] text-warm-copy">{entry.note}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <BottomNav discoveryStyle />
    </main>
  );
}

function LibraryHeading({ eyebrow, title, count, icon: Icon }: { eyebrow: string; title: string; count: string; icon: typeof BookOpen }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-1 font-serif text-[27px] font-semibold leading-tight">{title}</h2>
      </div>
      <div className="flex items-center gap-2 pb-1 text-[10px] text-muted-foreground">
        <Icon className="size-4 text-gold" aria-hidden="true" /> {count}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, copy }: { icon: typeof Bookmark; title: string; copy: string }) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <Icon className="mx-auto size-6 text-gold" aria-hidden="true" />
      <h2 className="mt-3 font-serif text-[21px] font-semibold">{title}</h2>
      <p className="mx-auto mt-1 max-w-[280px] text-[12px] leading-relaxed text-muted-foreground">{copy}</p>
    </div>
  );
}