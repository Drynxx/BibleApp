# Practice Library and Inscribe Session

## Goal
Add a polished discovery library at `/practice` and a focused three-level memorization session at `/inscribe`, using the app’s existing warm editorial style and navigation.

## Practice tab
- Replace the current exercise page with a serif-led **Discover** screen while keeping the shared bottom navigation and Practice selected.
- Add four distinct topical pack cards: Anxiety & Worry, Grief & Loss, Anger & Frustration, and A Need for Direction.
- Give each pack its own semantic color treatment, devotional icon artwork, short description, and verse-count label.
- Add a searchable Bible directory containing all 66 books, grouped into Old and New Testament sections with compact quick-jump browsing.
- Make pack and Bible-book entries open an accessible mobile bottom sheet with a preview, included verse references, and a prominent **Add to Queue** action.
- After adding, provide clear confirmation and a direct way to begin the memorization session.

## Inscribe loop
- Add a full-screen `/inscribe` route without the bottom navigation, with a top-left close control, level indicator, and restrained progress feedback.
- **Level 1 — Stillness:** show the complete verse in large serif typography, calm organic decoration, a short reflection cue, and an **I’m ready** action.
- **Level 2 — Weave:** hide roughly 30% of the verse, provide missing-word and distractor chips, fill blanks in sequence, show correct/incorrect feedback, and allow reset or continuation.
- **Level 3 — Inscription:** focus a visually hidden text input, accept the first letter of each word, reveal words one by one after correct input, reject incorrect letters without advancing, and provide completion feedback.
- Use John 3:16 as the initial session verse so the new flow aligns with the existing Home and Verse Detail screens.
- Route the Home “Start today’s verse,” Verse Detail “Continue practicing,” and discovery preview actions into `/inscribe`; keep the bottom Practice tab pointing to the catalog.

## Interaction and quality
- Preserve keyboard support, visible focus, screen-reader labels, reduced-motion behavior, and comfortable touch targets.
- Keep progress and answer state local to the session for now; no account or database changes.
- Add unique metadata for the new Inscribe screen and retain the existing Practice metadata with discovery-focused wording.
- Verify the complete flow on mobile and desktop: search, preview sheet, queue confirmation, all three levels, close behavior, route links, overflow, and browser errors.

## Technical details
- Use TanStack routes `src/routes/practice.tsx` and `src/routes/inscribe.tsx`.
- Reuse the existing Button and shared BottomNav components; use the installed Vaul drawer primitive or an existing sheet component for the mobile preview.
- Keep all colors tied to existing semantic tokens and create only any missing light-tone semantic tokens in the global design system.
- Implement the 66-book directory as local typed data and keep the session deterministic, with no backend dependency.
