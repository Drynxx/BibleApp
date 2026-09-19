# Architecture Plan: Home Screen Refactor

## Overview
This plan outlines the refactoring of the Home screen (`app/(tabs)/index.tsx`) to implement a clear "Separation of Concerns" UX. We will decouple the "Verse of the Day" from the "Practice Queue", mapping the correct data to the correct existing UI components.

**CRITICAL RULE:** Do NOT alter the visual design, colors, or layout structure of `index.tsx`. Strictly modify the data binding, state, and routing logic of the existing components.

---

## Phase 1: The Top Card ("Today's Verse")
This card must become strictly for daily inspiration, entirely ignoring the practice queue.
1. **Data Binding:** Fetch the verse strictly from the Verse of the Day logic (e.g., `discoverService.getVerseOfTheDay()`). Do not fetch this from `QueueManager`.
2. **Action:** Tapping this card should ideally open a clean reading view (or a modal), NOT the active recall practice screen. (If reading view doesn't exist yet, leave the `onPress` empty for now with a comment).

---

## Phase 2: "Continue your journey" Cards (The Queue)
These horizontal cards must be converted from hardcoded categories into the user's actual Spaced Repetition (SRS) queue.
1. **Fetch Data:** 
   - Update `QueueManager` to include a method `getActiveQueue(userId)` that returns an array of the user's verses currently in the `practice_queue` (limit to 3-5 items for the home screen).
2. **Data Binding:** 
   - Map over this array to render the existing card components under "Continue your journey".
   - Replace the generic titles (e.g., "Psalms of Comfort") with the actual verse references (e.g., "John 3:16", "Romans 8:28").
   - If the existing card has a progress ring or percentage, map it to the verse's `ease_factor` or mastery level.
3. **Action:** 
   - Tapping one of these specific cards must route the user to the `practice.tsx` screen, passing the specific `book`, `chapter`, and `verse` parameters so the engine knows which verse to test them on.

---

## Phase 3: The "See all" Button Routing
1. **Locate:** Find the "See all" text/button next to the "Continue your journey" header.
2. **Action:** Wire its `onPress` event using Expo Router:
   ```typescript
   import { router } from 'expo-router';
   // inside onPress:
   router.push('/(tabs)/discover');
   ```
3. **Result:** This creates the perfect loop, sending users to the Discover screen to find more verses to add to their newly configured Queue cards.
