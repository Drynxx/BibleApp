# Mobile-first Bible memorization home screen

## Goal
Recreate the supplied reference as a polished home screen for a Duolingo-style Bible verse memorization app. Keep its warm, calm, editorial character and familiar information hierarchy while adapting the content and actions to active memorization.

## What will be built
- A compact header with the temporary **Verse** wordmark, short faith-focused tagline, and overflow menu.
- Personalized morning greeting and current practice streak.
- A seven-day consistency panel with completed, current, and upcoming day states.
- A featured daily verse card using John 3:16, with restrained botanical and landscape artwork inspired by the reference.
- A prominent “Start today’s verse” action with clear pressed and focus states.
- A “Continue your journey” row with three study collections: Psalms of Comfort, Fruit of the Spirit, and Proverbs Wisdom.
- A fixed mobile navigation bar for Home, Practice, and Progress; only Home will be fully implemented in this version.
- Responsive behavior that closely matches the phone reference and remains composed on tablets and desktop.

## Visual direction
- Warm ivory background, near-black typography, terracotta action color, muted gold details, and soft botanical greens.
- Refined serif type for Scripture and collection titles; clean sans-serif type for navigation, labels, and progress.
- Soft paper texture, delicate line illustrations, subtle borders, low-elevation shadows, and restrained corner rounding.
- Gentle entrance and press feedback only, with reduced-motion support.
- Original CSS-built decorative artwork rather than embedding the uploaded screenshot.

## Interaction and UX
- The primary action will provide immediate visual feedback and reveal a lightweight practice-ready state without adding another full screen.
- Collection cards and navigation items will be keyboard accessible and communicate inactive destinations clearly.
- Touch targets, contrast, text sizing, safe-area spacing, and fixed navigation clearance will be optimized for mobile use.

## Technical details
- Replace the placeholder at `/` with the complete React home screen.
- Define all palette, typography, shadow, and radius values as semantic tokens in the global design system.
- Add app-specific page title, description, Open Graph metadata, and Twitter card metadata.
- Load the selected web fonts through the document head.
- Verify the finished screen at phone and desktop sizes, checking overflow, navigation clearance, and interactive states.

## Assumption
The supplied **Verse** name and sample Scripture content will be used for this first version because no final brand name or content set was provided; both will remain easy to replace later.
