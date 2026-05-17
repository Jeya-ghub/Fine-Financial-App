-- Clean up existing duplicate invitations in workspace_invites
DELETE FROM public.workspace_invites a USING public.workspace_invites b
WHERE a.id < b.id AND a.email = b.email AND a.workspace_id = b.workspace_id;
