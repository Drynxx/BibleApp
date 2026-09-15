# Profile & Settings Screens

Build two new mobile-first screens in the app's existing visual language: warm ivory background, terracotta primary, sage and muted gold accents, Newsreader (`font-serif`) for names, references and section titles, DM Sans (`font-sans`) for labels, controls and supporting text. Both screens render at the app's narrow reading width (max-w-[573px]), centered on larger screens, with generous editorial spacing matching Discover and Progress.

## 1. Profile screen — `/profile`

The user's personal vault: identity, saved verses, custom packs, reflections. No streaks, badges, or stats beyond one quiet grounding line (motivation stays on Progress).

- Header: "Verse" leaf branding on the left, subtle Settings gear icon button top right linking to `/settings`.
- Identity card: circular avatar with the user's initial on a soft terracotta surface, display name in Newsreader, and one muted line — "Member since March 2024 · 47 verses mastered".
- My Saved Verses: editorial rows (reference in `font-serif`, short two-line excerpt, translation label) — visually consistent with the Bible References rows on Discover.
- My Custom Packs: soft tinted cards (sage / gold / terracotta tones) with a pack name and verse count, e.g. "Verses for my family · 5 verses", plus a quiet "New pack" dashed action.
- My Reflections: private notes from Level 1 (Stillness), shown as soft paper cards with the verse reference and a two-line note preview.
- Shared `BottomNav` remains at the bottom; an avatar/profile icon is added to the Home header so the screen is reachable (gear on Home menu also links here).

## 2. Settings sub-screen — `/settings`

Reached from the gear on Profile. A dedicated screen (not a sheet) with a back arrow and "Settings" title, organized into calm grouped cards, iOS-settings style but in the app's warm editorial aesthetic.

- Group A — Appearance & Accessibility: Theme (Light / Dark / System selector) and Text Size (Small / Medium / Large selector).
- Group B — Language & Practice: App Interface Language (English / Română), Bible Text Language & Version (English – NIV / KJV, Română – VDCC), Daily Nudge toggle with an 8:00 AM time row, Haptic Feedback toggle, Sound Effects toggle.
- Group C — Data & Storage: Export My Data row, Clear Cache row (with current cache size shown muted).
- Group D — Account & Support: Contact Support (mail link), Privacy Policy, Terms of Service, Sign Out, and Delete Account in destructive red.
- Footer: tiny muted version line "Verse v1.0.2 (Build 44)".
- Each group is a softly bordered card with a small uppercase DM Sans group label above it; rows have a left icon, label, and right-side control (toggle, value + chevron, or segmented selector).

## Scope and interaction

- Purely presentational with local state: toggles, selectors and pickers respond visually; no account, notification, or data-export backend is wired in this pass.
- Theme selector applies a `dark` class preview only if it can be done without breaking the existing light-only token setup; otherwise it stays as a visual control — the dark palette tokens already exist in `styles.css`.
- No changes to Progress (streaks and achievements stay there), no changes to the Inscribe flow or Discover behavior.

## Technical details

- New files: `src/routes/profile.tsx`, `src/routes/settings.tsx`, each with its own `head()` metadata (unique title, description, og tags).
- Reuse `BottomNav`, `Button`, existing Sheet not needed; use shadcn `Switch` if present, otherwise a small styled toggle built with tokens.
- Settings gear on Profile uses `Link to="/settings"`; back on Settings returns to `/profile`; Home header gains a profile avatar link.
- All colors via semantic tokens (no hardcoded hex); destructive red uses the existing `--destructive` token.
- Accessibility: labeled switches with `role`/aria, 44px touch targets, keyboard focus rings, reduced-motion respected.
- Verify with Playwright at 573×891 and 955×891: both screens render, gear/back navigation works, toggles and selectors update, no horizontal overflow, no console errors.
