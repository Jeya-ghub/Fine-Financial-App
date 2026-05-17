-- 1. Optimize get_user_workspaces to use (SELECT auth.uid())
CREATE OR REPLACE FUNCTION internal.get_user_workspaces()
RETURNS TABLE (workspace_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id 
  FROM public.workspace_members 
  WHERE user_id = (SELECT auth.uid());
$$;

-- 2. Drop existing SELECT policies
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspaces;

-- 3. Re-create SELECT policies using (SELECT auth.uid()) to enable InitPlan cache optimization
CREATE POLICY "Users can view members of their workspaces"
ON public.workspace_members
FOR SELECT
TO public
USING (
  user_id = (SELECT auth.uid()) 
  OR workspace_id IN (SELECT internal.get_user_workspaces())
);

CREATE POLICY "Users can view workspaces they are members of"
ON public.workspaces
FOR SELECT
TO authenticated
USING (
  created_by = (SELECT auth.uid())
  OR id IN (SELECT internal.get_user_workspaces())
);
