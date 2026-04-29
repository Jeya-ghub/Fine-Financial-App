import { getWorkspaces, createWorkspace } from '@/app/actions/workspaces'
import { getTransactions } from '@/app/actions/transactions'
import { Plus, LayoutDashboard, Wallet, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { data: workspaces, error: workspaceError } = await getWorkspaces()

  // Basic auth check and redirection
  if (workspaceError || !workspaces) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <p className="text-zinc-400">Please sign in to view your dashboard.</p>
      </div>
    )
  }

  // Auto-create a default workspace if none exists
  if (workspaces.length === 0) {
    await createWorkspace('Personal Finance')
    redirect('/dashboard') // Refresh to load the new workspace
  }

  const activeWorkspace = workspaces[0]
  const { data: transactions } = await getTransactions(activeWorkspace.id)

  const safeTransactions = transactions || []

  const totalIncome = safeTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpense = safeTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const balance = totalIncome - totalExpense

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-emerald-500/30">
      {/* Sidebar/Navigation */}
      <nav className="fixed top-0 w-full border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-blue-500 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight">Fine Finance</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-300">
              {activeWorkspace.name}
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Overview</h1>
          <p className="text-zinc-400">Track your finances across {activeWorkspace.name}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Balance Card */}
          <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-white/10 group hover:border-white/20 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[50px] rounded-full group-hover:bg-emerald-500/30 transition-colors" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-zinc-400 font-medium">Total Balance</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
          </div>

          {/* Income Card */}
          <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <span className="text-zinc-400 font-medium">Total Income</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
          </div>

          {/* Expense Card */}
          <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-400">
                <ArrowDownRight className="w-6 h-6" />
              </div>
              <span className="text-zinc-400 font-medium">Total Expense</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight">Recent Transactions</h2>
          <button className="px-4 py-2 bg-white text-black font-semibold rounded-full text-sm hover:bg-zinc-200 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Transaction
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          {safeTransactions.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <Wallet className="w-8 h-8 text-zinc-600" />
              </div>
              <p>No transactions found for this workspace.</p>
              <p className="text-sm mt-1">Add a transaction to see it here.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {safeTransactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-white">{tx.description || tx.categories?.name || 'Uncategorized'}</p>
                      <p className="text-sm text-zinc-500">{new Date(tx.date).toLocaleDateString()} • v{tx.version_no}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-semibold ${tx.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <button className="p-2 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-white/10">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
