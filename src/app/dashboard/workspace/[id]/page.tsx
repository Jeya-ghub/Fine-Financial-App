import { getWorkspace, getWorkspaceMembers, getWorkspaceInvites } from '@/app/actions/workspaces'
import { getUser } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import WorkspaceDetailClient from './WorkspaceDetailClient'

export default async function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  if (!user) redirect('/auth')

  const { data: workspace, error: wsError } = await getWorkspace(id)
  if (wsError || !workspace) redirect('/dashboard/workspace')

  const { data: members } = await getWorkspaceMembers(id)
  const { data: invites } = await getWorkspaceInvites(id)

  const isMember = members?.find((m: any) => m.user_id === user.id)
  if (!isMember) redirect('/dashboard/workspace')

  return (
    <div className="h-full bg-[#0a0a0a]">
      <WorkspaceDetailClient 
        workspace={workspace}
        members={members || []}
        invites={invites || []}
        currentUserRole={isMember.role}
        userEmail={user.email || ''}
      />
    </div>
  )
}
