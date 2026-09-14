# Overflow Menu (3-Dot) Strategy

This document outlines the strategic placement and functionality of the "MoreVertical" (3-dot / kebab) menu across the Inscribe app. 

In a minimalist, typography-driven app, every button competes for attention. The overflow menu acts as an elegant "drawer" for secondary or destructive actions, keeping the main interface clean and calming.

## 1. Where to USE the Overflow Menu

### A. The Verse Detail / Inscribe Loop (`app/verse.tsx` & `app/inscribe.tsx`)
This is the most critical place for the 3-dot menu. While a user is actively reading or learning a verse, they may need to manage it without cluttering the reading view with buttons.

**Menu Actions:**
- **Share:** "Send this beautiful verse to a friend." (Triggers native share sheet).
- **Change Translation:** "Switch this specific verse from KJV to VDCC."
- **Reset Progress:** "I totally forgot this one; drop it back to Step 1."
- **Remove from Queue (Destructive):** "I no longer want to memorize this verse." (Should prompt a confirmation).

### B. The Progress / Covenant Tab (`app/(tabs)/progress.tsx`)
Located in the top right corner of the active Covenant/Partner card (or the top header), this menu handles social and accountability management.

**Menu Actions:**
- **Share Milestone:** "Generate a beautiful image of our 30-Day Streak for Instagram/WhatsApp."
- **Nudge Partner:** "Send a gentle reminder to practice today."
- **Manage Partner (Destructive):** "Disconnect from this accountability partner."

## 2. Where to AVOID the Overflow Menu

To maintain intense focus on certain screens, we explicitly avoid using the overflow menu in these locations:

- **The Home Tab (`index.tsx`):** The dashboard must remain hyper-focused. The user is here to press one button: "Start Daily Practice".
- **The Discover Tab (`discover.tsx`):** Users are browsing here. Any actions should be direct (e.g., tapping a pack, clicking "Add to Queue"). 
- **The Profile Tab (`profile.tsx`):** Settings and log out actions should be explicitly laid out as list items, not hidden behind a menu.

## 3. UI/UX Implementation Notes

For a premium feel, **do not use standard generic dropdown menus**. 

When a user taps the 3-dot icon (`<MoreVertical />`), it should trigger a **Bottom Sheet** (reusing the same smooth `BottomSheet` component built for the Discover tab). 
- The Bottom Sheet allows for large, tap-friendly rows.
- Destructive actions (like "Remove from Queue") should have their text colored in `Palette.destructive` (Red) to clearly indicate their severity.
