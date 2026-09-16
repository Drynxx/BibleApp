# Phase 1: State Management & Data-Driven UI Refactor

## Overview
Currently, the UI screens (`index.tsx`, `practice.tsx`, `verse.tsx`) contain hardcoded strings and numbers (e.g., "John 3:16", "12 day streak"). Before we connect SQLite and Supabase, we must abstract this data into a "Middleman" layer using React Hooks. 

By making the UI "Data-Driven", the screens will simply read variables. When we plug in the real databases in Phase 2, the UI code won't need to change at all.

---

## Step 1: Define the Data Models
Create a new file `src/types/models.ts` to define the shape of our data.

```typescript
// src/types/models.ts
export interface BibleVerse {
  bookId: number;
  chapter: number;
  verse: number;
  reference: string; // e.g., "John 3:16"
  text: string;
}

export interface PracticeSession {
  verse: BibleVerse;
  masteryPercentage: number;
}

export interface UserProgress {
  currentStreak: number;
  longestStreak: number;
  isDoneToday: boolean;
  savedCollections: Array<{ title: string; count: number; iconId: string }>;
}
```

---

## Step 2: Create the "Middleman" Hooks
Create a `src/hooks/` directory. We will build hooks that return hardcoded data *for now*, acting as placeholders for the databases.

### 1. `useDailyPractice.ts`
Create `src/hooks/useDailyPractice.ts`:
- **Functionality:** Export a hook `useDailyPractice()`.
- **Mock Data:** Have it return a mock `PracticeSession` object (e.g., John 3:16, 60% mastery).
- **Future use:** In Phase 2, this hook will ask Supabase what verse is queued today, and then ask SQLite for the text.

### 2. `useUserProgress.ts`
Create `src/hooks/useUserProgress.ts`:
- **Functionality:** Export a hook `useUserProgress()`.
- **Mock Data:** Return a mock `UserProgress` object (e.g., 12 day streak, false for `isDoneToday`, and mock array for collections).
- **Future use:** This will connect to `covenantContext.tsx` and the `saved_verses` Supabase table.

---

## Step 3: Refactor the UI Screens
Go through the main screens and rip out the hardcoded text. Replace them with the variables provided by the new hooks.

### 1. `app/(tabs)/index.tsx` (Home Screen)
- Import `useDailyPractice` and `useUserProgress`.
- **Replace Streak Numbers:** Swap the hardcoded `12` with `progress.currentStreak`.
- **Replace Verse Card:** Swap "JOHN 3:16" and the quote with `practice.verse.reference` and `practice.verse.text`.
- **Replace Collections Grid:** Map over `progress.savedCollections` instead of the hardcoded `collections` array at the top of the file.
- **Dynamic CTA Button:** If `progress.isDoneToday` is true, change the CTA to "Completed" (solid primary color).

### 2. `app/verse.tsx` (Verse Detail)
- Import `useDailyPractice`.
- Replace the static "JOHN 3:16" and text with the variables from the hook.
- Bind the progress ring (currently hardcoded to `60`) to `practice.masteryPercentage`.

### 3. `app/(tabs)/practice.tsx` (Active Recall Drill)
- Remove the massive hardcoded `verses` object at the top of the file.
- Import `useDailyPractice`.
- **Temporary Adapter:** Since the Active Recall Engine isn't built yet, you can temporarily have the hook return the `before`, `middle`, `after` structure, OR manually split the `practice.verse.text` string inside the component just to keep it rendering.

---

## Strict Rules for this Phase
- **No Database Code Yet:** Do not import `expo-sqlite` or `supabase` in this phase. The goal is strictly architectural decoupling.
- **Maintain Styling:** Ensure that passing data through variables does not break the layout, text wrapping, or spacing defined by the `Palette` and `Typography` constants.
- **TypeScript Strictness:** Ensure all variables pulled from the hooks conform to the interfaces defined in `models.ts`.

---
*Once this plan is executed, the app's UI will be completely dynamic and ready to be plugged into the SQLite database in Phase 2.*
