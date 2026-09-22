# Architecture Plan: Default Bible Swap (KJV to BSB)

## Overview
This plan outlines the steps to change the app's default offline Bible from the King James Version (KJV) to the Berean Standard Bible (BSB). 

*Note for the executing agent: The BSB database has already been renamed to `bsb.sqlite` and its internal schema has already been standardized to perfectly match the KJV schema (`verses` table, `book`, `chapter`, `verse`, `text`). No schema migrations are required.*

---

## Phase 1: Update `DatabaseManager` (`src/services/db/databaseManager.ts`)
The core logic for database allocation needs to be flipped. BSB becomes the local bundled asset, and KJV joins the Romanian version in the cloud.

**1. Update `ensureDbExists` Logic:**
```typescript
let dbName = 'bsb.sqlite';
if (translation === 'kjv') dbName = 'kjv_v2.sqlite';
if (translation === 'vdcc' || translation === 'cornilescu') dbName = 'cornilescu.sqlite';
// ...
if (translation === 'bsb') {
  // Bundle locally
  const asset = await Asset.loadAsync(require('../../../assets/db/bsb.sqlite'));
  // ... continue with local copy logic
} else {
  // Download KJV or VDCC from Supabase
  const { data } = supabase.storage.from('bible-translations').getPublicUrl(dbName);
  // ... continue with download logic
}
```

**2. Update `getConnection` Logic:**
Ensure the fallback/default translation checks map to `'bsb'` instead of `'kjv'`.

---

## Phase 2: Update Repositories & Engines
Any file that previously hardcoded `'kjv'` as a default fallback parameter needs to be updated.

**1. `src/services/db/verseRepository.ts`:**
Update the default parameter in `getVerse`:
```typescript
async getVerse(book: number, chapter: number, verse: number, translation: string = 'bsb')
```

**2. `src/services/practice/recallEngine.ts`:**
Update the default parameter in the generators:
```typescript
static generateRecallPractice(rawText: string, difficultyLevel: number, translation: string = 'bsb')
// AND
static generateReferencePractice(book: number, chapter: number, verse: number, difficultyLevel: number, translation: string = 'bsb')
```

---

## Phase 3: Supabase Storage (Manual User Step)
Because KJV is no longer bundled in the app files (to save storage space), any user who selects KJV in their settings will trigger a Supabase download. 

**USER ACTION REQUIRED:** 
1. Log into your Supabase Dashboard.
2. Go to **Storage** -> `bible-translations` bucket.
3. Upload your old `kjv_v2.sqlite` file into this bucket.
*(If this step is skipped, the app will throw a network error if a user tries to switch to KJV).*

---

## Phase 4: Clean up unused assets
Once the logic is running and successfully querying the BSB file on the device, the old `kjv_v2.sqlite` file can be safely deleted from the local `assets/db/` folder to significantly reduce the app's installation size.
