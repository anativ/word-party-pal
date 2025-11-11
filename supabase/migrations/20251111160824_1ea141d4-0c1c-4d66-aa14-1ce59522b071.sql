-- Add DELETE policy for word_stats that allows admins to delete any stats
CREATE POLICY "Admins can delete any stats" 
ON public.word_stats 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));