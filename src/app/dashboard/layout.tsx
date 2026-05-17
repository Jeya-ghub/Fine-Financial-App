import { getUser } from '@/app/actions/auth'
import { getWorkspaces, getActiveWorkspaceId } from '@/app/actions/workspaces'
import { getCategoriesWithSubs } from '@/app/actions/categories'
import { redirect } from 'next/navigation'
import Sidebar from './components/Sidebar'
import DashboardHeader from './components/DashboardHeader'
import TransactionDialog from './components/TransactionDialog'
import { DashboardProvider } from '@/components/providers/DashboardProvider'
import { FilterProvider } from '@/components/providers/FilterProvider'
import NoWorkspaceFallback from './components/NoWorkspaceFallback'

import { Suspense } from 'react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Parallelize initial baseline fetches
  const [user, { data: workspaces }, activeIdCookie] = await Promise.all([
    getUser(),
    getWorkspaces(),
    getActiveWorkspaceId()
  ])

  if (!user) {
    redirect('/auth')
  }

  if (!workspaces || workspaces.length === 0) {
    // Attempt auto-creation of default workspace
    try {
      const { createWorkspace } = await import('@/app/actions/workspaces')
      const wsName = `${user.user_metadata?.full_name || 'My'}'s Workspace`
      const res = await createWorkspace(wsName)
      if (res.success && res.workspace) {
        redirect('/dashboard')
      }
    } catch (err) {
      console.error('[DashboardLayout] Auto-creation failed:', err)
    }

    return <NoWorkspaceFallback userEmail={user.email || undefined} />
  }

  const activeWorkspace = workspaces.find(w => w.id === activeIdCookie) || workspaces[0]

  // This one depends on activeWorkspace, but we can potentially parallelize it too if we pre-calculate activeId
  const categoriesRes = await getCategoriesWithSubs(activeWorkspace.id)
  const categories = categoriesRes.data || []

  return (
    <FilterProvider>
      <DashboardProvider workspaceId={activeWorkspace.id}>
        <div className="flex h-screen bg-background overflow-hidden text-primary font-sans">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <DashboardHeader
              userEmail={user.email || ''}
              username={user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || ''}
              workspaceId={activeWorkspace.id}
              categories={categories}
              workspaces={workspaces}
            />
            <main className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-4 md:p-6 lg:p-8 max-w-screen-2xl mx-auto w-full">
                <Suspense fallback={<div className="animate-pulse bg-surface h-full w-full rounded-2xl" />}>
                  {children}
                </Suspense>
              </div>
            </main>
          </div>
          <TransactionDialog
            workspaceId={activeWorkspace.id}
            categories={categories as any}
            showTrigger={false}
          />
        </div>
      </DashboardProvider>
    </FilterProvider>
  )
}
