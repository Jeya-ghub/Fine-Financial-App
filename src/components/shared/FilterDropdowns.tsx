'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropdownProps {
  label: string;
  activeCount?: number;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

export function FilterDropdown({ label, activeCount, isOpen, onToggle, onClose, children }: DropdownProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 text-[10px] font-black uppercase tracking-widest",
          isOpen || (activeCount && activeCount > 0)
            ? "bg-accent-blue/10 border-accent-blue/30 text-accent-blue"
            : "bg-foreground/5 border-foreground/5 text-primary hover:bg-foreground/10"
        )}
      >
        {label}
        {activeCount !== undefined && activeCount > 0 && (
          <span className="w-4 h-4 bg-accent-blue text-white flex items-center justify-center rounded-full text-[8px]">
            {activeCount}
          </span>
        )}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 mt-2 min-w-[200px] z-50 bg-surface/95 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Single Select ────────────────────────────────────────────────────────────

interface SingleSelectProps {
  label: string;
  value: string | number;
  options: { label: string, value: string | number }[];
  onChange: (value: any) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function SingleSelect({ label, value, options, onChange, isOpen, onToggle, onClose }: SingleSelectProps) {
  return (
    <FilterDropdown label={label} isOpen={isOpen} onToggle={onToggle} onClose={onClose}>
      <div className="py-1 max-h-[300px] overflow-y-auto custom-scrollbar">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => { onChange(opt.value); onClose(); }}
            className={cn(
              "w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
              value === opt.value
                ? "bg-accent-blue/10 text-accent-blue"
                : "text-muted hover:bg-foreground/5 hover:text-primary"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </FilterDropdown>
  )
}

// ─── Multi Select ────────────────────────────────────────────────────────────

interface MultiSelectProps {
  label: string;
  selectedValues: string[];
  options: { label: string, value: string, sublabel?: string, color?: string }[];
  onChange: (value: string) => void;
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  showSearch?: boolean;
}

export function MultiSelect({ label, selectedValues, options, onChange, onClear, isOpen, onToggle, onClose, showSearch = true }: MultiSelectProps) {
  const [search, setSearch] = useState('')

  const filtered = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase()) || 
    (opt.sublabel && opt.sublabel.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <FilterDropdown 
      label={label} 
      activeCount={selectedValues.length} 
      isOpen={isOpen} 
      onToggle={onToggle} 
      onClose={onClose}
    >
      <div className="flex flex-col max-h-[320px]">
        {showSearch && (
          <div className="p-2 border-b border-foreground/5 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted" />
              <input 
                type="text" 
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-1.5 pl-7 pr-3 text-[10px] text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue/50 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
        
        <div className="overflow-y-auto custom-scrollbar p-1 flex-1">
          {filtered.length === 0 ? (
            <div className="py-4 text-center text-[9px] text-muted uppercase tracking-widest">No results found</div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all group hover:bg-foreground/5"
              >
                <div className={cn(
                  "w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                  selectedValues.includes(opt.value) 
                    ? "bg-accent-blue border-accent-blue" 
                    : "border-foreground/20 group-hover:border-foreground/40"
                )}>
                  {selectedValues.includes(opt.value) && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-wider truncate", 
                    selectedValues.includes(opt.value) ? "text-accent-blue" : (opt.color || "text-primary")
                  )}>
                    {opt.label}
                  </span>
                  {opt.sublabel && (
                    <span className="text-[8px] font-bold text-muted uppercase tracking-widest truncate">{opt.sublabel}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
        
        {selectedValues.length > 0 && (
          <div className="p-2 border-t border-foreground/5 shrink-0 bg-surface/50">
            <button 
              onClick={onClear}
              className="w-full py-1.5 text-[9px] font-black text-muted hover:text-accent-red transition-colors uppercase tracking-widest"
            >
              Clear Selected
            </button>
          </div>
        )}
      </div>
    </FilterDropdown>
  )
}
