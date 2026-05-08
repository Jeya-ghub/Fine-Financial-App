import { createClient } from '@/lib/supabase/server'

export type WorkspaceRole = 'owner' | 'member' | null

/**
 * Validates if a user has access to a specific workspace.
 * Returns the user's role if they have access, otherwise null.
 */
export async function getWorkspaceAccess(workspaceId: string): Promise<WorkspaceRole> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  return membership?.role ?? null
}

/**
 * Strict guard: Throws or returns error if access is denied.
 */
export async function validateWorkspaceAccess(workspaceId: string) {
  const role = await getWorkspaceAccess(workspaceId)
  if (!role) {
    throw new Error('Unauthorized: You do not have access to this workspace.')
  }
  return role
}
