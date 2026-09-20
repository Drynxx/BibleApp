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
  plan_id?: string;
}

export class QueueManager {
  static async addToQueue(userId: string, book: number, chapter: number, verse: number, planId: string = 'my_saved_verses') {
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
        verse,
        plan_id: planId
      });
      
    if (error) throw error;
    return { success: true, alreadyQueued: false };
  }

  static async getDueVerse(userId: string, planId?: string): Promise<PracticeQueueItem | null> {
    if (!userId) return null;

    // 1. Fetch Due Reviews
    let dueQuery = supabase
      .from('practice_queue')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review_at', new Date().toISOString())
      .order('next_review_at', { ascending: true })
      .limit(1);
      
    if (planId) {
      dueQuery = dueQuery.eq('plan_id', planId);
    }

    const { data: dueVerses, error: dueError } = await dueQuery;

    if (dueError) {
      console.error('Error fetching due verse', dueError);
      return null;
    }

    if (dueVerses && dueVerses.length > 0) {
      return dueVerses[0] as PracticeQueueItem;
    }

    // 2. Fetch New Material (oldest queued verse)
    let newQuery = supabase
      .from('practice_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1);
      
    if (planId) {
      newQuery = newQuery.eq('plan_id', planId);
    }

    const { data: newVerses, error: newError } = await newQuery;

    if (newError) {
      console.error('Error fetching new verse', newError);
      return null;
    }

    if (newVerses && newVerses.length > 0) {
      return newVerses[0] as PracticeQueueItem;
    }

    return null;
  }

  static async getActiveCollections(userId: string) {
    if (!userId) return [];
    
    // Fetch all practice_queue rows
    const { data: queue, error: queueError } = await supabase
      .from('practice_queue')
      .select('*')
      .eq('user_id', userId);

    if (queueError || !queue) return [];

    // Also fetch plan titles to map plan_id to title
    const { data: plans } = await supabase
      .from('discover_plans')
      .select('id, title');
      
    const planMap: Record<string, string> = {
      'my_saved_verses': 'My Saved Verses'
    };
    plans?.forEach(p => planMap[p.id] = p.title);

    // Group by plan_id
    const groups: Record<string, { planId: string; title: string; progressSum: number; dueCount: number; totalVerses: number }> = {};
    const now = new Date().getTime();

    for (const item of queue) {
      const pid = item.plan_id || 'my_saved_verses';
      if (!groups[pid]) {
        groups[pid] = {
          planId: pid,
          title: planMap[pid] || pid,
          progressSum: 0,
          dueCount: 0,
          totalVerses: 0,
        };
      }
      
      const interval = item.interval_days || 0;
      const mastery = Math.min(100, Math.round((interval / 21) * 100)) / 100;
      groups[pid].progressSum += mastery;
      groups[pid].totalVerses += 1;
      
      if (item.status === 'learning' || item.status === 'queued') {
        const nextReview = item.next_review_at ? new Date(item.next_review_at).getTime() : 0;
        if (nextReview <= now || item.status === 'queued') {
          groups[pid].dueCount += 1;
        }
      }
    }

    return Object.values(groups).map(g => ({
      planId: g.planId,
      title: g.title,
      progress: g.totalVerses > 0 ? (g.progressSum / g.totalVerses) : 0,
      dueCount: g.dueCount,
    }));
  }

  static async getActiveQueue(userId: string, limit: number = 4): Promise<PracticeQueueItem[]> {
    if (!userId) return [];
    
    try {
      const { data, error } = await supabase
        .from('practice_queue')
        .select('*')
        .eq('user_id', userId)
        .order('next_review_at', { ascending: true })
        .limit(limit);

      if (error || !data) return [];
      return data;
    } catch (e) {
      console.warn("Active Queue error:", e);
      return [];
    }
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

  static async removeFromQueue(queueId: string) {
    const { error } = await supabase
      .from('practice_queue')
      .delete()
      .eq('id', queueId);
      
    if (error) throw error;
    return { success: true };
  }

  static async removePlan(userId: string, planId: string) {
    const { error } = await supabase
      .from('practice_queue')
      .delete()
      .eq('user_id', userId)
      .eq('plan_id', planId);
      
    if (error) throw error;
    return { success: true };
  }
}
