# Architecture Plan: Spaced Repetition Queue (SRS)

## Overview
This plan outlines the system for users to discover verses, add them to a queue, and practice them using a Spaced Repetition System (SRS). The algorithm ensures that users review verses just before they are about to forget them, mixing new verses with older ones.

---

## Phase 1: Supabase Database Schema
We need a new table in Supabase to track each user's unique memorization journey.

**Table: `practice_queue`**
- `id` (uuid, primary key)
- `user_id` (uuid, references `profiles.id`)
- `book` (integer)
- `chapter` (integer)
- `verse` (integer)
- `status` (text) - e.g., `'queued'`, `'learning'`, `'graduated'`
- `interval_days` (integer) - Default: `0`. Days until next review.
- `ease_factor` (float) - Default: `2.5`. How easy it is for the user.
- `next_review_at` (timestamptz) - Default: `NOW()`. When it should be practiced next.
- `created_at` (timestamptz)

---

## Phase 2: Discover Screen ("Add to Queue")
When a user is browsing the Discover screen (e.g., looking at "Psalms of Comfort"):
1. The UI displays verses fetched from `VerseRepository` (SQLite).
2. Next to each verse is an **"Add to Queue"** button.
3. **Action:** Tapping it executes an RPC or Insert to Supabase:
   ```javascript
   supabase.from('practice_queue').insert({
     user_id: currentUser.id,
     book: 43, chapter: 3, verse: 16
     // Defaults kick in: next_review_at is set to TODAY.
   })
   ```
4. The button turns into a green checkmark indicating it is queued.

---

## Phase 3: The SRS Daily Selector (`src/services/practice/queueManager.ts`)
This service runs when the user opens the Home screen to determine *what* verse they should practice today.

**Logic Flow:**
1. **Fetch Due Reviews:** Query Supabase for verses where `next_review_at <= NOW()` ordered by most overdue.
2. **Fetch New Material:** If no verses are due, query for the oldest verse with status `'queued'`.
3. **Return:** The `queueManager` returns the `book`, `chapter`, and `verse`. 
4. **Hydrate:** The app passes those numbers to the local SQLite `VerseRepository` to get the actual text, which is then handed to the Active Recall Engine.

---

## Phase 4: Grading the Practice
After the user completes the fill-in-the-blank drill on the Practice screen, they must "grade" how hard it was. The UI should present 3 buttons: 
- 🔴 **Hard** (I forgot words)
- 🟡 **Good** (I remembered, but had to think)
- 🟢 **Easy** (I knew it instantly)

**The Algorithm (Simplified SM-2):**
When they tap a button, `queueManager.updateVerseProgress()` runs:
- **If "Hard":** `interval_days = 1` (See it again tomorrow). `ease_factor` decreases by `0.15`.
- **If "Good":** `interval_days = (previous interval * ease_factor)`.
- **If "Easy":** `interval_days = (previous interval * ease_factor * 1.3)`. `ease_factor` increases by `0.15`.
- Calculate `next_review_at = NOW() + interval_days`.
- Update the row in Supabase.

---
*By implementing this, the app becomes a true, intelligent learning tool rather than just a static reading app.*
