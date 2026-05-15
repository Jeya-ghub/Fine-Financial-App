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
  const [isConfirming, setIsConfirming] = useState(false)
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
    if (!isConfirming) {
      setIsConfirming(true)
      return
    }
    await supabase.auth.signOut()
    router.refresh()
    router.push('/auth')
  }

  // Reset confirmation when dropdown closes
  useEffect(() => {
    if (!isOpen) setIsConfirming(false)
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3.5 px-4 py-2 rounded-2xl bg-surface border border-surface-border transition-all group cursor-pointer select-none hover:bg-surface-hover hover:border-surface-border-hover shadow-sm active:scale-95 w-full max-w-[260px]"
      >
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-[12px] font-black text-background shrink-0 shadow-lg shadow-primary/10">
          {userEmail?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="hidden sm:flex flex-col text-left flex-1 min-w-0">
          <p className="text-[12px] font-black text-primary truncate leading-tight tracking-tight">
            {userEmail?.split('@')[0]}
          </p>
          <p className="text-[10px] font-bold text-muted truncate leading-tight tracking-wide">
            {userEmail}
          </p>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted transition-transform duration-300 ml-1 shrink-0 group-hover:text-primary", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="absolute right-0 mt-3 w-64 bg-surface border border-surface-border rounded-[2rem] shadow-elevated overflow-hidden z-[200] p-2 backdrop-blur-xl"
          >
            <div className="px-4 py-4 border-b border-surface-border mb-2 select-none cursor-default">
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.25em] mb-1">Active Account</p>
              <p className="text-[12px] font-bold text-primary truncate">{userEmail}</p>
            </div>
            
            <div className="space-y-1">
              <button 
                onClick={handleSignOut}
                className={cn(
                  "w-full flex items-center gap-4 px-4 h-12 rounded-xl text-[11px] font-black transition-all uppercase tracking-[0.15em] cursor-pointer active:scale-95",
                  isConfirming 
                    ? "bg-accent-red text-white" 
                    : "text-accent-red hover:bg-accent-red/5"
                )}
              >
                <LogOut className="w-5 h-5 shrink-0" />
                {isConfirming ? 'Confirm Sign Out?' : 'Sign Out'}
              </button>
              {isConfirming && (
                <button 
                  onClick={() => setIsConfirming(false)}
                  className="w-full text-center py-2 text-[9px] font-black text-muted uppercase tracking-widest hover:text-primary transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
