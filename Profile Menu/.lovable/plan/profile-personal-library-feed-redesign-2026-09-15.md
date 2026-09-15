# Profile — Personal Library Feed Redesign

Redesign `/profile` using the reference’s clear feed structure while keeping Verse’s warm ivory, terracotta, sage, muted-gold palette and the same Newsreader + DM Sans typography.

## Structure

- Keep the compact Verse header, circular initial avatar, name, membership line, and Settings gear.
- Introduce a restrained three-part filter directly below the identity area: **Saved Verses**, **My Packs**, and **Reflections**.
- Use a precise terracotta underline or softly tinted selected state rather than playful pills.
- Show one filtered category at a time, creating a focused personal-library experience without mixing administrative controls into the page.
- Preserve the existing Home / Discover / Progress navigation exactly as it is.

## Saved Verses feed

- Present saved passages as large editorial cards rather than compact table rows.
- Each card includes the Bible reference as the strongest element, translation, saved date, a subtle private indicator, and a generous scripture excerpt.
- Add quiet icon actions for opening the verse and removing it from Saved; avoid social likes, comments, or public-feed behavior from the reference.
- Use a restrained tinted edge or vertical rule to frame scripture without making the cards heavy.

## My Packs feed

- Give each custom pack a large visual card using the app’s existing plan artwork language and soft sage, gold, or terracotta accents.
- Show pack title, verse count, short purpose line, and a clear chevron/open action.
- Keep **New pack** as a quieter dashed action after the saved packs.

## Reflections feed

- Present private reflections as paper-like editorial cards with reference, date, private label, and a longer two-to-three-line note preview.
- Use Newsreader italics selectively for personal writing while keeping labels and actions in DM Sans.
- Opening a reflection remains presentational in this pass unless an existing destination already exists.

## Visual and interaction details

- Maintain the current narrow mobile reading width and centered desktop presentation.
- Use larger cards, clearer section rhythm, subtle borders, modest elevation, and 8px-or-less card corners where practical.
- Keep the page calm and personal: no streaks, badges, achievements, accountability, or activity-feed language.
- Filter changes update locally and preserve keyboard focus, visible focus rings, screen-reader labels, 44px touch targets, and reduced-motion behavior.
- Add a concise empty state for any category with no content.

## Validation

- Verify the three filters and Settings navigation at the current mobile viewport and a wider viewport.
- Confirm large cards remain readable, the bottom navigation does not cover content, and there is no horizontal overflow.
- Check keyboard navigation, accessible labels, reduced motion, and browser console errors.
