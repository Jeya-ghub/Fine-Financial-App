'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Plus, Loader2, Building2 } from 'lucide-react'
import { createWorkspace } from '@/app/actions/workspaces'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type NoWorkspaceFallbackProps = {
  userEmail?: string
}

export default function NoWorkspaceFallback({ userEmail }: NoWorkspaceFallbackProps) {
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    const workspaceName = name.trim() || 'My Workspace'
    setIsCreating(true)
    setError(null)
    
    try {
      const res = await createWorkspace(workspaceName)
      if (res.error) {
        setError(res.error)
      } else {
        router.refresh()
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create workspace')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await supabase.auth.signOut()
      router.refresh()
      router.push('/auth')
    } catch (err) {
      console.error('Failed to sign out', err)
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="flex h-screen w-screen bg-zinc-50 dark:bg-[#0a0a0a] items-center justify-center text-zinc-900 dark:text-white p-4 font-sans select-none">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
        className="w-full max-w-md bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-xl p-8 md:p-10 space-y-8 backdrop-blur-xl"
      >
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">No Workspace Found</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Logged in as <span className="font-bold text-zinc-800 dark:text-zinc-200">{userEmail}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] block pl-1">
              Create New Workspace
            </label>
            <input
              type="text"
              placeholder="e.g. Personal Finance, Work"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-all text-sm font-medium"
              disabled={isCreating || isSigningOut}
            />
          </div>

          {error && (
            <p className="text-[11px] font-bold text-red-500 pl-1">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isCreating || isSigningOut}
            className="w-full h-12 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.98] transition-all font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-zinc-950/10 dark:shadow-white/5 disabled:opacity-50"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isCreating ? 'Creating...' : 'Create Workspace'}
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="absolute w-full border-t border-zinc-100 dark:border-zinc-800" />
          <span className="relative px-3 bg-white dark:bg-[#121212] text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            or
          </span>
        </div>

        <button
          onClick={handleSignOut}
          disabled={isCreating || isSigningOut}
          className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 text-red-500 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-500/5 active:scale-[0.98] transition-all font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSigningOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          {isSigningOut ? 'Signing Out...' : 'Sign Out'}
        </button>
      </motion.div>
    </div>
  )
}
