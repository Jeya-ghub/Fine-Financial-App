'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FolderTree, Users, Shield, ShieldAlert, Key, LogOut, 
  Plus, CheckCircle2, X, Send, Loader2, Info, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { setActiveWorkspace, createWorkspace } from '@/app/actions/workspaces'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function WorkspaceClient({ 
  workspaces, 
  activeWorkspace,
  members,
  currentUserRole,
  userEmail
}: { 
  workspaces: any[]
  activeWorkspace: any
  members: any[]
  currentUserRole: string
  userEmail: string
}) {
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newWorkspaceType, setNewWorkspaceType] = useState<'private' | 'shared'>('shared')
  const [loading, setLoading] = useState(false)

  const handleSwitch = async (id: string) => {
    setLoading(true)
    await setActiveWorkspace(id)
    router.push(`/dashboard/workspace/${id}`)
    setLoading(false)
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceName.trim()) return
    setLoading(true)
    const res = await createWorkspace(newWorkspaceName, newWorkspaceType)
    setLoading(false)
    if (res.success) {
      setIsCreateModalOpen(false)
      setNewWorkspaceName('')
      setNewWorkspaceType('shared')
      router.refresh()
    } else {
      alert(res.error)
    }
  }


  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* ── Top Action Bar ── */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
            <FolderTree className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white uppercase tracking-tight">Workspace Hub</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Multi-Tenant Control</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCreateModalOpen(true)} 
            className="h-[44px] px-6 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest rounded-xl text-[10px] hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-emerald-500" />
            <span className="hidden md:inline">New Workspace</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
        
        {/* ── Bento Grid: Workspaces ── */}
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Your Workspaces</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map(w => {
              const isActive = w.id === activeWorkspace.id
              const role = w.workspace_members.find((m:any) => m.email === userEmail)?.role || 'member'
              const memberCount = w.workspace_members.length
              
              return (
                <div 
                  key={w.id}
                  className={cn(
                    "p-6 rounded-[2rem] border transition-all group relative overflow-hidden",
                    isActive 
                      ? "bg-gradient-to-br from-[#141414] to-emerald-900/20 border-emerald-500/20 shadow-2xl" 
                      : "bg-[#141414] border-white/5 hover:bg-white/[0.04]"
                  )}
                >
                  <Link 
                    href={`/dashboard/workspace/${w.id}`}
                    onClick={(e) => {
                      if (isActive) {
                        // If already active, just go to management
                        return;
                      }
                      e.preventDefault();
                      handleSwitch(w.id);
                    }}
                    className="absolute inset-0 z-10"
                  />
                  <div className="flex justify-between items-start mb-6 relative z-0">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl",
                      isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-white/5 text-zinc-400 group-hover:text-white transition-colors"
                    )}>
                      {w.name.charAt(0)}
                    </div>
                    <div className="flex gap-2">
                      <div className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Users className="w-3 h-3" /> {memberCount}
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5",
                        role === 'owner' ? "bg-blue-500/10 text-blue-500" : "bg-zinc-800 text-zinc-400"
                      )}>
                        {role === 'owner' ? <Shield className="w-3 h-3" /> : <Key className="w-3 h-3" />}
                        {role}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className={cn("text-xl font-black tracking-tight mb-2", isActive ? "text-white" : "text-zinc-300 group-hover:text-white transition-colors")}>
                      {w.name}
                    </h4>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border",
                      w.type === 'private'
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                        : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                    )}>
                      {w.type === 'private' ? 'Private' : 'Shared'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Create Workspace Modal ── */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 mx-auto">
                <FolderTree className="w-6 h-6 text-emerald-500" />
              </div>
              <h2 className="text-xl font-black text-white text-center uppercase tracking-tight mb-2">Create Shared Workspace</h2>
              <p className="text-xs text-zinc-500 text-center mb-8 leading-relaxed">
                Set up a new isolated environment to collaborate with others.
              </p>
              
              <form onSubmit={handleCreateWorkspace} className="space-y-6">
                <input 
                  type="text" 
                  value={newWorkspaceName} 
                  onChange={(e) => setNewWorkspaceName(e.target.value)} 
                  placeholder="e.g. Family Budget" 
                  className="w-full h-[60px] bg-white/[0.02] border border-white/5 rounded-2xl px-6 text-sm font-bold text-center text-white focus:outline-none focus:border-emerald-500/50 transition-all" 
                  required
                  maxLength={30}
                />
                
                <div className="grid grid-cols-2 gap-2 bg-[#141414] p-1 rounded-2xl border border-white/5">
                  <button 
                    type="button" 
                    onClick={() => setNewWorkspaceType('private')}
                    className={cn(
                      "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      newWorkspaceType === 'private' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-zinc-500 hover:text-white hover:bg-white/5"
                    )}
                  >
                    Private
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setNewWorkspaceType('shared')}
                    className={cn(
                      "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      newWorkspaceType === 'shared' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-zinc-500 hover:text-white hover:bg-white/5"
                    )}
                  >
                    Shared
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button type="button" onClick={() => { setIsCreateModalOpen(false); setNewWorkspaceName(''); }} className="h-[50px] rounded-xl text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading || !newWorkspaceName.trim()}
                    className="h-[50px] bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
