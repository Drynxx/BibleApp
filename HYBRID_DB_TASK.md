# Role
You are an expert React Native and Expo developer. You are working on "Inscribe", a high-end, offline-first scripture memorization app written in TypeScript.

# Task
Execute the "Hybrid Bible Database & Active Recall Engine" implementation plan.

# Context & Architecture
- The app uses `expo-sqlite` and `expo-file-system`.
- We are implementing a hybrid offline/online SQLite database system.
- The KJV translation is bundled locally in `assets/db/bible_kjv.db`.
- The Romanian VDCC translation is available remotely on a Supabase Storage public bucket named `bible-translations`.

# Execution Phases

## Phase 1: Metro Configuration
- Modify `metro.config.js` to ensure the Expo bundler includes `.db` files. 
- Append `db` and `sqlite` into `config.resolver.assetExts`.

## Phase 2: Database Management (`src/services/db/databaseManager.ts`)
- Implement a service that manages the SQLite files in the local filesystem.
- Create `ensureDbExists(translation: 'kjv' | 'vdcc')`:
  - Ensure the `SQLite/` directory exists inside `FileSystem.documentDirectory`.
  - If `translation === 'kjv'`, check if `bible_kjv.db` exists locally. If missing, use `FileSystem.copyAsync` to copy it from `require('../../../assets/db/bible_kjv.db')`.
  - If `translation === 'vdcc'`, check if `bible_vdcc.db` exists locally. If missing, use `FileSystem.downloadAsync` to fetch it from the Supabase public URL and save it.
- Create `getConnection(translation)` which returns `SQLite.openDatabaseAsync(dbName)`.

## Phase 3: Verse Repository (`src/services/db/verseRepository.ts`)
- Implement the SQL data access layer.
- Create `getVerse(bookId, chapter, verse, translation)`:
  - Uses `databaseManager.getConnection(translation)`.
  - Executes: `SELECT text FROM verses WHERE book_id = ? AND chapter = ? AND verse = ?`
  - Returns the raw text string.

## Phase 4: Active Recall Engine (`src/services/practice/recallEngine.ts`)
- Write a TypeScript engine: `generateRecallPractice(rawText: string, difficultyLevel: number)`
- **Tokenize**: Split the text by spaces, preserving punctuation positions.
- **Stop-words**: Filter out common/archaic words (e.g., *the, and, of, to, unto, hath, thou*).
- **Blanking**: Randomly select $N$ high-value words to become blanks, based on `difficultyLevel`.
- **Distractors**: Generate 3 wrong options for each blank. (For now, use a hardcoded pool of common biblical nouns/verbs to pick from).
- **Output**: Return a typed array: `Array<{ type: 'text' | 'blank', value: string, options?: string[] }>`

## Phase 5: UI & State Integration
- **Practice Screen (`app/(tabs)/practice.tsx`)**: Refactor to remove the hardcoded `verses` object. On mount, fetch a verse via `verseRepository`, process it through `recallEngine`, and render the dynamic array. Handle state for multiple blanks.
- **Profile Screen (`app/profile.tsx`)**: Add a "Bible Translations" section. Add a button to "Download Romanian (VDCC)". When tapped, trigger `databaseManager.ensureDbExists('vdcc')` with a loading indicator.

# Strict Rules
- **UI Consistency:** Do not break existing UI styles. Strictly adhere to the Inscribe `Palette` and `Typography` tokens defined in `@/constants/theme`.
- **Async Handling:** Ensure all async database connections and file system checks are handled gracefully to prevent blocking the UI thread.
- **Graceful Failures:** If a DB file doesn't exist yet (because the user hasn't provided the physical KJV file in assets yet), wrap the SQLite calls in try/catches that return placeholder text so the app doesn't crash during development.
