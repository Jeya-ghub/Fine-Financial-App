import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Settings, User, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type UserMenuProps = {
  userEmail?: string
}

export default function UserMenu({ userEmail }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/auth')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-[#0a0a0a] border border-white/5 transition-all group cursor-pointer select-none hover:bg-white/[0.03] shadow-sm active:scale-95 w-full max-w-[240px]"
      >
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[11px] font-black text-black shrink-0 shadow-sm">
          {userEmail?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="hidden sm:flex flex-col text-left flex-1 min-w-0">
          <p className="text-[11px] font-bold text-white truncate leading-tight">
            {userEmail?.split('@')[0]}
          </p>
          <p className="text-[10px] font-medium text-[#64748B] truncate leading-tight">
            {userEmail}
          </p>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-[#64748B] transition-transform duration-300 ml-1 shrink-0", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute right-0 mt-2 w-56 bg-[#0a0a0a] border border-white/10 rounded-[1.25rem] shadow-2xl overflow-hidden z-50 p-1.5 backdrop-blur-xl"
          >
            <div className="px-3 py-2 border-b border-white/10 mb-1.5 select-none cursor-default">
              <p className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.15em] mb-0.5">Active User</p>
              <p className="text-[11px] font-bold text-white truncate">{userEmail}</p>
            </div>
            
            <div className="space-y-0.5">
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 h-10 rounded-xl text-[10px] font-black text-red-500 hover:bg-red-500/10 transition-all uppercase tracking-[0.1em] cursor-pointer active:scale-95"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sign Out System
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
