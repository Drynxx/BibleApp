import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
import { supabase } from '../supabase';

// In Expo Go, we must use the scoped documentDirectory for file system writes to avoid sandbox restrictions.
const DB_DIR = Platform.OS === 'web' 
  ? '' 
  : `${FileSystem.documentDirectory}SQLite/`;

export const databaseManager = {
  /**
   * Ensures the database file exists in the app's internal SQLite directory.
   * If KJV, copies from local assets. If VDCC, downloads from Supabase public storage.
   */
  async ensureDbExists(translation: 'kjv' | 'vdcc'): Promise<void> {
    if (Platform.OS === 'web') {
      console.warn('[DB INIT] Web platform does not support expo-file-system for SQLite asset initialization.');
      return;
    }
    
    const dirInfo = await FileSystem.getInfoAsync(DB_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(DB_DIR, { intermediates: true });
    }

    if (translation === 'kjv') {
      const dbPath = `${DB_DIR}kjv.sqlite`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      
      console.log(`[DB INIT] Checking kjv.sqlite at ${dbPath}. Exists: ${fileInfo.exists}, Size: ${fileInfo.exists ? fileInfo.size : 'N/A'}`);
      
      // If the file doesn't exist OR it's suspiciously small (an auto-created empty DB), copy it again
      const isInvalidDb = !fileInfo.exists || (fileInfo.isDirectory === false && fileInfo.size < 100000);
      
      if (isInvalidDb) {
        console.log(`[DB INIT] kjv.sqlite is invalid/missing. Re-copying from assets...`);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(dbPath, { idempotent: true });
        }
        try {
          const assetModule = require('../../../assets/db/kjv.sqlite');
          console.log(`[DB INIT] assetModule:`, typeof assetModule, assetModule);
          
          const asset = Asset.fromModule(assetModule);
          console.log(`[DB INIT] Asset info:`, { uri: asset.uri, localUri: asset.localUri });
          
          // In development, Metro serves assets over HTTP. We must use downloadAsync, not copyAsync.
          console.log(`[DB INIT] Downloading asset from ${asset.uri} to ${dbPath}`);
          await FileSystem.downloadAsync(asset.uri, dbPath);
          
          const newFileInfo = await FileSystem.getInfoAsync(dbPath);
          console.log(`[DB INIT] Finished copying. New size: ${newFileInfo.exists ? newFileInfo.size : 'FAILED'}`);
        } catch (error) {
          console.warn('[DB INIT] Could not copy bundled KJV db to internal directory:', error);
        }
      }
    } else if (translation === 'vdcc') {
      const dbPath = `${DB_DIR}cornilescu.sqlite`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      
      const isInvalidDb = !fileInfo.exists || (fileInfo.isDirectory === false && fileInfo.size < 100000);
      
      if (isInvalidDb) {
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(dbPath, { idempotent: true });
        }
        try {
          // Get public URL from Supabase storage
          const { data } = supabase.storage
            .from('bible-translations')
            .getPublicUrl('cornilescu.sqlite');

          if (data?.publicUrl) {
            console.log(`Downloading VDCC database from: ${data.publicUrl}`);
            await FileSystem.downloadAsync(data.publicUrl, dbPath);
          }
        } catch (error) {
          console.warn('Could not download remote VDCC db:', error);
          throw error;
        }
      }
    }
  },

  /**
   * Returns a connection to the specified translation DB.
   */
  async getConnection(translation: 'kjv' | 'vdcc') {
    const dbName = translation === 'kjv' ? 'kjv.sqlite' : 'cornilescu.sqlite';
    try {
      return await SQLite.openDatabaseAsync(dbName, undefined, DB_DIR);
    } catch (error) {
      console.warn(`Failed to open database connection for ${dbName}:`, error);
      return null;
    }
  }
};
