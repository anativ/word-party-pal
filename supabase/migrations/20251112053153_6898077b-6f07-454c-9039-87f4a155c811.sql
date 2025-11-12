-- Add skipped column to word_stats table
ALTER TABLE public.word_stats 
ADD COLUMN skipped boolean DEFAULT false NOT NULL;