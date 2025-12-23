-- Create a table for verbs with past and future tenses
CREATE TABLE public.verbs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hebrew TEXT NOT NULL,
  past TEXT NOT NULL,
  future TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.verbs ENABLE ROW LEVEL SECURITY;

-- Create policies for verb access (same as words)
CREATE POLICY "Anyone can view verbs" 
ON public.verbs 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert verbs" 
ON public.verbs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update verbs" 
ON public.verbs 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete verbs" 
ON public.verbs 
FOR DELETE 
USING (true);

-- Create a table for verb stats (tracking user progress)
CREATE TABLE public.verb_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verb_id UUID NOT NULL REFERENCES public.verbs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  successes INTEGER NOT NULL DEFAULT 0,
  skipped BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(verb_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.verb_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for verb stats
CREATE POLICY "Anyone can view verb stats" 
ON public.verb_stats 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own verb stats" 
ON public.verb_stats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verb stats" 
ON public.verb_stats 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any verb stats" 
ON public.verb_stats 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates on verb_stats
CREATE TRIGGER update_verb_stats_updated_at
BEFORE UPDATE ON public.verb_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();