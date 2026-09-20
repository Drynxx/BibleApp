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

export interface DiscoverVerseRow {
  id: string;
  reference: string;
  book: number;
  chapter: number;
  verse: number;
  text: string;
  group_name: string;
  topic: string;
  translation: string;
  is_active: boolean;
}

export class DiscoverService {
  static async getVerseOfTheDay(): Promise<DailyVerseRow | null> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_verses')
      .select('*')
      .eq('date', today)
      .limit(1)
      .maybeSingle();

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

  static async getDiscoverVerses(): Promise<DiscoverVerseRow[]> {
    const { data, error } = await supabase
      .from('discover_verses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn("Could not fetch Discover Verses", error?.message);
      return [];
    }
    
    return data;
  }
}
