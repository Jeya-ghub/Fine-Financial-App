'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Download, ArrowUpRight, ArrowDownRight, X, Loader2, ChevronDown, Calendar, DollarSign, FileText, CheckCircle2, Edit2, Trash2, ArrowDown, ArrowUp, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

type Transaction = {
  id: string
  date: string
  description?: string
  amount: number
  type: 'income' | 'expense'
  version_no: number
  created_at?: string
  updated_at?: string
  categories?: { name: string; icon?: string }
  subcategories?: { id: string; name: string }
  subcategory_id?: string
  category_id?: string
}

import { useTransactions, type Operation } from '@/lib/contexts/TransactionsContext'
import { useTransactionSync } from '@/lib/realtime/useTransactionSync'
import ConflictResolutionModal from '@/components/ConflictResolutionModal'
import AuditTimeline from '@/components/AuditTimeline'
import { History } from 'lucide-react'

type Subcategory = { id: string; name: string }
type Category = { id: string; name: string; type: string; subcategories: Subcategory[] }

// ─── Edit Drawer ────────────────────────────────────────────────────────────
function EditDrawer({
  tx,
  categories,
  workspaceId,
  onClose,
  onSaved,
}: {
  tx: Transaction
  categories: Category[]
  workspaceId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [amount, setAmount] = useState(String(tx.amount))
  const [type, setType] = useState<'income' | 'expense'>(tx.type)
  const [date, setDate] = useState(tx.date?.split('T')[0] ?? '')
  const [categoryId, setCategoryId] = useState(tx.category_id ?? '')
  const [subcategoryId, setSubcategoryId] = useState(tx.subcategory_id ?? '')
  const [notes, setNotes] = useState(tx.description ?? '')

  const filteredCats = categories.filter(c => c.type === type)

  const { dispatchOperation } = useTransactions()

  const handleSave = async () => {
    if (!amount) return
    
    // Pass version_no so the server can detect conflicts via optimistic lock
    const optimisticPayload = {
      id: tx.id,
      expected_version: tx.version_no,
      amount: Math.abs(parseFloat(amount)),
      type,
      date,
      category_id: categoryId || undefined,
      subcategory_id: subcategoryId || undefined,
      description: notes.trim(),
    }
    
    dispatchOperation({ type: 'UPDATE', txId: tx.id, workspaceId, payload: optimisticPayload })
    onClose()
  }

  const shortId = tx.id?.slice(0, 12).toUpperCase() ?? 'N/A'
  const createdDate = tx.created_at ? new Date(tx.created_at).toLocaleString() : '—'
  const updatedDate = tx.updated_at ? new Date(tx.updated_at).toLocaleString() : '—'

  const drawer = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-end md:items-stretch md:justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />
        {/* Panel */}
        <motion.div
          initial={{ x: '100%', y: 0 }}
          animate={{ x: 0, y: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="hidden md:flex relative w-[460px] h-full bg-[#0d0d0d] border-l border-white/5 flex-col shadow-2xl"
        >
          <DrawerBody shortId={shortId} type={type} setType={setType} amount={amount} setAmount={setAmount} date={date} setDate={setDate} filteredCats={filteredCats} categoryId={categoryId} setCategoryId={setCategoryId} subcategoryId={subcategoryId} setSubcategoryId={setSubcategoryId} notes={notes} setNotes={setNotes} onClose={onClose} onSave={handleSave} createdDate={createdDate} updatedDate={updatedDate} />
        </motion.div>

        {/* Mobile Bottom Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="md:hidden relative w-full max-h-[92vh] bg-[#0d0d0d] border-t border-white/5 rounded-t-[2.5rem] flex flex-col shadow-2xl overflow-hidden"
        >
          <DrawerBody shortId={shortId} type={type} setType={setType} amount={amount} setAmount={setAmount} date={date} setDate={setDate} filteredCats={filteredCats} categoryId={categoryId} setCategoryId={setCategoryId} subcategoryId={subcategoryId} setSubcategoryId={setSubcategoryId} notes={notes} setNotes={setNotes} onClose={onClose} onSave={handleSave} createdDate={createdDate} updatedDate={updatedDate} />
        </motion.div>
      </div>
    </AnimatePresence>
  )

  return createPortal(drawer, document.body)
}

function DrawerBody({ shortId, type, setType, amount, setAmount, date, setDate, filteredCats, categoryId, setCategoryId, subcategoryId, setSubcategoryId, notes, setNotes, error, loading, onClose, onSave, createdDate, updatedDate }: any) {
  const selectedCat = filteredCats.find((c: any) => c.id === categoryId)
  const availableSubs = selectedCat?.subcategories ?? []
  return (
    <>
      {/* Drag handle mobile */}
      <div className="md:hidden w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 shrink-0" />

      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 shrink-0">
        <div>
          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Editing</p>
          <h3 className="font-mono font-bold text-white text-base">Txn: {shortId}</h3>
        </div>
        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {/* Type */}
        <div className="flex p-1 bg-white/5 rounded-2xl h-[52px]">
          <button type="button" onClick={() => setType('expense')} className={cn("flex-1 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", type === 'expense' ? 'bg-white text-red-500' : 'text-zinc-500 hover:text-white')}>
            <ArrowDown className="w-3 h-3" /> Expense
          </button>
          <button type="button" onClick={() => setType('income')} className={cn("flex-1 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", type === 'income' ? 'bg-white text-emerald-500' : 'text-zinc-500 hover:text-white')}>
            <ArrowUp className="w-3 h-3" /> Income
          </button>
        </div>

        {/* Amount */}
        <div className="space-y-1">
          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.25em]">Amount</label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input type="number" inputMode="decimal" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full h-[56px] bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-6 text-2xl font-black text-white focus:outline-none focus:ring-2 focus:ring-white/10 tracking-tighter" />
          </div>
        </div>

        {/* Date */}
        <div className="space-y-1">
          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.25em]">Date</label>
          <input type="date" value={date} max={new Date().toISOString().split('T')[0]} onChange={e => setDate(e.target.value)} className="w-full h-[52px] bg-white/[0.03] border border-white/5 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none [color-scheme:dark]" />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.25em]">Category</label>
          <div className="relative">
            <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubcategoryId('') }} className="w-full h-[52px] bg-white/[0.03] border border-white/5 rounded-2xl pl-5 pr-10 text-sm font-bold text-white focus:outline-none appearance-none transition-all">
              <option value="" className="bg-[#0d0d0d]">Select category...</option>
              {filteredCats.map((c: any) => <option key={c.id} value={c.id} className="bg-[#0d0d0d]">{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
          </div>
        </div>

        {/* Subcategory */}
        <AnimatePresence>
          {categoryId && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1 overflow-hidden"
            >
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.25em]">Subcategory</label>
              <div className="relative">
                <select value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)} className="w-full h-[52px] bg-white/[0.03] border border-white/5 rounded-2xl pl-5 pr-10 text-sm font-bold text-white focus:outline-none appearance-none transition-all">
                  <option value="" className="bg-[#0d0d0d]">Select subcategory...</option>
                  {availableSubs.map((s: any) => <option key={s.id} value={s.id} className="bg-[#0d0d0d]">{s.name}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.25em]">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Additional context..." className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-sm font-medium text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-white/10 resize-none" />
        </div>

        {/* Audit Trail Section inside Drawer */}
        <div className="pt-6 border-t border-white/5 space-y-4">
          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.25em]">Audit Trail</p>
          <div className="space-y-4">
             {/* We will fetch and display events here or show placeholders if not available in this scope */}
             <div className="relative pl-4 border-l border-white/10 space-y-6 py-2">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Transaction Created</p>
                  <p className="text-[9px] text-zinc-500 mt-0.5">{createdDate}</p>
                </div>
                <div className="relative opacity-50">
                   <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full border border-white/20 bg-black" />
                   <p className="text-[10px] font-bold text-zinc-400">Last System Sync</p>
                   <p className="text-[9px] text-zinc-600 mt-0.5">{updatedDate}</p>
                </div>
             </div>
          </div>
        </div>

      </div>

        {/* Sticky Footer */}
      <div className="px-8 py-6 border-t border-white/5 shrink-0">
        <button onClick={onSave} disabled={!amount} className="w-full h-[60px] bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-30 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> Save Changes
        </button>
      </div>
    </>
  )
}

// ─── Main Client Component ───────────────────────────────────────────────────
export default function TransactionsClient({
  categories = [],
  workspaceId,
}: {
  categories?: Category[]
  workspaceId: string
}) {
  const { 
    transactions, 
    pendingOperations, 
    dispatchOperation, 
    retryOperation, 
    cancelOperation,
    conflictPayload,
    resolveConflict,
    realtimeUpsert,
    realtimeDelete
  } = useTransactions()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [auditTxId, setAuditTxId] = useState<string | null>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // ── Realtime Sync ──
  useTransactionSync({
    workspaceId,
    onUpsert: (tx) => realtimeUpsert(tx),
    onDelete: (id) => realtimeDelete(id),
  })

  const today = new Date().toISOString().split('T')[0]

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const q = debouncedSearch.toLowerCase()
      const matchSearch = !q ||
        t.description?.toLowerCase().includes(q) ||
        t.id?.toLowerCase().includes(q) ||
        t.categories?.name?.toLowerCase().includes(q)
      const matchType = typeFilter === 'all' || t.type === typeFilter
      const matchCat = !categoryFilter || t.categories?.name === categoryFilter
      const txDate = t.date?.split('T')[0] ?? ''
      const matchFrom = !dateFrom || txDate >= dateFrom
      const matchTo = !dateTo || txDate <= dateTo
      return matchSearch && matchType && matchCat && matchFrom && matchTo
    })
  }, [transactions, debouncedSearch, typeFilter, categoryFilter, dateFrom, dateTo])

  const hasActiveFilter = search || typeFilter !== 'all' || categoryFilter || dateFrom || dateTo

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return
    dispatchOperation({ type: 'DELETE', txId: id, workspaceId })
  }

  const uniqueCategories = [...new Set(transactions.map(t => t.categories?.name).filter(Boolean))]

  return (
    <div className="flex flex-col h-full">
      {/* ── Glassmorphic Filter Bar ── */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder="Search ID, notes, category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-[44px] bg-white/[0.03] border border-white/5 rounded-2xl pl-11 pr-4 text-xs font-bold text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
            />
            {search && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />}
          </div>

          {/* Type Filter */}
          <div className="flex p-1 bg-white/[0.03] border border-white/5 rounded-2xl h-[44px]">
            {(['all', 'income', 'expense'] as const).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={cn("px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all relative", typeFilter === t ? 'bg-white text-black' : 'text-zinc-600 hover:text-white')}>
                {t}
                {typeFilter === t && t !== 'all' && <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-blue-500" />}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-[44px] bg-white/[0.03] border border-white/5 rounded-2xl pl-4 pr-8 text-[10px] font-black text-zinc-400 uppercase tracking-widest focus:outline-none appearance-none">
              <option value="">All Categories</option>
              {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
            {categoryFilter && <span className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-blue-500" />}
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} max={today} onChange={e => setDateFrom(e.target.value)} className="h-[44px] bg-white/[0.03] border border-white/5 rounded-2xl px-4 text-[10px] font-black text-zinc-400 focus:outline-none [color-scheme:dark] w-[140px]" placeholder="From" />
            <span className="text-zinc-700 text-xs">—</span>
            <input type="date" value={dateTo} max={today} onChange={e => setDateTo(e.target.value)} className="h-[44px] bg-white/[0.03] border border-white/5 rounded-2xl px-4 text-[10px] font-black text-zinc-400 focus:outline-none [color-scheme:dark] w-[140px]" placeholder="To" />
          </div>

          {/* Clear */}
          {hasActiveFilter && (
            <button onClick={() => { setSearch(''); setTypeFilter('all'); setCategoryFilter(''); setDateFrom(''); setDateTo('') }} className="h-[44px] px-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 border border-white/5 rounded-2xl">
              <X className="w-3 h-3" /> Clear
            </button>
          )}

          <div className="ml-auto text-[9px] font-black text-zinc-600 uppercase tracking-widest">
            <span className="text-white">{filtered.length}</span> Records
          </div>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="flex-1 overflow-auto px-4 md:px-8 py-6">
        <div className="min-w-[800px]">
          {/* Table Header */}
          <div className="grid grid-cols-[40px_100px_140px_100px_130px_130px_1fr_110px_120px] gap-4 px-6 py-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] border-b border-white/5 mb-1 cursor-default select-none">
            <div>S.No</div>
            <div>Date</div>
            <div>Txn ID</div>
            <div>Type</div>
            <div>Category</div>
            <div>Subcategory</div>
            <div>Notes</div>
            <div className="text-right">Amount</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Rows */}
          <AnimatePresence mode="popLayout">
            {filtered.map((t, i) => {
              const txOps = pendingOperations.filter(op => op.txId === t.id)
              const latestOp = txOps[txOps.length - 1]
              const isDeleting = latestOp?.type === 'DELETE' && latestOp.status !== 'failed'
              const isPending = !!latestOp && (latestOp.status === 'pending' || latestOp.status === 'processing')
              const hasError = latestOp?.status === 'failed'

              if (isDeleting) return null

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.01 }}
                  className={cn(
                    "grid grid-cols-[40px_100px_140px_100px_130px_130px_1fr_110px_120px] gap-4 px-6 py-4 rounded-xl border transition-all group items-center select-none cursor-default",
                    isPending ? "opacity-40 border-white/5 bg-white/[0.01]" : "border-transparent hover:bg-white/[0.03] hover:border-white/5 hover:-translate-y-[2px]",
                    hasError && "border-white/20 bg-white/[0.02]"
                  )}
                >
                  <div className="text-[10px] font-black text-zinc-700">{String(i + 1).padStart(2, '0')}</div>
                  <div className="text-[11px] font-bold text-zinc-500 font-mono">
                    {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                  <div className="font-mono text-[9px] text-zinc-600 truncate uppercase tracking-tight">
                    {t.id?.slice(0, 8).toUpperCase()}
                  </div>
                  <div>
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                      t.type === 'income' ? "bg-white text-black" : "bg-zinc-900 text-zinc-500"
                    )}>
                      {t.type}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-zinc-300 truncate">{t.categories?.name ?? '—'}</div>
                  <div className="text-[10px] font-bold text-zinc-500 truncate">{t.subcategories?.name ?? '—'}</div>
                  <div className="text-[11px] text-zinc-600 truncate italic">
                    {t.description || '—'}
                  </div>
                  <div className="text-right font-black text-sm tracking-tighter tabular-nums">
                    ₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    {hasError ? (
                      <div className="flex gap-1">
                        <button onClick={() => retryOperation(latestOp!.id)} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"><RotateCcw className="w-3.5 h-3.5" /></button>
                        <button onClick={() => cancelOperation(latestOp!.id)} className="p-2 text-zinc-600 hover:text-white rounded-lg transition-colors cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-700 mr-4" />
                    ) : (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setAuditTxId(t.id)} className="p-2 text-zinc-600 hover:text-white transition-colors cursor-pointer" title="Audit Trail"><History className="w-4 h-4" /></button>
                        <button onClick={() => setEditTx(t)} className="p-2 text-zinc-600 hover:text-white transition-colors cursor-pointer" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(t.id)} className="p-2 text-zinc-600 hover:text-red-500 transition-colors cursor-pointer" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="py-32 text-center">
              <Search className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.3em]">No matching records</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals & Drawers ── */}
      {editTx && (
        <EditDrawer
          tx={editTx}
          categories={categories}
          workspaceId={workspaceId}
          onClose={() => setEditTx(null)}
          onSaved={() => setEditTx(null)}
        />
      )}

      {conflictPayload && (
        <ConflictResolutionModal
          conflict={conflictPayload}
          categories={categories}
          onResolve={resolveConflict}
        />
      )}

      {auditTxId && (
        <AuditTimeline
          txId={auditTxId}
          workspaceId={workspaceId}
          categories={categories}
          onClose={() => setAuditTxId(null)}
          onUndoSuccess={() => setAuditTxId(null)}
        />
      )}
    </div>
  )
}
