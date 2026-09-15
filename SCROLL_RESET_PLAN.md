# Tab Scroll Reset Implementation Plan

By default, React Navigation (which powers Expo Router tabs) preserves the state and scroll position of every tab. When you scroll down on Home, visit Discover, and return to Home, you will still be at the bottom of the page. 

To create a fresh, clean experience every time a user switches tabs, we need to manually reset the scroll position to the top.

## The Recommended Approach: `useFocusEffect`

Instead of destroying and rebuilding the entire screen (which hurts performance), we will simply command the `ScrollView` to instantly jump back to the top whenever the screen gains focus.

### 1. What you need to import
On every tab screen (`index.tsx`, `discover.tsx`, `progress.tsx`, `profile.tsx`), import `useRef` and `useFocusEffect`.

```typescript
import React, { useRef, useCallback } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
```

### 2. Set up the Reference
Inside the component, create a reference to attach to your ScrollView.

```typescript
export default function HomeScreen() {
  const scrollRef = useRef<ScrollView>(null);
  
  // ... rest of your state
```

### 3. Apply the Focus Effect
Use `useFocusEffect` to trigger the scroll reset. `useFocusEffect` runs a callback every time the screen comes into focus. We use `animated: false` so it instantly snaps to the top without a distracting scroll animation while the screen is transitioning.

```typescript
  useFocusEffect(
    useCallback(() => {
      // Instantly reset scroll to top when tab is opened
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );
```

### 4. Attach the Ref to the ScrollView
Finally, pass the ref to your main ScrollView component.

```typescript
  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      // ... your other props
    >
      {/* Page Content */}
    </ScrollView>
  );
```

## Alternative Approach: `unmountOnBlur` (Not Recommended)

You *could* add `unmountOnBlur: true` to your tab screen options in `app/(tabs)/_layout.tsx`. This completely destroys the screen when you leave it and builds it from scratch when you return. 
- **Pros:** Resets absolutely everything (scroll position, local state, text inputs).
- **Cons:** Causes unnecessary re-renders, triggers loading states/spinners again, and uses more battery. 

**Verdict:** Stick to the `useFocusEffect` and `scrollTo` method above. It is the industry standard for high-performance React Native apps.
