import starterVerses from "../../../assets/data/verses.json";

export interface Verse {
  id: string;
  book: string;
  chapter: number;
  verse_number: number;
  translation: "VDC" | "WEB" | "KJV";
  text: string;
  theme: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface VerseResult {
  text: string;
}

export class VerseRepository {
  private verses: Verse[];

  constructor(initialData?: Verse[]) {
    this.verses = initialData || (starterVerses as Verse[]);
  }

  public getAll(translation?: "VDC" | "WEB"): Verse[] {
    if (!translation) return this.verses;
    return this.verses.filter((v) => v.translation === translation);
  }

  public getById(id: string): Verse | undefined {
    return this.verses.find((v) => v.id === id);
  }

  public getByTheme(theme: string, translation?: "VDC" | "WEB"): Verse[] {
    return this.verses.filter((v) => {
      const matchTheme = v.theme.toLowerCase() === theme.toLowerCase();
      return translation ? matchTheme && v.translation === translation : matchTheme;
    });
  }

  public getRandom(translation: "VDC" | "WEB" = "VDC"): Verse {
    const list = this.getAll(translation);
    const index = Math.floor(Math.random() * list.length);
    return list[index];
  }

  /**
   * Retrieves a specific verse from the local SQLite database.
   * Gracefully falls back to placeholder text if the database doesn't exist yet or on web.
   */
  public async getVerse(
    bookId: number,
    chapter: number,
    verse: number,
    translation: 'kjv' | 'vdcc'
  ): Promise<string | null> {
    let isWeb = false;
    try {
      // Lazily require react-native to avoid importing ESM in Node / Jest environments
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Platform } = require('react-native');
      isWeb = Platform.OS === 'web';
    } catch {
      isWeb = typeof window !== 'undefined';
    }

    if (isWeb) {
      return `[Database ${translation.toUpperCase()} not currently supported on Web]`;
    }

    try {
      // Lazily require databaseManager to avoid module resolution errors in Node / Jest environments
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { databaseManager } = require('./databaseManager');
      await databaseManager.ensureDbExists(translation);
      const db = await databaseManager.getConnection(translation);
      if (!db) {
        return `[Database ${translation.toUpperCase()} not found locally]`;
      }

      // Execute the query. We use getFirstAsync to get a single row.
      const result = await db.getFirstAsync(
        'SELECT text FROM verses WHERE book = ? AND chapter = ? AND verse = ?',
        [bookId, chapter, verse]
      );

      return result?.text || null;
    } catch (error) {
      console.warn(`Error querying verse (${bookId}:${chapter}:${verse}) in ${translation}:`, error);
      return '[Error querying database]';
    }
  }
}

export const verseRepository = new VerseRepository();
