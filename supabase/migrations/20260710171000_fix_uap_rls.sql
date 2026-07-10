-- Add missing UPDATE policy for user_artifact_progress
CREATE POLICY "own uap update" ON public.user_artifact_progress 
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

-- Also add a policy for user_progress update if missing (it exists but let's be sure)
-- The original migration had:
-- CREATE POLICY "own progress update" ON public.user_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
-- So that one is fine.
