-- Create user_learning_verses table
CREATE TABLE IF NOT EXISTS public.user_learning_verses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    book_id integer NOT NULL,
    chapter integer NOT NULL,
    verse integer NOT NULL,
    progression_step integer NOT NULL DEFAULT 1 CHECK (progression_step >= 1 AND progression_step <= 4),
    added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_practiced_at timestamp with time zone,
    next_practice_at timestamp with time zone,
    
    -- Ensure a user doesn't add the same verse multiple times
    UNIQUE(user_id, book_id, chapter, verse)
);

-- Enable RLS
ALTER TABLE public.user_learning_verses ENABLE ROW LEVEL SECURITY;

-- Policies for user_learning_verses
CREATE POLICY "Users can view their own learning verses"
    ON public.user_learning_verses
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning verses"
    ON public.user_learning_verses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning verses"
    ON public.user_learning_verses
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning verses"
    ON public.user_learning_verses
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster queries on the queue
CREATE INDEX IF NOT EXISTS user_learning_verses_user_id_idx ON public.user_learning_verses (user_id);
CREATE INDEX IF NOT EXISTS user_learning_verses_next_practice_at_idx ON public.user_learning_verses (next_practice_at);
