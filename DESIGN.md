# Inscribe (BibleApp) — Style Reference
> warm paper, deep rust, and quiet reverence

**Theme:** light

Inscribe uses a warm, nature-inspired palette on a creamy background (`#FAF7F2`) to foster stillness and focused reading. The design relies heavily on a dual-typeface system: the elegant, traditional serif `Newsreader` for scripture text and display headings, contrasted with the clean, modern sans-serif `DMSans` for utility text, meta-labels, and buttons. 

Color is purposeful and rooted in earthly tones: deep rust/terracotta (`primary`), warm gold, and muted sage. Cards use subtle shadows and warm borders rather than harsh lines. 

## Tokens — Colors

| Name | Value | Role |
|------|-------|------|
| Background | `#FAF7F2` | The primary canvas of the app. A soft, warm paper color to reduce eye strain. |
| Foreground | `#28231D` | Deep, warm charcoal for primary text. Softer than pure black. |
| Card | `#FFFFFF` | Elevated surfaces (streak cards, popups). |
| Primary | `#9E4324` | Rust/Terracotta. Used for primary actions, active states, and emphasis. |
| Primary Light | `rgba(158, 67, 36, 0.1)` | Washed out primary for decorative backgrounds (e.g. flame circle). |
| Gold | `#C68B35` | Secondary accent. Used for badges, verse markers, and decorative blobs. |
| Gold Light | `rgba(198, 139, 53, 0.14)` | Washed out gold for card backgrounds. |
| Sage | `#5A775E` | Tertiary accent. Used for peace/comfort themed collections. |
| Sage Light | `rgba(90, 119, 94, 0.15)` | Washed out sage for card backgrounds. |
| Secondary | `#EDE4D3` | Background elements, decorative blobs. |
| Muted | `#F0EAE1` | De-emphasized UI elements. |
| Border | `#E7DECE` | Subtle borders for cards and dividers. |
| Paper | `#F5EFE6` | Alternative card surface (e.g., Verse of the Day card). |

## Tokens — Typography

### Newsreader — Editorial Serif
- **Weights:** 400 (Regular), 500 (Medium), 600 (SemiBold)
- **Role:** The voice of Scripture. Used for reading Bible verses (`verseQuote`), primary page headings (`greetingTitle`), and elegant branding (`brandTitle`). It brings a traditional, book-like feel to the digital experience.

### DMSans — Utility Sans-Serif
- **Weights:** 400 (Regular), 500 (Medium), 700 (Bold)
- **Role:** The voice of the interface. Used for buttons, stats (`streakCount`), captions (`brandSubtitle`, `streakCaption`), and navigation. Often used with heavy letter-spacing (`1.5` to `1.8`) for small, uppercase meta-labels.

## Tokens — Spacing & Shapes

- **Border Radius:** Soft and welcoming.
  - Buttons: Fully rounded (`9999px` / `borderRadius: 29` for 58px height)
  - Cards: `24px` for large cards (Streak, Verse), `20px` for smaller collection grids.
  - Badges/Icons: Circular or pill-shaped.
- **Shadows:** Soft, warm, and low opacity to give a slight lift without looking structural.
  - CTA Button: `shadowColor: Palette.primary, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3`
  - Cards: `shadowColor: '#000', shadowOpacity: 0.04 - 0.05, shadowRadius: 10`
- **Borders:** Cards use a 1px border colored with `Palette.border` (`#E7DECE`) to define edges softly against the background.

## Components

### Primary CTA Button (Pill)
**Role:** Main call-to-action (e.g., "Start today's verse")
Background `Palette.primary` (`#9E4324`), Text `#FFFFFF`. Radius fully rounded (pill). Font `DMSans_700Bold` 17px. Includes an icon (ArrowRight or Check). Glows slightly with a primary-colored shadow.

### Streak Summary Card
**Role:** Displays user progress.
Background `Palette.card` (`#FFFFFF`), radius `24px`, border `1px Palette.border`. Contains the Flame icon inside a `primaryLight` circular badge. 

### Verse of the Day Card
**Role:** Featured daily content.
Background `Palette.paper` (`#F5EFE6`), radius `24px`. Features decorative overlapping abstract shapes (blobs) in the background (`secondary` and `gold` with low opacity). A small `gold` badge marks the reference. The quote uses `Newsreader_500Medium` at `24px`.

### Collection Grid Card
**Role:** Thematic verse packs (e.g., "Psalms of Comfort").
Background uses washed-out tones (`sageLight`, `primaryLight`, `goldLight`). Radius `20px`. The icon uses the bold `accentColor` (e.g., `sage`, `gold`).

### Day Badge (Week Row)
**Role:** Tracking daily completion.
Active: Background `primary`, with a white Check icon.
Inactive: Border `1.5px Palette.border`, Background `Palette.background`.

## Imagery & Decoration
Instead of photos, the app uses abstract, organic blobs (overlapping circles with slight rotations and low opacity) to add visual interest behind text. Icons are line-based (`lucide-react-native` and `phosphor-react-native`), keeping the interface light and legible.

## Quick Start (React Native Style Reference)

```typescript
import { Palette, Typography } from '@/constants/theme';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  // Headings
  title: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 32,
    color: Palette.foreground,
  },
  // Subtitles / Labels
  label: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Palette.primary,
    textTransform: 'uppercase',
  },
  // Verse Text
  verse: {
    fontFamily: Typography.serifMedium,
    fontSize: 24,
    lineHeight: 32,
    color: Palette.foreground,
  },
  // Flat Card
  card: {
    backgroundColor: Palette.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  }
});
```
