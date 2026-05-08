import { getTransactions } from '@/app/actions/transactions'
import { getCategoriesWithSubs } from '@/app/actions/categories'
import { getWorkspaces, getActiveWorkspaceId } from '@/app/actions/workspaces'
import { getUser } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import TransactionsClient from './TransactionsClient'

import { TransactionsProvider } from '@/lib/contexts/TransactionsContext'

export default async function TransactionsPage() {
  const user = await getUser()
  if (!user) redirect('/auth')

  const { data: workspaces } = await getWorkspaces()
  if (!workspaces || workspaces.length === 0) redirect('/dashboard')

  const activeId = await getActiveWorkspaceId()
  const activeWorkspace = workspaces.find(w => w.id === activeId) || workspaces[0]

  const [{ data: transactions }, { data: categories }] = await Promise.all([
    getTransactions(activeWorkspace.id),
    getCategoriesWithSubs(activeWorkspace.id),
  ])

  const txs = (transactions || []).map(t => ({ ...t, amount: Number(t.amount) }))

  return (
    <div className="h-full bg-[#0a0a0a] flex flex-col">
      <TransactionsProvider initialData={txs as any} workspaceId={activeWorkspace.id}>
        <TransactionsClient
          categories={(categories as any) || []}
          workspaceId={activeWorkspace.id}
        />
      </TransactionsProvider>
    </div>
  )
}
