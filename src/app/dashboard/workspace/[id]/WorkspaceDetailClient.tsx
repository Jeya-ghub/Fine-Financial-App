'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Users, Shield, ShieldAlert, Key, LogOut, 
  Plus, CheckCircle2, X, Send, Loader2, Info, Trash2, Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createInvite, leaveWorkspace, deleteWorkspace, revokeMember, requestOwnershipTransfer, confirmOwnershipTransfer, renameWorkspace } from '@/app/actions/workspaces'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Edit2 } from 'lucide-react'

export default function WorkspaceDetailClient({ 
  workspace,
  members,
  invites,
  currentUserRole,
  userEmail
}: { 
  workspace: any
  members: any[]
  invites: any[]
  currentUserRole: string
  userEmail: string
}) {
  const router = useRouter()
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [createdInviteUrl, setCreatedInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const closeInviteDrawer = () => {
    setIsInviteOpen(false)
    setInviteSuccess(false)
    setInviteEmail('')
    setCreatedInviteUrl('')
    setCopied(false)
  }
  
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [leaveConfirmName, setLeaveConfirmName] = useState('')

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [transferTargetId, setTransferTargetId] = useState('')
  const [transferOtp, setTransferOtp] = useState('')
  const [isOtpSent, setIsOtpSent] = useState(false)

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')

  // Supabase Realtime Sync
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`workspace-${workspace.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_members', filter: `workspace_id=eq.${workspace.id}` }, () => {
        router.refresh()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_invites', filter: `workspace_id=eq.${workspace.id}` }, () => {
        router.refresh()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspaces', filter: `id=eq.${workspace.id}` }, () => {
        router.refresh()
      })
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspace.id, router])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await createInvite(workspace.id, inviteEmail)
    setLoading(false)
    if (res.success) {
      if (res.emailSent === false) {
        setCreatedInviteUrl(res.inviteUrl || '')
        setInviteSuccess(true)
      } else {
        setInviteSuccess(true)
        setTimeout(() => {
          closeInviteDrawer()
          router.refresh()
        }, 2000)
      }
    } else {
      alert(res.error)
    }
  }

  const handleLeave = async () => {
    setLoading(true)
    const res = await leaveWorkspace(workspace.id)
    setLoading(false)
    if (res.success) {
      router.push('/dashboard/workspace')
    } else {
      alert(res.error)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    const res = await deleteWorkspace(workspace.id)
    setLoading(false)
    if (res.success) {
      router.push('/dashboard/workspace')
    } else {
      alert(res.error)
    }
  }

  const handleRevoke = async (memberUserId: string) => {
    if (!confirm('Are you sure you want to revoke access for this user?')) return
    setLoading(true)
    const res = await revokeMember(workspace.id, memberUserId)
    setLoading(false)
    if (res.success) {
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  const handleStartTransfer = async (memberUserId: string) => {
    setTransferTargetId(memberUserId)
    setLoading(true)
    const res = await requestOwnershipTransfer(workspace.id, memberUserId)
    setLoading(false)
    if (res.success) {
      setIsOtpSent(true)
      setIsTransferModalOpen(true)
    } else {
      alert(res.error)
    }
  }

  const handleConfirmTransfer = async () => {
    setLoading(true)
    const res = await confirmOwnershipTransfer(workspace.id, transferTargetId, transferOtp)
    setLoading(false)
    if (res.success) {
      setIsTransferModalOpen(false)
      setTransferOtp('')
      setIsOtpSent(false)
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  const handleRenameWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!renameValue.trim()) return
    setLoading(true)
    const res = await renameWorkspace(workspace.id, renameValue.trim())
    setLoading(false)
    if (res.success) {
      setIsRenameModalOpen(false)
      setRenameValue('')
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  const allUsers = [
    ...members.map(m => ({ ...m, status: 'active' })),
    ...invites.map(i => ({ ...i, status: 'pending', role: 'member' }))
  ]

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Top Action Bar ── */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-surface-border px-4 md:px-8 py-6 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard/workspace')}
            className="p-3 bg-surface border border-surface-border rounded-2xl text-muted hover:text-primary hover:bg-surface-hover transition-all active:scale-90 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-primary tracking-tight leading-tight">{workspace.name}</h1>
              {currentUserRole === 'owner' && (
                <button
                  onClick={() => {
                    setRenameValue(workspace.name);
                    setIsRenameModalOpen(true);
                  }}
                  className="p-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-surface-border text-muted hover:text-primary transition-all shadow-sm"
                  title="Rename Workspace"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              <span className={cn(
                "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-xl border shadow-sm",
                workspace.type === 'private' ? "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20" : "bg-accent-blue/10 text-accent-blue border-accent-blue/20"
              )}>
                {workspace.type === 'private' ? 'Confidential' : 'Collaborative'}
              </span>
            </div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mt-1">Workspace Security & Governance</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentUserRole === 'owner' && workspace.type !== 'private' && (
            <button 
              onClick={() => setIsInviteOpen(true)} 
              className="h-[48px] px-8 bg-primary text-background font-black uppercase tracking-widest rounded-2xl text-[11px] hover:opacity-90 transition-all flex items-center gap-3 shadow-elevated"
            >
              <Send className="w-5 h-5" />
              <span className="hidden md:inline">Invite Member</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* ── Member Management Table ── */}
        <div className="bg-surface border border-surface-border rounded-[2.5rem] overflow-hidden shadow-premium">
          <div className="px-10 py-8 border-b border-surface-border flex items-center justify-between bg-surface-hover/30">
            <div>
              <h3 className="text-sm font-black text-primary uppercase tracking-[0.3em]">Operational Team</h3>
              <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mt-1.5">Access Matrix & Authentication Status</p>
            </div>
          </div>
          
          {workspace.type === 'private' ? (
            <div className="p-16 text-center border-t border-surface-border bg-surface-hover/10">
              <div className="w-20 h-20 rounded-[2rem] bg-accent-emerald/10 flex items-center justify-center mx-auto mb-8 border border-accent-emerald/20 shadow-sm">
                <Shield className="w-10 h-10 text-accent-emerald" />
              </div>
              <h4 className="text-xl font-black text-primary tracking-tight mb-3 uppercase">Isolated Protocol Active</h4>
              <p className="text-[13px] text-muted font-medium max-w-md mx-auto leading-relaxed">
                This environment is strictly isolated. External collaboration and member invitations are permanently locked by system policy.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-hover/50">
                    <th className="px-10 py-5 text-[10px] font-black text-muted uppercase tracking-[0.25em]">Principal</th>
                    <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.25em]">Authorization</th>
                    <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.25em]">Security Role</th>
                    <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.25em]">Onboarded</th>
                    <th className="px-10 py-5 text-[10px] font-black text-muted uppercase tracking-[0.25em] text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {allUsers.map((m: any) => (
                    <tr key={m.id} className="hover:bg-surface-hover/30 transition-all group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-5">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black border shadow-sm",
                            m.status === 'active' 
                              ? "bg-surface border-surface-border text-primary" 
                              : "bg-accent-amber/10 border-accent-amber/20 text-accent-amber"
                          )}>
                            {(m.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-primary">{m.email || m.user_id}</p>
                            {m.user_id === workspace.created_by && (
                              <span className="text-[9px] text-accent-blue font-black uppercase tracking-[0.2em] mt-1 block">Founding Architect</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {m.status === 'active' ? (
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Validated
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-accent-amber/10 text-accent-amber border border-accent-amber/20 shadow-sm">
                            <Clock className="w-3.5 h-3.5" /> Pending Auth
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "text-[11px] font-black uppercase tracking-[0.15em]",
                          m.role === 'owner' ? "text-accent-blue" : "text-muted"
                        )}>
                          {m.role}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-[12px] font-bold text-muted">
                        {new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-10 py-6 text-right">
                        {currentUserRole === 'owner' && m.role !== 'owner' ? (
                          <div className="flex items-center justify-end gap-6 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                            {m.status === 'active' && (
                              <button onClick={() => handleStartTransfer(m.user_id)} className="text-[10px] font-black text-muted hover:text-accent-blue uppercase tracking-[0.2em] transition-colors flex items-center gap-2">
                                <Key className="w-4 h-4" /> Transfer
                              </button>
                            )}
                            <button onClick={() => m.status === 'active' ? handleRevoke(m.user_id) : alert('Need backend to revoke pending invite')} className="text-[10px] font-black text-muted hover:text-accent-red uppercase tracking-[0.2em] transition-colors flex items-center gap-2">
                                <X className="w-4 h-4" /> Revoke
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-surface-border">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Danger Zone ── */}
        <div className="p-10 rounded-[3rem] border border-accent-red/20 bg-accent-red/5 relative overflow-hidden group shadow-premium">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-red/5 blur-[120px] rounded-full group-hover:bg-accent-red/10 transition-all pointer-events-none" />
          <h3 className="text-sm font-black text-accent-red uppercase tracking-[0.3em] flex items-center gap-3 mb-4 relative z-10">
            <ShieldAlert className="w-5 h-5" /> Critical Governance Zone
          </h3>
          <p className="text-[13px] text-muted mb-10 font-medium max-w-2xl leading-relaxed relative z-10">
            {workspace.type === 'private'
              ? "Private workspaces cannot be deleted to ensure you always have a secure, isolated personal environment."
              : currentUserRole === 'owner' 
                ? "Deletion of a workspace is an irreversible event. All financial records, custom segments, and access protocols will be permanently destroyed. This action will immediately disconnect all authorized agents." 
                : "Exiting this workspace will immediately revoke your access credentials. Re-onboarding will require a new secure invitation from the primary architect."}
          </p>
          
          <div className="flex gap-4 relative z-10">
            {workspace.type === 'private' ? (
              <button 
                disabled
                className="h-[48px] px-8 bg-accent-red/20 text-white/40 font-black uppercase tracking-widest rounded-2xl text-[11px] cursor-not-allowed flex items-center gap-3 border border-accent-red/10"
              >
                <Shield className="w-4 h-4" /> Private Workspace Locked
              </button>
            ) : currentUserRole === 'owner' ? (
              <button 
                onClick={() => setIsDeleteModalOpen(true)}
                className="h-[48px] px-8 bg-accent-red text-white font-black uppercase tracking-widest rounded-2xl text-[11px] hover:opacity-90 transition-all flex items-center gap-3 shadow-lg shadow-accent-red/20 active:scale-95"
              >
                <Trash2 className="w-4 h-4" /> Delete Workspace
              </button>
            ) : (
              <button 
                onClick={() => setIsLeaveModalOpen(true)}
                className="h-[48px] px-8 bg-accent-red text-white font-black uppercase tracking-widest rounded-2xl text-[11px] hover:opacity-90 transition-all flex items-center gap-3 shadow-lg shadow-accent-red/20 active:scale-95"
              >
                <LogOut className="w-4 h-4" /> Exit Environment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Invite Drawer ── */}
      <AnimatePresence>
        {isInviteOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeInviteDrawer}
              className="fixed inset-0 top-12 z-40 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-12 right-0 bottom-0 w-full md:w-[420px] bg-surface border-l border-surface-border z-50 flex flex-col shadow-2xl"
            >
              <div className="px-10 py-8 border-b border-surface-border flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-xl font-black text-primary uppercase tracking-tight">Invite Member</h2>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mt-1.5">Grant Environment Access</p>
                </div>
                <button onClick={closeInviteDrawer} className="p-3 bg-surface-hover border border-surface-border rounded-2xl text-muted hover:text-primary transition-all active:scale-90">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 p-10 overflow-y-auto">
                {inviteSuccess ? (
                  createdInviteUrl ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center space-y-6">
                      <div className="w-20 h-20 bg-accent-emerald/10 rounded-[2rem] flex items-center justify-center border border-accent-emerald/20 shadow-sm">
                        <CheckCircle2 className="w-10 h-10 text-accent-emerald" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-primary uppercase tracking-tight">Invite Generated</h3>
                        <p className="text-[9px] text-accent-emerald font-black uppercase tracking-[0.2em] mt-1.5 bg-accent-emerald/5 border border-accent-emerald/10 px-2 py-0.5 rounded-full inline-block">Secure Local Mode</p>
                      </div>
                      
                      <p className="text-[12px] text-muted leading-relaxed max-w-sm">
                        The secure invite has been successfully registered. Since automated notifications are currently offline, you can share this direct link with your collaborator:
                      </p>

                      <div className="w-full space-y-3">
                        <input 
                          type="text" 
                          readOnly 
                          value={createdInviteUrl} 
                          className="w-full h-12 bg-surface-hover/50 border border-surface-border rounded-xl px-4 text-[11px] font-mono font-bold text-muted focus:outline-none select-all shadow-inner" 
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(createdInviteUrl)
                            setCopied(true)
                            setTimeout(() => setCopied(false), 2000)
                          }}
                          className="w-full h-12 bg-primary text-background font-black uppercase tracking-widest rounded-xl text-[10px] hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                        >
                          {copied ? 'Copied to Clipboard!' : 'Copy Invite Link'}
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          closeInviteDrawer()
                          router.refresh()
                        }}
                        className="w-full h-12 bg-surface-hover hover:bg-surface border border-surface-border text-primary font-black uppercase tracking-widest rounded-xl text-[10px] transition-all active:scale-95 shadow-sm"
                      >
                        Close
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center">
                      <div className="w-24 h-24 bg-accent-emerald/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-accent-emerald/20 shadow-sm">
                        <CheckCircle2 className="w-12 h-12 text-accent-emerald" />
                      </div>
                      <h3 className="text-2xl font-black text-primary uppercase tracking-tight mb-3">Invite Dispatched</h3>
                      <p className="text-[13px] text-muted font-medium leading-relaxed max-w-[280px]">
                        A secure authentication token has been generated and sent to the recipient.
                      </p>
                    </motion.div>
                  )
                ) : (
                  <form onSubmit={handleInvite} className="space-y-10">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted uppercase tracking-[0.25em] ml-2">Email Address</label>
                      <input 
                        type="email"
                        value={inviteEmail} 
                        onChange={(e) => setInviteEmail(e.target.value)} 
                        placeholder="collaborator@enterprise.com" 
                        className="w-full h-[64px] bg-surface-hover/30 border border-surface-border rounded-2xl px-6 text-base font-bold text-primary placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm" 
                        required 
                      />
                    </div>
                    <div className="bg-accent-blue/5 border border-accent-blue/10 rounded-[2rem] p-6 flex gap-5">
                      <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center shrink-0">
                        <Info className="w-5 h-5 text-accent-blue" />
                      </div>
                      <p className="text-[12px] text-muted font-medium leading-relaxed">
                        Security Notice: Recipients must complete high-entropy OTP verification to validate their identity before access is granted.
                      </p>
                    </div>
                    <button type="submit" disabled={loading || !inviteEmail} className="w-full h-[64px] bg-primary text-background font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-elevated">
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5" /> Dispatch Access Invite</>}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Leave Confirmation Modal ── */}
      <AnimatePresence>
        {isLeaveModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-surface border border-accent-red/20 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-accent-red" />
              
              <div className="w-20 h-20 bg-accent-red/10 rounded-[2rem] flex items-center justify-center mb-8 border border-accent-red/20 mx-auto shadow-sm">
                <LogOut className="w-10 h-10 text-accent-red" />
              </div>
              <h2 className="text-2xl font-black text-primary text-center uppercase tracking-tight mb-3">Terminate Access?</h2>
              <p className="text-[13px] text-muted text-center mb-10 leading-relaxed font-medium">
                This action is permanent. To authorize your exit from this environment, type <strong className="text-primary font-mono tracking-widest bg-surface-hover px-2 py-1 rounded">"{workspace.name}"</strong> below.
              </p>
              
              <div className="space-y-8">
                <input 
                  type="text" 
                  value={leaveConfirmName} 
                  onChange={(e) => setLeaveConfirmName(e.target.value)} 
                  placeholder={workspace.name} 
                  className="w-full h-[64px] bg-surface-hover/50 border border-surface-border rounded-2xl px-6 text-base font-bold text-center text-primary focus:outline-none focus:ring-4 focus:ring-accent-red/10 transition-all font-mono tracking-widest shadow-inner" 
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => { setIsLeaveModalOpen(false); setLeaveConfirmName(''); }} className="h-[64px] rounded-2xl text-[11px] font-black text-muted hover:text-primary uppercase tracking-[0.2em] transition-all hover:bg-surface-hover">
                    Cancel
                  </button>
                  <button 
                    onClick={handleLeave}
                    disabled={loading || leaveConfirmName !== workspace.name}
                    className="h-[64px] bg-accent-red text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-lg shadow-accent-red/20"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Exit'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-surface border border-accent-red/20 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-accent-red shadow-[0_4px_20px_rgba(239,68,68,0.4)]" />
              
              <div className="w-20 h-20 bg-accent-red/10 rounded-[2rem] flex items-center justify-center mb-8 border border-accent-red/20 mx-auto shadow-sm">
                <Trash2 className="w-10 h-10 text-accent-red" />
              </div>
              <h2 className="text-2xl font-black text-primary text-center uppercase tracking-tight mb-3">Delete Workspace?</h2>
              <p className="text-[13px] text-muted text-center mb-10 leading-relaxed font-medium">
                This will eradicate the workspace and <strong className="text-accent-red">ALL associated financial history</strong>. To confirm this destructive event, type <strong className="text-primary font-mono tracking-widest bg-surface-hover px-2 py-1 rounded">"{workspace.name}"</strong> below.
              </p>
              
              <div className="space-y-8">
                <input 
                  type="text" 
                  value={deleteConfirmName} 
                  onChange={(e) => setDeleteConfirmName(e.target.value)} 
                  placeholder={workspace.name} 
                  className="w-full h-[64px] bg-surface-hover/50 border border-surface-border rounded-2xl px-6 text-base font-bold text-center text-primary focus:outline-none focus:ring-4 focus:ring-accent-red/10 transition-all font-mono tracking-widest shadow-inner" 
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmName(''); }} className="h-[64px] rounded-2xl text-[11px] font-black text-muted hover:text-primary uppercase tracking-[0.2em] transition-all hover:bg-surface-hover">
                    Cancel
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={loading || deleteConfirmName !== workspace.name}
                    className="h-[64px] bg-accent-red text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-lg shadow-accent-red/20"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Deletion'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── Ownership Transfer OTP Modal ── */}
      <AnimatePresence>
        {isTransferModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-surface border border-accent-blue/20 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-accent-blue" />
              
              <div className="w-20 h-20 bg-accent-blue/10 rounded-[2rem] flex items-center justify-center mb-8 border border-accent-blue/20 mx-auto shadow-sm">
                <Shield className="w-10 h-10 text-accent-blue" />
              </div>
              <h2 className="text-2xl font-black text-primary text-center uppercase tracking-tight mb-3">Security Verification</h2>
              <p className="text-[13px] text-muted text-center mb-10 leading-relaxed font-medium">
                A critical security token has been dispatched to <strong className="text-primary">{userEmail}</strong>. Provide the 6-digit authorization code to transfer primary ownership.
              </p>
              
              <div className="space-y-8">
                <input 
                  type="text" 
                  value={transferOtp} 
                  onChange={(e) => setTransferOtp(e.target.value)} 
                  placeholder="000000" 
                  maxLength={6}
                  className="w-full h-[72px] bg-surface-hover/50 border border-surface-border rounded-2xl px-6 text-3xl font-black text-center text-primary focus:outline-none focus:ring-4 focus:ring-accent-blue/10 transition-all tracking-[0.5em] shadow-inner" 
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => { setIsTransferModalOpen(false); setTransferOtp(''); setIsOtpSent(false); }} className="h-[64px] rounded-2xl text-[11px] font-black text-muted hover:text-primary uppercase tracking-[0.2em] transition-all hover:bg-surface-hover">
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmTransfer}
                    disabled={loading || transferOtp.length !== 6}
                    className="h-[64px] bg-accent-blue text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-lg shadow-accent-blue/20"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Authorize Transfer'}
                  </button>
                </div>
              </div>
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
                  <button type="button" onClick={() => { setIsRenameModalOpen(false); setRenameValue(''); }} className="h-[64px] rounded-2xl text-[11px] font-black text-muted hover:text-primary uppercase tracking-[0.2em] transition-all hover:bg-surface-hover border border-transparent hover:border-surface-border">
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
