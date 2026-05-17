-- 1. Create a private internal schema
CREATE SCHEMA IF NOT EXISTS internal;

-- 2. Define get_user_workspaces inside the internal schema
CREATE OR REPLACE FUNCTION internal.get_user_workspaces()
RETURNS TABLE (workspace_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id 
  FROM public.workspace_members 
  WHERE user_id = auth.uid();
$$;

-- 3. Grant schema and function privileges so executing roles can call it during RLS
GRANT USAGE ON SCHEMA internal TO authenticated, anon;
GRANT EXECUTE ON FUNCTION internal.get_user_workspaces() TO authenticated, anon;

-- 4. Re-create the RLS policies to use the new function
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspaces;

CREATE POLICY "Users can view members of their workspaces"
ON public.workspace_members
FOR SELECT
TO public
USING (
  user_id = auth.uid() 
  OR workspace_id IN (SELECT internal.get_user_workspaces())
);

CREATE POLICY "Users can view workspaces they are members of"
ON public.workspaces
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR id IN (SELECT internal.get_user_workspaces())
);

-- 5. Drop the old function from public schema to resolve the Security Advisor warnings
DROP FUNCTION IF EXISTS public.get_user_workspaces();
