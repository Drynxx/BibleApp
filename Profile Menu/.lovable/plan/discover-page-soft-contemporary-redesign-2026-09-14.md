# Discover Page — Soft Contemporary Redesign

## Goal
Modernize `/practice` using the selected **Artisan earth discovery** structure while preserving the current warm ivory, terracotta, sage, and muted-gold palette. The result should feel calm and premium rather than playful.

## Page structure
- Keep the page as a centered, single-column mobile experience that scales cleanly on larger screens.
- Use a clean left-aligned **Discover** header with no profile button.
- Move the book search directly beneath the introduction so discovery starts with a clear, useful action.
- Add a compact horizontal topic selector for quick filtering, styled with restrained capsules rather than oversized playful pills.
- Retain the topical packs as full-width tinted rows, but make them flatter and more structured: smaller line icons, moderate corners, subtle borders, consistent metadata alignment, and minimal shadow.
- Keep **Browse by Book**, quick-jump books, the expandable 66-book directory, and the existing search behavior.
- Preserve the fixed John 3:16 queue tray and existing preview sheet without changing their actions.

## Visual direction
- Keep all current semantic colors and use tint variations only for hierarchy.
- Adopt Outfit for headings and Figtree for body/interface text across this page, loaded through the existing document font setup.
- Reduce circular decoration, oversized icon containers, heavy rounding, and badge-like elements.
- Use more disciplined spacing, thinner outlines, quieter surfaces, and stronger typographic hierarchy.
- Keep the page warm and approachable, but avoid playful illustrations, bouncy motion, floating decoration, or childlike styling.
- Use subtle press, focus, and sheet transitions while honoring reduced-motion preferences.

## Navigation and behavior
- Keep the current Home / Discover / Progress navigation bar and its existing routes.
- Refine only its visual treatment as needed to harmonize with the updated page; do not replace its structure.
- Preserve pack selection, book selection, search, See all/Show less, Add to Queue, Begin now, and `/inscribe` navigation.

## Responsive and accessibility
- Maintain generous touch targets, visible keyboard focus, readable contrast, safe-area spacing, and screen-reader labels.
- Ensure the queue tray and navigation never obscure content.
- Prevent clipped titles, pills, or book labels at narrow mobile widths and avoid stretching the mobile composition excessively on desktop.

## Verification
- Compare the updated page at 573 × 891 and the current 955 × 891 preview size.
- Test topic selection, search, See all/Show less, pack and book previews, queue actions, and all navigation links.
- Check text fit, horizontal overflow, fixed-area overlap, reduced motion, and browser errors.

## Technical details
- Update `src/routes/practice.tsx` for the revised composition and styling while retaining its state and interactions.
- Update `src/components/BottomNav.tsx` only where necessary for visual cohesion.
- Update `src/styles.css` and the root font links for Outfit/Figtree and any reusable semantic surface or shadow tokens.
- Preserve the route’s existing metadata.
