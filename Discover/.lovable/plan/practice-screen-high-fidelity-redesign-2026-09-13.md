# Practice Screen High-Fidelity Redesign

## Goal
Rebuild `/practice` as a close visual match to the supplied mobile reference, using the screenshot only as a design guide while preserving the app’s working discovery, search, preview, queue, and navigation behavior.

## Screen composition
- Match the reference’s warm ivory canvas, narrow mobile reading width, spacing, and vertical rhythm.
- Use the existing Newsreader serif for the large **Discover** heading and DM Sans for interface text.
- Add the subtitle: **Explore topics and books to grow in God’s word.**
- Replace the current card grid with full-width horizontal topical rows featuring soft tinted surfaces, circular line-art icons, title, two-line description, verse-count pill, and right chevron.
- Show Anxiety & Worry, Grief & Loss, and A Need for Direction in the first viewport; retain Anger & Frustration immediately below so all requested packs remain available.
- Recreate **Browse by Book**, the terracotta **See all** action, the large rounded search field, and a two-row four-column quick-jump book grid matching the reference labels.
- Keep all 66 books accessible through search and the expanded directory opened by **See all**.

## Queue and navigation
- Add the elevated bottom queue tray shown in the reference with John 3:16, a one-line verse preview, drag handle, and prominent terracotta **Add to Queue** button.
- Preserve the existing pack/book preview sheet; tapping a pack or book opens it, and queue actions continue into `/inscribe`.
- Restyle the shared bottom navigation for this screen to match the reference: Home, Discover, and Progress, with Discover highlighted by a pale terracotta capsule and filled leaf mark.
- Keep safe-area spacing and ensure the queue tray and navigation never cover scrollable content.

## Visual fidelity
- Extend semantic design tokens for the selected reference palette: ivory `#FBF7EF`, terracotta `#D34D25`, sage `#789268`, and muted gold `#D9A432`, represented as OKLCH values in the global design system.
- Match the screenshot’s soft shadows, rounded corners, compact uppercase labels, icon weights, card heights, and subdued brown body copy.
- Use CSS and icon components for the botanical, leaf, and sun artwork; do not embed the screenshot.
- Keep motion restrained to subtle press feedback and bottom-sheet transitions, honoring reduced-motion settings.

## Responsive behavior
- Prioritize a high-fidelity match at the supplied 573 × 891 mobile viewport.
- On larger screens, center the same mobile composition rather than stretching cards into a desktop grid.
- Prevent clipped labels, overlapping fixed regions, horizontal overflow, and inaccessible touch targets.

## Verification
- Compare the finished `/practice` screen against the reference at 573 × 891.
- Test pack selection, book selection, search, See all, preview sheet, Add to Queue, `/inscribe` link, and all three navigation items.
- Check mobile and desktop rendering, safe-area behavior, keyboard focus, text fit, overflow, metadata, and browser errors.

## Technical details
- Update `src/routes/practice.tsx` for the new composition and interactions.
- Update `src/components/BottomNav.tsx` only as needed to support the reference-specific active Discover treatment without regressing Home or Progress.
- Add or refine semantic color/shadow tokens in `src/styles.css`; keep all component colors token-based.
- Preserve the route’s existing unique title, description, Open Graph metadata, and Twitter card metadata.
