# Improve Upper Profile Information

Refine only the upper section of the Profile page, preserving the existing personal-library feed and navigation.

## Design

- Keep the warm editorial palette: ivory background, terracotta primary accent, muted gold details, and deep warm text.
- Give the identity area a compact dashboard-like structure with clearer grouping and stronger visual hierarchy.
- Retain the Verse brand and settings button, but refine their alignment and visual weight.
- Make the avatar, “Mattias,” membership date, and mastered-verses count easier to scan.
- Separate the membership date and mastery count into concise supporting details instead of one long sentence.
- Refine the Saved verses / My packs / Reflections switcher into a more polished, evenly balanced control that clearly indicates the active view.
- Preserve the existing content, settings link, filter behavior, feed cards, and bottom navigation.

## Typography

- Use Libre Baskerville for the profile name and prominent identity values.
- Use IBM Plex Sans for labels, metadata, and controls.
- Load these fonts through the document head and register them as semantic design tokens without changing typography elsewhere in the app.

## Interaction and accessibility

- Keep the settings action and all three library filters keyboard accessible.
- Preserve the existing tab semantics and focus states.
- Use restrained transitions with reduced-motion support.
- Maintain comfortable touch targets and prevent the upper area from crowding the feed on short mobile screens.

## Validation

- Verify the Profile page at 509×878 and 955×891.
- Confirm all library filters and the settings link still work.
- Check keyboard focus, labels, horizontal overflow, bottom-navigation clearance, and browser errors.
