# Profile Tab & Settings UX Plan (Finalized)

To keep the app feeling deeply personal and free from administrative clutter, we divide the user's data into two distinct spaces: the **Profile Tab** (their personal library) and the **Settings Sub-Screen** (the control room).

*Note: Motivation, streaks, accountability partners, and badges/achievements live exclusively on the **Progress Tab**.*

---

## 1. The Main Profile Screen (Identity & Library)

The Profile screen is the user's personal vault. It should be beautiful, clean, and highly encouraging.

- **The Header:** Minimalist, with a subtle **Settings Gear icon** (`<Settings />`) in the top right corner.
- **Identity Card:** 
  - Avatar (Initial or uploaded photo).
  - Display Name.
  - A subtle "Member since [Date]" or "Total Verses Mastered: [Number]" to ground their identity.
- **My Saved Verses (Bookmarks):** A list/grid of scriptures the user has intentionally saved because they love them, separate from their memorization queue.
- **My Custom Packs (Optional):** If users want to create their own custom collections of verses (e.g., "Verses for my family").
- **My Reflections / Notes:** A private space where they can view the thoughts or notes they've jotted down while meditating on Level 1 (The Stillness).

---

## 2. The Settings Sub-Screen (The Gear Icon)

When the user taps the Gear icon, a new screen or Bottom Sheet slides up. This houses all technical and administrative options, grouped logically into "Cards" (similar to iOS system settings).

### Group A: Appearance & Accessibility
*Crucial for a reading-heavy app.*
- **Theme:** Dark / Light / System Default (Critical for night reading).
- **Text Size:** Small / Medium / Large (Accessibility for visually impaired or older users).

### Group B: Language & Practice Preferences
*Controls the core language and mechanics of the app.*
- **App Interface Language:** Set the language for buttons, menus, and UI (e.g., English vs. Română).
- **Bible Text Language:** Set the language and version for the actual scripture text (e.g., English - KJV, Romanian - VDCC).
- **Daily Nudge:** Toggle push notifications and select a time (e.g., "Remind me at 8:00 AM").
- **Haptic Feedback:** Toggle vibrations on/off for a silent experience.
- **Sound Effects (Optional):** Toggle soft chimes/clicks for verse mastery.

### Group C: Data & Storage
*Ensures users feel ownership over their progress.*
- **Export My Data:** Download a text file of their Saved and Mastered verses.
- **Clear Cache:** Free up device storage without losing account data.

### Group D: Account & Support
*Administrative and App Store requirements.*
- **Contact Support:** Opens an email draft to report bugs or suggest features.
- **Privacy Policy & Terms of Service:** Links to web pages (Required by Apple/Google).
- **Sign Out:** Log out of the current session.
- **Delete Account:** Destructive red text. (Strictly required by Apple App Store guidelines for apps with user accounts).

### Footer
- **App Version:** Tiny, muted text at the very bottom (e.g., *v1.0.2 (Build 44)*) to assist with bug reporting.
