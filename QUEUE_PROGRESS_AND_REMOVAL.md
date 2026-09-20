# Architecture Plan: Dynamic Queue Progress & Removal

## Overview
This plan outlines the final interactive polish for the Spaced Repetition Queue. It dynamically calculates user progress for the "Continue your journey" cards on the Home screen, and enables users to cleanly remove verses from their queue during practice.

---

## Part 1: The Engine Updates (`src/services/practice/queueManager.ts`)

**1. Calculate Mastery Percentage:**
Because this is an SRS system, true mastery is based on how far in the future a verse is scheduled (the `interval_days`). We will define "Mastery" (100%) as an interval of 21 days or more without failing.
- Add a helper function or ensure the `PracticeQueueItem` interface being returned to the UI includes the `interval_days` so the UI can calculate progress.

**2. Add `removeFromQueue` Method:**
Add a new static method to handle deletions:
```typescript
static async removeFromQueue(queueId: string) {
  const { error } = await supabase
    .from('practice_queue')
    .delete()
    .eq('id', queueId);
    
  if (error) throw error;
  return { success: true };
}
```

---

## Part 2: Home Screen Dynamic Progress (`app/(tabs)/index.tsx`)

**Locate the "Continue your journey" Cards:**
When mapping over the array of active queue items (from `QueueManager.getActiveQueue`), calculate the dynamic progress for each card.

**The Math:**
```typescript
// interval_days comes from the Supabase row
const interval = item.interval_days || 0;
// 21 days = 100% mastered
const rawPercentage = Math.min(100, Math.round((interval / 21) * 100)); 
const progressDecimal = rawPercentage / 100; // e.g. 0.45 for the SVG ring
```

**Wiring it to the UI:**
- Pass `rawPercentage` to the `<Text>{rawPercentage}%</Text>` component inside the ring.
- Pass `progressDecimal` to your SVG progress circle (e.g., `strokeDashoffset` or whatever prop drives your ring).

---

## Part 3: Practice Screen Removal (`app/inscribe.tsx` or `practice.tsx`)

**Locate the "Remove from Queue" Option:**
Find the button/menu item on the practice screen that says "Remove from Queue".

**Action Wiring:**
Update its `onPress` to execute the following logic:
```typescript
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const handleRemove = async () => {
  try {
    // Assuming you have the current queue item ID in state
    await QueueManager.removeFromQueue(currentSession.queueId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Go back to the previous screen since this verse is no longer in practice
    router.back();
  } catch (error) {
    console.error("Failed to remove verse:", error);
    alert("Could not remove from queue.");
  }
};
```
*Note: Ensure that the practice screen is actually receiving/storing the `queueId` from Supabase when it starts the session, so it knows exactly which row to delete!*
