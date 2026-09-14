# Uniform Tab Headers Implementation Plan

This document outlines the strategy for standardizing the headers across the secondary tabs (`Discover`, `Progress`, and `Profile`). 

The Home tab (`index.tsx`) remains unique as your daily dashboard (featuring the subtle leaf logo and personalized greeting), while the other three tabs will share a cohesive, editorial 3-part header structure.

## 1. The Design Pattern

The `Discover` screen established a beautiful, high-end typographic hierarchy:
1. **Eyebrow:** Small, uppercase, tracked-out sans-serif (e.g., `letterSpacing: 2`, `Palette.primary`). It provides context.
2. **Title:** Massive serif font (e.g., `fontSize: 44`, `Palette.foreground`). The name of the tab.
3. **Subtitle:** Muted sans-serif (e.g., `fontSize: 14`, `Palette.mutedForeground`). A brief explanation of the page's purpose.

By replicating this exact structure, the app will feel incredibly polished and cohesive as the user navigates between tabs.

## 2. Progress Header (`app/(tabs)/progress.tsx`)

**Suggested Copy:**
- **Eyebrow:** TRACK YOUR JOURNEY
- **Title:** Progress
- **Subtitle:** Watch your faith grow, step by step. *(Or if focused heavily on the partner aspect: "See how far you and your partner have come.")*

**Code Structure:**
```tsx
<View style={styles.header}>
  <Text style={styles.headerEyebrow}>{t('progress.eyebrow', 'Track your journey')}</Text>
  <Text style={styles.headerTitle}>{t('progress.title', 'Progress')}</Text>
  <Text style={styles.headerSubtitle}>
    {t('progress.subtitle', 'Watch your faith grow, step by step.')}
  </Text>
</View>
```

## 3. Profile Header (`app/(tabs)/profile.tsx`)

**Suggested Copy:**
- **Eyebrow:** ACCOUNT & SETTINGS
- **Title:** Profile
- **Subtitle:** Manage your translations, notifications, and account.

**Code Structure:**
```tsx
<View style={styles.header}>
  <Text style={styles.headerEyebrow}>{t('profile.eyebrow', 'Account & Settings')}</Text>
  <Text style={styles.headerTitle}>{t('profile.title', 'Profile')}</Text>
  <Text style={styles.headerSubtitle}>
    {t('profile.subtitle', 'Manage your translations, notifications, and account.')}
  </Text>
</View>
```

## 4. Shared Styles (To copy to both files)

Ensure the exact same stylesheet properties used in `discover.tsx` are applied to `progress.tsx` and `profile.tsx`:

```javascript
  header: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  headerEyebrow: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: Palette.primary,
  },
  headerTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 44,
    lineHeight: 48,
    color: Palette.foreground,
    marginTop: 6,
  },
  headerSubtitle: {
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    color: Palette.mutedForeground,
    marginTop: 10,
  },
```

## 5. Execution Steps
1. Open `app/(tabs)/progress.tsx`. Replace its current top-level branding or simple title with the 3-part structure above. Add the shared styles to its `StyleSheet`.
2. Open `app/(tabs)/profile.tsx`. Do the exact same thing using the Profile-specific copy.
3. Ensure both screens are wrapped in a `ScrollView` (or a `View` with `flex: 1` if it's a SectionList) with `paddingTop` respecting the safe area insets, identical to `discover.tsx`:
   `style={{ paddingTop: Math.max(insets.top + 8, 20) }}`
