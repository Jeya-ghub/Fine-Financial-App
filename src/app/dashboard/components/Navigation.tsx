'use client'

import { motion } from 'framer-motion'
import { 
  LayoutDashboard, ReceiptText, Tags, BarChart3, 
  Wallet2, Settings, Bell, Plus, ChevronDown, Search, Calendar, RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ── SIDEBAR ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: ReceiptText, label: 'Transactions', href: '/dashboard/transactions' },
  { icon: Tags, label: 'Categories', href: '/dashboard/categories' },
  { icon: BarChart3, label: 'Reports', href: '/dashboard/reports' },
  { icon: Wallet2, label: 'Workspace', href: '/dashboard/workspace' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-[260px] h-screen fixed left-0 top-0 bg-[#0a0a0a] border-r border-white/5 p-6 z-50">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
          <LayoutDashboard className="w-6 h-6 text-black fill-black" />
        </div>
        <span className="text-xl font-black text-white tracking-tighter">Fine Finance</span>
      </div>

      <div className="mb-8">
        <button className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px] font-black relative">
              P
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-[#0a0a0a]" />
            </div>
            <span className="text-[11px] font-black text-white uppercase tracking-widest">Personal Finance</span>
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <Link key={item.label} href={item.href}>
              <div className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group",
                active ? "bg-white text-black font-black" : "text-zinc-600 hover:text-white hover:bg-white/[0.02]"
              )}>
                <item.icon className={cn("w-5 h-5", active ? "text-black fill-black" : "text-zinc-600 group-hover:text-white")} />
                <span className="text-[13px] font-bold tracking-tight">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto">
        <div className="p-4 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-sm font-black text-white">
              F
            </div>
            <div>
              <h4 className="text-[13px] font-black text-white tracking-tight">Jeya</h4>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
              </p>
            </div>
          </div>
        </div>
        <button className="flex items-center gap-3 px-4 py-2 text-[11px] font-black text-zinc-500 hover:text-white uppercase tracking-[0.2em] transition-all">
          <RotateCcw className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  )
}

// ── TOPBAR ───────────────────────────────────────────────────────────────────

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 h-12 px-4 flex items-center justify-between">
      {/* Left: Workspace Name */}
      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] font-black text-white uppercase tracking-widest hover:bg-white/[0.05] transition-all">
        <LayoutDashboard className="w-3.5 h-3.5" />
        Personal Finance
        <ChevronDown className="w-3 h-3 text-zinc-500 ml-1" />
      </button>

      {/* Right: Month Selector, Add Transaction, Avatar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] font-black text-zinc-400 uppercase tracking-widest cursor-default">
          <Calendar className="w-3 h-3" />
          April 2026
        </div>

        <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-black font-black text-[11px] transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Plus className="w-3.5 h-3.5" />
          Add Transaction
        </button>

        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[11px] font-black text-white ml-1">
          J
        </div>
      </div>
    </header>
  )
}


// ── BOTTOM NAV ───────────────────────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname()
  
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-2xl border-t border-white/5 px-6 flex items-center justify-between z-50">
      {NAV_ITEMS.slice(0, 4).map((item) => {
        const active = pathname === item.href
        return (
          <Link key={item.label} href={item.href} className="flex flex-col items-center gap-1.5">
            <div className={cn(
              "w-12 h-10 rounded-2xl flex items-center justify-center transition-all",
              active ? "bg-white text-black" : "text-zinc-600"
            )}>
              <item.icon className="w-5 h-5" />
            </div>
          </Link>
        )
      })}
      <button className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg shadow-white/10 -mt-8 border-4 border-black">
        <Plus className="w-6 h-6" />
      </button>
    </nav>
  )
}
