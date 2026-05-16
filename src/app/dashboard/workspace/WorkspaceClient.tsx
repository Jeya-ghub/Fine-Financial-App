'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FolderTree, Users, Shield, ShieldAlert, Key, LogOut, 
  Plus, CheckCircle2, X, Send, Loader2, Info, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { setActiveWorkspace, createWorkspace, renameWorkspace } from '@/app/actions/workspaces'
import { useRouter } from 'next/navigation'
import { Edit2 } from 'lucide-react'
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
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
  const [renamingWorkspace, setRenamingWorkspace] = useState<any>(null)
  const [renameValue, setRenameValue] = useState('')

  const handleSwitch = async (id: string) => {
    setLoading(true)
    await setActiveWorkspace(id)
    router.push(`/dashboard/workspace/${id}`)
    setLoading(false)
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    // No explicit name check here as createWorkspace has a default, 
    // but we'll trim and use the name if provided.
    setLoading(true)
    const res = await createWorkspace(newWorkspaceName || 'Private Workspace', newWorkspaceType)
    setLoading(true)
    if (res.success) {
      setIsCreateModalOpen(false)
      setNewWorkspaceName('')
      setNewWorkspaceType('shared')
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  const handleRenameWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!renameValue.trim() || !renamingWorkspace) return
    setLoading(true)
    const res = await renameWorkspace(renamingWorkspace.id, renameValue.trim())
    setLoading(false)
    if (res.success) {
      setIsRenameModalOpen(false)
      setRenamingWorkspace(null)
      setRenameValue('')
      router.refresh()
    } else {
      alert(res.error)
    }
  }


  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Top Action Bar ── */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-surface-border px-4 md:px-8 py-6 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent-blue/10 rounded-2xl border border-accent-blue/20">
            <FolderTree className="w-6 h-6 text-accent-blue" />
          </div>
          <div>
            <h1 className="text-xl font-black text-primary uppercase tracking-tight leading-tight">Workspace Hub</h1>
            <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mt-1">Multi-Tenant Control Center</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCreateModalOpen(true)} 
            className="h-[48px] px-8 bg-primary text-background font-black uppercase tracking-widest rounded-2xl text-[11px] hover:opacity-90 transition-all flex items-center gap-3 shadow-elevated"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden md:inline">Create Workspace</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
        
        {/* ── Bento Grid: Workspaces ── */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            <h3 className="text-[11px] font-black text-muted uppercase tracking-[0.3em]">Managed Environments</h3>
            <div className="h-px flex-1 bg-surface-border" />
          </div>
          <div className="flex flex-col gap-4">
            {workspaces.map(w => {
              const isActive = w.id === activeWorkspace.id
              const role = w.workspace_members.find((m:any) => m.email === userEmail)?.role || 'member'
              const memberCount = w.workspace_members.length
              
              return (
                <div 
                  key={w.id}
                  className={cn(
                    "p-5 rounded-3xl border transition-all group relative overflow-hidden flex items-center justify-between gap-6 shadow-sm hover:shadow-elevated",
                    isActive 
                      ? "bg-surface border-primary/20 ring-2 ring-primary/5" 
                      : "bg-surface border-surface-border hover:border-surface-border-hover"
                  )}
                >
                  <Link 
                    href={`/dashboard/workspace/${w.id}`}
                    onClick={(e) => {
                      if (isActive) return;
                      e.preventDefault();
                      handleSwitch(w.id);
                    }}
                    className="absolute inset-0 z-10"
                  />
                  
                  <div className="flex items-center gap-5 relative z-0 flex-1">
                    <div className={cn(
                      "w-12 h-12 rounded-[1rem] flex items-center justify-center font-black text-xl shadow-sm border transition-all group-hover:scale-105 shrink-0",
                      isActive 
                        ? "bg-primary text-background border-primary" 
                        : "bg-surface-hover text-muted border-surface-border"
                    )}>
                      {w.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex flex-col items-start min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h4 className={cn("text-lg font-black tracking-tight truncate transition-colors", isActive ? "text-primary" : "text-primary/80 group-hover:text-primary")}>
                          {w.name}
                        </h4>
                        {isActive && (
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                            Current
                          </span>
                        )}
                        {role === 'owner' && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setRenamingWorkspace(w);
                              setRenameValue(w.name);
                              setIsRenameModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-surface-hover border border-surface-border text-muted hover:text-primary transition-all relative z-20 opacity-0 group-hover:opacity-100 shrink-0"
                            title="Rename Workspace"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-lg border",
                          w.type === 'private'
                            ? "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20" 
                            : "bg-accent-blue/10 text-accent-blue border-accent-blue/20"
                        )}>
                          {w.type === 'private' ? 'Confidential' : 'Collaborative'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 relative z-0 shrink-0">
                    <div className="px-3 py-1.5 bg-surface-hover border border-surface-border rounded-xl text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-muted" /> {memberCount}
                    </div>
                    <div className={cn(
                      "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border shadow-sm",
                      role === 'owner' 
                        ? "bg-accent-blue/10 text-accent-blue border-accent-blue/20" 
                        : "bg-surface-hover text-muted border-surface-border"
                    )}>
                      {role === 'owner' ? <Shield className="w-3 h-3" /> : <Key className="w-3 h-3" />}
                      {role}
                    </div>
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
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-surface border border-surface-border rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent-blue via-primary to-accent-emerald" />
              
              <div className="w-20 h-20 bg-accent-blue/10 rounded-[2rem] flex items-center justify-center mb-8 border border-accent-blue/20 mx-auto shadow-sm">
                <FolderTree className="w-10 h-10 text-accent-blue" />
              </div>
              
              <h2 className="text-2xl font-black text-primary text-center uppercase tracking-tight mb-3">Create Workspace</h2>
              <p className="text-[13px] text-muted text-center mb-10 leading-relaxed max-w-[280px] mx-auto font-medium">
                Establish a secure, isolated environment for your financial operations.
              </p>
              
              <form onSubmit={handleCreateWorkspace} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.25em] ml-2">Workspace Name</label>
                  <input 
                    type="text" 
                    value={newWorkspaceName} 
                    onChange={(e) => setNewWorkspaceName(e.target.value)} 
                    placeholder="e.g. Strategic Assets" 
                    className="w-full h-[64px] bg-surface-hover/50 border border-surface-border rounded-2xl px-6 text-base font-bold text-center text-primary placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm" 
                    required
                    maxLength={30}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.25em] ml-2">Operational Mode</label>
                  <div className="flex w-full bg-surface-hover/50 p-1 rounded-xl border border-surface-border shadow-inner">
                    <button 
                      type="button" 
                      onClick={() => setNewWorkspaceType('private')}
                      className={cn(
                        "flex-1 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        newWorkspaceType === 'private' ? "bg-primary text-background shadow-md" : "text-muted hover:text-primary hover:bg-surface"
                      )}
                    >
                      Private
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setNewWorkspaceType('shared')}
                      className={cn(
                        "flex-1 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        newWorkspaceType === 'shared' ? "bg-primary text-background shadow-md" : "text-muted hover:text-primary hover:bg-surface"
                      )}
                    >
                      Shared
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-6">
                  <button type="button" onClick={() => { setIsCreateModalOpen(false); setNewWorkspaceName(''); }} className="h-[64px] rounded-2xl text-[11px] font-black text-muted hover:text-primary uppercase tracking-[0.2em] transition-all hover:bg-surface-hover border border-transparent hover:border-surface-border">
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading || !newWorkspaceName.trim()}
                    className="h-[64px] bg-primary text-background rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-elevated"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Rename Workspace Modal ── */}
      <AnimatePresence>
        {isRenameModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-surface border border-surface-border rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
              
              <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-8 border border-primary/20 mx-auto shadow-sm">
                <Edit2 className="w-10 h-10 text-primary" />
              </div>
              
              <h2 className="text-2xl font-black text-primary text-center uppercase tracking-tight mb-3">Rename Workspace</h2>
              <p className="text-[13px] text-muted text-center mb-10 leading-relaxed max-w-[280px] mx-auto font-medium">
                Update the designation of your environment.
              </p>
              
              <form onSubmit={handleRenameWorkspace} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.25em] ml-2">New Workspace Name</label>
                  <input 
                    type="text" 
                    value={renameValue} 
                    onChange={(e) => setRenameValue(e.target.value)} 
                    placeholder="e.g. My Private Workspace" 
                    className="w-full h-[64px] bg-surface-hover/50 border border-surface-border rounded-2xl px-6 text-base font-bold text-center text-primary placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm" 
                    required
                    maxLength={30}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-6">
                  <button type="button" onClick={() => { setIsRenameModalOpen(false); setRenameValue(''); setRenamingWorkspace(null); }} className="h-[64px] rounded-2xl text-[11px] font-black text-muted hover:text-primary uppercase tracking-[0.2em] transition-all hover:bg-surface-hover border border-transparent hover:border-surface-border">
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading || !renameValue.trim()}
                    className="h-[64px] bg-primary text-background rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-elevated"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Save'}
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
