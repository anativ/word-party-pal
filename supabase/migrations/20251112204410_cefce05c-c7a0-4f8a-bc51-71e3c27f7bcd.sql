-- Add "by_order" to profiles.word_order check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_word_order_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_word_order_check
CHECK (
  word_order IN (
    'random',
    'least_seen',
    'random_priority_least_seen',
    'lowest_success_rate',
    'by_order'
  )
);