# Architecture Plan: Continuous Practice & Plan Management

## Overview
This plan outlines the UX for a seamless, Duolingo-style practice session. When a user starts practicing a plan, they should seamlessly flow from one verse to the next until they clear their daily queue for that plan. It also adds a "Clear Plan" safeguard in the options menu.

---

## Phase 1: Engine Updates (`src/services/practice/queueManager.ts`)

**1. Scoped Fetching:**
Update the `getDueVerse` method to accept an optional `planId`. If provided, it must ONLY return verses that match that `plan_id`.
```typescript
static async getDueVerse(userId: string, planId?: string): Promise<PracticeQueueItem | null> {
  let query = supabase.from('practice_queue').select('*').eq('user_id', userId);
  if (planId) {
    query = query.eq('plan_id', planId);
  }
  // ... continue with existing logic (fetching due, then fetching new)
}
```

**2. Add `removePlan` Method:**
Add a method to bulk-delete an entire plan from a user's queue.
```typescript
static async removePlan(userId: string, planId: string) {
  const { error } = await supabase
    .from('practice_queue')
    .delete()
    .eq('user_id', userId)
    .eq('plan_id', planId);
    
  if (error) throw error;
  return { success: true };
}
```

---

## Phase 2: Continuous Practice Loop (`app/inscribe.tsx` or `practice.tsx`)

**1. The "Next Verse" State Loop:**
Currently, grading a verse likely ends the session. Update the grading function (Hard/Good/Easy) to do the following:
- Await `QueueManager.updateVerseProgress(...)`.
- Immediately call `loadNextVerse()`.

**2. The `loadNextVerse` Function:**
- Set a loading state `true`.
- Call `QueueManager.getDueVerse(userId, currentPlanId)`.
- **If a verse is found:** Generate the new active recall blanks via `RecallEngine` and update the screen state. The user smoothly transitions to the next verse.
- **If null is returned (Queue Empty):** Set a state `isSessionComplete = true`. 

**3. Session Complete UI:**
When `isSessionComplete` is true, render a beautiful "Session Complete!" view inside the practice screen.
- Show a big checkmark or flame icon.
- Show text: "You've completed your practice for this plan today!"
- Button: "Return Home" (Calls `router.back()` or `router.push('/')`).

---

## Phase 3: "Clear Plan" Option in Practice Screen
1. Locate the options menu (typically a 3-dot icon or similar in the header of the practice screen).
2. Add a new red/destructive button: **"Clear this Plan"** (or "Stop learning this plan").
3. **Action:**
   - Prompt an alert: *"Are you sure? This will remove all verses in this plan from your active memory queue."*
   - On confirm: Call `QueueManager.removePlan(userId, currentPlanId)`.
   - Trigger haptic success.
   - `router.back()` to the Home screen.
