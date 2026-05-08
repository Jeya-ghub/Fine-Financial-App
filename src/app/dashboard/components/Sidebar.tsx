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
  ChevronDown,
  LogOut,
  User
} from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Receipt, label: 'Transactions', href: '/dashboard/transactions' },
  { icon: Tag, label: 'Categories', href: '/dashboard/categories' },
  { icon: BarChart3, label: 'Reports', href: '/dashboard/reports' },
  { icon: FolderTree, label: 'Workspace', href: '/dashboard/workspace' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

type Workspace = {
  id: string
  name: string
  workspace_members?: { role: string }[]
}

export default function Sidebar({ 
  workspaces = [], 
  activeWorkspaceId = '',
  userEmail = ''
}: { 
  workspaces?: Workspace[]
  activeWorkspaceId?: string
  userEmail?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }


  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      className="relative h-screen bg-background border-r border-surface-border flex flex-col z-40 transition-all duration-300 ease-in-out group shadow-2xl"
    >
      {/* Logo Section */}
      <div className="flex flex-col px-4 pt-6 pb-2">
        <div className="flex items-center gap-4 px-2 mb-8">
          <div className="w-10 h-10 rounded-[14px] bg-primary flex items-center justify-center shrink-0 shadow-xl shadow-primary/5">
            <LayoutDashboard className="w-5 h-5 text-background" />
          </div>
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-black text-xl tracking-tight whitespace-nowrap text-primary"
            >
              Fine Finance
            </motion.span>
          )}
        </div>
      </div>

      {/* Main Menu - Strictly following requested structure */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar pt-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all relative group/item select-none cursor-pointer",
                isActive 
                  ? "bg-primary text-background shadow-lg" 
                  : "text-secondary hover:text-primary hover:bg-surface"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-background" : "group-hover/item:text-primary")} />
              {!isCollapsed && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-bold text-sm tracking-tight whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto px-4 pb-8 space-y-4">
        <button 
          onClick={handleSignOut}
          className={cn(
            "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-secondary hover:text-accent-red hover:bg-accent-red/5 group/logout cursor-pointer select-none",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <LogOut className="w-5 h-5 shrink-0 transition-colors" />
          {!isCollapsed && (
            <span className="font-bold text-sm tracking-tight">Sign Out</span>
          )}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 w-6 h-6 rounded-full bg-surface border border-surface-border flex items-center justify-center text-secondary hover:text-primary hover:bg-accent-emerald transition-all z-50 shadow-xl group-hover:opacity-100 opacity-0"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  )
}
