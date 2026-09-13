import { Platform } from 'react-native';
import { databaseManager } from './databaseManager';

export interface VerseResult {
  text: string;
}

export const verseRepository = {
  /**
   * Retrieves a specific verse from the local SQLite database.
   * Gracefully falls back to placeholder text if the database doesn't exist yet.
   */
  async getVerse(
    bookId: number,
    chapter: number,
    verse: number,
    translation: 'kjv' | 'vdcc'
  ): Promise<string | null> {
    if (Platform.OS === 'web') {
      return `[Database ${translation.toUpperCase()} not currently supported on Web]`;
    }

    try {
      await databaseManager.ensureDbExists(translation);
      const db = await databaseManager.getConnection(translation);
      if (!db) {
        return `[Database ${translation.toUpperCase()} not found locally]`;
      }

      // Execute the query. We use getFirstAsync to get a single row.
      const result = await db.getFirstAsync<VerseResult>(
        'SELECT text FROM verses WHERE book = ? AND chapter = ? AND verse = ?',
        [bookId, chapter, verse]
      );

      return result?.text || null;
    } catch (error) {
      console.warn(`Error querying verse (${bookId}:${chapter}:${verse}) in ${translation}:`, error);
      return '[Error querying database]';
    }
  }
};
