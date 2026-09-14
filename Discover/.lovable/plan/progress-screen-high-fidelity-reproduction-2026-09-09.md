# Progress screen — high-fidelity reproduction

Rebuild the existing `/progress` screen to closely match the supplied mobile reference while keeping the current Verse design system and shared navigation.

## Screen structure

- Add the Verse brand header with leaf mark, tagline, overflow action, and generous top spacing.
- Create the large progress summary: **47 verses memorized**, supporting message, and a subtle botanical “Grow in His Word” illustration built from CSS/icons rather than embedding the reference image.
- Reproduce the **Practice Days** panel with November 2024 controls, weekday labels, a five-row activity-dot calendar, and the right-side monthly totals and consistency message.
- Add an **Achievements** section with four distinct illustrated tiles: 7-Day Streak, First Book Complete, Night Owl, and Psalms Master.
- Add a **Recently Mastered** panel listing Philippians 4:13, Psalm 23:1, and Jeremiah 29:11 with completion marks and row arrows.
- Keep the shared Home / Practice / Progress navigation, with Progress visibly selected.

## Fidelity and responsive behavior

- Match the reference’s warm ivory background, terracotta accents, muted gold and sage details, serif achievement labels, soft borders, compact shadows, and spacing hierarchy.
- Prioritize the narrow mobile composition shown in the reference; adapt the sections cleanly for wider screens without stretching cards excessively.
- Keep all controls readable and touch-friendly, prevent text or artwork overlap, and respect reduced-motion preferences.

## Interactions

- Month arrows update the visible month label while retaining the same demonstration activity pattern.
- “See all” links and mastered rows provide polished press/focus feedback without inventing destination screens.
- Header overflow remains an accessible visual control consistent with the other screens.

## Technical details

- Update only the Progress route and, if required, shared semantic color tokens.
- Reuse the existing shared bottom navigation and Button component conventions.
- Use Lucide icons and CSS shapes for the decorative artwork; the uploaded screenshot remains reference-only.
- Preserve route-specific title, description, Open Graph, and Twitter metadata.

## Verification

- Compare the rendered screen against the reference at a mobile viewport.
- Confirm the month controls and navigation work, there is no horizontal overflow, and no browser console errors occur.
- Check a wide viewport to ensure the layout remains balanced and readable.
