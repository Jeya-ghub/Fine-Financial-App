import { fetchDashboardData } from '@/services/dashboard.service'
import { getActiveWorkspaceId, getWorkspaces } from '@/app/actions/workspaces'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const activeIdCookie = await getActiveWorkspaceId()
  const { data: workspaces } = await getWorkspaces()
  
  if (!workspaces || workspaces.length === 0) return null
  
  const activeWorkspace = workspaces.find(w => w.id === activeIdCookie) || workspaces[0]
  
  // Default month calculation
  const date = new Date()
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const currentMonth = `${months[date.getMonth()]} ${date.getFullYear()}`

  // Prefetch data on the server
  let initialData = null
  try {
    initialData = await fetchDashboardData(activeWorkspace.id, currentMonth, null)
  } catch (err) {
    console.error('[Dashboard Server] Prefetch Error:', err)
  }

  return <DashboardClient initialData={initialData} />
}
