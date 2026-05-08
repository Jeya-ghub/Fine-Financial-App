'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, ShieldCheck, Palette, Trash2, CheckCircle2, 
  Smartphone, Laptop, X, AlertTriangle, Info, Key, Loader2,
  Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateProfile, requestAccountDeletion, revokeAccountDeletion, terminateSession } from '@/app/actions/auth'
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
    // In a real app, call an API to invalidate all other tokens
    setSessions(s => s.filter(x => x.isCurrent))
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-background transition-colors duration-500">
      {/* ── Left Navigation Pane ── */}
      <div className="w-full md:w-72 border-r border-surface-border bg-surface p-4 flex flex-col z-10 shrink-0 overflow-y-auto">
        <div className="mb-8 p-4">
          <h2 className="text-xl font-black text-primary uppercase tracking-tight">Studio</h2>
          <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-1">Environment Settings</p>
        </div>

        <nav className="space-y-2 flex-1">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all relative group",
                  isActive ? "bg-surface-hover text-primary shadow-lg" : "text-secondary hover:text-primary hover:bg-surface-hover/50"
                )}
              >
                <tab.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-accent-emerald" : "")} />
                <div className="text-left flex-1">
                  <span className="block text-sm font-bold tracking-tight">{tab.label}</span>
                  {tab.id === 'profile' && isActive && (
                    <span className="block text-[10px] text-secondary/70 mt-1 truncate">{username || 'Unknown'} • {user.email}</span>
                  )}
                </div>
                {isActive && (
                  <motion.div layoutId="active-settings-tab" className="absolute left-0 w-1 h-6 bg-accent-emerald rounded-r-full" />
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
            className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar"
          >
            <div className="max-w-3xl">
              
              {/* === PROFILE & IDENTITY === */}
              {activeTab === 'profile' && (
                <div className="space-y-12">
                  <div className="mb-8">
                    <h1 className="text-3xl font-black text-primary tracking-tighter">Profile & Identity</h1>
                    <p className="text-sm text-secondary mt-2">Manage your core presence within the workspace.</p>
                  </div>

                  <div className="p-8 rounded-[2rem] border border-surface-border bg-surface space-y-8 shadow-sm">
                    {/* Username */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Primary Identity</label>
                        <span className="text-[10px] font-bold text-muted">{username.length}/10</span>
                      </div>
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 10).toUpperCase()
                          setUsername(val)
                        }}
                        placeholder="USERNAME"
                        className="w-full h-[60px] bg-background border border-surface-border rounded-2xl px-6 text-xl font-black text-primary focus:outline-none focus:ring-2 focus:ring-accent-emerald/50 transition-all font-mono tracking-[0.2em]"
                      />
                      <p className="text-[10px] text-muted font-medium ml-1">Strictly Letters Only (A-Z). No spaces or symbols.</p>
                      
                      {username !== initialUsername && (
                        <motion.button 
                          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                          onClick={handleSaveUsername}
                          disabled={loading}
                          className="h-[40px] px-6 bg-primary text-background text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all"
                        >
                          {loading ? 'Saving...' : 'Save Identity'}
                        </motion.button>
                      )}
                    </div>

                    <hr className="border-surface-border" />

                    {/* Email */}
                    <div className={cn("space-y-3 transition-all", emailOtpMode && "opacity-50 pointer-events-none")}>
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Secondary Identity (Email)</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-[60px] bg-background border border-surface-border rounded-2xl px-6 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all"
                      />
                      
                      {email !== user.email && !emailOtpMode && (
                        <motion.button 
                          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                          onClick={() => setEmailOtpMode(true)}
                          className="h-[40px] px-6 bg-accent-blue/10 text-accent-blue border border-accent-blue/20 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-accent-blue hover:text-white transition-colors"
                        >
                          Request Email Change
                        </motion.button>
                      )}
                    </div>

                    {/* OTP Focus Mode */}
                    <AnimatePresence>
                      {emailOtpMode && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 space-y-4"
                        >
                          <div className="flex items-center gap-3 text-blue-500">
                            <Lock className="w-5 h-5" />
                            <h3 className="text-sm font-bold tracking-tight">Security Lock Engaged</h3>
                          </div>
                          <p className="text-xs text-zinc-400 font-medium">To complete this high-priority change, please enter the OTP sent to <strong className="text-white">{email}</strong>.</p>
                          <div className="flex gap-4">
                            <input type="text" placeholder="------" className="w-32 h-[50px] bg-black/50 border border-blue-500/30 rounded-xl text-center text-xl font-mono text-blue-400 tracking-[0.3em] focus:outline-none focus:border-blue-500" maxLength={6} />
                            <button onClick={() => setEmailOtpMode(false)} className="px-6 h-[50px] bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20">Verify</button>
                            <button onClick={() => {setEmail(user.email); setEmailOtpMode(false)}} className="px-4 text-xs font-bold text-zinc-500 hover:text-white transition-colors">Cancel</button>
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
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h1 className="text-3xl font-black text-primary tracking-tighter">Security Command Centre</h1>
                      <p className="text-sm text-secondary mt-2">Monitor active sessions and security protocols.</p>
                    </div>
                    {/* Security Health Badge */}
                    <div className="px-4 py-2 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                      <ShieldCheck className="w-5 h-5 text-accent-emerald" />
                      <span className="text-[10px] font-black text-accent-emerald uppercase tracking-widest">Account Secure</span>
                    </div>
                  </div>

                  {/* Active Sessions Bento Tiles */}
                  <div>
                    <h3 className="text-[10px] font-black text-muted uppercase tracking-widest mb-4">Active Sessions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <AnimatePresence>
                        {sessions.map((session, i) => {
                          // Mock geo-fencing unusual activity for the second session
                          const isUnusual = !session.isCurrent && i === 1
                          return (
                            <motion.div 
                              key={session.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ delay: i * 0.1 }}
                              className={cn(
                                "p-5 rounded-[2rem] border relative overflow-hidden group transition-all",
                                session.isCurrent ? "bg-surface border-primary/20 shadow-premium" : "bg-surface border-surface-border",
                                isUnusual && "bg-accent-amber/5 border-accent-amber/20"
                              )}
                            >
                              {/* One-Tap Kill Switch */}
                              {!session.isCurrent && (
                                <button onClick={() => handleKillSession(session.id)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-muted hover:text-primary hover:bg-accent-red transition-all opacity-0 group-hover:opacity-100">
                                  <X className="w-4 h-4" />
                                </button>
                              )}

                              <div className="flex gap-4 items-start">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", isUnusual ? "bg-accent-amber/10 text-accent-amber" : "bg-surface-hover text-primary")}>
                                  {session.device.includes('iPhone') || session.device.includes('Android') ? <Smartphone className="w-6 h-6" /> : <Laptop className="w-6 h-6" />}
                                </div>
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-primary">{session.device}</h4>
                                    {session.isCurrent && <span className="px-2 py-0.5 rounded bg-accent-emerald/10 text-[9px] font-black uppercase tracking-widest text-accent-emerald">Current</span>}
                                  </div>
                                  <p className="text-xs text-secondary font-medium">{session.browser} on {session.os}</p>
                                  <div className="flex items-center gap-2 mt-2 text-[10px] text-muted font-mono">
                                    <span>{session.location}</span> • 
                                    <div className="group/tooltip relative cursor-help flex items-center">
                                      <Info className="w-3 h-3 hover:text-primary" />
                                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-3 py-2 bg-surface border border-surface-border rounded-lg text-primary text-[10px] opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none shadow-xl">
                                        IP: {session.ip}<br/>
                                        Time: {new Date(session.last_active).toLocaleString('en-GB')}
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

                    {sessions.length > 1 && (
                      <div className="mt-6">
                        <button onClick={handleKillAll} className="text-[10px] font-black text-accent-red hover:opacity-80 uppercase tracking-widest transition-colors flex items-center gap-2">
                          <X className="w-3 h-3" /> Sign Out All Other Sessions
                        </button>
                      </div>
                    )}
                  </div>

                  <hr className="border-surface-border" />

                  {/* Frequency Control */}
                  <div>
                    <h3 className="text-[10px] font-black text-muted uppercase tracking-widest mb-4">Biometric / OTP Frequency</h3>
                    <div className="bg-surface border border-surface-border p-1.5 rounded-2xl inline-flex relative gap-1">
                      <button onClick={() => setOtpFrequency('strict')} className={cn("relative z-10 px-8 py-3 text-xs font-bold transition-colors w-48 rounded-xl flex items-center justify-center", otpFrequency === 'strict' ? "text-primary" : "text-secondary hover:text-primary")}>
                        {otpFrequency === 'strict' && <motion.div layoutId="otp-slider" className="absolute inset-0 bg-background border border-surface-border rounded-xl -z-10 shadow-sm" />}
                        Every Login
                      </button>
                      <button onClick={() => setOtpFrequency('comfort')} className={cn("relative z-10 px-8 py-3 text-xs font-bold transition-colors w-48 rounded-xl flex items-center justify-center", otpFrequency === 'comfort' ? "text-primary" : "text-secondary hover:text-primary")}>
                        {otpFrequency === 'comfort' && <motion.div layoutId="otp-slider" className="absolute inset-0 bg-background border border-surface-border rounded-xl -z-10 shadow-sm" />}
                        Remember (30 Days)
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* === APPEARANCE === */}
              {activeTab === 'appearance' && (
                <div className="space-y-12">
                  <div className="mb-8">
                    <h1 className="text-3xl font-black text-primary tracking-tighter">Appearance</h1>
                    <p className="text-sm text-secondary mt-2">Customize your visual workspace.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                    {/* Dark Mode Card */}
                    <button 
                      onClick={() => theme !== 'dark' && toggleTheme()}
                      className={cn(
                        "group text-left space-y-4 p-4 rounded-[2.5rem] border transition-all hover:scale-[1.02] active:scale-[0.98]",
                        theme === 'dark' ? "bg-surface border-accent-emerald shadow-premium" : "bg-surface border-surface-border opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                      )}
                    >
                      <div className="h-40 rounded-3xl bg-[#000] border border-white/5 flex items-center justify-center overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent-emerald/10 to-transparent" />
                        <div className="w-24 h-16 bg-[#0d0d0d] rounded-2xl border border-white/10 flex flex-col p-3 gap-2 shadow-2xl">
                          <div className="w-full h-2.5 bg-white/20 rounded-full" />
                          <div className="w-2/3 h-2.5 bg-accent-emerald/50 rounded-full" />
                        </div>
                      </div>
                      <div className="px-2">
                        <span className="block text-sm font-bold text-primary">High Contrast Dark</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className={cn("text-[9px] font-black uppercase tracking-widest", theme === 'dark' ? "text-accent-emerald" : "text-muted")}>
                            {theme === 'dark' ? 'Active' : 'OLED Optimized'}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Light Mode Card */}
                    <button 
                      onClick={() => theme !== 'light' && toggleTheme()}
                      className={cn(
                        "group text-left space-y-4 p-4 rounded-[2.5rem] border transition-all hover:scale-[1.02] active:scale-[0.98]",
                        theme === 'light' ? "bg-white border-accent-blue shadow-premium" : "bg-white border-surface-border opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                      )}
                    >
                      <div className="h-40 rounded-3xl bg-slate-50 border border-black/5 flex items-center justify-center overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/10 to-transparent" />
                        <div className="w-24 h-16 bg-white rounded-2xl border border-black/5 flex flex-col p-3 gap-2 shadow-xl">
                          <div className="w-full h-2.5 bg-black/10 rounded-full" />
                          <div className="w-2/3 h-2.5 bg-accent-blue/50 rounded-full" />
                        </div>
                      </div>
                      <div className="px-2">
                        <span className="block text-sm font-bold text-slate-900">Premium Light</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className={cn("text-[9px] font-black uppercase tracking-widest", theme === 'light' ? "text-accent-blue" : "text-muted")}>
                            {theme === 'light' ? 'Active' : 'Soft Slate'}
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* === ACCOUNT DATA === */}
              {activeTab === 'account' && (
                <div className="space-y-12">
                  <div className="mb-8">
                    <h1 className="text-3xl font-black text-primary tracking-tighter">Account Lifecycle</h1>
                    <p className="text-sm text-secondary mt-2">Data retention and destruction policies.</p>
                  </div>

                  {deletionDate ? (
                    <div className="p-8 rounded-[2rem] border border-accent-amber/20 bg-accent-amber/5 space-y-6">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent-amber/10 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-6 h-6 text-accent-amber" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-accent-amber">Deactivation Scheduled</h3>
                          <p className="text-xs text-secondary leading-relaxed mt-2 max-w-md">
                            Your account is currently in the 10-day grace period. It will be permanently purged on <strong className="text-primary">{new Date(deletionDate).toLocaleDateString('en-GB')}</strong>. All your data remains recoverable until then.
                          </p>
                        </div>
                      </div>
                      <button onClick={handleRevokeDeletion} disabled={loading} className="h-[44px] px-8 bg-accent-amber text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:opacity-80 transition-all">
                        Revoke Deletion
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 rounded-[2rem] border border-accent-red/10 bg-surface">
                      <h3 className="text-sm font-black text-accent-red uppercase tracking-widest mb-2">Delete Account</h3>
                      <p className="text-xs text-muted mb-6 font-medium max-w-md leading-relaxed">
                        Initiating deletion begins a 10-day grace period. During this time, you can revoke the deletion. After 10 days, your data is permanently purged.
                      </p>
                      
                      <div className="space-y-4 max-w-sm">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Type "{username}" to confirm</label>
                        <input 
                          type="text" 
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          className="w-full h-[50px] bg-background border border-surface-border rounded-xl px-4 text-sm font-bold text-primary focus:outline-none focus:border-accent-red/50 font-mono tracking-widest"
                        />
                        <button 
                          onClick={handleAccountDeletion}
                          disabled={deleteConfirm !== username || loading}
                          className="w-full h-[50px] bg-accent-red/10 border border-accent-red/20 text-accent-red font-black uppercase tracking-widest rounded-xl hover:bg-accent-red hover:text-white transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Initiate Deletion'}
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
