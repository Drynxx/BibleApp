import { supabase } from '../supabase';

export type QueueGrade = 'hard' | 'good' | 'easy';

export interface PracticeQueueItem {
  id: string;
  user_id: string;
  book: number;
  chapter: number;
  verse: number;
  status: string;
  interval_days: number;
  ease_factor: number;
  next_review_at: string;
  created_at: string;
}

export class QueueManager {
  static async addToQueue(userId: string, book: number, chapter: number, verse: number) {
    if (!userId) throw new Error('User required to add to queue');
    
    // Check if it already exists
    const { data: existing } = await supabase
      .from('practice_queue')
      .select('id')
      .eq('user_id', userId)
      .eq('book', book)
      .eq('chapter', chapter)
      .eq('verse', verse)
      .single();

    if (existing) return { success: true, alreadyQueued: true };

    const { error } = await supabase
      .from('practice_queue')
      .insert({
        user_id: userId,
        book,
        chapter,
        verse
      });
      
    if (error) throw error;
    return { success: true, alreadyQueued: false };
  }

  static async getDueVerse(userId: string): Promise<PracticeQueueItem | null> {
    if (!userId) return null;

    // 1. Fetch Due Reviews
    const { data: dueVerses, error: dueError } = await supabase
      .from('practice_queue')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review_at', new Date().toISOString())
      .order('next_review_at', { ascending: true })
      .limit(1);

    if (dueError) {
      console.error('Error fetching due verse', dueError);
      return null;
    }

    if (dueVerses && dueVerses.length > 0) {
      return dueVerses[0] as PracticeQueueItem;
    }

    // 2. Fetch New Material (oldest queued verse)
    const { data: newVerses, error: newError } = await supabase
      .from('practice_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1);

    if (newError) {
      console.error('Error fetching new verse', newError);
      return null;
    }

    if (newVerses && newVerses.length > 0) {
      return newVerses[0] as PracticeQueueItem;
    }

    return null;
  }

  static async updateVerseProgress(queueId: string, grade: QueueGrade) {
    // 1. Fetch current row
    const { data: row, error: fetchError } = await supabase
      .from('practice_queue')
      .select('interval_days, ease_factor')
      .eq('id', queueId)
      .single();
      
    if (fetchError || !row) throw fetchError;

    let interval = row.interval_days;
    let ease = row.ease_factor;

    // First time review handling (interval is 0)
    if (interval === 0) interval = 1;

    // The SM-2 Algorithm
    if (grade === 'hard') {
      interval = 1;
      ease = Math.max(1.3, ease - 0.15);
    } else if (grade === 'good') {
      interval = Math.round(interval * ease);
    } else if (grade === 'easy') {
      interval = Math.round(interval * ease * 1.3);
      ease += 0.15;
    }

    // Ensure interval is at least 1 day
    if (interval < 1) interval = 1;

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + interval);

    // Update the row
    const { error: updateError } = await supabase
      .from('practice_queue')
      .update({
        interval_days: interval,
        ease_factor: ease,
        next_review_at: nextReviewAt.toISOString(),
        status: 'learning'
      })
      .eq('id', queueId);

    if (updateError) throw updateError;
    return { success: true };
  }
}
