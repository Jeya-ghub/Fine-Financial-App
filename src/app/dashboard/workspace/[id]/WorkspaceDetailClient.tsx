'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Users, Shield, ShieldAlert, Key, LogOut, 
  Plus, CheckCircle2, X, Send, Loader2, Info, Trash2, Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createInvite, leaveWorkspace, deleteWorkspace, revokeMember, requestOwnershipTransfer, confirmOwnershipTransfer } from '@/app/actions/workspaces'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
  
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [leaveConfirmName, setLeaveConfirmName] = useState('')

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [transferTargetId, setTransferTargetId] = useState('')
  const [transferOtp, setTransferOtp] = useState('')
  const [isOtpSent, setIsOtpSent] = useState(false)

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
      setInviteSuccess(true)
      setTimeout(() => {
        setIsInviteOpen(false)
        setInviteSuccess(false)
        setInviteEmail('')
        router.refresh()
      }, 2000)
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

  const allUsers = [
    ...members.map(m => ({ ...m, status: 'active' })),
    ...invites.map(i => ({ ...i, status: 'pending', role: 'member' }))
  ]

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* ── Top Action Bar ── */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard/workspace')}
            className="p-2.5 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/10"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white tracking-tight">{workspace.name}</h1>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                workspace.type === 'private' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
              )}>
                {workspace.type === 'private' ? 'Private' : 'Shared'}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Workspace Settings</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentUserRole === 'owner' && workspace.type !== 'private' && (
            <button 
              onClick={() => setIsInviteOpen(true)} 
              className="h-[44px] px-6 bg-white text-black font-black uppercase tracking-widest rounded-xl text-[10px] hover:bg-zinc-200 transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden md:inline">Invite Member</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* ── Member Management Table ── */}
        <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Team Access</h3>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Manage Roles & Permissions</p>
            </div>
          </div>
          
          {workspace.type === 'private' ? (
            <div className="p-12 text-center border-t border-white/5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                <Shield className="w-8 h-8 text-emerald-500" />
              </div>
              <h4 className="text-lg font-black text-white tracking-tight mb-2">Isolated Environment</h4>
              <p className="text-sm text-zinc-500 font-medium max-w-md mx-auto leading-relaxed">
                This is your permanent financial safe zone. Sharing and member invitations are permanently disabled for this environment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-8 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Joined</th>
                    <th className="px-8 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {allUsers.map((m: any) => (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-xs font-black border",
                            m.status === 'active' 
                              ? "bg-gradient-to-br from-zinc-800 to-zinc-900 border-white/10 text-white" 
                              : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                          )}>
                            {(m.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{m.email || m.user_id}</p>
                            {m.user_id === workspace.created_by && (
                              <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest">Creator</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {m.status === 'active' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                            <Clock className="w-3 h-3" /> Pending
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          m.role === 'owner' ? "text-blue-500" : "text-zinc-500"
                        )}>
                          {m.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-zinc-600">
                        {new Date(m.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-8 py-4 text-right">
                        {currentUserRole === 'owner' && m.role !== 'owner' ? (
                          <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            {m.status === 'active' && (
                              <button onClick={() => handleStartTransfer(m.user_id)} className="text-[10px] font-black text-zinc-500 hover:text-blue-500 uppercase tracking-widest transition-colors flex items-center gap-1.5">
                                <Key className="w-3 h-3" /> Transfer
                              </button>
                            )}
                            <button onClick={() => m.status === 'active' ? handleRevoke(m.user_id) : alert('Need backend to revoke pending invite')} className="text-[10px] font-black text-zinc-500 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1.5">
                              <X className="w-3 h-3" /> Revoke
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">—</span>
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
        <div className="p-8 rounded-[2.5rem] border border-red-500/10 bg-gradient-to-br from-red-500/5 to-transparent relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 blur-[120px] rounded-full group-hover:bg-red-500/10 transition-all pointer-events-none" />
          <h3 className="text-sm font-black text-red-500 uppercase tracking-widest flex items-center gap-2 mb-3 relative z-10">
            <ShieldAlert className="w-4 h-4" /> Danger Zone
          </h3>
          <p className="text-xs text-zinc-400 mb-8 font-medium max-w-2xl leading-relaxed relative z-10">
            {currentUserRole === 'owner' 
              ? "Deleting a workspace permanently destroys all associated transactions, categories, and member access. This action cannot be undone and will forcefully disconnect all active users." 
              : "Leaving a workspace revokes your access instantly. You will no longer be able to view or edit transactions in this environment."}
          </p>
          
          <div className="flex gap-4 relative z-10">
            {currentUserRole === 'owner' ? (
              <button 
                onClick={() => setIsDeleteModalOpen(true)}
                className="h-[44px] px-8 bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-widest rounded-xl text-[10px] hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Workspace
              </button>
            ) : (
              <button 
                onClick={() => setIsLeaveModalOpen(true)}
                className="h-[44px] px-8 bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-widest rounded-xl text-[10px] hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Leave Workspace
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
              onClick={() => setIsInviteOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full md:w-[400px] bg-[#0a0a0a] border-l border-white/10 z-50 flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">Invite Member</h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Provide Access</p>
                </div>
                <button onClick={() => setIsInviteOpen(false)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 p-8">
                {inviteSuccess ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Invite Dispatched</h3>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                      A secure token has been sent to the email address. They will appear as "Pending" until they accept.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleInvite} className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
                      <input 
                        type="email"
                        value={inviteEmail} 
                        onChange={(e) => setInviteEmail(e.target.value)} 
                        placeholder="colleague@example.com" 
                        className="w-full h-[60px] bg-white/[0.02] border border-white/5 rounded-2xl px-6 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all" 
                        required 
                      />
                    </div>
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5 flex gap-4">
                      <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                        The invited user will undergo a Redis-OTP verification flow. Upon success, they will be granted "Member" access.
                      </p>
                    </div>
                    <button type="submit" disabled={loading || !inviteEmail} className="w-full h-[60px] bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Send Secure Invite</>}
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
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#0d0d0d] border border-red-500/20 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20 mx-auto">
                <LogOut className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-black text-white text-center uppercase tracking-tight mb-2">Leave Workspace?</h2>
              <p className="text-xs text-zinc-500 text-center mb-8 leading-relaxed">
                This action is irreversible. To confirm your exit, type <strong className="text-white font-mono tracking-widest px-1">"{workspace.name}"</strong> below.
              </p>
              
              <div className="space-y-6">
                <input 
                  type="text" 
                  value={leaveConfirmName} 
                  onChange={(e) => setLeaveConfirmName(e.target.value)} 
                  placeholder={workspace.name} 
                  className="w-full h-[60px] bg-white/[0.02] border border-white/5 rounded-2xl px-6 text-sm font-bold text-center text-white focus:outline-none focus:border-red-500/50 transition-all font-mono tracking-widest" 
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => { setIsLeaveModalOpen(false); setLeaveConfirmName(''); }} className="h-[50px] rounded-xl text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">
                    Cancel
                  </button>
                  <button 
                    onClick={handleLeave}
                    disabled={loading || leaveConfirmName !== workspace.name}
                    className="h-[50px] bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Leave'}
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
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#0d0d0d] border border-red-500/20 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20 mx-auto">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-black text-white text-center uppercase tracking-tight mb-2">Delete Workspace?</h2>
              <p className="text-xs text-zinc-500 text-center mb-8 leading-relaxed">
                This will permanently delete the workspace and <strong className="text-white">ALL associated transactions</strong>. To confirm, type <strong className="text-white font-mono tracking-widest px-1">"{workspace.name}"</strong>.
              </p>
              
              <div className="space-y-6">
                <input 
                  type="text" 
                  value={deleteConfirmName} 
                  onChange={(e) => setDeleteConfirmName(e.target.value)} 
                  placeholder={workspace.name} 
                  className="w-full h-[60px] bg-white/[0.02] border border-white/5 rounded-2xl px-6 text-sm font-bold text-center text-white focus:outline-none focus:border-red-500/50 transition-all font-mono tracking-widest" 
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmName(''); }} className="h-[50px] rounded-xl text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">
                    Cancel
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={loading || deleteConfirmName !== workspace.name}
                    className="h-[50px] bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Delete'}
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
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#0d0d0d] border border-blue-500/20 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 mx-auto">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <h2 className="text-xl font-black text-white text-center uppercase tracking-tight mb-2">Security Verification</h2>
              <p className="text-xs text-zinc-500 text-center mb-8 leading-relaxed">
                A critical security code has been sent to <strong className="text-white">{userEmail}</strong>. Enter it below to authorize "God Mode" transfer.
              </p>
              
              <div className="space-y-6">
                <input 
                  type="text" 
                  value={transferOtp} 
                  onChange={(e) => setTransferOtp(e.target.value)} 
                  placeholder="000000" 
                  maxLength={6}
                  className="w-full h-[60px] bg-white/[0.02] border border-white/5 rounded-2xl px-6 text-2xl font-black text-center text-white focus:outline-none focus:border-blue-500/50 transition-all tracking-[0.5em]" 
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => { setIsTransferModalOpen(false); setTransferOtp(''); setIsOtpSent(false); }} className="h-[50px] rounded-xl text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmTransfer}
                    disabled={loading || transferOtp.length !== 6}
                    className="h-[50px] bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authorize Transfer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
