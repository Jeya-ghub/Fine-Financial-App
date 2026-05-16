'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, ShieldCheck, Palette, Trash2, CheckCircle2, 
  Smartphone, Laptop, X, AlertTriangle, Info, Key, Loader2,
  Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateProfile, requestAccountDeletion, revokeAccountDeletion, terminateSession, terminateAllOtherSessions } from '@/app/actions/auth'
import { useDashboardContext } from '@/components/providers/DashboardProvider'

const TABS = [
  { id: 'profile', label: 'Profile & Identity', icon: User },
  { id: 'security', label: 'Security & Sessions', icon: ShieldCheck },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'account', label: 'Account Data', icon: Trash2 },
]

export default function SettingsClient({ 
  user, 
  initialSessions 
}: { 
  user: any
  initialSessions: any[]
}) {
  const { theme, toggleTheme } = useDashboardContext()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  
  // Profile State
  const initialUsername = user.user_metadata?.username || user.user_metadata?.full_name?.replace(/[^a-zA-Z]/g, '').slice(0, 10) || ''
  const [username, setUsername] = useState(initialUsername)
  const [email, setEmail] = useState(user.email || '')
  const [emailOtpMode, setEmailOtpMode] = useState(false)
  
  // Security State
  const [sessions, setSessions] = useState(initialSessions)
  const [otpFrequency, setOtpFrequency] = useState('comfort') // 'strict' | 'comfort'

  // Account State
  const deletionDate = user.user_metadata?.deletion_scheduled_at
  const [deleteConfirm, setDeleteConfirm] = useState('')

  // ── Handlers ──

  const handleSaveUsername = async () => {
    setLoading(true)
    await updateProfile(username)
    setLoading(false)
  }

  const handleKillSession = async (id: string) => {
    await terminateSession(id)
    setSessions(s => s.filter(x => x.id !== id))
  }

  const handleAccountDeletion = async () => {
    setLoading(true)
    await requestAccountDeletion()
    window.location.reload()
  }

  const handleRevokeDeletion = async () => {
    setLoading(true)
    await revokeAccountDeletion()
    window.location.reload()
  }

  const handleKillAll = async () => {
    setLoading(true)
    const res = await terminateAllOtherSessions()
    if (res.success) {
      setSessions(s => s.filter(x => x.isCurrent))
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-background transition-colors duration-500 overflow-hidden">
      {/* ── Left Navigation Pane ── */}
      <div className="w-full md:w-64 border-r border-surface-border bg-surface p-5 flex flex-col z-10 shrink-0 overflow-y-auto shadow-sm">
        <div className="mb-8 px-2">
          <h2 className="text-xl font-black text-primary uppercase tracking-tight leading-tight">Studio</h2>
          <p className="text-[9px] text-muted font-bold uppercase tracking-[0.3em] mt-1">Governance & Controls</p>
        </div>

        <nav className="space-y-3 flex-1">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group",
                  isActive 
                    ? "bg-surface-hover text-primary shadow-premium ring-1 ring-primary/5" 
                    : "text-muted hover:text-primary hover:bg-surface-hover/50"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center transition-all shadow-sm border",
                  isActive ? "bg-primary text-background border-primary" : "bg-surface-hover text-muted border-surface-border"
                )}>
                  <tab.icon className="w-4.5 h-4.5" />
                </div>
                <div className="text-left flex-1">
                  <span className="block text-[13px] font-black tracking-tight">{tab.label}</span>
                  {tab.id === 'profile' && isActive && (
                    <span className="block text-[9px] text-muted font-medium mt-0.5 truncate max-w-[140px]">{username || 'Unknown'} • {user.email}</span>
                  )}
                </div>
                {isActive && (
                  <motion.div layoutId="active-settings-tab" className="absolute left-0 w-1.5 h-8 bg-primary rounded-r-full" />
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* ── Right Active Panel ── */}
      <div className="flex-1 bg-background relative overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto custom-scrollbar"
          >
            <div className="max-w-3xl mx-auto">
              {/* === PROFILE & IDENTITY === */}
              {activeTab === 'profile' && (
                <div className="space-y-12">
                  <div className="mb-8">
                    <h1 className="text-3xl font-black text-primary tracking-tighter uppercase">Profile & Identity</h1>
                    <p className="text-[13px] text-muted mt-2 font-medium max-w-lg">Establish your unique identifier and communication channels within the operational framework.</p>
                  </div>

                  <div className="p-8 rounded-3xl border border-surface-border bg-surface space-y-8 shadow-premium">
                    {/* Username */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[9px] font-black text-muted uppercase tracking-[0.25em]">Primary Designation</label>
                        <span className="text-[9px] font-black text-muted bg-surface-hover px-2 py-0.5 rounded-md border border-surface-border">{username.length}/10</span>
                      </div>
                      <div className="relative group">
                        <input 
                          type="text" 
                          value={username}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 10).toUpperCase()
                            setUsername(val)
                          }}
                          placeholder="DESIGNATION"
                          className="w-full h-12 bg-surface-hover/50 border border-surface-border rounded-xl px-6 text-xl font-black text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-mono tracking-[0.2em] shadow-inner"
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                          <User className="w-5 h-5" />
                        </div>
                      </div>
                      <p className="text-[9px] text-muted font-bold ml-1 uppercase tracking-widest opacity-60">Alphabetical Characters Only (A-Z)</p>
                      
                      {username !== initialUsername && (
                        <motion.button 
                          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          onClick={handleSaveUsername}
                          disabled={loading}
                          className="h-10 px-8 bg-primary text-background text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-elevated flex items-center justify-center gap-3"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authorize Identity Change'}
                        </motion.button>
                      )}
                    </div>

                    <div className="h-px bg-surface-border" />

                    {/* Email */}
                    <div className={cn("space-y-4 transition-all", emailOtpMode && "opacity-30 blur-[2px] pointer-events-none")}>
                      <label className="text-[9px] font-black text-muted uppercase tracking-[0.25em] ml-1">Communication Channel (Email)</label>
                      <div className="relative group">
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-12 bg-surface-hover/50 border border-surface-border rounded-xl px-6 text-[14px] font-bold text-primary focus:outline-none focus:ring-4 focus:ring-accent-blue/5 transition-all shadow-inner"
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent-blue transition-colors">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      </div>
                      
                      {email !== user.email && !emailOtpMode && (
                        <motion.button 
                          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          onClick={() => setEmailOtpMode(true)}
                          className="h-10 px-8 bg-accent-blue/10 text-accent-blue border border-accent-blue/20 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-accent-blue hover:text-white transition-all shadow-sm"
                        >
                          Initialize Channel Migration
                        </motion.button>
                      )}
                    </div>

                    {/* OTP Focus Mode */}
                    <AnimatePresence>
                      {emailOtpMode && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                          className="p-8 rounded-3xl border border-accent-blue/30 bg-accent-blue/5 space-y-6 shadow-premium relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 w-full h-1 bg-accent-blue" />
                          <div className="flex items-center gap-3 text-accent-blue">
                            <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center border border-accent-blue/20">
                              <Lock className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-[14px] font-black tracking-tight uppercase">High-Entropy Lock Active</h3>
                              <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">Verify Ownership to Continue</p>
                            </div>
                          </div>
                          <p className="text-[12px] text-muted font-medium leading-relaxed">To validate this migration, provide the 6-digit verification code dispatched to <strong className="text-primary font-black underline decoration-accent-blue underline-offset-4">{email}</strong>.</p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input type="text" placeholder="000000" className="flex-1 h-12 bg-surface border border-accent-blue/30 rounded-xl text-center text-xl font-black text-accent-blue tracking-[0.4em] focus:outline-none focus:ring-4 focus:ring-accent-blue/10 shadow-inner" maxLength={6} />
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => setEmailOtpMode(false)} className="px-6 h-12 bg-accent-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent-blue/20 hover:opacity-90 transition-all">Verify Auth</button>
                              <button onClick={() => {setEmail(user.email); setEmailOtpMode(false)}} className="px-4 h-12 rounded-xl text-[10px] font-black text-muted hover:text-primary transition-colors border border-transparent hover:border-surface-border">Abort</button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* === SECURITY & SESSIONS === */}
              {activeTab === 'security' && (
                <div className="space-y-12">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                      <h1 className="text-3xl font-black text-primary tracking-tighter uppercase leading-tight">Security Protocol</h1>
                      <p className="text-[13px] text-muted mt-2 font-medium max-w-lg">Monitor active authorization tokens and establish multi-factor authentication frequency.</p>
                    </div>
                    {/* Security Health Badge */}
                    <div className="px-4 py-3 rounded-2xl bg-accent-emerald/10 border border-accent-emerald/20 flex items-center gap-3 shadow-premium self-start md:self-auto">
                      <div className="w-9 h-9 rounded-lg bg-accent-emerald/10 flex items-center justify-center border border-accent-emerald/20 shadow-sm animate-pulse">
                        <ShieldCheck className="w-5 h-5 text-accent-emerald" />
                      </div>
                      <div>
                        <span className="block text-[10px] font-black text-accent-emerald uppercase tracking-[0.2em]">Account Secure</span>
                        <span className="block text-[8px] text-accent-emerald/70 font-bold uppercase tracking-[0.1em] mt-0.5">Hardware Protected</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Sessions Bento Tiles */}
                  <div>
                    <div className="flex items-center justify-between mb-6 px-1">
                      <h3 className="text-[9px] font-black text-muted uppercase tracking-[0.3em]">Active Credentials</h3>
                      {sessions.length > 1 && (
                        <button onClick={handleKillAll} className="text-[9px] font-black text-accent-red hover:underline uppercase tracking-widest transition-all flex items-center gap-2">
                          <X className="w-3 h-3" /> Terminate All Others
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <AnimatePresence>
                        {sessions.map((session, i) => {
                          const isUnusual = !session.isCurrent && i === 1
                          return (
                            <motion.div 
                              key={session.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ delay: i * 0.1 }}
                              className={cn(
                                "p-6 rounded-3xl border relative overflow-hidden group transition-all shadow-premium hover:shadow-elevated hover:-translate-y-0.5",
                                session.isCurrent ? "bg-surface border-primary/20 ring-4 ring-primary/5" : "bg-surface border-surface-border",
                                isUnusual && "bg-accent-amber/5 border-accent-amber/20"
                              )}
                            >
                              {!session.isCurrent && (
                                <button onClick={() => handleKillSession(session.id)} className="absolute top-4 right-4 w-9 h-9 rounded-lg bg-surface-hover border border-surface-border flex items-center justify-center text-muted hover:text-white hover:bg-accent-red hover:border-accent-red transition-all opacity-0 group-hover:opacity-100 shadow-sm active:scale-90">
                                  <X className="w-4 h-4" />
                                </button>
                              )}

                              <div className="flex gap-4 items-start">
                                <div className={cn(
                                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border transition-all group-hover:scale-105", 
                                  isUnusual ? "bg-accent-amber/10 text-accent-amber border-accent-amber/20" : "bg-surface-hover text-primary border-surface-border"
                                )}>
                                  {session.device.includes('iPhone') || session.device.includes('Android') ? <Smartphone className="w-6 h-6" /> : <Laptop className="w-6 h-6" />}
                                </div>
                                <div className="space-y-1.5 flex-1 pt-0.5">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-[14px] font-black text-primary tracking-tight">{session.device}</h4>
                                    {session.isCurrent && <span className="px-2 py-0.5 rounded-md bg-primary/10 text-[8px] font-black uppercase tracking-[0.2em] text-primary border border-primary/20 shadow-sm">Current</span>}
                                  </div>
                                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest">{session.browser} • {session.os}</p>
                                  <div className="flex items-center gap-2 mt-3 text-[9px] text-muted font-mono bg-surface-hover/50 px-2 py-1.5 rounded-lg border border-surface-border/50 w-max">
                                    <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-accent-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> {session.location}</span> • 
                                    <div className="group/tooltip relative cursor-help flex items-center">
                                      <Info className="w-3 h-3 hover:text-primary transition-colors" />
                                      <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-max p-4 bg-surface border border-surface-border rounded-2xl text-primary text-[11px] opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none shadow-2xl z-20 font-sans border-t-4 border-t-primary">
                                        <div className="space-y-1">
                                          <p className="font-black uppercase tracking-widest text-[9px] text-muted mb-2 border-b border-surface-border pb-1">Technical Audit</p>
                                          <p><span className="text-muted">Network IP:</span> {session.ip}</p>
                                          <p><span className="text-muted">Last Active:</span> {new Date(session.last_active).toLocaleString('en-GB')}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="h-px bg-surface-border" />

                  {/* Frequency Control */}
                  <div className="p-8 rounded-3xl border border-surface-border bg-surface shadow-premium">
                    <h3 className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-6 ml-1">Authorization Persistence</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-hover/50 p-1.5 rounded-2xl border border-surface-border shadow-inner">
                      <button 
                        onClick={() => setOtpFrequency('strict')} 
                        className={cn(
                          "relative z-10 px-6 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2.5 shadow-sm", 
                          otpFrequency === 'strict' ? "bg-surface text-primary border border-surface-border shadow-elevated" : "text-muted hover:text-primary hover:bg-surface"
                        )}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Strict Protocol
                      </button>
                      <button 
                        onClick={() => setOtpFrequency('comfort')} 
                        className={cn(
                          "relative z-10 px-6 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2.5 shadow-sm", 
                          otpFrequency === 'comfort' ? "bg-surface text-primary border border-surface-border shadow-elevated" : "text-muted hover:text-primary hover:bg-surface"
                        )}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Trust Environment
                      </button>
                    </div>
                    <p className="text-[10px] text-muted font-medium mt-4 text-center opacity-60">Comfort mode allows session persistence for 30 days on this hardware.</p>
                  </div>
                </div>
              )}

              {/* === APPEARANCE === */}
              {activeTab === 'appearance' && (
                <div className="space-y-12">
                  <div className="mb-8">
                    <h1 className="text-3xl font-black text-primary tracking-tighter uppercase leading-tight">Theme</h1>
                    <p className="text-[13px] text-muted mt-2 font-medium max-w-lg">Establish your preferred sensory environment. Optimized for both low-light operations and high-visibility monitoring.</p>
                  </div>
                  
                  <div className="flex w-full sm:max-w-md bg-surface-hover/50 p-1 rounded-xl border border-surface-border shadow-inner">
                    <button 
                      type="button" 
                      onClick={() => theme !== 'dark' && toggleTheme()}
                      className={cn(
                        "flex-1 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        theme === 'dark' ? "bg-primary text-background shadow-md" : "text-muted hover:text-primary hover:bg-surface"
                      )}
                    >
                      Dark
                    </button>
                    <button 
                      type="button" 
                      onClick={() => theme !== 'light' && toggleTheme()}
                      className={cn(
                        "flex-1 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        theme === 'light' ? "bg-primary text-background shadow-md" : "text-muted hover:text-primary hover:bg-surface"
                      )}
                    >
                      Light
                    </button>
                  </div>
                </div>
              )}

              {/* === ACCOUNT DATA === */}
              {activeTab === 'account' && (
                <div className="space-y-12">
                  <div className="mb-8">
                    <h1 className="text-3xl font-black text-primary tracking-tighter uppercase leading-tight">Lifecycle Control</h1>
                    <p className="text-[13px] text-muted mt-2 font-medium max-w-lg">Manage data persistence and structural termination protocols.</p>
                  </div>

                  {deletionDate ? (
                    <div className="p-8 rounded-3xl border border-accent-amber/30 bg-accent-amber/5 space-y-6 shadow-premium relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-accent-amber" />
                      <div className="flex gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-accent-amber/10 flex items-center justify-center shrink-0 border border-accent-amber/20 shadow-sm animate-bounce">
                          <AlertTriangle className="w-8 h-8 text-accent-amber" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-accent-amber uppercase tracking-tight">Termination Protocol Initialized</h3>
                          <p className="text-[13px] text-muted leading-relaxed mt-3 max-w-md font-medium">
                            Your identity is currently in a 10-day terminal grace period. Permanent purging of all transaction history, categories, and credentials will occur on <strong className="text-primary font-black underline underline-offset-4 decoration-accent-amber">{new Date(deletionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>.
                          </p>
                        </div>
                      </div>
                      <button onClick={handleRevokeDeletion} disabled={loading} className="h-10 px-8 bg-accent-amber text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:opacity-90 transition-all shadow-lg shadow-accent-amber/20 active:scale-95">
                        Abort Termination
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 rounded-3xl border border-accent-red/20 bg-accent-red/5 shadow-premium relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-red/5 blur-[100px] rounded-full group-hover:bg-accent-red/10 transition-all pointer-events-none" />
                      
                      <h3 className="text-sm font-black text-accent-red uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                        <Trash2 className="w-5 h-5" /> Critical Data Purge
                      </h3>
                      <p className="text-[13px] text-muted mb-10 font-medium max-w-xl leading-relaxed relative z-10">
                        Initiating account deletion triggers a final 10-day stabilization period. All data blocks, encrypted keys, and financial associations will be permanently eradicated upon completion. This event cannot be reversed once the grace period expires.
                      </p>
                      
                      <div className="space-y-4 max-w-sm relative z-10">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-muted uppercase tracking-[0.25em] ml-1">Verification Required: Type "{username}"</label>
                          <input 
                            type="text" 
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            placeholder="AUTHORIZE PURGE"
                            className="w-full h-12 bg-surface border border-accent-red/20 rounded-xl px-5 text-sm font-black text-primary focus:outline-none focus:ring-4 focus:ring-accent-red/10 transition-all font-mono tracking-[0.2em] shadow-inner text-center placeholder:text-muted/30"
                          />
                        </div>
                        <button 
                          onClick={handleAccountDeletion}
                          disabled={deleteConfirm !== username || loading}
                          className="w-full h-12 bg-accent-red text-white font-black uppercase tracking-[0.15em] rounded-xl hover:opacity-90 transition-all disabled:opacity-20 flex items-center justify-center gap-2.5 shadow-lg shadow-accent-red/20 active:scale-95 text-[10px]"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Deletion Protocol'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Global Audit Footer */}
        <div className="mt-auto border-t border-surface-border p-4 flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity">
          <p className="text-[9px] font-mono text-muted uppercase tracking-widest flex items-center gap-2">
            <Key className="w-3 h-3" /> Last Auth: {new Date().toLocaleString('en-GB')}
          </p>
          <a href="#" className="text-[9px] font-black text-muted hover:text-primary uppercase tracking-widest underline decoration-surface-border underline-offset-4">Security Audit Log</a>
        </div>
      </div>
    </div>
  )
}
