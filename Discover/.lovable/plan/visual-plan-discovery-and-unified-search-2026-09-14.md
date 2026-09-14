# Visual Plan Discovery and Unified Search

## Goal
Restructure `/practice` around immersive square plan cards inspired by the selected **Editorial Discovery Grid**, while preserving the app’s mobile width, Outfit/Figtree typography, warm ivory/terracotta/sage/gold palette, queue tray, and navigation.

## Discovery flow
- Keep the mobile app composition centered at the current maximum width rather than expanding into a desktop grid.
- Retain the left-aligned **Discover** title and supporting sentence.
- Make search the main entry point with the prompt **Search plans, books, or verses…**.
- Keep compact topic filters for fast browsing, using the current restrained visual treatment.
- Replace horizontal tinted plan rows with one large, nearly full-width square plan card per row.
- Give every plan a distinct abstract texture image using the locked palette and tactile paper, stone, light, and painted-surface direction.
- Overlay each image with a controlled dark fade, plan type, verse count, title, and short description, preserving strong contrast.
- Keep all four existing topics and their preview-sheet and queue behavior.

## Unified search
- Search across plan titles, plan descriptions, plan verse references, all 66 Bible-book names, and a curated set of available verse references/text.
- While a query is present, replace the normal discovery feed with one continuous results view grouped in sequence: matching plans, matching Bible books, then matching verses.
- Use square visual cards for matching plans, compact editorial rows for books, and readable scripture cards for verses.
- Selecting a plan opens its existing preview sheet; selecting a book opens its existing book preview; selecting a verse opens a matching preview that can be added to the queue.
- Include a clear no-results state and a one-tap way to clear the query.
- Keep results local to the current available content; do not add remote search or backend work.

## Existing controls
- Preserve the current Home / Discover / Progress navigation exactly in structure and route behavior.
- Preserve the fixed John 3:16 queue tray, **Add to Queue**, **Begin now**, preview sheet, and `/inscribe` link.
- Keep the expandable 66-book directory available beneath the visual plans when no search is active.

## Visual and interaction details
- Use Outfit for headings and Figtree for interface text, with the existing semantic color tokens.
- Generate four cohesive abstract texture assets for Anxiety & Worry, Grief & Loss, A Need for Direction, and Anger & Frustration; do not embed the reference screenshot.
- Favor moderate corners, subtle borders, restrained shadows, and quiet transitions rather than playful shapes or illustration.
- Keep image overlays readable and expose descriptive alternative text for each visual.
- Honor reduced-motion preferences and maintain visible keyboard focus.

## Responsive and accessibility
- Optimize first for the current mobile app width and 573 × 891 reference viewport.
- Center the same single-column app on larger screens without widening cards into a multi-column layout.
- Maintain safe-area spacing so search results, square cards, the queue tray, and bottom navigation never overlap incoherently.
- Ensure long plan names, book names, and verse text wrap or truncate cleanly without horizontal overflow.

## Verification
- Test default discovery, each topic filter, and all four plan previews.
- Search by a plan topic, Bible book, verse reference, and words from a verse; verify each result group and selection behavior.
- Test clearing search, no-results behavior, 66-book expansion, queue actions, `/inscribe`, and all navigation links.
- Check 573 × 891 and 955 × 891 rendering, keyboard focus, text contrast, overflow, reduced motion, image loading, and browser errors.

## Technical details
- Update `src/routes/practice.tsx` to define searchable local plan/book/verse data and render the discovery or unified-results state.
- Add generated texture images through the project asset flow and import them into the route.
- Adjust `src/styles.css` only if reusable image-overlay or surface tokens are needed; preserve existing global palette and fonts.
- Leave `src/components/BottomNav.tsx` unchanged unless verification reveals a layout regression.
- Preserve the route’s existing metadata.
