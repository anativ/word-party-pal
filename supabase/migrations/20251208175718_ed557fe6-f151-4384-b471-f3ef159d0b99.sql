-- Allow anyone to update words
CREATE POLICY "Anyone can update words" 
ON public.words 
FOR UPDATE 
USING (true)
WITH CHECK (true);