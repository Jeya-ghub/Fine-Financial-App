'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, ChevronDown, Check, Calendar, Search,
  ArrowUpDown, TrendingUp, TrendingDown, Users, Tag, Layers, Clock
} from 'lucide-react'
import { useFilters } from '@/components/providers/FilterProvider'
import { useDashboardContext } from '@/components/providers/DashboardProvider'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { SortOption } from '@/types/filters.types'

interface FilterManagerProps {
  isOpen: boolean
  onClose: () => void
}

const MONTH_OPTIONS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function FilterManager({ isOpen, onClose }: FilterManagerProps) {
  const { draftFilters, dispatch, applyFilters, clearFilters, isDirty } = useFilters()
  const { workspaceId } = useDashboardContext()

  const [categories, setCategories] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    period: true, date: false, type: false, category: false, subcategory: false, user: false, search: false
  })

  const [localSearch, setLocalSearch] = useState(draftFilters.searchQuery)

  useEffect(() => {
    setLocalSearch(draftFilters.searchQuery)
  }, [draftFilters.searchQuery, isOpen])

  useEffect(() => {
    if (!isOpen || !workspaceId) return
    const supabase = createClient()

    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const user = session.user
      setCurrentUserId(user.id)

      const [catsRes, membersRes, roleRes] = await Promise.all([
        supabase.from('categories').select('*, subcategories(*)').eq('workspace_id', workspaceId).order('type').order('name'),
        supabase.from('workspace_members').select('user_id, role, profiles(username, email)').eq('workspace_id', workspaceId),
        supabase.from('workspace_members').select('role').eq('workspace_id', workspaceId).eq('user_id', user.id).single()
      ])

      if (catsRes.data) setCategories(catsRes.data)
      if (membersRes.data) setMembers(membersRes.data)
      if (roleRes.data) setIsOwner(roleRes.data.role === 'owner')
    }

    fetchData()
  }, [isOpen, workspaceId])

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))

  const toggleCategory = (id: string) => {
    const newIds = draftFilters.categoryIds.includes(id) ? draftFilters.categoryIds.filter(c => c !== id) : [...draftFilters.categoryIds, id]
    dispatch({ type: 'SET_DRAFT_FIELD', field: 'categoryIds', payload: newIds })
  }

  const toggleSubcategory = (id: string) => {
    const newIds = draftFilters.subcategoryIds.includes(id) ? draftFilters.subcategoryIds.filter(s => s !== id) : [...draftFilters.subcategoryIds, id]
    dispatch({ type: 'SET_DRAFT_FIELD', field: 'subcategoryIds', payload: newIds })
  }

  const toggleUser = (uid: string) => {
    const newIds = draftFilters.userIds.includes(uid) ? draftFilters.userIds.filter(u => u !== uid) : [...draftFilters.userIds, uid]
    dispatch({ type: 'SET_DRAFT_FIELD', field: 'userIds', payload: newIds })
  }

  const handleApply = () => {
    if (localSearch !== draftFilters.searchQuery) {
      dispatch({ type: 'SET_DRAFT_FIELD', field: 'searchQuery', payload: localSearch })
    }
    applyFilters()
    onClose()
  }

  const availableSubcategories = categories
    .filter(c => draftFilters.categoryIds.length === 0 || draftFilters.categoryIds.includes(c.id))
    .flatMap(c => (c.subcategories || []).map((s: any) => ({ ...s, categoryName: c.name })))

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')
  const visibleMembers = isOwner ? members : members.filter(m => m.user_id === currentUserId)

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i)

  const customStartStr = draftFilters.customStartDate ? draftFilters.customStartDate.toISOString().split('T')[0] : ''
  const customEndStr = draftFilters.customEndDate ? draftFilters.customEndDate.toISOString().split('T')[0] : ''

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0">
        <div>
          <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em]">Filter Engine</h2>
          <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">Refine your data view</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={clearFilters}
            className="text-[9px] font-black uppercase tracking-widest text-muted hover:text-accent-red transition-colors px-3 py-1.5 rounded-lg hover:bg-accent-red/10"
          >
            Clear
          </button>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X className="w-4 h-4 text-muted" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1 custom-scrollbar pb-24">

        {/* ── SEARCH ── */}
        <FilterSection icon={<Search className="w-3.5 h-3.5" />} label="Search" sectionKey="search" expanded={expandedSections.search} onToggle={() => toggleSection('search')} badge={localSearch ? 1 : undefined}>
          <input
            type="text"
            placeholder="Search transactions..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onBlur={() => dispatch({ type: 'SET_DRAFT_FIELD', field: 'searchQuery', payload: localSearch })}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue/50 transition-all"
          />
        </FilterSection>

        {/* ── PERIOD (MONTH/YEAR) ── */}
        <FilterSection icon={<Clock className="w-3.5 h-3.5" />} label="Month & Year" sectionKey="period" expanded={expandedSections.period} onToggle={() => toggleSection('period')}>
          <div className="flex gap-2">
            <select 
              value={draftFilters.month} 
              onChange={e => dispatch({ type: 'SET_DRAFT_FIELD', field: 'month', payload: Number(e.target.value) })}
              className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider text-primary focus:outline-none appearance-none"
            >
              {MONTH_OPTIONS.map((m, i) => <option key={i} value={i} className="bg-surface text-primary">{m}</option>)}
            </select>
            <select 
              value={draftFilters.year} 
              onChange={e => dispatch({ type: 'SET_DRAFT_FIELD', field: 'year', payload: Number(e.target.value) })}
              className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider text-primary focus:outline-none appearance-none"
            >
              {yearOptions.map(y => <option key={y} value={y} className="bg-surface text-primary">{y}</option>)}
            </select>
          </div>
        </FilterSection>

        {/* ── CUSTOM DATE RANGE ── */}
        <FilterSection icon={<Calendar className="w-3.5 h-3.5" />} label="Custom Date Range" sectionKey="date" expanded={expandedSections.date} onToggle={() => toggleSection('date')} badge={(draftFilters.customStartDate && draftFilters.customEndDate) ? 1 : undefined}>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStartStr}
              onChange={e => dispatch({ type: 'SET_DRAFT_FIELD', field: 'customStartDate', payload: e.target.value ? new Date(e.target.value) : null })}
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] text-primary focus:outline-none [color-scheme:dark]"
            />
            <span className="text-muted text-xs">→</span>
            <input
              type="date"
              value={customEndStr}
              onChange={e => dispatch({ type: 'SET_DRAFT_FIELD', field: 'customEndDate', payload: e.target.value ? new Date(e.target.value) : null })}
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] text-primary focus:outline-none [color-scheme:dark]"
            />
          </div>
          {(draftFilters.customStartDate || draftFilters.customEndDate) && (
            <button 
              onClick={() => {
                dispatch({ type: 'SET_DRAFT_FIELD', field: 'customStartDate', payload: null })
                dispatch({ type: 'SET_DRAFT_FIELD', field: 'customEndDate', payload: null })
              }}
              className="mt-2 w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black text-muted uppercase tracking-widest transition-all"
            >
              Clear Dates
            </button>
          )}
        </FilterSection>

        {/* ── TRANSACTION TYPE ── */}
        <FilterSection icon={<ArrowUpDown className="w-3.5 h-3.5" />} label="Transaction Type" sectionKey="type" expanded={expandedSections.type} onToggle={() => toggleSection('type')}>
          <div className="flex gap-2">
            {(['all', 'income', 'expense'] as const).map(type => (
              <button
                key={type}
                onClick={() => dispatch({ type: 'SET_DRAFT_FIELD', field: 'transactionType', payload: type })}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                  draftFilters.transactionType === type
                    ? type === 'income' ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                    : type === 'expense' ? "bg-red-500/15 text-red-400 border-red-500/30"
                    : "bg-accent-blue/15 text-accent-blue border-accent-blue/30"
                    : "bg-white/5 text-muted hover:text-primary border-transparent hover:bg-white/10"
                )}
              >
                {type === 'income' && <TrendingUp className="w-3 h-3" />}
                {type === 'expense' && <TrendingDown className="w-3 h-3" />}
                {type}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* ── CATEGORIES ── */}
        <FilterSection icon={<Tag className="w-3.5 h-3.5" />} label="Categories" sectionKey="category" expanded={expandedSections.category} onToggle={() => toggleSection('category')} badge={draftFilters.categoryIds.length > 0 ? draftFilters.categoryIds.length : undefined}>
          {[{ label: 'INCOME', items: incomeCategories, color: 'text-emerald-500' }, { label: 'EXPENSE', items: expenseCategories, color: 'text-red-400' }].map(group => (
            <div key={group.label} className="mb-4">
              <p className={cn("text-[8px] font-black uppercase tracking-[0.3em] mb-2 pl-1", group.color)}>{group.label}</p>
              <div className="space-y-1">
                {group.items.length === 0 && <p className="text-[9px] text-muted pl-1">No categories</p>}
                {group.items.map((cat: any) => (
                  <CheckItem key={cat.id} label={cat.name} checked={draftFilters.categoryIds.includes(cat.id)} onChange={() => toggleCategory(cat.id)} />
                ))}
              </div>
            </div>
          ))}
        </FilterSection>

        {/* ── SUBCATEGORIES ── */}
        <FilterSection icon={<Layers className="w-3.5 h-3.5" />} label="Subcategories" sectionKey="subcategory" expanded={expandedSections.subcategory} onToggle={() => toggleSection('subcategory')} badge={draftFilters.subcategoryIds.length > 0 ? draftFilters.subcategoryIds.length : undefined}>
          {availableSubcategories.length === 0 ? (
            <p className="text-[9px] text-muted py-2">Select a category first</p>
          ) : (
            <div className="space-y-1">
              {availableSubcategories.map((sub: any) => (
                <CheckItem key={sub.id} label={sub.name} sublabel={sub.categoryName} checked={draftFilters.subcategoryIds.includes(sub.id)} onChange={() => toggleSubcategory(sub.id)} />
              ))}
            </div>
          )}
        </FilterSection>

        {/* ── USER FILTER ── */}
        {visibleMembers.length > 0 && (
          <FilterSection icon={<Users className="w-3.5 h-3.5" />} label="Members" sectionKey="user" expanded={expandedSections.user} onToggle={() => toggleSection('user')} badge={draftFilters.userIds.length > 0 ? draftFilters.userIds.length : undefined}>
            <div className="space-y-1">
              {visibleMembers.map((m: any) => (
                <CheckItem
                  key={m.user_id}
                  label={m.profiles?.username || m.profiles?.email || m.user_id.slice(0, 8)}
                  sublabel={m.user_id === currentUserId ? 'You' : m.role}
                  checked={draftFilters.userIds.includes(m.user_id)}
                  onChange={() => toggleUser(m.user_id)}
                  disabled={!isOwner}
                />
              ))}
            </div>
          </FilterSection>
        )}

      </div>

      {/* Sticky Bottom Button */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-white/5 bg-surface/90 backdrop-blur-xl">
        <button
          onClick={handleApply}
          className={cn(
            "w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-lg",
            isDirty ? "bg-primary text-background hover:opacity-90" : "bg-white/10 text-muted opacity-50"
          )}
        >
          {isDirty ? 'Apply Filters' : 'No Changes'}
        </button>
      </div>
    </div>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden" />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 h-[85vh] bg-surface/98 backdrop-blur-xl border-t border-white/10 rounded-t-[2rem] z-50 flex flex-col md:hidden shadow-2xl">
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>
            {content}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function FilterSection({ icon, label, expanded, onToggle, badge, children }: any) {
  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3 text-muted">
          {icon}
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">{label}</span>
          {badge && <span className="px-2 py-0.5 bg-accent-blue text-white text-[8px] font-black rounded-full">{badge}</span>}
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted transition-transform duration-200", expanded && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CheckItem({ label, sublabel, checked, onChange, disabled }: any) {
  return (
    <button onClick={onChange} disabled={disabled} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group", checked ? "bg-accent-blue/10" : "hover:bg-white/5", disabled && "opacity-50 cursor-default")}>
      <div className={cn("w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all", checked ? "bg-accent-blue border-accent-blue" : "border-white/20 group-hover:border-white/40")}>
        {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
      </div>
      <div className="flex flex-col items-start min-w-0">
        <span className={cn("text-[10px] font-black uppercase tracking-wider truncate", checked ? "text-accent-blue" : "text-primary")}>{label}</span>
        {sublabel && <span className="text-[8px] font-bold text-muted uppercase tracking-widest">{sublabel}</span>}
      </div>
    </button>
  )
}
