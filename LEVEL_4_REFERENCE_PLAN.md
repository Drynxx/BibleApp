# Architecture Plan: Level 4 Reference Mastery

## Overview
This plan introduces **Level 4** to the practice flow. Level 4 represents ultimate mastery: the user completes the verse text (with maximum blanks) while the reference is hidden, and then must pass a multiple-choice "Reference Quiz" to successfully complete the session. 

**CRITICAL RULE:** Do NOT introduce new UI paradigms. Use the existing fonts (`Newsreader` / `DMSans`), colors (`Palette`), and button structures to ensure the Reference Quiz feels like a native extension of Level 3.

---

## Phase 1: The Bilingual Dictionary (`src/constants/bibleBooks.ts`)
We must create the translation arrays to generate realistic fake references in both languages.

```typescript
export const BOOKS_EN = ["Genesis", "Exodus", /* ... all 66 ... */ "Revelation"];
export const BOOKS_RO = ["Geneza", "Exodul", /* ... all 66 ... */ "Apocalipsa"];

export const getBookName = (bookId: number, translation: string) => {
  const array = (translation === 'vdcc' || translation === 'cornilescu') ? BOOKS_RO : BOOKS_EN;
  return array[bookId - 1] || "Unknown";
};
```
*(Agent Note: Populate the full 66-book arrays based on standard biblical order).*

---

## Phase 2: Distractor Generation (`src/services/practice/recallEngine.ts`)
Add a new method to generate the multiple-choice options for the Level 4 quiz.

```typescript
static generateReferenceQuiz(bookId: number, chapter: number, verse: number, translation: string): string[] {
  const correctName = getBookName(bookId, translation);
  const correctRef = `${correctName} ${chapter}:${verse}`;
  
  const distractors = new Set<string>();
  distractors.add(correctRef);

  while (distractors.size < 4) {
    const randomStrategy = Math.random();
    let fakeRef = "";

    if (randomStrategy < 0.33) {
      // Same book, wrong numbers
      fakeRef = `${correctName} ${chapter + Math.floor(Math.random() * 3 + 1)}:${verse + Math.floor(Math.random() * 5 + 1)}`;
    } else if (randomStrategy < 0.66) {
      // Wrong book, same numbers
      let fakeBook = Math.floor(Math.random() * 66) + 1;
      fakeRef = `${getBookName(fakeBook, translation)} ${chapter}:${verse}`;
    } else {
      // Totally random
      let fakeBook = Math.floor(Math.random() * 66) + 1;
      fakeRef = `${getBookName(fakeBook, translation)} ${Math.floor(Math.random() * 5 + 1)}:${Math.floor(Math.random() * 20 + 1)}`;
    }
    distractors.add(fakeRef);
  }

  return Array.from(distractors).sort(() => 0.5 - Math.random());
}
```

---

## Phase 3: Level 4 State Flow (`app/inscribe.tsx` or `practice.tsx`)
**1. State Management:**
Add a new state to track the two-step flow during Level 4:
`const [quizStep, setQuizStep] = useState<'text' | 'reference'>('text');`

**2. Header Behavior:**
If `currentLevel === 4` and `quizStep === 'text'`, hide the real reference at the top of the screen. Instead, display a mystery placeholder using existing typography:
`<Text style={styles.headerTitle}>Level 4 Challenge</Text>`

**3. Transition Trigger:**
When the user successfully fills the last text blank, normally the session ends. 
Instead:
```typescript
if (currentLevel === 4 && quizStep === 'text') {
  setQuizStep('reference'); // Triggers the second step
  // Do NOT end the session yet.
}
```

---

## Phase 4: Reference Quiz UI (Preserving Design)
When `quizStep === 'reference'`, the completed verse text remains locked on the screen, but the bottom half of the screen (where the word options used to be) is replaced by the Reference Quiz.

**UI Rendering:**
- Add a prompt above the options: `<Text style={styles.eyebrow}>Where is this verse found?</Text>`
- Map over the 4 strings returned by `generateReferenceQuiz`.
- Render them as large, elegant, full-width buttons. Use styles identical to the `bookRow` or `recentBookBtn` from the Discover screen:
  - `backgroundColor: 'rgba(255,255,255,0.8)'`
  - `borderWidth: 1`, `borderColor: 'rgba(0,0,0,0.05)'`
  - `borderRadius: 12`
  - Text: `fontFamily: Typography.serifSemiBold`, `fontSize: 18`, `color: Palette.foreground`

**Action:**
- If the user taps the *wrong* option, trigger `Haptics.notificationAsync(Error)` and shake the button (or highlight it red briefly).
- If the user taps the *correct* option, trigger `Haptics.notificationAsync(Success)`, show the Grading Buttons (Hard/Good/Easy), and complete the session!
