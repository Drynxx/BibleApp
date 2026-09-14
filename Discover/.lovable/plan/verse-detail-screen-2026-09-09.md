# Verse Detail screen

## Goal
Recreate the supplied Verse Detail reference with high fidelity, matching the existing warm ivory / terracotta / gold look already used on Home and Practice.

## What will be built
A new Verse Detail page reached from the daily verse card on Home and from the collection cards, containing, top to bottom:

- A slim top bar: back arrow, centered-left "Verse Detail" title, overflow menu on the right.
- A gold reference chip reading "JOHN 3:16", a thin divider, and a muted "NIV" translation label.
- The full verse in large serif type, exactly as shown in the reference.
- A memorization progress card: a circular ring showing 60% with the percentage inside, a vertical divider, then "60% memorized" and a small gold "KEEP GOING" label.
- A reflection card on warm paper tone with a leaf mark, "REFLECTION" label, two lines of reflection text, and soft sun/mountain artwork drawn in CSS on the right.
- A full-width terracotta "Continue practicing" button with a trailing arrow that opens the Practice screen.

## Behavior
- Back arrow returns to the previous screen (falls back to Home).
- Progress ring animates once from empty to 60% on load, respecting reduced-motion.
- Continue practicing navigates to Practice.
- The bottom navigation bar is intentionally not shown on this screen, matching the reference.

## Visual notes
- Same tokens already in the design system: ivory background, near-black serif verse text, terracotta primary, muted gold accents.
- Rounded cards with hairline borders and very soft shadows; generous vertical rhythm.
- Reference chip, uppercase micro-labels, and letter spacing matched to the reference.

## Technical details
- New route file `src/routes/verse.tsx` with its own page title, description, Open Graph and Twitter metadata.
- Progress ring built as an inline SVG with stroke-dasharray, no new dependency.
- Reflection artwork built from CSS shapes plus an existing leaf icon; the uploaded screenshot is used as reference only, never embedded.
- Link the daily verse card and the collection cards on Home to this screen.
- Verify at phone and desktop widths for overflow, contrast, and button behavior.

## Assumption
Verse content, 60% progress, and the reflection text are taken from the reference image and remain easy to swap later.
