import { File, Directory, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
import { supabase } from '../supabase'; // Ensure this exists to fetch URL

const DB_DIR = Platform.OS !== 'web' ? new Directory(Paths.document, 'SQLite') : null as any;

export class DatabaseManager {
  /**
   * Ensures the requested database exists in the local SQLite directory.
   * If it doesn't exist, it copies it from assets or downloads it from Supabase.
   */
  static async ensureDbExists(translation: 'kjv' | 'vdcc' | 'cornilescu', forceOverwrite: boolean = false): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      if (!DB_DIR.exists) {
        DB_DIR.create();
      }

      let dbName = 'kjv.sqlite';
      if (translation === 'vdcc' || translation === 'cornilescu') dbName = 'cornilescu.sqlite';

      const destFile = new File(DB_DIR, dbName);

      if (destFile.exists && !forceOverwrite) {
        return true;
      }

      if (forceOverwrite) {
        try {
          await SQLite.deleteDatabaseAsync(dbName);
        } catch (e) { }

        try {
          // Explicitly delete the file itself so File.copy or File.downloadFileAsync doesn't throw "Destination already exists"
          destFile.delete();
        } catch (e) { }
      }

      if (translation === 'kjv') {
        // Copy from local bundled assets
        const asset = await Asset.loadAsync(require('../../../assets/db/kjv_v2.sqlite'));
        const uri = asset[0].localUri || asset[0].uri;

        console.log(`Asset URI resolved: ${uri}`);

        if (uri.startsWith('http')) {
          await File.downloadFileAsync(uri, destFile);
        } else {
          const sourceFile = new File(uri);
          await sourceFile.copy(destFile);
        }
      } else {
        // Download VDCC/Cornilescu from Supabase public bucket
        const { data } = supabase.storage.from('bible-translations').getPublicUrl('cornilescu.sqlite');

        if (!data.publicUrl) {
          throw new Error("Failed to get public URL for Cornilescu database");
        }

        await File.downloadFileAsync(data.publicUrl, destFile);
      }
      
      return true;
    } catch (e) {
      console.error(`Error ensuring DB exists for ${translation}:`, e);
      return false;
    }
  }

  /**
   * Returns a SQLite database connection. 
   * It assumes ensureDbExists was already called successfully.
   */
  static async getConnection(translation: 'kjv' | 'vdcc' | 'cornilescu'): Promise<SQLite.SQLiteDatabase | null> {
    if (Platform.OS === 'web') return null;
    let dbName = 'kjv.sqlite';
    if (translation === 'vdcc' || translation === 'cornilescu') dbName = 'cornilescu.sqlite';

    try {
      // 1. Ensure the DB file is downloaded/copied first
      await this.ensureDbExists(translation);

      const destFile = new File(DB_DIR, dbName);
      if (!destFile.exists) {
        console.warn(`Database ${dbName} does not exist yet. Returning null.`);
        return null;
      }

      let db = await SQLite.openDatabaseAsync(dbName, { useNewConnection: true }, DB_DIR.uri);

      // 2. Validate DB is not empty/corrupted (0-byte file from a failed copy)
      try {
        await db.getFirstAsync('SELECT 1 FROM verses LIMIT 1');
      } catch (validationError: any) {
        console.warn(`Database ${dbName} is corrupt or empty (Validation Error: ${validationError.message}). Re-creating...`);
        try { await db.closeAsync(); } catch (e) { }

        // Re-attempt download/copy FORCING overwrite
        const success = await this.ensureDbExists(translation, true);
        if (!success) {
          console.error("ensureDbExists returned false during recreation!");
          return null;
        }

        // Re-open
        db = await SQLite.openDatabaseAsync(dbName, { useNewConnection: true }, DB_DIR.uri);

        // Final validation to avoid returning a corrupt DB
        try {
          await db.getFirstAsync('SELECT 1 FROM verses LIMIT 1');
        } catch (finalError: any) {
          console.error(`Database is STILL corrupt after recreation! finalError: ${finalError.message}`);
          return null; // Return null instead of crashing the app!
        }
      }

      return db;
    } catch (e) {
      console.error(`Failed to open DB connection for ${translation}:`, e);
      return null;
    }
  }
}
