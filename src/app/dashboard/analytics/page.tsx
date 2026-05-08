import { getWorkspaces, getActiveWorkspaceId } from '@/app/actions/workspaces'
import AnalyticsClient from '@/app/dashboard/analytics/AnalyticsClient'
import { redirect } from 'next/navigation'

export default async function AnalyticsPage() {
  const { data: workspaces } = await getWorkspaces()
  const activeWorkspaceId = await getActiveWorkspaceId()

  if (!workspaces || workspaces.length === 0) {
    redirect('/dashboard/workspace')
  }

  return (
    <AnalyticsClient 
      workspaces={workspaces} 
      initialWorkspaceId={activeWorkspaceId || workspaces[0].id} 
    />
  )
}
