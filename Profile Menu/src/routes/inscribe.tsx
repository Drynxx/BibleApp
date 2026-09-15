import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowRight, Check, Leaf, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/inscribe")({
  head: () => ({
    meta: [
      { title: "Inscribe John 3:16 — Verse" },
      { name: "description", content: "Commit John 3:16 to memory through reading, recall, and first-letter practice." },
      { property: "og:title", content: "Inscribe John 3:16 — Verse" },
      { property: "og:description", content: "Commit John 3:16 to memory through reading, recall, and first-letter practice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inscribe,
});

const verse = "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.";
const words = verse.split(" ");
const hiddenIndexes = [3, 8, 13, 16, 21, 24];
const answers = hiddenIndexes.map((index) => words[index] ?? "");
const options = ["loved", "gave", "Son,", "believes", "perish", "eternal", "created", "fears"];

function Inscribe() {
  const router = useRouter();
  const [level, setLevel] = useState(1);
  const [picked, setPicked] = useState<string[]>([]);
  const [wrong, setWrong] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const complete = revealed === words.length;

  useEffect(() => { if (level === 3) inputRef.current?.focus(); }, [level]);
  const close = () => router.history.back();
  const choose = (word: string) => {
    if (picked.length >= answers.length || picked.includes(word)) return;
    const expected = answers[picked.length];
    if (word === expected) { setWrong(false); setPicked((current) => [...current, word]); } else { setWrong(true); }
  };
  const typeLetter = (value: string) => {
    const letter = value.slice(-1).toLowerCase();
    const expected = (words[revealed]?.match(/[a-z]/i)?.[0] ?? "").toLowerCase();
    if (letter === expected) setRevealed((current) => Math.min(words.length, current + 1));
  };

  return (
    <main className="min-h-screen text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 pb-7 pt-4 sm:px-8 sm:pb-10 sm:pt-7">
        <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <Button variant="ghost" size="icon" className="size-11 rounded-full" onClick={close} aria-label="Close practice"><X className="size-5" /></Button>
          <div><div className="mx-auto flex max-w-52 gap-2" aria-label={`Level ${level} of 3`}>{[1, 2, 3].map((item) => <span key={item} className={`h-1.5 flex-1 rounded-full ${item <= level ? "bg-primary" : "bg-secondary"}`} />)}</div></div>
          <span className="w-11 text-right text-xs font-semibold text-primary">{level}/3</span>
        </header>

        {level === 1 && <LevelOne onNext={() => setLevel(2)} />}
        {level === 2 && <LevelTwo picked={picked} wrong={wrong} onChoose={choose} onReset={() => { setPicked([]); setWrong(false); }} onNext={() => setLevel(3)} />}
        {level === 3 && <LevelThree revealed={revealed} complete={complete} inputRef={inputRef} onType={typeLetter} onFocus={() => inputRef.current?.focus()} onRestart={() => { setLevel(1); setPicked([]); setRevealed(0); }} onClose={close} />}
      </div>
    </main>
  );
}

function LevelOne({ onNext }: { onNext: () => void }) {
  return <section className="flex flex-1 flex-col pt-8 text-center sm:pt-14"><p className="text-[10px] font-bold uppercase tracking-[0.27em] text-gold">Level one · Stillness</p><h1 className="mt-3 font-serif text-4xl font-semibold">Read & reflect</h1><div className="relative my-auto py-12"><div className="absolute left-1/2 top-1/2 h-52 w-[90%] -translate-x-1/2 -translate-y-1/2 rotate-[-3deg] rounded-[50%] bg-secondary/45" aria-hidden="true" /><div className="absolute right-8 top-4 size-16 rounded-full bg-gold/15" aria-hidden="true" /><Leaf className="absolute bottom-3 left-4 size-24 -rotate-12 text-gold/20" strokeWidth={1} aria-hidden="true" /><p className="relative mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">John 3:16 · NIV</p><blockquote className="relative mx-auto max-w-xl font-serif text-[2rem] leading-[1.25] sm:text-[2.6rem]">“{verse}”</blockquote></div><p className="mx-auto mb-6 max-w-sm text-sm leading-6 text-muted-foreground">Stay with each phrase. Notice the love at the heart of every word.</p><Button className="h-16 w-full rounded-full text-lg" onClick={onNext}>I’m ready <ArrowRight className="ml-auto" /></Button></section>;
}

function LevelTwo({ picked, wrong, onChoose, onReset, onNext }: { picked: string[]; wrong: boolean; onChoose: (word: string) => void; onReset: () => void; onNext: () => void }) {
  const done = picked.length === answers.length;
  let blank = 0;
  return <section className="flex flex-1 flex-col pt-8 sm:pt-14"><div className="text-center"><p className="text-[10px] font-bold uppercase tracking-[0.27em] text-gold">Level two · The Weave</p><h1 className="mt-3 font-serif text-4xl font-semibold">Complete the verse</h1><p className="mt-2 text-sm text-muted-foreground">Choose each missing word in order.</p></div><blockquote className="my-auto py-10 font-serif text-[1.9rem] leading-[1.55] sm:text-[2.35rem]">{words.map((word, index) => { if (!hiddenIndexes.includes(index)) return <span key={index}>{word}{" "}</span>; const value = picked[blank]; const current = blank; blank += 1; return <span key={index} className={`mx-1 inline-block min-w-20 border-b-2 px-1 text-center ${value ? "border-primary text-primary" : current === picked.length && wrong ? "border-destructive text-destructive" : "border-gold text-transparent"}`}>{value ?? "______"}{" "}</span>; })}</blockquote><div><div className="flex flex-wrap justify-center gap-2.5">{options.map((word) => <Button key={word} type="button" variant={picked.includes(word) ? "secondary" : "outline"} disabled={picked.includes(word) || done} onClick={() => onChoose(word)} className="h-12 rounded-full px-5 text-base shadow-none">{word}</Button>)}</div><div className="mt-4 min-h-6 text-center text-sm font-semibold" role="status">{wrong && <span className="text-destructive">Try another word.</span>}{done && <span className="text-sage">Beautifully woven together.</span>}</div><div className="mt-4 flex gap-3"><Button variant="ghost" size="icon" className="size-16 rounded-full" onClick={onReset} aria-label="Reset words"><RotateCcw className="size-5" /></Button><Button className="h-16 flex-1 rounded-full text-lg" disabled={!done} onClick={onNext}>Continue <ArrowRight className="ml-auto" /></Button></div></div></section>;
}

function LevelThree({ revealed, complete, inputRef, onType, onFocus, onRestart, onClose }: { revealed: number; complete: boolean; inputRef: React.RefObject<HTMLInputElement | null>; onType: (value: string) => void; onFocus: () => void; onRestart: () => void; onClose: () => void }) {
  return <section className="flex flex-1 flex-col pt-8 text-center sm:pt-14" onClick={onFocus}><p className="text-[10px] font-bold uppercase tracking-[0.27em] text-gold">Level three · The Inscription</p><h1 className="mt-3 font-serif text-4xl font-semibold">Recall from within</h1><p className="mt-3 text-sm text-muted-foreground">Type the first letter of every word.</p><input ref={inputRef} aria-label="Type the first letter of every word" value="" onChange={(event) => onType(event.target.value)} className="sr-only" autoCapitalize="none" autoComplete="off" /><div className="my-auto flex min-h-72 items-center justify-center py-10"><blockquote className="max-w-xl font-serif text-[2rem] leading-[1.45] sm:text-[2.5rem]" aria-live="polite">{revealed === 0 ? <span className="animate-pulse text-gold">|</span> : words.slice(0, revealed).join(" ")}{revealed > 0 && !complete && <span className="ml-1 animate-pulse text-gold">|</span>}</blockquote></div>{complete ? <div><p className="mb-5 flex items-center justify-center gap-2 text-base font-semibold text-sage"><Check className="size-5" /> John 3:16 is inscribed.</p><Button className="h-16 w-full rounded-full text-lg" onClick={onClose}>Finish</Button><Button variant="ghost" className="mt-2 h-12 w-full" onClick={onRestart}>Practice again</Button></div> : <Button variant="outline" className="h-16 w-full rounded-full border-gold bg-card text-base shadow-none" onClick={onFocus}>Tap here, then type letters <span className="ml-auto text-xs text-muted-foreground">{revealed}/{words.length}</span></Button>}</section>;
}