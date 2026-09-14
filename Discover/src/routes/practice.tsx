import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, ChevronDown, ChevronRight, ChevronUp, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import angerImage from "@/assets/plan-anger.jpg";
import anxietyImage from "@/assets/plan-anxiety.jpg";
import directionImage from "@/assets/plan-direction.jpg";
import griefImage from "@/assets/plan-grief.jpg";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Discover Bible Plans and Verses — Verse" },
      { name: "description", content: "Browse Bible plans, books, and memorable verses for your daily practice." },
      { property: "og:title", content: "Discover Bible Plans and Verses — Verse" },
      { property: "og:description", content: "Browse Bible plans, books, and memorable verses for your daily practice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PracticeLibrary,
});

const packs = [
  { title: "Anxiety & Worry", category: "Peace", count: 7, description: "Find peace in God’s presence through every season.", verses: "Philippians 4:6–7 · Matthew 6:34 · Psalm 56:3", image: anxietyImage, alt: "Layered terracotta brush strokes on textured ivory paper" },
  { title: "Grief & Loss", category: "Comfort", count: 9, description: "Hope and comfort for the hard days.", verses: "Psalm 34:18 · Revelation 21:4 · John 11:25", image: griefImage, alt: "Overlapping sage paper forms and stone textures" },
  { title: "A Need for Direction", category: "Guidance", count: 6, description: "Seeking God’s wisdom for what’s next.", verses: "Proverbs 3:5–6 · Psalm 32:8 · Isaiah 30:21", image: directionImage, alt: "Ivory folded paper crossed by muted gold lines" },
  { title: "Anger & Frustration", category: "Growth", count: 8, description: "Words for patience, wisdom, and lasting peace.", verses: "James 1:19–20 · Proverbs 15:1 · Ephesians 4:26", image: angerImage, alt: "Layered terracotta and dusty rose painted arcs" },
];

const topics = ["All", "Peace", "Comfort", "Guidance", "Growth"] as const;
const tabs = ["Plans", "Books", "Verses"] as const;
type LibraryTab = (typeof tabs)[number];

const recentBooks = ["Psalms", "John", "Romans"];
const oldTestament = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"];
const newTestament = ["Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"];

const verseLibrary = [
  { reference: "John 3:16", translation: "NIV", text: "For God so loved the world that he gave his one and only Son.", topic: "Love", group: "For today", tags: "love salvation John" },
  { reference: "Philippians 4:6–7", translation: "NIV", text: "Do not be anxious about anything, but in every situation, by prayer and petition, present your requests to God.", topic: "Peace", group: "For today", tags: "anxiety peace prayer Philippians" },
  { reference: "Psalm 34:18", translation: "NIV", text: "The Lord is close to the brokenhearted and saves those who are crushed in spirit.", topic: "Comfort", group: "Popular", tags: "grief comfort Psalms" },
  { reference: "Proverbs 3:5–6", translation: "NIV", text: "Trust in the Lord with all your heart and lean not on your own understanding.", topic: "Guidance", group: "Popular", tags: "direction wisdom trust Proverbs" },
  { reference: "James 1:19–20", translation: "NIV", text: "Everyone should be quick to listen, slow to speak and slow to become angry.", topic: "Growth", group: "Popular", tags: "anger patience James" },
  { reference: "Romans 8:28", translation: "NIV", text: "In all things God works for the good of those who love him.", topic: "Hope", group: "For today", tags: "hope purpose Romans" },
];

type Pack = (typeof packs)[number];
type Verse = (typeof verseLibrary)[number];
type Preview = { title: string; description: string; verses: string; count?: number; kind: "plan" | "book" | "verse" };

function PracticeLibrary() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<LibraryTab>("Plans");
  const [activeTopic, setActiveTopic] = useState<(typeof topics)[number]>("All");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [queued, setQueued] = useState(false);
  const [queuedItem, setQueuedItem] = useState("John 3:16");
  const [queueExpanded, setQueueExpanded] = useState(false);

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return { plans: [], books: [], verses: [] };
    const includes = (value: string) => value.toLowerCase().includes(normalized);
    return {
      plans: packs.filter((pack) => includes(`${pack.title} ${pack.category} ${pack.description} ${pack.verses}`)),
      books: [...oldTestament, ...newTestament].filter(includes),
      verses: verseLibrary.filter((verse) => includes(`${verse.reference} ${verse.text} ${verse.topic} ${verse.tags}`)),
    };
  }, [query]);

  const visiblePacks = activeTopic === "All" ? packs : packs.filter((pack) => pack.category === activeTopic);
  const featuredPack = visiblePacks[0] ?? packs[0];
  const remainingPacks = visiblePacks.filter((pack) => pack.title !== featuredPack?.title);
  const isSearching = query.trim().length > 0;
  const resultCount = searchResults.plans.length + searchResults.books.length + searchResults.verses.length;

  const openPlan = (pack: Pack) => {
    setQueued(false);
    setPreview({ title: pack.title, count: pack.count, kind: "plan", description: pack.description, verses: pack.verses });
  };
  const openBook = (book: string) => {
    setQueued(false);
    setPreview({ title: book, kind: "book", description: `Begin memorizing a meaningful passage from ${book}.`, verses: book === "John" ? "John 3:16 · John 14:6 · John 15:5" : `${book} · Curated memory verses` });
  };
  const openVerse = (verse: Verse) => {
    setQueued(false);
    setPreview({ title: verse.reference, kind: "verse", description: verse.text, verses: `${verse.reference} · ${verse.translation}` });
  };
  const addToQueue = (item: string) => {
    setQueuedItem(item);
    setQueued(true);
    setQueueExpanded(true);
  };

  return (
    <main className="min-h-screen bg-background pb-[176px] font-sans text-foreground">
      <div className="mx-auto w-full max-w-[573px]">
        <header className="px-6 pt-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.23em] text-primary">Build your practice</p>
          <h1 className="mt-1.5 font-serif text-[44px] font-semibold leading-none">Discover</h1>
          <p className="mt-2.5 text-[14px] leading-6 text-warm-copy">Find scripture for where you are today.</p>
        </header>

        <div className="relative mx-6 mt-5">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.8} />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search plans, books, or verses…" aria-label="Search plans, books, or verses" className="h-12 rounded-xl border border-border/45 bg-card/85 pl-12 pr-12 text-[14px] shadow-[0_3px_12px_color-mix(in_oklab,var(--foreground)_3%,transparent)] placeholder:text-muted-foreground focus-visible:ring-1" />
          {isSearching && <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 size-10 -translate-y-1/2 rounded-lg text-muted-foreground" onClick={() => setQuery("")} aria-label="Clear search"><X className="size-4" /></Button>}
        </div>

        {!isSearching && <div className="mx-6 mt-4 grid grid-cols-3 border-b border-border/60" role="tablist" aria-label="Discover library">
          {tabs.map((tab) => <Button key={tab} variant="ghost" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={`relative h-11 rounded-none text-[13px] font-semibold shadow-none transition-colors hover:bg-transparent ${activeTab === tab ? "text-primary" : "text-muted-foreground"}`}><span>{tab}</span>{activeTab === tab && <span className="absolute inset-x-5 bottom-0 h-0.5 bg-primary" />}</Button>)}
        </div>}

        <div className="mt-0 border-t border-card bg-paper/30 px-6 pb-10 pt-6">
        {isSearching ? <SearchResults results={searchResults} count={resultCount} query={query} onOpenPlan={openPlan} onOpenBook={openBook} onOpenVerse={openVerse} onQueueVerse={(verse) => addToQueue(verse.reference)} onClear={() => setQuery("")} /> : (
          <div>
            {activeTab === "Plans" && <PlansTab activeTopic={activeTopic} onTopicChange={setActiveTopic} featuredPack={featuredPack} remainingPacks={remainingPacks} onOpen={openPlan} />}
            {activeTab === "Books" && <BooksTab onOpen={openBook} />}
            {activeTab === "Verses" && <VersesTab onOpen={openVerse} onQueue={(verse) => addToQueue(verse.reference)} />}
          </div>
        )}
        </div>
      </div>

      <aside className="fixed inset-x-4 bottom-[91px] z-20 mx-auto max-w-[541px] overflow-hidden rounded-xl border border-border/60 bg-card/95 px-3 shadow-[0_8px_24px_color-mix(in_oklab,var(--foreground)_10%,transparent)] backdrop-blur-xl" aria-label="Practice queue">
        <div className={`grid transition-[grid-template-rows] duration-200 ${queueExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}><div className="overflow-hidden"><p className="pb-1 pt-3 text-xs leading-5 text-muted-foreground">Ready to continue your next memorization session?</p></div></div>
        <div className="grid min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <Button variant="ghost" size="icon" className="size-9 rounded-lg bg-primary-soft/65 text-primary" onClick={() => setQueueExpanded((value) => !value)} aria-label={queueExpanded ? "Collapse practice queue" : "Expand practice queue"}>{queueExpanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}</Button>
          <button type="button" className="min-w-0 text-left" onClick={() => setQueueExpanded((value) => !value)}><span className="block text-[8px] font-semibold uppercase tracking-[0.18em] text-primary">Next in queue</span><span className="block truncate font-serif text-[18px] font-semibold leading-tight">{queuedItem}</span></button>
          {queued ? <Button asChild className="h-10 shrink-0 rounded-lg px-4 text-[13px]"><Link to="/inscribe">Begin now<ArrowRight /></Link></Button> : <Button className="h-10 shrink-0 rounded-lg px-4 text-[13px]" onClick={() => addToQueue(queuedItem)}>Add to Queue</Button>}
        </div>
      </aside>
      <BottomNav discoveryStyle />

      <Sheet open={preview !== null} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <SheetContent side="bottom" className="mx-auto rounded-t-3xl border-border bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 sm:max-w-[573px]">
          <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-border" />
          <SheetHeader className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold">{preview?.kind === "verse" ? "Memory verse" : preview?.kind === "plan" ? `${preview.count} verse plan` : "Bible book"}</p>
            <SheetTitle className="font-serif text-3xl">{preview?.title}</SheetTitle>
            <SheetDescription className="text-base leading-6">{preview?.description}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 rounded-xl bg-paper p-5"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Preview</p><p className="mt-3 font-serif text-xl leading-7">{preview?.verses}</p></div>
          {queued ? <div className="mt-6"><p className="text-center text-sm font-semibold text-sage">Added to your practice queue.</p><Button asChild className="mt-3 h-14 w-full rounded-xl text-base"><Link to="/inscribe">Begin now <ArrowRight className="ml-auto" /></Link></Button></div> : <Button className="mt-6 h-14 w-full rounded-xl text-base" onClick={() => preview && addToQueue(preview.title)}>Add to Queue <ArrowRight className="ml-auto" /></Button>}
        </SheetContent>
      </Sheet>
    </main>
  );
}

function PlansTab({ activeTopic, onTopicChange, featuredPack, remainingPacks, onOpen }: { activeTopic: (typeof topics)[number]; onTopicChange: (topic: (typeof topics)[number]) => void; featuredPack: Pack | undefined; remainingPacks: Pack[]; onOpen: (pack: Pack) => void }) {
  return <section aria-labelledby="plans-heading">
    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Choose by need</p>
    <h2 id="plans-heading" className="mt-1 font-serif text-[29px] font-semibold leading-tight">What do you need today?</h2>
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Filter plans by need">{topics.map((topic) => <Button key={topic} variant={activeTopic === topic ? "default" : "outline"} className={`h-8 shrink-0 rounded-lg px-3.5 text-[12px] shadow-none ${activeTopic === topic ? "" : "border-border/55 bg-card/65 text-warm-copy"}`} onClick={() => onTopicChange(topic)} aria-pressed={activeTopic === topic}>{topic}</Button>)}</div>
    {featuredPack && <div className="mt-5"><div className="mb-2.5 flex items-end justify-between"><h3 className="font-serif text-[21px] font-semibold">Featured plan</h3><span className="text-[11px] text-muted-foreground">{featuredPack.count} verses</span></div><PlanCard pack={featuredPack} onOpen={() => onOpen(featuredPack)} /></div>}
    {remainingPacks.length > 0 && <div className="mt-6"><div className="mb-2 flex items-center justify-between"><h3 className="font-serif text-[21px] font-semibold">More plans</h3><span className="text-[11px] text-muted-foreground">{remainingPacks.length} plans</span></div><div className="overflow-hidden rounded-xl border border-border/55 bg-card/75 px-4 shadow-[0_4px_16px_color-mix(in_oklab,var(--foreground)_3%,transparent)]">{remainingPacks.map((pack, index) => <div key={pack.title} className={index < remainingPacks.length - 1 ? "border-b border-border/60" : ""}><PlanRow pack={pack} onOpen={() => onOpen(pack)} /></div>)}</div></div>}
  </section>;
}

function BooksTab({ onOpen }: { onOpen: (book: string) => void }) {
  return <section aria-labelledby="books-heading">
    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">The Bible</p><h2 id="books-heading" className="mt-1 font-serif text-[29px] font-semibold">Browse by Book</h2>
    <div className="mt-6"><h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recently viewed</h3><div className="mt-3 grid grid-cols-3 gap-2">{recentBooks.map((book) => <Button key={book} variant="outline" className="h-14 rounded-lg border-border/60 bg-card/70 font-serif text-[17px]" onClick={() => onOpen(book)}>{book}</Button>)}</div></div>
    <div className="mt-7 grid gap-8"><BookGroup title="Old Testament" books={oldTestament} onOpen={onOpen} /><BookGroup title="New Testament" books={newTestament} onOpen={onOpen} /></div>
  </section>;
}

function VersesTab({ onOpen, onQueue }: { onOpen: (verse: Verse) => void; onQueue: (verse: Verse) => void }) {
  const groups = ["For today", "Popular"];
  return <section aria-labelledby="verses-heading"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Scripture index</p><h2 id="verses-heading" className="mt-1 font-serif text-[29px] font-semibold">Bible References</h2><div className="mt-6 grid gap-8">{groups.map((group) => <div key={group}><h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{group}</h3><div className="grid gap-2.5">{verseLibrary.filter((verse) => verse.group === group).map((verse) => <ReferenceRow key={verse.reference} verse={verse} onOpen={() => onOpen(verse)} onQueue={() => onQueue(verse)} />)}</div></div>)}</div></section>;
}

function PlanCard({ pack, onOpen }: { pack: Pack; onOpen: () => void }) {
  return <Button variant="ghost" className="group relative aspect-[1.35/1] h-auto w-full overflow-hidden rounded-xl border border-border/35 p-0 text-left shadow-[0_8px_24px_color-mix(in_oklab,var(--foreground)_7%,transparent)] hover:bg-transparent active:scale-[0.99]" onClick={onOpen} aria-label={`Open ${pack.title}, ${pack.count} verses`}><img src={pack.image} alt={pack.alt} width={1024} height={1024} className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.025]" /><span className="absolute inset-0 bg-[linear-gradient(to_top,color-mix(in_oklab,var(--foreground)_86%,transparent)_0%,color-mix(in_oklab,var(--foreground)_18%,transparent)_68%,transparent_88%)]" /><span className="absolute inset-x-0 bottom-0 block whitespace-normal p-5 text-primary-foreground"><span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-primary-foreground/75">{pack.category} · {pack.count} verses</span><span className="mt-1.5 block font-serif text-[28px] font-semibold leading-tight">{pack.title}</span><span className="mt-1 block text-[12px] font-normal leading-5 text-primary-foreground/85">{pack.description}</span></span></Button>;
}

function PlanRow({ pack, onOpen }: { pack: Pack; onOpen: () => void }) {
  return <Button variant="ghost" className="grid h-auto min-h-[88px] w-full grid-cols-[62px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-none px-0 py-3 text-left hover:bg-transparent" onClick={onOpen} aria-label={`Open ${pack.title}, ${pack.count} verses`}><img src={pack.image} alt="" width={1024} height={1024} loading="lazy" className="size-[62px] rounded-lg object-cover" /><span className="min-w-0 whitespace-normal"><span className="block text-[8px] font-semibold uppercase tracking-[0.16em] text-primary">{pack.category} · {pack.count} verses</span><span className="mt-1 block truncate font-serif text-[19px] font-semibold">{pack.title}</span><span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground">{pack.description}</span></span><ChevronRight className="size-4 text-muted-foreground" /></Button>;
}

function ReferenceRow({ verse, onOpen, onQueue }: { verse: Verse; onOpen: () => void; onQueue: () => void }) {
  return <article className="grid min-h-[116px] grid-cols-[minmax(0,1fr)_40px] items-center gap-3 rounded-xl border border-border/50 bg-card/80 px-4 py-3 shadow-[0_3px_12px_color-mix(in_oklab,var(--foreground)_3%,transparent)]"><Button variant="ghost" className="h-auto min-w-0 justify-start rounded-none px-0 text-left hover:bg-transparent" onClick={onOpen} aria-label={`Open ${verse.reference}`}><span className="min-w-0 whitespace-normal"><span className="block text-[8px] font-semibold uppercase tracking-[0.18em] text-primary">{verse.topic} · {verse.translation}</span><span className="mt-1 block font-serif text-[24px] font-semibold leading-tight">{verse.reference}</span><span className="mt-1.5 line-clamp-2 block text-[12px] font-normal leading-[1.55] text-warm-copy">{verse.text}</span></span></Button><Button variant="ghost" size="icon" className="size-9 rounded-lg border border-border/65 text-primary hover:bg-primary-soft/60" onClick={onQueue} aria-label={`Add ${verse.reference} to queue`}><Plus className="size-4" /></Button></article>;
}

function SearchResults({ results, count, query, onOpenPlan, onOpenBook, onOpenVerse, onQueueVerse, onClear }: { results: { plans: Pack[]; books: string[]; verses: Verse[] }; count: number; query: string; onOpenPlan: (pack: Pack) => void; onOpenBook: (book: string) => void; onOpenVerse: (verse: Verse) => void; onQueueVerse: (verse: Verse) => void; onClear: () => void }) {
  return <section className="mt-7" aria-live="polite" aria-label="Search results"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/45 pb-3"><h2 className="min-w-0 truncate font-serif text-[25px] font-semibold">Results for “{query}”</h2><span className="text-xs text-muted-foreground">{count} found</span></div>{count === 0 ? <div className="py-16 text-center"><p className="font-serif text-2xl font-semibold">No matching content</p><p className="mt-2 text-sm text-muted-foreground">Try a Bible book, topic, or verse reference.</p><Button variant="outline" className="mt-5 rounded-lg" onClick={onClear}>Clear search</Button></div> : <div className="mt-6 grid gap-9">{results.plans.length > 0 && <ResultSection title="Plans"><div className="divide-y divide-border/65 border-y border-border/65">{results.plans.map((pack) => <PlanRow key={pack.title} pack={pack} onOpen={() => onOpenPlan(pack)} />)}</div></ResultSection>}{results.books.length > 0 && <ResultSection title="Bible books"><div className="divide-y divide-border/65 border-y border-border/65">{results.books.map((book) => <BookRow key={book} book={book} onOpen={() => onOpenBook(book)} />)}</div></ResultSection>}{results.verses.length > 0 && <ResultSection title="Verses"><div className="divide-y divide-border/65 border-y border-border/65">{results.verses.map((verse) => <ReferenceRow key={verse.reference} verse={verse} onOpen={() => onOpenVerse(verse)} onQueue={() => onQueueVerse(verse)} />)}</div></ResultSection>}</div>}</section>;
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) { return <div><h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{title}</h3>{children}</div>; }
function BookRow({ book, onOpen }: { book: string; onOpen: () => void }) { return <Button variant="ghost" className="h-14 w-full justify-between rounded-none px-0 hover:bg-transparent" onClick={onOpen}><span className="font-serif text-[18px] font-semibold">{book}</span><ChevronRight className="size-4 text-muted-foreground" /></Button>; }
function BookGroup({ title, books, onOpen }: { title: string; books: string[]; onOpen: (book: string) => void }) { return <div><div className="flex items-center justify-between border-b border-border/60 pb-3"><h3 className="font-serif text-[22px] font-semibold">{title}</h3><BookOpen className="size-4 text-gold" /></div><div className="grid grid-cols-2 gap-x-6">{books.map((book) => <BookRow key={book} book={book} onOpen={() => onOpen(book)} />)}</div></div>; }
