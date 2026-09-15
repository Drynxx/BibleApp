# Inscribe: Interactive Onboarding & Deferred Login Plan

## Overview
This document outlines the architecture for Inscribe's new onboarding flow. We are moving away from a hard login wall to a **Deferred Onboarding** model (similar to Duolingo, but adapted to Inscribe's reverent aesthetic). 

**The core loop:** Auto-detect language -> Ask user intent -> Choose translation -> Complete a mini-lesson -> Create account to save progress.

---

## Phase 1: Language & Localization Strategy
The app must feel frictionless from the first second.
1. **Auto-Detection:** Use `expo-localization` (`Localization.getLocales()[0].languageCode`) to detect if the phone is `en` or `ro`.
2. **Initialization:** Pass the detected language into `i18next` so the app immediately renders in the user's native language.
3. **Manual Override:** Place a subtle "Globe" icon in the top right of the Welcome screen for users who want to manually switch languages before starting.

---

## Phase 2: The Onboarding Flow (Expo Router Architecture)
Create a new route group: `app/(onboarding)/`. This flow will use a stack navigator with smooth cross-fade animations, removing default headers.

### Screen 1: The Hook (`welcome.tsx`)
- **Visuals:** Full-screen looping video (`Paper_pages_rustling_in_breeze...mp4`).
- **UI:** 
  - Title: "Inscribe" (Newsreader, large).
  - Subtitle: "Small Steps. Deeper Faith." (DMSans, uppercase, letter-spaced).
- **Actions:** 
  - Primary Button: **"Begin Journey"** (Navigates to `intent.tsx`).
  - Secondary Link (Bottom): *"Already have an account? Log in"* (Navigates to the standard login screen).

### Screen 2: Personalization (`intent.tsx`)
- **Visuals:** Warm paper background (`Palette.background`). No video.
- **UI:** "What brings you to Inscribe today?"
- **Options (Selectable Cards):**
  1. "I want to memorize Scripture."
  2. "I'm looking for daily peace."
  3. "I want to build a habit with a friend."
- **Actions:** Tapping an option plays a soft haptic tick and auto-advances to the next screen.

### Screen 3: Translation Choice (`translation.tsx`)
- **Visuals:** Same warm background.
- **UI:** "Which voice resonates with you?"
- **Dynamic Options:** 
  - If language is English: "World English Bible (Modern)", "King James Version (Classic)".
  - If language is Romanian: "Dumitru Cornilescu (VDCC)", "Noua Traducere (NTR)".
- **Actions:** Tapping an option saves the choice to local state and advances.

### Screen 4: The Aha! Moment (`mini-lesson.tsx`)
- **Visuals:** A simplified version of your `practice.tsx` screen.
- **UI:** "Let’s try a daily practice. Tap the missing words."
- **Mechanic:** Display a famous, pre-loaded verse (e.g., John 3:16). Blank out 2 words. Provide 4 options at the bottom. 
- **Feedback:** When the user taps the correct words, trigger `Haptics.notificationAsync(Success)`.
- **Actions:** Once completed, a "Continue" button appears, advancing to the signup wall.

### Screen 5: The Login Wall (`signup.tsx`)
- **Visuals:** A celebratory screen. A gold Flame icon appears in the center.
- **UI:** "You’ve taken your first step. Create an account to save your streak and invite a companion to your Cord."
- **Actions:** 
  - Google Sign-In Button.
  - Email OTP Input.
  - When authentication completes, write the user's chosen Translation to their Supabase profile, and route them to `app/(tabs)/index.tsx`.

---

## Phase 3: State Management
During the `(onboarding)` flow, the user is not authenticated yet. 
- **Temporary State:** Use React Context (or simply Expo Router `params`) to pass their `intent` and `translation` choices from screen to screen.
- **Final Commit:** Only push these choices to Supabase (e.g., updating the `profiles` table with their preferred `translation` and `locale`) *after* the user successfully signs in on Screen 5.

---

## Phase 4: Strict Design Rules
- **No Gamified Progress Bars:** Do not use loud loading bars. Use subtle pagination dots or rely entirely on smooth `FadeIn` / `FadeOut` animations using `react-native-reanimated`.
- **Haptics:** Use `Haptics.ImpactFeedbackStyle.Light` for button selections to make the app feel tactile and premium.
- **Typography:** Strictly use `Newsreader` for questions and `DMSans` for button labels.
- **Whitespace:** Keep the interface extremely clean. Only one question per screen, vertically and horizontally centered.
