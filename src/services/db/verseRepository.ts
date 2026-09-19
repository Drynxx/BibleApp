import { DatabaseManager } from './databaseManager';

export class VerseRepository {
  /**
   * Retrieves the raw text of a specific verse from the local database.
   * Gracefully returns fallback text if the database is not ready or the verse is not found.
   */
  static async getVerse(
    bookId: number, 
    chapter: number, 
    verse: number, 
    translation: 'kjv' | 'vdcc' | 'cornilescu' = 'kjv'
  ): Promise<string> {
    try {
      const db = await DatabaseManager.getConnection(translation);
      if (!db) {
        return "Database not available. Please ensure the translation is downloaded.";
      }

      // Execute the query
      // Using executeAsync or getFirstAsync depending on expo-sqlite API
      // Since SDK 50+, expo-sqlite uses getFirstAsync
      type VerseRow = { text: string };
      const row = await db.getFirstAsync<VerseRow>(
        'SELECT text FROM verses WHERE book = ? AND chapter = ? AND verse = ?',
        [bookId, chapter, verse]
      );

      if (row && row.text) {
        return row.text;
      }

      return "Verse not found in the selected translation.";
    } catch (error) {
      console.error(`Error fetching verse ${bookId}:${chapter}:${verse} (${translation}):`, error);
      return "An error occurred while fetching the verse.";
    }
  }
}
