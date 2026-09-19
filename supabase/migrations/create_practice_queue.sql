CREATE TABLE public.practice_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  book integer NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  interval_days integer NOT NULL DEFAULT 0,
  ease_factor real NOT NULL DEFAULT 2.5,
  next_review_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.practice_queue ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own queue
CREATE POLICY "Users can insert their own queue items"
  ON public.practice_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own queue items"
  ON public.practice_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue items"
  ON public.practice_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queue items"
  ON public.practice_queue FOR DELETE
  USING (auth.uid() = user_id);
