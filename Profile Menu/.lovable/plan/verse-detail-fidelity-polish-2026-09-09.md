# Verse Detail — fidelity polish

The Verse Detail screen already exists at `/verse`. This pass tightens it against the reference image rather than rebuilding it.

## Changes

- **Header**: reduce back-arrow/title gap so the title sits close to the arrow (left-aligned, not centered); lighter weight, size ~20px.
- **Reference chip**: keep the gold pill and the thin divider, but tighten padding so the chip height matches the reference.
- **Verse text**: serif, slightly larger line-height and a touch lighter weight so the large paragraph reads as in the reference.
- **Progress card**: reduce the ring to ~96px, thin the track, and keep the vertical divider before "60% memorized" / "KEEP GOING".
- **Reflection card**: soften the artwork — one warm sun circle top-right and two low, wide mountain shapes anchored bottom-right, all clipped inside the rounded card.
- **Continue practicing button**: centered label with the arrow pinned to the right edge, full-width pill in terracotta.

## Behaviour (unchanged)

- Back arrow returns to the previous screen.
- Progress ring animates once to 60% on load, respecting reduced-motion.
- Button navigates to `/practice`.

## Verification

Screenshot at mobile width and compare against the reference; confirm no overflow and no console errors.
