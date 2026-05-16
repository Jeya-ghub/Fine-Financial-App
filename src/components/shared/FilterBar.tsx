'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Search, SlidersHorizontal, X, ArrowRight } from 'lucide-react'
import { useFilters } from '@/components/providers/FilterProvider'
import { useDashboardContext } from '@/components/providers/DashboardProvider'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { FilterManager } from './FilterManager'
import { SingleSelect, MultiSelect, FilterDropdown } from './FilterDropdowns'

const MONTH_OPTIONS = [
  { label: 'January', value: 0 },
  { label: 'February', value: 1 },
  { label: 'March', value: 2 },
  { label: 'April', value: 3 },
  { label: 'May', value: 4 },
  { label: 'June', value: 5 },
  { label: 'July', value: 6 },
  { label: 'August', value: 7 },
  { label: 'September', value: 8 },
  { label: 'October', value: 9 },
  { label: 'November', value: 10 },
  { label: 'December', value: 11 },
]

interface FilterBarProps {
  rightActions?: React.ReactNode;
}

export function FilterBar({ rightActions }: FilterBarProps = {}) {
  const { filters, draftFilters, dispatch, applyFilters, clearFilters, isDirty } = useFilters()
  const { workspaceId } = useDashboardContext()
  const [isManagerOpen, setIsManagerOpen] = useState(false)
  const [localSearch, setLocalSearch] = useState(draftFilters.searchQuery)
  
  const [categories, setCategories] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [availableYears, setAvailableYears] = useState<{label: string, value: number}[]>([])

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  useEffect(() => {
    setLocalSearch(draftFilters.searchQuery)
  }, [draftFilters.searchQuery])

  useEffect(() => {
    if (!workspaceId) return
    const supabase = createClient()

    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const user = session.user
      setCurrentUserId(user.id)

      const [catsRes, membersRes, roleRes, minDateRes] = await Promise.all([
        supabase.from('categories').select('*, subcategories(*)').eq('workspace_id', workspaceId).order('type').order('name'),
        supabase.from('workspace_members').select('user_id, role, profiles(username, email)').eq('workspace_id', workspaceId),
        supabase.from('workspace_members').select('role').eq('workspace_id', workspaceId).eq('user_id', user.id).single(),
        supabase.from('transactions').select('date').eq('workspace_id', workspaceId).order('date', { ascending: true }).limit(1)
      ])

      if (catsRes.data) setCategories(catsRes.data)
      if (membersRes.data) setMembers(membersRes.data)
      if (roleRes.data) setIsOwner(roleRes.data.role === 'owner')

      const currentYear = new Date().getFullYear()
      const startYear = minDateRes.data?.[0]?.date ? new Date(minDateRes.data[0].date).getFullYear() : currentYear
      const years = []
      for (let y = startYear; y <= currentYear; y++) {
        years.push({ label: String(y), value: y })
      }
      setAvailableYears(years.length > 0 ? years : [{ label: String(currentYear), value: currentYear }])
    }

    fetchData()
  }, [workspaceId])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch({ type: 'SET_DRAFT_FIELD', field: 'searchQuery', payload: localSearch })
  }

  const handleSearchBlur = () => {
    if (localSearch !== draftFilters.searchQuery) {
      dispatch({ type: 'SET_DRAFT_FIELD', field: 'searchQuery', payload: localSearch })
    }
  }

  // Options prep
  const typeOptions = [
    { label: 'All Types', value: 'all' },
    { label: 'Income', value: 'income' },
    { label: 'Expense', value: 'expense' }
  ]

  const categoryOptions = categories.map(c => ({
    label: c.name,
    value: c.id,
    sublabel: c.type.toUpperCase(),
    color: c.type === 'income' ? 'text-emerald-500' : 'text-red-400'
  }))

  const availableSubcategories = categories
    .filter(c => draftFilters.categoryIds.length === 0 || draftFilters.categoryIds.includes(c.id))
    .flatMap(c => (c.subcategories || []).map((s: any) => ({ label: s.name, value: s.id, sublabel: c.name })))

  const visibleMembers = isOwner ? members : members.filter(m => m.user_id === currentUserId)
  const userOptions = visibleMembers.map(m => ({
    label: m.profiles?.username || m.profiles?.email || m.user_id.slice(0, 8),
    value: m.user_id,
    sublabel: m.user_id === currentUserId ? 'You' : m.role
  }))

  const customStartStr = draftFilters.customStartDate ? draftFilters.customStartDate.toISOString().split('T')[0] : ''
  const customEndStr = draftFilters.customEndDate ? draftFilters.customEndDate.toISOString().split('T')[0] : ''

  const setCustomStart = (val: string) => {
    dispatch({ type: 'SET_DRAFT_FIELD', field: 'customStartDate', payload: val ? new Date(val) : null })
  }
  const setCustomEnd = (val: string) => {
    dispatch({ type: 'SET_DRAFT_FIELD', field: 'customEndDate', payload: val ? new Date(val) : null })
  }

  const toggleDropdown = (id: string) => {
    setOpenDropdown(prev => prev === id ? null : id)
  }

  const handleApply = () => {
    applyFilters()
  }

  return (
    <>
      {/* Desktop Filter Bar */}
      <div className="hidden md:block sticky top-0 z-30 w-full px-4 py-3 bg-background/60 backdrop-blur-xl border-b border-foreground/5 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-3">
          {/* Row 1: Primary Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 h-10">
              <label className="flex items-center gap-2 px-3 py-1 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-xl h-full cursor-pointer transition-colors">
                <span className="text-[9px] font-bold text-muted uppercase tracking-widest">From</span>
                <input 
                  type="date" 
                  value={customStartStr}
                  onChange={e => setCustomStart(e.target.value)}
                  onClick={e => {
                    try { (e.target as HTMLInputElement).showPicker?.() } catch(err) {}
                  }}
                  className="bg-transparent border-none text-[10px] text-primary focus:outline-none focus:ring-0 uppercase font-black w-[110px] cursor-pointer dark:[color-scheme:dark] [color-scheme:light]"
                />
              </label>
              <ArrowRight className="w-3 h-3 text-muted" />
              <label className="flex items-center gap-2 px-3 py-1 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-xl h-full cursor-pointer transition-colors">
                <span className="text-[9px] font-bold text-muted uppercase tracking-widest">To</span>
                <input 
                  type="date" 
                  value={customEndStr}
                  onChange={e => setCustomEnd(e.target.value)}
                  onClick={e => {
                    try { (e.target as HTMLInputElement).showPicker?.() } catch(err) {}
                  }}
                  className="bg-transparent border-none text-[10px] text-primary focus:outline-none focus:ring-0 uppercase font-black w-[110px] cursor-pointer dark:[color-scheme:dark] [color-scheme:light]"
                />
              </label>
            </div>
            
            <div className="h-4 w-px bg-white/10 mx-1" />
            
            <SingleSelect
              label={MONTH_OPTIONS.find(m => m.value === draftFilters.month)?.label || 'Month'}
              value={draftFilters.month}
              options={MONTH_OPTIONS}
              onChange={(val) => dispatch({ type: 'SET_DRAFT_FIELD', field: 'month', payload: val })}
              isOpen={openDropdown === 'month'}
              onToggle={() => toggleDropdown('month')}
              onClose={() => setOpenDropdown(null)}
            />

            <SingleSelect
              label={String(draftFilters.year)}
              value={draftFilters.year}
              options={availableYears}
              onChange={(val) => dispatch({ type: 'SET_DRAFT_FIELD', field: 'year', payload: val })}
              isOpen={openDropdown === 'year'}
              onToggle={() => toggleDropdown('year')}
              onClose={() => setOpenDropdown(null)}
            />
            
            <div className="h-4 w-px bg-white/10 mx-1" />

            <SingleSelect
              label={`Type: ${draftFilters.transactionType === 'all' ? 'All' : draftFilters.transactionType}`}
              value={draftFilters.transactionType}
              options={typeOptions}
              onChange={(val) => dispatch({ type: 'SET_DRAFT_FIELD', field: 'transactionType', payload: val })}
              isOpen={openDropdown === 'type'}
              onToggle={() => toggleDropdown('type')}
              onClose={() => setOpenDropdown(null)}
            />

            <MultiSelect
              label="Category"
              selectedValues={draftFilters.categoryIds}
              options={categoryOptions}
              onChange={(val) => {
                const newIds = draftFilters.categoryIds.includes(val) 
                  ? draftFilters.categoryIds.filter(id => id !== val) 
                  : [...draftFilters.categoryIds, val]
                dispatch({ type: 'SET_DRAFT_FIELD', field: 'categoryIds', payload: newIds })
              }}
              onClear={() => dispatch({ type: 'SET_DRAFT_FIELD', field: 'categoryIds', payload: [] })}
              isOpen={openDropdown === 'category'}
              onToggle={() => toggleDropdown('category')}
              onClose={() => setOpenDropdown(null)}
            />

            <MultiSelect
              label="Subcategory"
              selectedValues={draftFilters.subcategoryIds}
              options={availableSubcategories}
              onChange={(val) => {
                const newIds = draftFilters.subcategoryIds.includes(val) 
                  ? draftFilters.subcategoryIds.filter(id => id !== val) 
                  : [...draftFilters.subcategoryIds, val]
                dispatch({ type: 'SET_DRAFT_FIELD', field: 'subcategoryIds', payload: newIds })
              }}
              onClear={() => dispatch({ type: 'SET_DRAFT_FIELD', field: 'subcategoryIds', payload: [] })}
              isOpen={openDropdown === 'subcategory'}
              onToggle={() => toggleDropdown('subcategory')}
              onClose={() => setOpenDropdown(null)}
            />

            {visibleMembers.length > 0 && (
              <MultiSelect
                label="User"
                selectedValues={draftFilters.userIds}
                options={userOptions}
                onChange={(val) => {
                  const newIds = draftFilters.userIds.includes(val) 
                    ? draftFilters.userIds.filter(id => id !== val) 
                    : [...draftFilters.userIds, val]
                  dispatch({ type: 'SET_DRAFT_FIELD', field: 'userIds', payload: newIds })
                }}
                onClear={() => dispatch({ type: 'SET_DRAFT_FIELD', field: 'userIds', payload: [] })}
                isOpen={openDropdown === 'user'}
                onToggle={() => toggleDropdown('user')}
                onClose={() => setOpenDropdown(null)}
              />
            )}
          </div>

          {/* Row 2: Search + Actions */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-3 w-full max-w-[600px]">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted group-focus-within:text-accent-blue transition-colors" />
                <input
                  type="text"
                  placeholder="Search transactions, notes, users..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onBlur={handleSearchBlur}
                  className="pl-9 pr-4 py-2 bg-foreground/5 border border-foreground/10 rounded-xl text-[10px] font-bold tracking-wider focus:outline-none focus:ring-1 focus:ring-accent-blue/50 w-full transition-all"
                />
              </form>

              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-foreground/5 border border-foreground/10 text-muted hover:text-primary hover:bg-foreground/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Clear
              </button>

              <button
                onClick={handleApply}
                disabled={!isDirty}
                className={cn(
                  "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2",
                  isDirty 
                    ? "bg-primary text-background shadow-lg shadow-foreground/10 hover:opacity-90 scale-100" 
                    : "bg-foreground/10 text-muted opacity-50 cursor-not-allowed scale-95"
                )}
              >
                Apply Filters
                {isDirty && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-blue opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-blue"></span>
                  </span>
                )}
              </button>
            </div>
            
            {rightActions && (
              <div className="flex items-center w-full md:w-auto justify-end">
                {rightActions}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-30 w-full px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-foreground/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-foreground/5 border border-foreground/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary">
            {MONTH_OPTIONS.find(m => m.value === filters.month)?.label}
          </span>
          <span className="px-3 py-1.5 bg-foreground/5 border border-foreground/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary">
            {filters.year}
          </span>
        </div>
        <button
          onClick={() => setIsManagerOpen(true)}
          className={cn(
            "relative p-2 rounded-xl border transition-all",
            isDirty
              ? "bg-accent-blue/10 border-accent-blue/30 text-accent-blue"
              : "bg-foreground/5 border-foreground/5 text-muted hover:text-primary"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {isDirty && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent-blue rounded-full" />}
        </button>
      </div>

      <FilterManager isOpen={isManagerOpen} onClose={() => setIsManagerOpen(false)} />
    </>
  )
}
