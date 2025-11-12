-- Allow "lowest_success_rate" in profiles.word_order
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_word_order_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_word_order_check
CHECK (
  word_order IN (
    'random',
    'least_seen',
    'random_priority_least_seen',
    'lowest_success_rate'
  )
);

-- Keep the existing default as-is
ALTER TABLE public.profiles ALTER COLUMN word_order SET DEFAULT 'random_priority_least_seen';