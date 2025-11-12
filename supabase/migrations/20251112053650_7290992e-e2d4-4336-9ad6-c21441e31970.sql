-- Add foreign key constraint from word_stats to words
ALTER TABLE public.word_stats
ADD CONSTRAINT word_stats_word_id_fkey 
FOREIGN KEY (word_id) 
REFERENCES public.words(id) 
ON DELETE CASCADE;