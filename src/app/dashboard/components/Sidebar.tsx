'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Receipt, 
  Tag, 
  BarChart3, 
  FolderTree, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  AlertCircle,
  X
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Receipt, label: 'Transactions', href: '/dashboard/transactions' },
  { icon: Tag, label: 'Categories', href: '/dashboard/categories' },
  { icon: BarChart3, label: 'Reports', href: '/dashboard/reports' },
  { icon: FolderTree, label: 'Workspace', href: '/dashboard/workspace' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth')
  }

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 64 : 256 }}
      className="relative h-screen bg-surface border-r border-surface-border flex flex-col z-40 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group shadow-premium"
    >
      {/* Logo Section */}
      <div className="flex flex-col px-6 pt-10 pb-6">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-elevated border border-primary/10">
            <LayoutDashboard className="w-5 h-5 text-background" />
          </div>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="font-black text-lg tracking-tighter leading-none text-primary uppercase">
                Fine
              </span>
              <span className="text-[10px] font-black text-muted uppercase tracking-[0.4em] mt-1">
                Finance
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 h-10 rounded-xl transition-all relative group/item select-none cursor-pointer",
                isActive 
                  ? "bg-primary/5 text-primary shadow-premium border border-primary/10 ring-1 ring-primary/5" 
                  : "text-muted hover:text-primary hover:bg-surface-hover/80 border border-transparent"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                />
              )}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                isActive ? "text-primary" : "text-muted group-hover/item:text-primary"
              )}>
                <item.icon className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <motion.span 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "text-sm tracking-tight whitespace-nowrap",
                    isActive ? "font-black" : "font-bold"
                  )}
                >
                  {item.label}
                </motion.span>
              )}
              {isActive && !isCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer Section */}
      <div className="mt-auto px-4 pb-10 space-y-6">
        <div className="h-px bg-gradient-to-r from-transparent via-surface-border to-transparent mx-4" />
        <button 
          onClick={() => setShowSignOutConfirm(true)}
          className={cn(
            "w-full flex items-center gap-3 px-3 h-10 rounded-xl transition-all text-muted hover:text-accent-red hover:bg-accent-red/5 group/logout cursor-pointer select-none border border-transparent hover:border-accent-red/20",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 group-hover/logout:text-accent-red transition-all">
            <LogOut className="w-4 h-4 shrink-0 transition-colors" />
          </div>
          {!isCollapsed && (
            <span className="font-black text-[13px] uppercase tracking-[0.2em] pt-0.5 text-accent-red">Sign Out</span>
          )}
        </button>

        {/* ── Sign Out Confirmation Modal ── */}
        <AnimatePresence>
          {showSignOutConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSignOutConfirm(false)}
                className="absolute inset-0 bg-background/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm bg-surface border border-surface-border rounded-3xl p-6 shadow-elevated text-center overflow-hidden"
              >
                <div className="absolute top-4 right-4">
                  <button 
                    onClick={() => setShowSignOutConfirm(false)}
                    className="p-2 hover:bg-surface-hover rounded-xl text-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-accent-red/10 flex items-center justify-center mx-auto mb-4 border border-accent-red/20">
                  <LogOut className="w-6 h-6 text-accent-red" />
                </div>

                <h3 className="text-lg font-black text-primary uppercase tracking-tight mb-2">
                  Confirm Departure?
                </h3>
                <p className="text-xs font-bold text-muted uppercase tracking-widest leading-relaxed mb-6">
                  Your session state will be preserved, but you will need to re-authenticate.
                </p>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleSignOut}
                    className="w-full h-11 bg-accent-red text-white font-black uppercase tracking-widest rounded-xl hover:bg-accent-red/90 transition-all shadow-lg shadow-accent-red/20 flex items-center justify-center gap-2 text-xs"
                  >
                    Confirm Sign Out
                  </button>
                  <button 
                    onClick={() => setShowSignOutConfirm(false)}
                    className="w-full h-11 bg-surface-hover text-primary font-black uppercase tracking-widest rounded-xl hover:bg-surface-active transition-all border border-surface-border text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-12 w-8 h-8 rounded-xl bg-surface border border-surface-border flex items-center justify-center text-muted hover:text-primary hover:bg-surface-hover transition-all z-50 shadow-elevated opacity-0 group-hover:opacity-100 ring-4 ring-background"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  )
}
