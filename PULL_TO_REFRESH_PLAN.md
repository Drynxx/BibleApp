# Architecture Plan: Pull-to-Refresh Implementation

## Overview
This plan outlines the integration of React Native's native `RefreshControl` into the Home and Discover screens. This provides users with manual control to sync data, recover from network drops, and update the app during long sessions, paired with premium haptic feedback.

---

## Phase 1: Hook Refactoring (`src/hooks/useDiscover.ts` & Home Hooks)
To allow manual refreshing, our data-fetching hooks need to expose a `refetch` method.
1. **In `useDiscover.ts`:**
   - Extract the logic inside `useEffect` into a standalone `fetchData` function.
   - Return `fetchData` in the hook's export: `return { packs, library, isLoading, refetch: fetchData };`
2. **In Home Screen Data logic (e.g., `useDailyPractice.ts` or local state):**
   - Ensure the function that calls `QueueManager.getActiveCollections()` and fetches the Verse of the Day can be called manually via a `refetch` function.

---

## Phase 2: Home Screen Integration (`app/(tabs)/index.tsx`)
**1. Imports:**
Ensure `RefreshControl` is imported from `react-native`, and `Haptics` is imported from `expo-haptics`.

**2. State & Logic:**
```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = useCallback(async () => {
  setRefreshing(true);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  
  try {
    // Await your data fetching functions here
    await refetchHomeData(); 
  } catch (error) {
    console.error(error);
  } finally {
    setRefreshing(false);
  }
}, []);
```

**3. Component Wiring:**
Find the main `<ScrollView>` wrapping the Home screen and add:
```tsx
<ScrollView
  refreshControl={
    <RefreshControl 
      refreshing={refreshing} 
      onRefresh={onRefresh} 
      tintColor={Palette.primary} // iOS brand color spinner
      colors={[Palette.primary]} // Android brand color spinner
    />
  }
  // ... existing props
>
```

---

## Phase 3: Discover Screen Integration (`app/(tabs)/discover.tsx`)
**1. State & Logic:**
```typescript
const { packs, library, isLoading, refetch } = useDiscover();
const [refreshing, setRefreshing] = useState(false);

const onRefresh = useCallback(async () => {
  setRefreshing(true);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  
  try {
    await refetch();
  } catch (error) {
    console.error(error);
  } finally {
    setRefreshing(false);
  }
}, [refetch]);
```

**2. Component Wiring:**
Find the main `<ScrollView>` wrapping the Discover screen and add the exact same `<RefreshControl>` prop used in the Home screen.

---
**CRITICAL RULE:** Do not change any visual layouts, padding, or margins on these screens. The `RefreshControl` is a prop passed directly to the `ScrollView` and handles its own UI native to iOS/Android.
