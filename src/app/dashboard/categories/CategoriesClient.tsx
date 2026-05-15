'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Edit2, Trash2, X, Loader2, CheckCircle2,
  ChevronDown, Tag, ArrowUpRight, ArrowDownRight, History
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  createCategory, updateCategory, deleteCategory,
  createSubcategory, updateSubcategory, deleteSubcategory,
  getCategoriesWithSubs
} from '@/app/actions/categories'
import { getWorkspaceRole } from '@/app/actions/workspaces'
import { WorkspaceRole } from '@/lib/auth/permissions'
import { useRealtimeCategories } from '@/lib/hooks/useRealtimeCategories'
import { CategoryConflictModal } from './components/ConflictModal'
import { CategoryTimeline } from './components/CategoryTimeline'

// ── Types ────────────────────────────────────────────────────────────────────
type Sub = { id: string; name: string; is_default: boolean; version: number }
type Category = {
  id: string; name: string; type: 'income' | 'expense'
  is_default: boolean; version: number; subcategories?: Sub[]
}

// ── Ghost Chip (inline add subcategory) ─────────────────────────────────────
function GhostChip({ categoryId, workspaceId, onAdded }: {
  categoryId: string; workspaceId: string; onAdded: (sub: Sub) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const commit = async () => {
    if (!value.trim()) { setEditing(false); return }
    setLoading(true)
    const res = await createSubcategory(categoryId, workspaceId, value.trim())
    setLoading(false)
    if (res.data) { onAdded(res.data as Sub); setValue(''); setEditing(false) }
  }

  if (editing) return (
    <div className="flex items-center gap-1.5">
      <input ref={ref} autoFocus value={value} onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        className="h-7 px-2.5 text-[11px] font-bold bg-surface-active border border-surface-border rounded-xl text-primary focus:outline-none w-28 shadow-inner" />
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted" /> :
        <button onClick={commit} className="text-accent-emerald hover:scale-110 transition-transform"><CheckCircle2 className="w-3.5 h-3.5" /></button>}
    </div>
  )

  return (
    <button onClick={() => setEditing(true)}
      className="flex items-center gap-1.5 h-7 px-3 rounded-xl border border-dashed border-surface-border text-muted hover:text-primary hover:border-surface-border-hover transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer select-none bg-surface-hover/30">
      <Plus className="w-3 h-3" /> Add Sub
    </button>
  )
}

// ── Category Card ────────────────────────────────────────────────────────────
interface CategoryCardProps {
  cat: Category
  search: string
  workspaceId: string
  role: WorkspaceRole
  onEdit: (cat: Category) => void
  onDelete: (id: string) => void
  onConflict: (data: any) => void
  onHistory: (id: string) => void
  onSubAdded: (catId: string, sub: Sub) => void
}

function CategoryCard({ cat, workspaceId, search, role, onEdit, onDelete, onConflict, onHistory, onSubAdded }: CategoryCardProps) {
  const [subs, setSubs] = useState(cat.subcategories ?? [])
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null)
  const [editingSubId, setEditingSubId] = useState<string | null>(null)
  const [editingSubValue, setEditingSubValue] = useState('')
  const [savingSubId, setSavingSubId] = useState<string | null>(null)

  const canEdit = !!role
  const isDefault = cat.is_default

  // Sync state with props
  useEffect(() => {
    setSubs(cat.subcategories ?? [])
  }, [cat.subcategories])

  const highlight = (text: string) => {
    if (!search) return <span>{text}</span>
    const idx = text.toLowerCase().indexOf(search.toLowerCase())
    if (idx === -1) return <span>{text}</span>
    return <span>{text.slice(0, idx)}<span className="bg-blue-500/10 text-blue-400 rounded px-0.5">{text.slice(idx, idx + search.length)}</span>{text.slice(idx + search.length)}</span>
  }

  const handleDeleteSub = async (id: string) => {
    setDeletingSubId(id)
    await deleteSubcategory(id)
    setSubs(prev => prev.filter(s => s.id !== id))
    setDeletingSubId(null)
  }

  const handleEditSub = (sub: Sub) => {
    setEditingSubId(sub.id)
    setEditingSubValue(sub.name)
  }

  const handleSaveSub = async (id: string) => {
    if (!editingSubValue.trim()) { setEditingSubId(null); return }
    const sub = subs.find(s => s.id === id)
    if (!sub) return

    setSavingSubId(id)
    const res = await updateSubcategory(id, editingSubValue.trim(), sub.version)
    setSavingSubId(null)

    if (res.error === 'CONFLICT') {
      onConflict?.({
        id,
        type: 'subcategory',
        currentValue: editingSubValue,
        originalValue: sub.name,
        expectedVersion: sub.version
      })
      return
    }

    if (res.data) {
      setSubs(prev => prev.map(s => s.id === id ? { ...(res.data as Sub) } : s))
    }
    setEditingSubId(null)
  }

  return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.01 }}
        className="bg-surface border border-surface-border rounded-3xl p-6 group relative flex flex-col gap-5 transition-all shadow-premium hover:shadow-elevated"
      >
      {/* Ghost Actions - always available */}
      <div className="absolute top-6 right-6 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
        <button onClick={() => onHistory?.(cat.id)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-primary hover:bg-surface-hover border border-transparent hover:border-surface-border transition-all"
          title="History">
          <History className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onEdit(cat)}
          disabled={!canEdit || isDefault}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-accent-blue hover:bg-accent-blue/10 border border-transparent hover:border-accent-blue/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title={isDefault ? "System default categories cannot be edited" : "Edit category"}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onDelete(cat.id)}
          disabled={!canEdit || isDefault}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-accent-red hover:bg-accent-red/10 border border-transparent hover:border-accent-red/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title={isDefault ? "System default categories cannot be deleted" : "Delete category"}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-4 select-none cursor-default">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 shadow-sm",
          cat.type === 'income'
            ? 'bg-primary text-background border-primary'
            : 'bg-surface-hover border-surface-border text-muted')}>
          <Tag className="w-5 h-5" />
        </div>
        <div>
          <p className="font-black text-primary text-base uppercase tracking-tight leading-tight mb-1">{highlight(cat.name)}</p>
          {cat.is_default && <p className="text-[9px] text-muted uppercase tracking-[0.25em] font-black">System Core Asset</p>}
        </div>
      </div>

      {/* Subcategory Chips */}
      <div className="flex flex-wrap gap-2">
        {subs.map(sub => (
          editingSubId === sub.id ? (
            <div key={sub.id} className="flex items-center gap-1">
              <input
                autoFocus
                value={editingSubValue}
                onChange={e => setEditingSubValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveSub(sub.id)
                  if (e.key === 'Escape') setEditingSubId(null)
                }}
                className="h-7 px-3 text-[10px] font-black bg-surface-active border border-surface-border rounded-xl text-primary focus:outline-none w-32 caret-primary uppercase tracking-widest"
              />
              {savingSubId === sub.id
                ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted" />
                : <button onClick={() => handleSaveSub(sub.id)} className="text-primary hover:text-primary/70 cursor-pointer">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
              }
              <button onClick={() => setEditingSubId(null)} className="text-muted hover:text-primary cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div key={sub.id} className="group/chip relative flex items-center gap-2 h-8 px-4 rounded-[1.25rem] bg-surface-hover/50 border border-surface-border hover:border-primary/20 hover:bg-surface-hover transition-all select-none cursor-default">
              <span className="text-[11px] font-black text-muted uppercase tracking-widest group-hover/chip:text-primary transition-colors">
                {highlight(sub.name)}
              </span>
              {(canEdit && !isDefault) && (
                <div className="ml-1 flex items-center gap-0.5 opacity-0 group-hover/chip:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditSub(sub)}
                    className="w-4 h-4 flex items-center justify-center text-muted hover:text-primary transition-colors cursor-pointer"
                    title="Rename"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSub(sub.id)}
                    className="w-4 h-4 flex items-center justify-center text-muted hover:text-red-500 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    {deletingSubId === sub.id
                      ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      : <X className="w-2.5 h-2.5" />}
                  </button>
                </div>
              )}
            </div>
          )
        ))}
        {canEdit && !isDefault && (
          <GhostChip
            categoryId={cat.id}
            workspaceId={workspaceId}
            onAdded={(sub) => {
              setSubs(prev => [...prev, sub])
              onSubAdded(cat.id, sub)
            }}
          />
        )}
      </div>
    </motion.div>
  )
}

// ── Category Drawer ──────────────────────────────────────────────────────────
function CategoryDrawer({ cat, workspaceId, onClose, onSaved }: {
  cat: Category | null; workspaceId: string
  onClose: () => void; onSaved: (cat: Category, conflictData?: any) => void
}) {
  const [name, setName] = useState(cat?.name ?? '')
  const [type, setType] = useState<'expense' | 'income'>(cat?.type ?? 'expense')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isNew = !cat

  const handleSave = async () => {
    if (!name.trim()) return
    setLoading(true); setError('')
    const res = isNew
      ? await createCategory(workspaceId, name.trim(), type)
      : await updateCategory(cat!.id, name.trim(), cat!.version)
    setLoading(false)
    if (res.error === 'CONFLICT') {
      onSaved(null as any, { 
        id: cat!.id, 
        type: 'category', 
        currentValue: name.trim(), 
        originalValue: cat!.name,
        expectedVersion: cat!.version 
      })
      onClose()
      return
    }
    if (res.error) { setError(res.error); return }
    onSaved(res.data as Category)
    onClose()
  }

  const panel = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-end md:items-stretch md:justify-end">
        {/* Backdrop */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Desktop panel */}
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="hidden md:flex relative w-[420px] h-full bg-surface border-l border-surface-border flex-col shadow-2xl">
          <DrawerForm name={name} setName={setName} type={type} setType={setType} isNew={isNew}
            loading={loading} error={error} onClose={onClose} onSave={handleSave} />
        </motion.div>

        {/* Mobile bottom sheet */}
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="md:hidden relative w-full bg-surface border-t border-surface-border rounded-t-[2.5rem] flex flex-col shadow-2xl">
          <DrawerForm name={name} setName={setName} type={type} setType={setType} isNew={isNew}
            loading={loading} error={error} onClose={onClose} onSave={handleSave} />
        </motion.div>
      </div>
    </AnimatePresence>
  )

  return createPortal(panel, document.body)
}

function DrawerForm({ name, setName, type, setType, isNew, loading, error, onClose, onSave }: any) {
  return (
    <>
      <div className="md:hidden w-12 h-1.5 bg-surface-border rounded-full mx-auto mt-4 mb-2 shrink-0" />
      <div className="flex items-center justify-between px-6 py-5 border-b border-surface-border shrink-0">
        <h3 className="font-black text-[13px] text-primary uppercase tracking-[0.2em]">{isNew ? 'New Category Segment' : 'Modify Segment'}</h3>
        <button onClick={onClose} className="p-2 bg-surface-hover border border-surface-border rounded-lg text-muted hover:text-primary transition-all active:scale-90"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {isNew && (
          <div className="flex gap-4 px-1 py-2">
            {(['expense', 'income'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-all relative pb-1",
                  type === t ? 'text-primary' : 'text-muted hover:text-primary/70')}>
                {t}
                {type === t && <motion.div layoutId="typeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
              </button>
            ))}
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-muted uppercase tracking-[0.25em] ml-1">Designation</label>
          <input value={name} onChange={e => setName(e.target.value)} autoFocus
            onKeyDown={e => e.key === 'Enter' && onSave()}
            className="w-full h-11 bg-surface-hover/30 border border-surface-border rounded-xl px-4 text-sm font-bold text-primary placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
            placeholder="e.g. Household, Investments..." />
        </div>
        {error && <p className="text-[10px] font-black text-accent-red uppercase tracking-widest bg-accent-red/5 p-3 rounded-lg border border-accent-red/20">{error}</p>}
      </div>
      <div className="px-6 py-6 border-t border-surface-border shrink-0 bg-surface">
        <button onClick={onSave} disabled={loading || !name.trim()}
          className="w-full h-12 bg-primary text-background font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all disabled:opacity-20 flex items-center justify-center gap-2.5 shadow-elevated active:scale-[0.98] text-[10px]">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Commit Segment</>}
        </button>
      </div>
    </>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CategoriesClient({ initialCategories, workspaceId }: {
  initialCategories: Category[]; workspaceId: string
}) {
  const [categories, setCategories] = useState(initialCategories)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [role, setRole] = useState<WorkspaceRole>(null)

  useEffect(() => {
    getWorkspaceRole(workspaceId).then(setRole)
  }, [workspaceId])
  
  // Timeline State
  const [timelineIds, setTimelineIds] = useState<string | string[] | null>(null)

  // Conflict State
  const [conflict, setConflict] = useState<{
    id: string; type: 'category' | 'subcategory';
    currentValue: string; originalValue: string;
    expectedVersion: number;
  } | null>(null)

  // 🔄 Realtime Sync
  const refresh = async () => {
    const res = await getCategoriesWithSubs(workspaceId)
    if (res.data) setCategories(res.data as Category[])
  }
  useRealtimeCategories(workspaceId, refresh)

  const incomeCategories = useMemo(() =>
    categories.filter(c => c.type === 'income' && (
      !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.subcategories ?? []).some(s => s.name.toLowerCase().includes(search.toLowerCase()))
    )), [categories, search])

  const expenseCategories = useMemo(() =>
    categories.filter(c => c.type === 'expense' && (
      !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.subcategories ?? []).some(s => s.name.toLowerCase().includes(search.toLowerCase()))
    )), [categories, search])



  const openNew = () => { setEditCat(null); setDrawerOpen(true) }
  const openEdit = (cat: Category) => { setEditCat(cat); setDrawerOpen(true) }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return
    const res = await deleteCategory(id)
    if (!res.error) setCategories(prev => prev.filter(c => c.id !== id))
  }

  const handleSaved = (saved: Category | null, conflictData?: any) => {
    if (conflictData) {
      setConflict(conflictData)
      return
    }
    if (!saved) return
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === saved.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
      return [...prev, saved]
    })
  }

  const handleOverwrite = async () => {
    if (!conflict) return
    const { id, type, currentValue, expectedVersion } = conflict
    
    // To overwrite, we first need to fetch the LATEST version number from the DB
    // but the conflict error already tells us our expectedVersion failed.
    // A simple way to "overwrite" in an optimistic system is to reload then save,
    // or provide a specific 'force' update action.
    // For now, we'll suggest the user reload to get the latest version.
    alert('Overwrite not yet implemented in force-mode. Please Reload to get the latest version and try again.')
    setConflict(null)
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-surface-border px-4 md:px-8 py-4 flex items-center gap-4 shadow-sm">
        <div className="relative flex-1 max-w-sm group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Lookup segments..."
            className="w-full h-10 bg-surface border border-surface-border rounded-xl pl-11 pr-4 text-[13px] font-bold text-primary placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm" />
        </div>
        <button onClick={openNew}
          className="h-10 px-6 bg-primary text-background font-black uppercase tracking-widest rounded-xl text-[10px] hover:opacity-90 active:scale-95 transition-all flex items-center gap-2.5 shrink-0 shadow-elevated">
          <Plus className="w-4 h-4" /> Create Segment
        </button>
      </div>

      <div className="flex-1 px-4 md:px-8 py-6 space-y-10">
        {/* ── INCOME ── */}
        <section>
          <div className="flex items-center gap-4 mb-8 select-none cursor-default">
            <h2 className="text-[12px] font-black text-primary uppercase tracking-[0.4em]">Inflow Streams</h2>
            <div className="h-px flex-1 bg-surface-border/50" />
            <span className="text-[9px] font-black text-muted uppercase tracking-widest">{incomeCategories.length} Categories</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {incomeCategories.map(cat => (
                <CategoryCard key={cat.id} cat={cat} workspaceId={workspaceId} search={search} role={role}
                  onEdit={openEdit} onDelete={handleDelete}
                  onConflict={setConflict}
                  onHistory={(id) => {
                    const cat = categories.find(c => c.id === id)
                    const subIds = (cat?.subcategories ?? []).map(s => s.id)
                    setTimelineIds([id, ...subIds])
                  }}
                  onSubAdded={(catId, sub) => setCategories(prev =>
                    prev.map(c => c.id === catId ? { ...c, subcategories: [...(c.subcategories ?? []), sub] } : c)
                  )} />
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* ── EXPENSE ── */}
        <section>
          <div className="flex items-center gap-4 mb-8 select-none cursor-default">
            <h2 className="text-[12px] font-black text-primary uppercase tracking-[0.4em]">Outflow Targets</h2>
            <div className="h-px flex-1 bg-surface-border/50" />
            <span className="text-[9px] font-black text-muted uppercase tracking-widest">{expenseCategories.length} Categories</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {expenseCategories.map(cat => (
                <CategoryCard key={cat.id} cat={cat} workspaceId={workspaceId} search={search} role={role}
                  onEdit={openEdit} onDelete={handleDelete}
                  onConflict={setConflict}
                  onHistory={(id) => {
                    const cat = categories.find(c => c.id === id)
                    const subIds = (cat?.subcategories ?? []).map(s => s.id)
                    setTimelineIds([id, ...subIds])
                  }}
                  onSubAdded={(catId, sub) => setCategories(prev =>
                    prev.map(c => c.id === catId ? { ...c, subcategories: [...(c.subcategories ?? []), sub] } : c)
                  )} />
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <CategoryDrawer
          cat={editCat}
          workspaceId={workspaceId}
          onClose={() => setDrawerOpen(false)}
          onSaved={(saved: Category | null, conflictData?: any) => { handleSaved(saved, conflictData); setDrawerOpen(false) }}
        />
      )}

      {/* Timeline Slide-over */}
      <AnimatePresence>
        {timelineIds && (
          <div className="fixed inset-0 z-[100000] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setTimelineIds(null)} className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-md h-full bg-surface border-l border-surface-border p-10 overflow-y-auto shadow-2xl">
              <button onClick={() => setTimelineIds(null)} className="absolute top-10 right-10 p-3 bg-surface-hover border border-surface-border rounded-2xl text-muted hover:text-primary transition-all active:scale-90 shadow-sm">
                <X className="w-5 h-5" />
              </button>
              <CategoryTimeline workspaceId={workspaceId} recordIds={timelineIds} onRestoreComplete={() => { refresh(); setTimelineIds(null) }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Conflict Modal */}
      <CategoryConflictModal
        isOpen={!!conflict}
        onClose={() => setConflict(null)}
        currentValue={conflict?.originalValue ?? ''}
        incomingValue={conflict?.currentValue ?? ''}
        onOverwrite={handleOverwrite}
        onReload={() => { refresh(); setConflict(null) }}
      />
    </div>
  )
}
