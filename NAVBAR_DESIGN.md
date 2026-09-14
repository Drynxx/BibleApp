# Frosted Glass "Island" Navbar Implementation Plan

This document outlines the step-by-step technical plan to upgrade Inscribe's bottom navigation bar from a solid white floating pill to a premium, frosted glass (translucent blur) dynamic island.

## 1. Dependency Installation
To achieve a high-performance native blur effect on both iOS and Android, we will use Expo's official blur package.

**Command to run:**
```bash
npx expo install expo-blur
```

## 2. Refactoring `app/(tabs)/_layout.tsx`
Currently, the navbar uses a standard React Native `<View>` with `backgroundColor: '#FFFFFF'`. We will replace this container with `<BlurView>`.

### Required Changes:
- **Import BlurView:** `import { BlurView } from 'expo-blur';`
- **Replace the wrapper:** Wrap the mapping of `state.routes` inside a `<BlurView>`.
- **Apply `tint` and `intensity`:**
  - `tint="light"` (or `"default"`) to maintain the bright, airy feel of the app.
  - `intensity={80}` to ensure the blur is strong enough that text scrolling behind it isn't distracting, but transparent enough to let colors bleed through.
- **Adjust Background Color:** 
  - We must remove `backgroundColor: '#FFFFFF'` from the container. 
  - Instead, we apply a semi-transparent background color (e.g., `backgroundColor: 'rgba(255, 255, 255, 0.7)'`) to the BlurView or an inner view to give it the "frosted" white tint while still blurring the content behind it.
- **Handling Shadows with Blur:**
  - `overflow: 'hidden'` is required for the `BlurView` to clip to the `borderRadius: 38`.
  - However, `overflow: 'hidden'` cuts off drop shadows.
  - *Solution:* We will wrap the `BlurView` inside a standard `<View>` that has the shadow properties applied, and place the `BlurView` inside it with `overflow: 'hidden'`.

### Code Architecture:
```tsx
<View style={styles.shadowContainer}>
  <BlurView 
    intensity={80} 
    tint="light" 
    style={styles.blurContainer}
  >
    {/* Tab Buttons Render Here */}
  </BlurView>
</View>
```

## 3. The "Scroll Bleed" Adjustment
A floating navbar sits *over* the content. When using a solid white navbar, if content gets trapped behind it, the user can't see it anyway. But with a *frosted* navbar, if content is trapped behind it, the user will see blurred text at the bottom of the screen that they cannot tap or read clearly.

**Fixing the Padding:**
Every scrollable screen in the app (e.g., `index.tsx`, `practice.tsx`, `progress.tsx`) must have adequate `paddingBottom` applied to its `contentContainerStyle`.

- The navbar height is `76px`. 
- The bottom offset is roughly `24px` to `34px` (depending on iOS safe area).
- **Required Padding:** All ScrollViews must ensure their `paddingBottom` is at least `120px`. This ensures the user can scroll the very bottom content completely *above* the floating navbar.

## 4. Android Fallbacks & Polish
While `expo-blur` works on Android, it can sometimes be resource-heavy or render slightly darker than iOS.
- We will test the blur on Android.
- If the Android blur looks muddy, we can conditionally apply a slightly more opaque background color on Android using `Platform.OS === 'android' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.75)'`.

## 5. Active State Indicator
Currently, the active tab uses an animated `FadeIn` background pill using `Palette.primaryLight`. 
- Because the navbar itself will now be translucent, we need to ensure the active indicator doesn't look muddy when blending with the blurred background. 
- The `Palette.primaryLight` will blend beautifully with a frosted white background, maintaining the organic aesthetic of the app.

---
**Summary of Next Steps:**
1. Run `npx expo install expo-blur`.
2. Update `_layout.tsx` to implement the Shadow Wrapper + BlurView.
3. Audit `index.tsx` and `practice.tsx` to ensure `paddingBottom: 120` (or dynamic inset calculation) is applied to their ScrollViews.
