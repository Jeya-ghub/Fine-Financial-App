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
    <div className="flex items-center gap-1">
      <input ref={ref} autoFocus value={value} onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        className="h-6 px-2 text-[10px] font-bold bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none w-24" />
      {loading ? <Loader2 className="w-3 h-3 animate-spin text-zinc-500" /> :
        <button onClick={commit} className="text-emerald-500"><CheckCircle2 className="w-3 h-3" /></button>}
    </div>
  )

  return (
    <button onClick={() => setEditing(true)}
      className="flex items-center gap-1 h-6 px-2 rounded-lg border border-dashed border-white/10 text-zinc-600 hover:text-white hover:border-white/20 transition-all text-[9px] font-black uppercase tracking-widest cursor-pointer select-none">
      <Plus className="w-2.5 h-2.5" /> Add
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
      whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(255,255,255,0.04)' }}
      className="bg-white/[0.02] border border-white/5 rounded-[1.75rem] p-6 group relative flex flex-col gap-4 transition-shadow"
    >
      {/* Ghost Actions - always available */}
      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onHistory?.(cat.id)}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-600 hover:text-white hover:bg-white/5 transition-all"
          title="History">
          <History className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => onEdit(cat)}
          disabled={!canEdit || isDefault}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-600 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title={isDefault ? "System default categories cannot be edited" : "Edit category"}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => onDelete(cat.id)}
          disabled={!canEdit || isDefault}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-600 hover:text-red-500 hover:bg-red-500/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title={isDefault ? "System default categories cannot be deleted" : "Delete category"}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3 select-none cursor-default">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border shrink-0",
          cat.type === 'income'
            ? 'bg-white border-white/10 text-black shadow-lg shadow-white/5'
            : 'bg-white/[0.03] border-white/5 text-zinc-500')}>
          <Tag className="w-4 h-4" />
        </div>
        <div>
          <p className="font-black text-white text-[13px] uppercase tracking-tight leading-tight">{highlight(cat.name)}</p>
          {cat.is_default && <p className="text-[8px] text-zinc-600 uppercase tracking-[0.2em] font-black mt-0.5">System Default</p>}
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
                className="h-7 px-3 text-[10px] font-black bg-white/[0.05] border border-white/20 rounded-xl text-white focus:outline-none w-32 caret-white uppercase tracking-widest"
              />
              {savingSubId === sub.id
                ? <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
                : <button onClick={() => handleSaveSub(sub.id)} className="text-white hover:text-zinc-300 cursor-pointer">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
              }
              <button onClick={() => setEditingSubId(null)} className="text-zinc-600 hover:text-white cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div key={sub.id} className="group/chip relative flex items-center gap-1 h-7 px-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all select-none cursor-default">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover/chip:text-white transition-colors">
                {highlight(sub.name)}
              </span>
              {(canEdit && !isDefault) && (
                <div className="ml-1 flex items-center gap-0.5 opacity-0 group-hover/chip:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditSub(sub)}
                    className="w-4 h-4 flex items-center justify-center text-zinc-600 hover:text-white transition-colors cursor-pointer"
                    title="Rename"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSub(sub.id)}
                    className="w-4 h-4 flex items-center justify-center text-zinc-600 hover:text-red-500 transition-colors cursor-pointer"
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
    onSaved({ ...(cat ?? { id: res.data.id, is_default: false, subcategories: [], version: 1 }), name, type, ...res.data })
    onClose()
  }

  const panel = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-end md:items-stretch md:justify-end">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Desktop panel */}
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="hidden md:flex relative w-[420px] h-full bg-[#0d0d0d] border-l border-white/5 flex-col shadow-2xl">
          <DrawerForm name={name} setName={setName} type={type} setType={setType} isNew={isNew}
            loading={loading} error={error} onClose={onClose} onSave={handleSave} />
        </motion.div>

        {/* Mobile bottom sheet */}
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="md:hidden relative w-full bg-[#0d0d0d] border-t border-white/5 rounded-t-[2.5rem] flex flex-col shadow-2xl">
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
      <div className="md:hidden w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 shrink-0" />
      <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 shrink-0">
        <h3 className="font-bold text-white">{isNew ? 'New Category' : 'Edit Category'}</h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-2"><X className="w-5 h-5" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {isNew && (
          <div className="flex p-1 bg-white/5 rounded-2xl h-[52px]">
            {(['expense', 'income'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={cn("flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  type === t ? 'bg-white text-black' : 'text-zinc-500 hover:text-white')}>
                {t}
              </button>
            ))}
          </div>
        )}
        <div className="space-y-2">
          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.25em]">Category Name</label>
          <input value={name} onChange={e => setName(e.target.value)} autoFocus
            onKeyDown={e => e.key === 'Enter' && onSave()}
            className="w-full h-[56px] bg-white/[0.03] border border-white/5 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-white/10"
            placeholder="e.g. Dining, Freelance..." />
        </div>
        {error && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{error}</p>}
      </div>
      <div className="px-8 py-6 border-t border-white/5 shrink-0">
        <button onClick={onSave} disabled={loading || !name.trim()}
          className="w-full h-[60px] bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-30 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Save Category</>}
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
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search categories & subcategories..."
            className="w-full h-[44px] bg-white/[0.03] border border-white/5 rounded-2xl pl-11 pr-4 text-xs font-bold text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all" />
          {search && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />}
        </div>
        <button onClick={openNew}
          className="h-[44px] px-6 bg-white text-black font-black uppercase tracking-widest rounded-2xl text-xs hover:bg-zinc-200 active:scale-95 transition-all flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="flex-1 px-4 md:px-8 py-8 space-y-12">
        {/* ── INCOME ── */}
        <section>
          <div className="flex items-center gap-4 mb-6 select-none cursor-default">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-white" />
              <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Income</h2>
            </div>
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[9px] font-black text-zinc-800 uppercase tracking-widest">{incomeCategories.length} Categories</span>
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
          <div className="flex items-center gap-4 mb-6 select-none cursor-default">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-zinc-500" />
              <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Expense</h2>
            </div>
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[9px] font-black text-zinc-800 uppercase tracking-widest">{expenseCategories.length} Categories</span>
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
              onClick={() => setTimelineIds(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-md h-full bg-[#0d0d0d] border-l border-white/5 p-8 overflow-y-auto">
              <button onClick={() => setTimelineIds(null)} className="absolute top-8 right-8 text-zinc-500 hover:text-white p-2">
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
