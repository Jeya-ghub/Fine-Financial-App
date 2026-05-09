import { getUser } from '@/app/actions/auth'
import { getWorkspaces, getActiveWorkspaceId } from '@/app/actions/workspaces'
import { getCategoriesWithSubs } from '@/app/actions/categories'
import { redirect } from 'next/navigation'
import Sidebar from './components/Sidebar'
import DashboardHeader from './components/DashboardHeader'
import TransactionDialog from './components/TransactionDialog'
import { DashboardProvider } from '@/components/providers/DashboardProvider'

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
    // This should ideally not happen after the onboarding fix, 
    // but we'll show a fallback or redirect to a creation page if it does.
    return (
      <div className="flex h-screen bg-[#0a0a0a] items-center justify-center text-white">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">No Workspace Found</h1>
          <p className="text-zinc-500">Please contact support or try logging in again.</p>
        </div>
      </div>
    )
  }

  const activeWorkspace = workspaces.find(w => w.id === activeIdCookie) || workspaces[0]

  // This one depends on activeWorkspace, but we can potentially parallelize it too if we pre-calculate activeId
  const categoriesRes = await getCategoriesWithSubs(activeWorkspace.id)
  const categories = categoriesRes.data || []

  return (
    <DashboardProvider workspaceId={activeWorkspace.id}>
      <div className="flex h-screen bg-[#0a0a0a] overflow-hidden text-white font-sans">
        <Sidebar 
          workspaces={workspaces} 
          activeWorkspaceId={activeWorkspace.id} 
          userEmail={user.email || ''} 
        />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader 
            userEmail={user.email || ''} 
            workspaceId={activeWorkspace.id} 
            categories={categories} 
            workspaces={workspaces}
          />
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-6 lg:p-8">
              <Suspense fallback={<div className="animate-pulse bg-white/5 h-full w-full rounded-3xl" />}>
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
  )
}
