export interface BibleVerse {
  id: string;
  reference: string; // e.g. "John 3:16"
  text: string;
  translation: string;
  isMastered: boolean;
}

export interface PracticeSession {
  sessionId: string;
  verse: BibleVerse;
  masteryPercentage: number;
  completed: boolean;
}

export interface Collection {
  id: string;
  title: string;
  count: number;
  image: any; // Using any for require() image imports temporarily
}

export interface UserProgress {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  isDoneToday: boolean;
  savedCollections: Collection[];
  activityMap: number[];
  achievements: ProgressAchievement[];
  masteredVerses: string[];
  versesMasteredCount: number;
  practiceDaysThisMonth: number;
}

export interface DiscoverPack {
  id: string;
  title: string;
  verses: number;
  image: any;
}

export interface LibraryVerse {
  id: string;
  reference: string;
  snippet: string;
}

export interface ProgressAchievement {
  id: string;
  label: string;
  iconType: string;
}

export interface Reflection {
  id: string;
  title: string;
  date: string;
  snippet: string;
}
