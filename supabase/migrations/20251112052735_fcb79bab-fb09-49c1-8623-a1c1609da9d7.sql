-- Add settings columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN dark_mode boolean DEFAULT false,
ADD COLUMN word_order text DEFAULT 'random_priority_least_seen' CHECK (word_order IN ('random', 'least_seen', 'random_priority_least_seen'));