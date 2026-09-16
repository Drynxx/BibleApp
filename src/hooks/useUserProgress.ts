import { UserProgress } from '../types/models';

export function useUserProgress(): UserProgress {
  // Mock data representing user's streak and progress.
  return {
    userId: 'mock-user',
    currentStreak: 12,
    longestStreak: 21,
    isDoneToday: false,
    savedCollections: [
      { id: '1', title: 'Morning', count: 12, image: require('../../assets/images/plans/plan-direction.jpg') },
      { id: '2', title: 'Wisdom', count: 8, image: require('../../assets/images/plans/plan-anxiety.jpg') },
      { id: '3', title: 'Peace', count: 15, image: require('../../assets/images/plans/plan-anger.jpg') },
      { id: '4', title: 'Strength', count: 6, image: require('../../assets/images/plans/plan-grief.jpg') },
    ],
    activityMap: [
      0, 1, 1, 1, 1, 1, 0,
      1, 1, 1, 0, 0, 1, 1,
      1, 1, 1, 1, 1, 1, 1,
      1, 0, 0, 1, 1, 0, 0,
      0, 0, 1, 0, 0, 1, 0,
    ],
    achievements: [
      { id: '1', label: '7 Day Streak', iconType: 'Flame' },
      { id: '2', label: 'First Book', iconType: 'BookOpen' },
      { id: '3', label: 'Night Owl', iconType: 'Moon' },
      { id: '4', label: 'Psalms Master', iconType: 'Crown' },
    ],
    masteredVerses: [
      'Philippians 4:8',
      'Psalm 23',
      'Jeremiah 29:11'
    ],
    versesMasteredCount: 47,
    practiceDaysThisMonth: 18,
  };
}
