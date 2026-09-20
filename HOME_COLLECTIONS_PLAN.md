# Architecture Plan: Macro-Goal Collections (Home Screen)

## Overview
This plan upgrades the Spaced Repetition System (SRS) from tracking individual verses on the Home screen to grouping them into macro-goals (Plans/Collections). This prevents UI clutter and provides users with a clear, motivating sense of completion.

---

## Phase 1: Database Updates
We need a way to group verses together in the user's queue.
1. **Schema Update:** The `practice_queue` table in Supabase needs a new column: 
   - `plan_id` (text, nullable). 
2. **Defaulting:** If a user adds a single verse manually, `plan_id` is stored as `'my_saved_verses'`. If they start a plan, it stores the actual plan ID (e.g., `'peace_anxiety'`).

---

## Phase 2: Engine Updates (`src/services/practice/queueManager.ts`)

**1. Queueing with Context:**
Update `addToQueue` to accept a `planId`.
```typescript
static async addToQueue(userId: string, book: number, chapter: number, verse: number, planId: string = 'my_saved_verses') {
  // Insert includes plan_id
}
```

**2. Aggregating Active Collections:**
Create a new method `getActiveCollections(userId)` to power the Home screen.
- **Fetch:** Get all rows from `practice_queue` for the user.
- **Group:** Group the rows by `plan_id`.
- **Calculate Progress:** For each group, calculate the average mastery. 
  *(Formula: For every verse in the group, `mastery = Math.min(100, (interval_days / 21) * 100)`. The collection progress is the average of all verses in it).*
- **Calculate Due:** Count how many verses in that group have `next_review_at <= NOW()`.
- **Return:** An array of collections: `[{ planId: 'peace_anxiety', title: 'Peace in Anxiety', progress: 0.45, dueCount: 2 }]`.

---

## Phase 3: The Discover Screen ("Start Plan")
When a user taps "Start Plan" on the Discover screen, update the loop so it passes the plan's ID to the queue manager:
```typescript
for (const v of pack.verses_array) {
  await QueueManager.addToQueue(user.id, v.b, v.c, v.v, pack.id); // Passing pack.id!
}
```

---

## Phase 4: Home Screen Wiring (`app/(tabs)/index.tsx`)
**1. "Continue your journey" Cards:**
- Fetch the data using `QueueManager.getActiveCollections(userId)`.
- Map over this array to render the existing cards.
- **UI Mapping:** 
  - `Title`: The Collection/Plan title (or "My Saved Verses").
  - `Subtitle`: "X verses due today" (using `dueCount`).
  - `Progress Ring`: Pass the calculated `progress` decimal (e.g. `0.45`).

**2. The Action (Tapping a Card):**
When the user taps the "Peace in Anxiety" card, route them to the practice screen and pass the `planId` as a URL parameter:
```typescript
router.push({ pathname: '/inscribe', params: { planId: collection.planId } });
```
*(This ensures the Practice screen only tests them on verses from THAT specific plan during the session).*
