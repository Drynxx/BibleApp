import { PracticeSession } from '../types/models';

const MOCK_SESSION: PracticeSession = {
  sessionId: 'mock-session-1',
  verse: {
    id: 'mock-verse-1',
    reference: 'John 3:16',
    bookId: 43,
    chapter: 3,
    verse: 16,
    text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
    translation: 'KJV',
    isMastered: false,
  },
  masteryPercentage: 45,
  completed: false,
};

export function useDailyPractice() {
  return { currentSession: MOCK_SESSION };
}
