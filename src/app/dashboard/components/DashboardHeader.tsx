'use client'

import { Calendar, Plus, ChevronDown, Moon, Sun } from 'lucide-react'
import UserMenu from './UserMenu'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '@/components/providers/DashboardProvider'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { setActiveWorkspace } from '@/app/actions/workspaces'
import { useRouter } from 'next/navigation'

type DashboardHeaderProps = {
  userEmail: string
  username: string
  workspaceId: string
  categories: any[]
  workspaces: any[]
}

export default function DashboardHeader({ userEmail, username, workspaceId, categories, workspaces }: DashboardHeaderProps) {
  const router = useRouter()
  const { selectedMonth, setSelectedMonth, theme, toggleTheme } = useDashboardContext()
  const [isMonthSheetOpen, setIsMonthSheetOpen] = useState(false)
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState<string | null>(null)

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  
  const activeWorkspace = workspaces.find(w => w.id === workspaceId)

  return (
    <>
      <header className="h-12 bg-background/80 backdrop-blur-md border-b border-surface-border px-6 flex items-center justify-between z-[100] transition-colors duration-300 sticky top-0">
        
        {/* Left: Branding & Workspace Switcher */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
              className={cn(
                "flex items-center gap-4 px-3 py-1.5 rounded-2xl transition-all duration-300 group",
                isWorkspaceOpen ? "bg-surface-hover border-surface-border shadow-inner" : "hover:bg-white/5"
              )}
            >
              <div className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center border border-surface-border shadow-sm group-hover:scale-110 transition-transform">
                <Calendar className="w-4 h-4 text-accent-emerald" />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  Fine Finance
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-muted uppercase tracking-wider">
                    {activeWorkspace?.name || 'Personal'}
                  </span>
                  <ChevronDown className={cn("w-2.5 h-2.5 text-muted/40 transition-transform duration-300", isWorkspaceOpen && "rotate-180")} />
                </div>
              </div>
            </button>

            {/* Workspace Dropdown */}
            <AnimatePresence>
              {isWorkspaceOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-[190]" 
                    onClick={() => setIsWorkspaceOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.98 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    className="absolute top-full left-0 mt-3 w-72 bg-surface/98 border border-surface-border rounded-[2rem] p-4 shadow-elevated z-[200] backdrop-blur-xl overflow-hidden"
                  >
                    <div className="px-3 py-2 mb-3">
                      <span className="text-[9px] font-black text-muted uppercase tracking-[0.3em]">Switch Workspace</span>
                    </div>
                    
                    <div className="space-y-1.5">
                      {workspaces.map((ws) => {
                        const isActive = ws.id === workspaceId
                        const switching = isSwitching === ws.id

                        return (
                          <button
                            key={ws.id}
                            disabled={isActive || !!isSwitching}
                            onClick={async () => {
                              setIsSwitching(ws.id)
                              await setActiveWorkspace(ws.id)
                              window.location.reload()
                            }}
                            className={cn(
                              "w-full flex items-center justify-between p-4 rounded-2xl transition-all group relative border",
                              isActive 
                                ? "bg-primary/5 border-primary/10 shadow-sm" 
                                : "hover:bg-white/5 border-transparent"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-2.5 h-2.5 rounded-full transition-all duration-500",
                                isActive ? "bg-accent-emerald shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-muted/20 group-hover:bg-muted/40"
                              )} />
                              <span className={cn(
                                "text-[11px] font-black uppercase tracking-widest transition-colors",
                                isActive ? "text-primary" : "text-muted group-hover:text-primary"
                              )}>
                                {ws.name}
                              </span>
                            </div>

                            {switching && (
                              <div className="absolute right-4">
                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                              </div>
                            )}
                            
                            {isActive && !switching && (
                              <span className="text-[8px] font-black text-accent-emerald uppercase tracking-widest border border-accent-emerald/20 px-2 py-1 rounded-lg">Active</span>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-surface-border">
                      <button 
                        onClick={() => {
                          setIsWorkspaceOpen(false)
                          router.push('/dashboard/workspace')
                        }}
                        className="w-full p-4 rounded-2xl hover:bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-primary transition-all text-center"
                      >
                        Manage Workspaces
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
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
          <UserMenu userEmail={userEmail} username={username} />
        </div>
      </header>
    </>
  )
}
