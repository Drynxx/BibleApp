DROP TABLE IF EXISTS public.daily_verses CASCADE;
DROP TABLE IF EXISTS public.discover_plans CASCADE;

CREATE TABLE public.daily_verses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date UNIQUE NOT NULL,
  book integer NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL
);

CREATE TABLE public.discover_plans (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  verses_array jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discover_plans ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read daily verses and plans
CREATE POLICY "Allow public read access to daily_verses"
  ON public.daily_verses FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to discover_plans"
  ON public.discover_plans FOR SELECT
  USING (true);

-- Insert some mock data for development
INSERT INTO public.discover_plans (id, title, description, verses_array, is_active)
VALUES 
  ('plan-anxiety', 'Overcoming Anxiety', 'Scripture for peace in troubled times.', '[{"b": 43, "c": 14, "v": 27}, {"b": 50, "c": 4, "v": 6}]'::jsonb, true),
  ('plan-morning', 'Morning Devotion', 'Start your day with God.', '[{"b": 19, "c": 143, "v": 8}, {"b": 24, "c": 3, "v": 22}]'::jsonb, true),
  ('plan-wisdom', 'Pursuing Wisdom', 'Godly guidance for life.', '[{"b": 20, "c": 3, "v": 5}, {"b": 59, "c": 1, "v": 5}]'::jsonb, true);

INSERT INTO public.daily_verses (date, book, chapter, verse)
VALUES 
  (CURRENT_DATE, 43, 3, 16);
