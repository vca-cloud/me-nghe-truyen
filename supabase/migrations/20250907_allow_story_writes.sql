-- The admin page currently uses the public anon Supabase client.
-- Allow that client to manage stories during this prototype phase.
DROP POLICY IF EXISTS "Stories are public" ON public.stories;
CREATE POLICY "Stories are public" ON public.stories
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);
