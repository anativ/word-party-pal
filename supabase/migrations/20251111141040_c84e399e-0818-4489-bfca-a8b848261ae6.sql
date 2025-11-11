-- Create words table to store English-Hebrew word pairs
CREATE TABLE public.words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  english TEXT NOT NULL,
  hebrew TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create word_stats table to track success rate
CREATE TABLE public.word_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word_id UUID NOT NULL REFERENCES public.words(id) ON DELETE CASCADE,
  attempts INT NOT NULL DEFAULT 0,
  successes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(word_id)
);

-- Enable Row Level Security
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth needed for learning app)
CREATE POLICY "Anyone can view words" 
ON public.words 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert words" 
ON public.words 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view stats" 
ON public.word_stats 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert stats" 
ON public.word_stats 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update stats" 
ON public.word_stats 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_word_stats_updated_at
BEFORE UPDATE ON public.word_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();