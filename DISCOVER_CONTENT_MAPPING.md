# Content Population & Discover Screen Mapping

## Overview
This document outlines the curated content to be inserted into Supabase for the Discover screen, and the exact data-formatting required to display this content flawlessly in the existing UI without altering any UI components.

---

## Part 1: Supabase Content Generation
Execute these SQL inserts in your Supabase dashboard to populate the `discover_plans` table.

```sql
INSERT INTO discover_plans (id, title, description, cover_color, is_active, verses_array) VALUES
('peace_anxiety', 'Peace in Anxiety', 'Find calm and anchor your mind when overwhelmed by worry.', '#8C3A3A', true, 
  '[{"b": 43, "c": 14, "v": 27}, {"b": 50, "c": 4, "v": 6}, {"b": 50, "c": 4, "v": 7}, {"b": 60, "c": 5, "v": 7}]'
),
('strength', 'Strength & Courage', 'Verses to remind you of the power that stands behind you.', '#4A5D4E', true, 
  '[{"b": 6, "c": 1, "v": 9}, {"b": 23, "c": 40, "v": 31}, {"b": 19, "c": 46, "v": 1}, {"b": 50, "c": 4, "v": 13}]'
),
('trust', 'Trusting God', 'Lean not on your own understanding. A plan for building deep faith.', '#B08954', true, 
  '[{"b": 20, "c": 3, "v": 5}, {"b": 20, "c": 3, "v": 6}, {"b": 58, "c": 11, "v": 1}, {"b": 47, "c": 5, "v": 7}]'
),
('love', 'Walking in Love', 'The greatest commandment. Ground yourself in perfect love.', '#A47786', true, 
  '[{"b": 46, "c": 13, "v": 4}, {"b": 46, "c": 13, "v": 7}, {"b": 62, "c": 4, "v": 18}, {"b": 45, "c": 8, "v": 38}]'
);
```
*(Note: These map to John 14:27, Phil 4:6-7, 1 Peter 5:7, Joshua 1:9, Isaiah 40:31, Psalm 46:1, Proverbs 3:5-6, Hebrews 11:1, 1 Cor 13:4, 1 John 4:18, Romans 8:38).*

---

## Part 2: Data Formatting (Preserving the UI Structure)
Currently, in `discover.tsx`, when a user taps a Plan to preview it, the modal tries to render the `preview.verses` property. Because `verses_array` is raw JSON from Supabase, it will not display correctly in the `<Text>` component.

**CRITICAL RULE:** Do NOT change the JSX/UI structure of `discover.tsx`.

Instead, fix the data formatting inside the "Middleman" hook (`src/hooks/useDiscover.ts`).

### Action Item for `src/hooks/useDiscover.ts`:
Locate the `mappedPacks` assignment inside the `useEffect`. 
Add a formatter that converts the raw `verses_array` JSON into a beautiful, readable string of references before handing it to the UI.

```typescript
// Add this inside the remotePlans.map loop in useDiscover.ts:

// Format the verses array into a readable string (e.g., "John 14:27, Philippians 4:6")
const formattedVersesString = p.verses_array.map((v: any) => 
  `${books[v.b - 1]} ${v.c}:${v.v}`
).join(', ');

return {
  id: p.id,
  title: p.title,
  description: p.description,
  verses: p.verses_array.length,
  verses_array: p.verses_array,
  category: 'All', 
  image,
  // Pass the newly formatted string so the Modal can render it beautifully
  verses_preview_string: formattedVersesString 
}
```

### Action Item for `app/(tabs)/discover.tsx`:
Find the `PlanRow` component usage where `onOpen` is triggered. 
Simply change the `verses` property in the `setPreview` payload from `pack.verses_array` to the new formatted string:

```typescript
// Find this line:
<PlanRow 
  key={pack.id} 
  pack={pack} 
  onOpen={() => setPreview({ 
    kind: 'plan', 
    title: pack.title, 
    description: pack.description, 
    verses: pack.verses_preview_string, // <-- UPDATE THIS LINE ONLY
    count: pack.verses 
  })} 
/>
```

### Why this is the best approach:
- We don't touch a single style, margin, or layout rule in the Discover screen.
- The `BottomSheet` modal continues to function exactly as it was designed.
- When the user taps a Plan, the modal will flawlessly display: **"John 14:27, Philippians 4:6, Philippians 4:7, 1 Peter 5:7"** under the "Preview" section.
