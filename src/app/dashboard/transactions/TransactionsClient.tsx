'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Download, ArrowUpRight, ArrowDownRight, X, Loader2, ChevronDown, Calendar, DollarSign, FileText, CheckCircle2, Edit2, Trash2, ArrowDown, ArrowUp, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

import { Transaction } from '@/types/transaction.types'
import { Category, Subcategory } from '@/types/category.types'

import { useTransactions, type Operation } from '@/lib/contexts/TransactionsContext'
import { useTransactionSync } from '@/lib/realtime/useTransactionSync'
import ConflictResolutionModal from '@/components/ConflictResolutionModal'
import AuditTimeline from '@/components/AuditTimeline'
import { History } from 'lucide-react'

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
          className="hidden md:flex relative w-[400px] h-full bg-surface border-l border-surface-border flex-col shadow-2xl"
        >
          <DrawerBody shortId={shortId} type={type} setType={setType} amount={amount} setAmount={setAmount} date={date} setDate={setDate} filteredCats={filteredCats} categoryId={categoryId} setCategoryId={setCategoryId} subcategoryId={subcategoryId} setSubcategoryId={setSubcategoryId} notes={notes} setNotes={setNotes} onClose={onClose} onSave={handleSave} createdDate={createdDate} updatedDate={updatedDate} />
        </motion.div>

        {/* Mobile Bottom Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="md:hidden relative w-full max-h-[92vh] bg-surface border-t border-surface-border rounded-t-[2.5rem] flex flex-col shadow-2xl overflow-hidden"
        >
          <DrawerBody shortId={shortId} type={type} setType={setType} amount={amount} setAmount={setAmount} date={date} setDate={setDate} filteredCats={filteredCats} categoryId={categoryId} setCategoryId={setCategoryId} subcategoryId={subcategoryId} setSubcategoryId={setSubcategoryId} notes={notes} setNotes={setNotes} onClose={onClose} onSave={handleSave} createdDate={createdDate} updatedDate={updatedDate} />
        </motion.div>
      </div>
    </AnimatePresence>
  )

  return createPortal(drawer, document.body)
}

function DrawerBody({ 
  shortId, 
  type, 
  setType, 
  amount, 
  setAmount, 
  date, 
  setDate, 
  filteredCats, 
  categoryId, 
  setCategoryId, 
  subcategoryId, 
  setSubcategoryId, 
  notes, 
  setNotes, 
  onClose, 
  onSave, 
  createdDate, 
  updatedDate 
}: {
  shortId: string
  type: 'income' | 'expense'
  setType: (t: 'income' | 'expense') => void
  amount: string
  setAmount: (a: string) => void
  date: string
  setDate: (d: string) => void
  filteredCats: Category[]
  categoryId: string
  setCategoryId: (id: string) => void
  subcategoryId: string
  setSubcategoryId: (id: string) => void
  notes: string
  setNotes: (n: string) => void
  onClose: () => void
  onSave: () => void
  createdDate: string
  updatedDate: string
}) {
  const selectedCat = filteredCats.find((c) => c.id === categoryId)
  const availableSubs = selectedCat?.subcategories ?? []
  return (
    <>
      {/* Drag handle mobile */}
      <div className="md:hidden w-12 h-1.5 bg-surface-border rounded-full mx-auto mt-4 mb-2 shrink-0" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-surface-border shrink-0">
        <div>
          <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-1">Transaction Editor</p>
          <h3 className="font-mono font-bold text-primary text-lg">ID: {shortId}</h3>
        </div>
        <button onClick={onClose} className="p-2 bg-surface-hover border border-surface-border rounded-lg text-muted hover:text-primary transition-all active:scale-90"><X className="w-4 h-4" /></button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Type */}
        <div className="flex p-1 bg-surface-hover/50 border border-surface-border rounded-xl h-10">
          <button type="button" onClick={() => setType('expense')} className={cn("flex-1 flex items-center justify-center gap-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm", type === 'expense' ? 'bg-surface text-accent-red border border-surface-border' : 'text-muted hover:text-primary')}>
            <ArrowDown className="w-3.5 h-3.5" /> Expense
          </button>
          <button type="button" onClick={() => setType('income')} className={cn("flex-1 flex items-center justify-center gap-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm", type === 'income' ? 'bg-surface text-accent-emerald border border-surface-border' : 'text-muted hover:text-primary')}>
            <ArrowUp className="w-3.5 h-3.5" /> Income
          </button>
        </div>

        {/* Amount */}
        <div className="space-y-1">
          <label className="text-[9px] font-black text-muted uppercase tracking-[0.25em]">Monetary Value</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-muted">₹</span>
            <input type="number" inputMode="decimal" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full h-11 bg-surface-hover/30 border border-surface-border rounded-xl pl-10 pr-4 text-xl font-black text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all tracking-tighter" />
          </div>
        </div>

        {/* Date */}
        <div className="space-y-1">
          <label className="text-[9px] font-black text-muted uppercase tracking-[0.25em]">Execution Date</label>
          <input type="date" value={date} max={new Date().toISOString().split('T')[0]} onChange={e => setDate(e.target.value)} className="w-full h-11 bg-surface-hover/30 border border-surface-border rounded-xl px-4 text-[13px] font-bold text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all [color-scheme:light] dark:[color-scheme:dark]" />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-muted uppercase tracking-[0.25em]">Category Segment</label>
          <div className="relative">
            <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubcategoryId('') }} className="w-full h-11 bg-surface-hover/30 border border-surface-border rounded-xl pl-4 pr-10 text-[13px] font-bold text-primary focus:outline-none appearance-none transition-all focus:ring-4 focus:ring-primary/5">
              <option value="" className="bg-surface">Choose category...</option>
              {filteredCats.map((c: any) => <option key={c.id} value={c.id} className="bg-surface">{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
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
              <label className="text-[9px] font-black text-muted uppercase tracking-[0.25em]">Detailed Classification</label>
              <div className="relative">
                <select value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)} className="w-full h-11 bg-surface-hover/30 border border-surface-border rounded-xl pl-4 pr-10 text-[13px] font-bold text-primary focus:outline-none appearance-none transition-all focus:ring-4 focus:ring-primary/5">
                  <option value="" className="bg-surface">Choose subcategory...</option>
                  {availableSubs.map((s: any) => <option key={s.id} value={s.id} className="bg-surface">{s.name}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-muted uppercase tracking-[0.25em]">Notes & Context</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add specific details about this record..." className="w-full bg-surface-hover/30 border border-surface-border rounded-xl p-4 text-[13px] font-medium text-primary placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/5 resize-none transition-all" />
        </div>

        {/* Audit Trail Section inside Drawer */}
        <div className="pt-8 border-t border-surface-border space-y-6">
          <p className="text-[10px] font-black text-muted uppercase tracking-[0.25em]">System Audit Log</p>
          <div className="space-y-6">
             <div className="relative pl-6 border-l-2 border-surface-border space-y-8 py-2">
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-surface shadow-premium" />
                  <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-1">Creation Event</p>
                  <p className="text-[10px] font-bold text-muted">{createdDate}</p>
                </div>
                <div className="relative opacity-60">
                   <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-surface border-2 border-surface-border shadow-inner" />
                   <p className="text-[11px] font-black text-muted uppercase tracking-[0.2em] mb-1">Last Synchronization</p>
                   <p className="text-[10px] font-bold text-muted/60">{updatedDate}</p>
                </div>
             </div>
          </div>
        </div>

      </div>

      {/* Sticky Footer */}
      <div className="px-6 py-6 border-t border-surface-border shrink-0 bg-surface">
        <button onClick={onSave} disabled={!amount} className="w-full h-14 bg-primary text-background font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-elevated active:scale-[0.98]">
          <CheckCircle2 className="w-5 h-5" /> Commit Changes
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
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

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
      {/* ── Filter Bar ── */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-surface-border px-4 md:px-8 py-6 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px] max-w-sm group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search across transactions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 bg-surface border border-surface-border rounded-xl pl-10 pr-4 text-[12px] font-bold text-primary placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
            />
          </div>

          {/* Type Filter */}
          <div className="flex p-0.5 bg-surface border border-surface-border rounded-xl h-10 shadow-sm">
            {(['all', 'income', 'expense'] as const).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={cn("px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all relative", typeFilter === t ? 'bg-primary text-background shadow-md' : 'text-muted hover:text-primary')}>
                {t}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-10 bg-surface border border-surface-border rounded-xl pl-4 pr-10 text-[9px] font-black text-primary uppercase tracking-widest focus:outline-none appearance-none shadow-sm hover:border-surface-border-hover transition-all">
              <option value="">All Categories</option>
              {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 bg-surface border border-surface-border rounded-xl p-0.5 shadow-sm">
            <input type="date" value={dateFrom} max={today} onChange={e => setDateFrom(e.target.value)} className="h-8 bg-transparent border-0 rounded-lg px-3 text-[9px] font-black text-primary focus:outline-none w-[130px]" placeholder="From" />
            <span className="text-surface-border font-bold">|</span>
            <input type="date" value={dateTo} max={today} onChange={e => setDateTo(e.target.value)} className="h-8 bg-transparent border-0 rounded-lg px-3 text-[9px] font-black text-primary focus:outline-none w-[130px]" placeholder="To" />
          </div>

          {/* Clear */}
          {hasActiveFilter && (
            <button onClick={() => { setSearch(''); setTypeFilter('all'); setCategoryFilter(''); setDateFrom(''); setDateTo('') }} className="h-10 px-4 text-[9px] font-black text-accent-red hover:bg-accent-red/5 uppercase tracking-widest transition-all flex items-center gap-2 border border-accent-red/20 rounded-xl">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}

          <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-surface-hover rounded-xl border border-surface-border">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{filtered.length}</span>
            <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Records</span>
          </div>
      </div>
    </div>

      {/* ── Data Table ── */}
      <div className="flex-1 overflow-auto px-4 md:px-8 py-8">
        <div className="min-w-[1000px]">
          {/* Table Header */}
          <div className="grid grid-cols-[40px_90px_110px_80px_130px_130px_1fr_130px_120px] gap-4 px-6 py-2.5 text-[9px] font-black text-muted uppercase tracking-[0.25em] border-b border-surface-border mb-1 cursor-default select-none bg-surface-hover/30 rounded-t-2xl">
            <div>S.No</div>
            <div>Date</div>
            <div>ID</div>
            <div>Type</div>
            <div>Category</div>
            <div>Subcategory</div>
            <div>Notes</div>
            <div className="text-right pr-2">Amount</div>
            <div className="text-right pr-2">Actions</div>
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
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: i * 0.01, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    className={cn(
                      "grid grid-cols-[40px_90px_110px_80px_130px_130px_1fr_130px_120px] gap-4 px-6 py-2.5 rounded-xl border transition-all duration-300 group items-center select-none cursor-default mb-1.5",
                      isPending 
                        ? "opacity-40 border-surface-border bg-surface-hover/10" 
                        : "border-surface-border bg-surface/80 hover:bg-surface hover:border-accent-blue hover:ring-4 hover:ring-accent-blue/10 hover:shadow-premium hover:-translate-y-[0.5px]",
                      hasError && "border-accent-red/20 bg-accent-red/5"
                    )}
                  >
                  <div className="text-[10px] font-black text-muted">{String(i + 1).padStart(2, '0')}</div>
                  <div className="text-[11px] font-bold text-secondary font-mono">
                    {isMounted ? new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                  </div>
                  <div className="font-mono text-[9px] text-muted truncate uppercase tracking-tight">
                    {t.id?.slice(0, 12).toUpperCase()}
                  </div>
                  <div className="flex items-center">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-[0.2em]",
                      t.type === 'income' 
                        ? "text-accent-emerald" 
                        : "text-accent-red"
                    )}>
                      {t.type}
                    </span>
                  </div>
                  <div className="text-[12px] font-black text-primary truncate">{t.categories?.name ?? '—'}</div>
                  <div className="text-[11px] font-bold text-secondary truncate">{t.subcategories?.name ?? '—'}</div>
                  <div className="relative group/tooltip flex items-center min-w-0">
                    <div className="text-[11px] text-muted truncate italic font-medium w-full">
                      {t.description || '—'}
                    </div>
                    {t.description && (
                      <div className="absolute z-[100] invisible group-hover/tooltip:visible opacity-0 group-hover/tooltip:opacity-100 bottom-full left-0 mb-2 w-max max-w-xs bg-surface/90 backdrop-blur-md border border-surface-border text-primary text-[11px] font-medium p-3 rounded-xl shadow-premium transition-all duration-200 whitespace-normal pointer-events-none ring-1 ring-white/10">
                        {t.description}
                      </div>
                    )}
                  </div>
                   <div className={cn(
                    "text-right font-black text-base tracking-tighter tabular-nums pr-2",
                    t.type === 'income' ? "text-accent-emerald" : "text-accent-red"
                  )}>
                    {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center justify-end pr-1">
                    {hasError ? (
                      <div className="flex gap-1">
                        <button onClick={() => retryOperation(latestOp!.id)} className="p-2 bg-accent-emerald/10 text-accent-emerald hover:bg-accent-emerald/20 rounded-xl transition-all active:scale-90"><RotateCcw className="w-4 h-4" /></button>
                        <button onClick={() => cancelOperation(latestOp!.id)} className="p-2 bg-accent-red/10 text-accent-red hover:bg-accent-red/20 rounded-xl transition-all active:scale-90"><X className="w-4 h-4" /></button>
                      </div>
                    ) : isPending ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-hover rounded-xl">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted" />
                        <span className="text-[9px] font-black text-muted uppercase tracking-widest">Syncing</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 justify-end">
                        <button onClick={() => setAuditTxId(t.id)} className="p-2 text-muted/50 hover:text-primary hover:bg-surface-hover rounded-lg transition-all active:scale-90" title="History"><History className="w-4 h-4" /></button>
                        <button onClick={() => setEditTx(t)} className="p-2 text-muted/50 hover:text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-all active:scale-90" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(t.id)} className="p-2 text-muted/50 hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-all active:scale-90" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
