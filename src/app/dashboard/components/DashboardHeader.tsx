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
      <header className="h-12 bg-background/80 backdrop-blur-md border-b border-surface-border px-6 flex items-center justify-between z-[100] transition-colors duration-300 sticky top-0">
        
        {/* Left: Branding or Space */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-surface-hover flex items-center justify-center border border-surface-border shadow-sm">
            <Calendar className="w-4 h-4 text-accent-emerald" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              Fine Finance
            </span>
            <span className="text-[9px] font-bold text-muted uppercase tracking-wider">
              {activeWorkspace?.name || 'Personal'}
            </span>
          </div>
        </div>

        {/* Center: Month Selector */}
        <div className="relative">
          <button
            onClick={() => setIsMonthSheetOpen(!isMonthSheetOpen)}
            className={cn(
              "flex items-center gap-3 px-4 h-9 rounded-xl bg-surface border border-surface-border text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-premium active:scale-95 group",
              isMonthSheetOpen ? "border-accent-emerald ring-4 ring-accent-emerald/5" : "hover:border-accent-emerald/50 hover:shadow-elevated"
            )}
          >
            <Calendar className="w-3.5 h-3.5 text-accent-emerald transition-transform group-hover:scale-110" />
            <span className="text-primary">{selectedMonth}</span>
            <ChevronDown className={cn("w-3 h-3 text-muted transition-all", isMonthSheetOpen && "rotate-180")} />
          </button>

          {/* Month Picker Popover */}
          <AnimatePresence>
            {isMonthSheetOpen && (
              <>
                <div 
                  className="fixed inset-0 z-[190]" 
                  onClick={() => setIsMonthSheetOpen(false)} 
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-surface border border-surface-border rounded-3xl p-6 shadow-elevated z-[200] glass"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-surface border-t border-l border-surface-border rotate-45 z-[-1]" />
                  
                  <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.25em] mb-4 text-center">
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
                            'h-10 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all active:scale-90',
                            isActive
                              ? 'bg-primary border-primary text-background shadow-lg shadow-primary/20'
                              : 'bg-surface-hover/30 border-surface-border text-secondary hover:text-primary hover:bg-surface-hover hover:border-surface-border-hover'
                          )}
                        >
                          {month.slice(0, 3)}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => setIsMonthSheetOpen(false)}
                    className="w-full h-10 bg-surface-hover border border-surface-border text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-surface transition-all active:scale-95"
                  >
                    Close
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme} 
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface border border-surface-border hover:bg-surface-hover transition-all shadow-sm active:scale-90"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-accent-amber" /> : <Moon className="w-4 h-4 text-accent-blue" />}
          </button>

          {/* Add Transaction */}
          <Button 
            onClick={() => window.dispatchEvent(new Event('open-transaction-dialog'))}
            className="h-9 px-4 text-[10px] uppercase font-black tracking-widest rounded-xl bg-primary text-background hover:scale-[1.02] shadow-lg shadow-primary/10 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">New Transaction</span>
          </Button>

          <div className="w-[1px] h-5 bg-surface-border mx-1" />

          {/* Avatar / User Menu */}
          <UserMenu userEmail={userEmail} />
        </div>
      </header>
    </>
  )
}
