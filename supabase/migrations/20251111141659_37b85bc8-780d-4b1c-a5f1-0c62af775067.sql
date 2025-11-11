-- Add DELETE policy for words
CREATE POLICY "Anyone can delete words" 
ON public.words 
FOR DELETE 
USING (true);