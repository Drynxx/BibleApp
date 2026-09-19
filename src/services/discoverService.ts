import { supabase } from './supabase';

export interface DailyVerseRow {
  id: string;
  date: string;
  book: number;
  chapter: number;
  verse: number;
}

export interface DiscoverPlanRow {
  id: string;
  title: string;
  description: string;
  verses_array: { b: number; c: number; v: number }[];
  is_active: boolean;
  created_at: string;
}

export class DiscoverService {
  static async getVerseOfTheDay(): Promise<DailyVerseRow | null> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_verses')
      .select('*')
      .eq('date', today)
      .single();

    if (error) {
      console.warn("Could not fetch Verse of the Day", error.message);
      return null;
    }

    return data;
  }

  static async getPlans(): Promise<DiscoverPlanRow[]> {

    const { data, error } = await supabase
      .from('discover_plans')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn("Could not fetch Discover Plans", error?.message);
      return [];
    }

    return data;
  }
}
