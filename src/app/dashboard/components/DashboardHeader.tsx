'use client'

import { Calendar, Plus, ChevronDown, Moon, Sun } from 'lucide-react'
import UserMenu from './UserMenu'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '@/components/providers/DashboardProvider'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

type DashboardHeaderProps = {
  userEmail: string
  workspaceId: string
  categories: any[]
  workspaces: any[]
}

export default function DashboardHeader({ userEmail, workspaceId, categories, workspaces }: DashboardHeaderProps) {
  const { selectedMonth, setSelectedMonth, theme, toggleTheme } = useDashboardContext()
  const [isMonthSheetOpen, setIsMonthSheetOpen] = useState(false)

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  
  const activeWorkspace = workspaces.find(w => w.id === workspaceId)

  return (
    <>
      <header className="h-12 bg-background border-b border-surface-border px-4 flex items-center justify-between z-[100] transition-colors duration-300">
        
        {/* Left: Branding or Space */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-surface-hover flex items-center justify-center border border-surface-border">
            <Calendar className="w-3.5 h-3.5 text-accent-emerald" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hidden md:block">
            Fine Finance
          </span>
        </div>

        {/* Center: Month Selector */}
        <div className="relative">
          <button
            onClick={() => setIsMonthSheetOpen(!isMonthSheetOpen)}
            className={cn(
              "flex items-center gap-3 px-6 h-9 rounded-full bg-[#0a0a0a] border text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] active:scale-95",
              isMonthSheetOpen ? "border-accent-emerald ring-4 ring-accent-emerald/10" : "border-accent-emerald/40 hover:border-accent-emerald"
            )}
          >
            <Calendar className="w-4 h-4 text-accent-emerald" />
            <span className="text-primary">{selectedMonth}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-muted transition-transform", isMonthSheetOpen && "rotate-180")} />
          </button>

          {/* Month Picker Popover */}
          <AnimatePresence>
            {isMonthSheetOpen && (
              <>
                {/* Backdrop for closing */}
                <div 
                  className="fixed inset-0 z-[190]" 
                  onClick={() => setIsMonthSheetOpen(false)} 
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-surface border border-surface-border rounded-[2rem] p-6 shadow-premium z-[200] glass"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-surface border-t border-l border-surface-border rotate-45 z-[-1]" />
                  
                  <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4 text-center">
                    Select Period
                  </h3>

                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {MONTHS.map((month) => {
                      const isActive = selectedMonth.startsWith(month)
                      return (
                        <button
                          key={month}
                          onClick={() => {
                            setSelectedMonth(`${month} 2026`)
                            setIsMonthSheetOpen(false)
                          }}
                          className={cn(
                            'h-12 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all active:scale-90',
                            isActive
                              ? 'bg-primary border-primary text-background'
                              : 'bg-surface-hover/50 border-surface-border text-secondary hover:text-primary hover:bg-surface-hover'
                          )}
                        >
                          {month.slice(0, 3)}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => setIsMonthSheetOpen(false)}
                    className="w-full h-11 bg-surface-hover border border-surface-border text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-surface transition-all"
                  >
                    Close
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme} 
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-hover transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-accent-amber" /> : <Moon className="w-4 h-4 text-accent-blue" />}
          </button>

          {/* Add Transaction */}
          <Button 
            onClick={() => window.dispatchEvent(new Event('open-transaction-dialog'))}
            className="h-8 px-4 text-[10px] uppercase font-black tracking-widest rounded-xl bg-primary text-background hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Add Transaction</span>
          </Button>

          <div className="w-[1px] h-4 bg-surface-border mx-1" />

          {/* Avatar / User Menu */}
          <UserMenu userEmail={userEmail} />
        </div>
      </header>
    </>
  )
}
