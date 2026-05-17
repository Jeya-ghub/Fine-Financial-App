-- Enable real-time replication for workspace governance tables
alter publication supabase_realtime add table public.workspace_members;
alter publication supabase_realtime add table public.workspace_invites;
alter publication supabase_realtime add table public.workspaces;
