import { getWorkspaces, getActiveWorkspaceId, getWorkspaceMembers } from '@/app/actions/workspaces'
import { getUser } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import WorkspaceClient from './WorkspaceClient'

export default async function WorkspacePage() {
  const user = await getUser()
  if (!user) redirect('/auth')

  const { data: workspaces, error } = await getWorkspaces()
  if (error || !workspaces) redirect('/dashboard')

  const activeIdCookie = await getActiveWorkspaceId()
  const activeWorkspace = workspaces.find((w: any) => w.id === activeIdCookie) || workspaces[0]

  const { data: members } = await getWorkspaceMembers(activeWorkspace.id)

  // Find the current user's role in the active workspace
  const currentUserRole = activeWorkspace.workspace_members.find((m: any) => m.role)?.role || 'member'

  return (
    <div className="h-full bg-[#0a0a0a]">
      <WorkspaceClient 
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        members={members || []}
        currentUserRole={currentUserRole}
        userEmail={user.email || ''}
      />
    </div>
  )
}
