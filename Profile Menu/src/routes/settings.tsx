import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  Languages,
  Mail,
  Moon,
  ShieldCheck,
  Trash2,
  Type,
  Vibrate,
  Volume2,
  LogOut,
  BookOpen,
  Eraser,
  FileText,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Verse" },
      { name: "description", content: "Appearance, language, practice preferences, data, and account settings for Verse." },
      { property: "og:title", content: "Settings — Verse" },
      { property: "og:description", content: "Appearance, language, practice preferences, data, and account settings for Verse." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

type Option = { value: string; label: string };

function GroupLabel({ children }: { children: string }) {
  return (
    <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{children}</p>
  );
}

function GroupCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/55 bg-card/85 shadow-[0_4px_16px_color-mix(in_oklab,var(--foreground)_3%,transparent)]">
      {children}
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  detail,
  control,
  destructive = false,
  last = false,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  detail?: string;
  control?: ReactNode;
  destructive?: boolean;
  last?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-lg ${
          destructive ? "bg-destructive/10 text-destructive" : "bg-primary-soft/60 text-primary"
        }`}
        aria-hidden="true"
      >
        <Icon className="size-[17px]" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[14px] font-medium leading-snug ${destructive ? "text-destructive" : ""}`}>
          {label}
        </span>
        {detail ? <span className="mt-0.5 block text-[11.5px] text-muted-foreground">{detail}</span> : null}
      </span>
      {control}
    </>
  );

  const className = `flex min-h-[58px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
    last ? "" : "border-b border-border/60"
  } ${onClick ? "hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary" : ""}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {body}
      </button>
    );
  }
  return <div className={className}>{body}</div>;
}

function SegmentedControl({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-background/70 p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`h-7 rounded-md px-2 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
            value === option.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ValueChevron({ value }: { value: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1 text-[12px] text-muted-foreground">
      {value}
      <ChevronRight className="size-4" aria-hidden="true" />
    </span>
  );
}

function SettingsPage() {
  const [theme, setTheme] = useState("light");
  const [textSize, setTextSize] = useState("medium");
  const [interfaceLang, setInterfaceLang] = useState("english");
  const [bibleLang, setBibleLang] = useState("niv");
  const [dailyNudge, setDailyNudge] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [sounds, setSounds] = useState(false);

  return (
    <main className="min-h-screen bg-background pb-12 font-sans text-foreground">
      <div className="mx-auto w-full max-w-[573px] px-6 pt-7">
        <header className="flex items-center gap-3">
          <Link
            to="/profile"
            aria-label="Back to profile"
            className="grid size-11 shrink-0 place-items-center rounded-full border border-border/55 bg-card/80 text-muted-foreground shadow-[0_2px_10px_color-mix(in_oklab,var(--foreground)_4%,transparent)] transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ChevronLeft className="size-5" strokeWidth={1.8} />
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Control room</p>
            <h1 className="mt-0.5 font-serif text-[30px] font-semibold leading-none">Settings</h1>
          </div>
        </header>

        <section aria-labelledby="group-appearance" className="mt-7 grid gap-2">
          <GroupLabel>Appearance & Accessibility</GroupLabel>
          <GroupCard>
            <Row
              icon={Moon}
              label="Theme"
              control={
                <SegmentedControl
                  ariaLabel="Theme"
                  options={[
                    { value: "light", label: "Light" },
                    { value: "dark", label: "Dark" },
                    { value: "system", label: "Auto" },
                  ]}
                  value={theme}
                  onChange={setTheme}
                />
              }
            />
            <Row
              icon={Type}
              label="Text size"
              last
              control={
                <SegmentedControl
                  ariaLabel="Text size"
                  options={[
                    { value: "small", label: "S" },
                    { value: "medium", label: "M" },
                    { value: "large", label: "L" },
                  ]}
                  value={textSize}
                  onChange={setTextSize}
                />
              }
            />
          </GroupCard>
        </section>

        <section aria-labelledby="group-practice" className="mt-6 grid gap-2">
          <GroupLabel>Language & Practice</GroupLabel>
          <GroupCard>
            <Row
              icon={Languages}
              label="App language"
              control={
                <SegmentedControl
                  ariaLabel="App interface language"
                  options={[
                    { value: "english", label: "EN" },
                    { value: "romanian", label: "RO" },
                  ]}
                  value={interfaceLang}
                  onChange={setInterfaceLang}
                />
              }
            />
            <Row
              icon={BookOpen}
              label="Bible text"
              control={
                <SegmentedControl
                  ariaLabel="Bible text language and version"
                  options={[
                    { value: "niv", label: "NIV" },
                    { value: "kjv", label: "KJV" },
                    { value: "vdcc", label: "VDCC" },
                  ]}
                  value={bibleLang}
                  onChange={setBibleLang}
                />
              }
            />
            <Row
              icon={Bell}
              label="Daily nudge"
              detail="Remind me at 8:00 AM"
              control={
                <Switch checked={dailyNudge} onCheckedChange={setDailyNudge} aria-label="Daily nudge notification" />
              }
            />
            <Row
              icon={Vibrate}
              label="Haptic feedback"
              control={<Switch checked={haptics} onCheckedChange={setHaptics} aria-label="Haptic feedback" />}
            />
            <Row
              icon={Volume2}
              label="Sound effects"
              last
              control={<Switch checked={sounds} onCheckedChange={setSounds} aria-label="Sound effects" />}
            />
          </GroupCard>
        </section>

        <section aria-labelledby="group-data" className="mt-6 grid gap-2">
          <GroupLabel>Data & Storage</GroupLabel>
          <GroupCard>
            <Row
              icon={Download}
              label="Export my data"
              detail="Saved and mastered verses as a text file"
              onClick={() => {}}
              control={<ChevronRight className="size-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />}
            />
            <Row
              icon={Eraser}
              label="Clear cache"
              last
              onClick={() => {}}
              control={<ValueChevron value="12.4 MB" />}
            />
          </GroupCard>
        </section>

        <section aria-labelledby="group-account" className="mt-6 grid gap-2">
          <GroupLabel>Account & Support</GroupLabel>
          <GroupCard>
            <Row
              icon={Mail}
              label="Contact support"
              onClick={() => {}}
              control={<ChevronRight className="size-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />}
            />
            <Row
              icon={ShieldCheck}
              label="Privacy policy"
              onClick={() => {}}
              control={<ChevronRight className="size-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />}
            />
            <Row
              icon={FileText}
              label="Terms of service"
              onClick={() => {}}
              control={<ChevronRight className="size-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />}
            />
            <Row
              icon={LogOut}
              label="Sign out"
              onClick={() => {}}
              control={<ChevronRight className="size-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />}
            />
            <Row icon={Trash2} label="Delete account" destructive last onClick={() => {}} />
          </GroupCard>
        </section>

        <p className="mt-8 text-center text-[11px] text-muted-foreground/80">Verse v1.0.2 (Build 44)</p>
      </div>
    </main>
  );
}
