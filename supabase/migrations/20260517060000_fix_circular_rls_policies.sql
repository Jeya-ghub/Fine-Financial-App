-- 1. Create a security-definer helper function to break recursion
CREATE OR REPLACE FUNCTION public.get_user_workspaces()
RETURNS TABLE (workspace_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id 
  FROM public.workspace_members 
  WHERE user_id = auth.uid();
$$;

-- 2. Drop the recursive select policies
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspaces;

-- 3. Re-create SELECT policies using the helper function
CREATE POLICY "Users can view members of their workspaces"
ON public.workspace_members
FOR SELECT
TO public
USING (
  user_id = auth.uid() 
  OR workspace_id IN (SELECT public.get_user_workspaces())
);

CREATE POLICY "Users can view workspaces they are members of"
ON public.workspaces
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR id IN (SELECT public.get_user_workspaces())
);
