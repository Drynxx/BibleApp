DROP TABLE IF EXISTS public.discover_verses CASCADE;

CREATE TABLE public.discover_verses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reference text NOT NULL,
  book integer NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  text text NOT NULL,
  group_name text NOT NULL,
  topic text NOT NULL,
  translation text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discover_verses ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to discover_verses"
  ON public.discover_verses FOR SELECT
  USING (true);

-- Insert mock data for the Popular section
INSERT INTO public.discover_verses (reference, book, chapter, verse, text, group_name, topic, translation) VALUES
('Philippians 4:13', 50, 4, 13, 'I can do all this through him who gives me strength.', 'Popular', 'Strength', 'KJV'),
('Psalm 23:1', 19, 23, 1, 'The Lord is my shepherd, I lack nothing.', 'Popular', 'Comfort', 'KJV');
