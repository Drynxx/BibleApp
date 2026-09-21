# Architecture Plan: Reference Active Recall & Bilingual Support

## Overview
This plan upgrades the Active Recall system so users must memorize the biblical reference (Book, Chapter, Verse) alongside the text. It uses a structured data approach to ensure perfect UI integration and introduces a bilingual dictionary to support both English (KJV) and Romanian (VDCC/Cornilescu).

---

## Phase 1: The Bilingual Dictionary (`src/constants/bibleBooks.ts`)
Create a new file to act as the single source of truth for book names.

```typescript
export const BOOKS_EN = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", 
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

export const BOOKS_RO = [
  "Geneza", "Exodul", "Leviticul", "Numeri", "Deuteronomul", "Iosua", "Judecători", "Rut", "1 Samuel", "2 Samuel", "1 Împărați", "2 Împărați", "1 Cronici", "2 Cronici", "Ezra", "Neemia", "Estera", "Iov", "Psalmii", "Proverbele", "Eclesiastul", "Cântarea Cântărilor", "Isaia", "Ieremia", "Plângerile lui Ieremia", "Ezechiel", "Daniel", "Osea", "Ioel", "Amos", "Obadia", "Iona", "Mica", "Naum", "Habacuc", "Țefania", "Hagai", "Zaharia", "Maleahi", 
  "Matei", "Marcu", "Luca", "Ioan", "Faptele Apostolilor", "Romani", "1 Corinteni", "2 Corinteni", "Galateni", "Efeseni", "Filipeni", "Coloseni", "1 Tesaloniceni", "2 Tesaloniceni", "1 Timotei", "2 Timotei", "Tit", "Filimon", "Evrei", "Iacov", "1 Petru", "2 Petru", "1 Ioan", "2 Ioan", "3 Ioan", "Iuda", "Apocalipsa"
];

export const getBookName = (bookId: number, translation: string) => {
  const isRo = translation === 'vdcc' || translation === 'cornilescu';
  const array = isRo ? BOOKS_RO : BOOKS_EN;
  return array[bookId - 1] || "Unknown";
};
```

---

## Phase 2: Upgrading `RecallEngine` (`src/services/practice/recallEngine.ts`)
Add a new static method: `generateReferencePractice(book: number, chapter: number, verse: number, difficultyLevel: number, translation: string): RecallToken[]`

**1. Progressive Blank Logic:**
- **Level 1 (Familiar):** Return all as text tokens. No blanks.
- **Level 2 (Learning):** Blank out ONLY the Book name. Chapter and Verse are text tokens.
- **Level 3 (Mastery):** Blank out Book, Chapter, AND Verse.

**2. Smart Distractor Generation:**
- **For Book Blanks:** Select 3 random unique book names from the correct localized array (`BOOKS_EN` or `BOOKS_RO`).
- **For Number Blanks:** Generate 3 random numbers close to the target number. 
  *(e.g., `[target, target + 1, Math.max(1, target - 2), target + 3]` shuffled).*

**3. Output Structure:**
Return the same `RecallToken[]` array structure used for the main text, so the UI can reuse its existing components:
`[{type: 'blank', value: 'John', options: [...]}, {type: 'text', value: ' '}, {type: 'blank', value: '3', options: [...]}, {type: 'text', value: ':'}, {type: 'blank', value: '16', options: [...]}]`

---

## Phase 3: UI Integration (`app/inscribe.tsx` or `practice.tsx`)
**1. State Update:**
When loading a verse, in addition to calling `generateRecallPractice` for the text, call the new `generateReferencePractice` for the title. Save this in state (e.g., `referenceTokens`).

**2. Render the Title:**
Locate the existing hardcoded reference title at the top of the practice screen.
Replace it with a `<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>` that maps over `referenceTokens`.
- If `token.type === 'text'`, render standard title text.
- If `token.type === 'blank'`, render the exact same tappable Blank component you use in the verse body, just styled slightly larger/bolder to match the title styling.

*Result: A perfectly integrated, bilingual reference memorization system that looks native to the existing design.*
