# Internal Headers UI/UX Refactor Plan

This document outlines the design changes required to modernize the internal headers across the app. The goal is to move away from heavy, repetitive branding on every screen and embrace a cleaner, content-first approach that aligns with top-tier mobile apps.

## 1. The Core UX Principles

- **Drop the Tagline Internally:** Taglines (e.g., "SMALL STEPS. DEEPER FAITH.") are highly effective on marketing pages, splash screens, and login flows. Inside the app, the user is already convinced. Removing it reclaims valuable vertical space and makes the interface feel like a premium tool rather than a marketing brochure.
- **Brand as an Accent, Not a Billboard:** We do not need the word "Inscribe" on every tab. The app's visual language (the serif fonts, the warm palette, the organic blobs) is the brand. A simple standalone logo icon (the Gold Leaf) is enough.
- **Context is the Header:** The content of the page should act as its title. On the Home page, the greeting ("Good morning, [Name]") is the anchor. On the Progress page, a simple "Progress" or "Covenant" title is perfect.

## 2. Refactoring the Home Screen (`app/(tabs)/index.tsx`)

### What to Remove:
- **The Text Branding:** Delete the `<Text style={styles.brandTitle}>` and `<Text style={styles.brandSubtitle}>` elements.
- **The Log Out Button:** Since sign-out is already correctly implemented in the Profile tab, remove the `LogOut` icon button from the top right of the Home screen. This prevents accidental destructive actions.

### The New Structure:
The new header will be ultra-minimal, acting only as a subtle brand touchpoint.

```tsx
{/* New Ultra-Minimal Header */}
<View style={styles.header}>
  <View style={styles.logoBadge}>
    <Leaf 
      color={Palette.gold} 
      size={30} 
      strokeWidth={1.8} 
      style={{ transform: [{ rotate: '-12deg' }] }} 
    />
  </View>
  
  {/* Optional: Future home for a Notification Bell or User Avatar */}
  {/* <Pressable style={styles.iconButton}>
        <Bell color={Palette.foreground} size={20} />
      </Pressable> */}
</View>

{/* The Greeting now acts as the true page title */}
<View style={styles.greetingSection}>
  <Text style={styles.greetingTitle}>{t('home.goodMorning')}, {displayName}</Text>
  {/* ... streak row ... */}
</View>
```

## 3. Refactoring the Progress Screen (`app/(tabs)/progress.tsx`)

If the Progress page currently uses the same "Inscribe" branding header, it should be replaced with a clean page title.

### The New Structure:
```tsx
<View style={styles.header}>
  <Text style={styles.pageTitle}>{t('tabs.progress', 'Progress')}</Text>
</View>
```
*Where `styles.pageTitle` uses `Typography.serifSemiBold` at a size of `32` or `36`, visually matching the weight of the "Good morning" greeting on the Home screen.*

## 4. Execution Steps
1. Open `app/(tabs)/index.tsx`.
2. Locate the `<View style={styles.header}>` block.
3. Delete the `LogOut` Pressable and the `View` containing the `brandTitle` and `brandSubtitle`.
4. Ensure the `styles.greetingSection` has appropriate top margin (e.g., `marginTop: 20`) so it breathes well under the minimal leaf logo.
5. Repeat the cleanup for `app/(tabs)/progress.tsx`, ensuring the header text clearly states the page's purpose.
