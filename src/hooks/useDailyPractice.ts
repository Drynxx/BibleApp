import { PracticeSession } from '../types/models';

export function useDailyPractice(): PracticeSession {
  // In the future, this will connect to SQLite/Supabase.
  // For now, it returns mock data to decouple the UI.
  return {
    sessionId: 'mock-session-123',
    verse: {
      id: 'mock-verse-1',
      reference: 'Proverbe 3:3',
      text: 'Să nu te părăsească bunătatea și credincioșia: leagă-le la gât, scrie-le pe tăblița inimii tale!',
      translation: 'VDCC',
      isMastered: false,
    },
    masteryPercentage: 60,
    completed: false,
  };
}
