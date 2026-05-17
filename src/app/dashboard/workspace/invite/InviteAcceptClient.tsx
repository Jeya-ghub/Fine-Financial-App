'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Shield, Loader2, Send, X } from 'lucide-react'
import { sendInviteOtp, acceptInviteWithOtp } from '@/app/actions/workspaces'
import { useRouter } from 'next/navigation'

export default function InviteAcceptClient({ token, userEmail }: { token: string, userEmail: string }) {
  const router = useRouter()
  const [step, setStep] = useState<'initial' | 'otp' | 'success'>('initial')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bypassOtp, setBypassOtp] = useState('')

  const handleStartAccept = async () => {
    setLoading(true)
    setError('')
    const res = await sendInviteOtp(token)
    setLoading(false)
    if (res.success) {
      if (res.emailSent === false) {
        setBypassOtp(res.bypassOtp || '')
      }
      setStep('otp')
    } else {
      setError(res.error || 'Failed to initiate acceptance.')
    }
  }

  const handleVerifyOtp = async () => {
    setLoading(true)
    setError('')
    const res = await acceptInviteWithOtp(token, otp)
    setLoading(false)
    if (res.success) {
      setStep('success')
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } else {
      setError(res.error || 'Invalid OTP.')
    }
  }

  return (
    <div className="w-full max-w-md bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
      
      <AnimatePresence mode="wait">
        {step === 'initial' && (
          <motion.div 
            key="initial"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="text-center relative z-10"
          >
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
              <Shield className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mb-2 uppercase tracking-widest">Workspace Invite</h1>
            <p className="text-xs text-zinc-500 mb-8 leading-relaxed">
              You've been invited to join a professional workspace. For high-security acceptance, we will send an OTP to your email.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-widest">
                {error}
              </div>
            )}

            <button 
              onClick={handleStartAccept}
              disabled={loading}
              className="w-full h-[60px] bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Accept Invitation</>}
            </button>
          </motion.div>
        )}

        {step === 'otp' && (
          <motion.div 
            key="otp"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="text-center relative z-10"
          >
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
              <Send className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mb-2 uppercase tracking-widest">Verify Email</h1>
            <p className="text-xs text-zinc-500 mb-8 leading-relaxed">
              Enter the 6-digit security code sent to <strong className="text-white">{userEmail}</strong> to confirm your identity.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-widest">
                {error}
              </div>
            )}

            {bypassOtp && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[10px] font-black text-emerald-400 uppercase tracking-widest text-left leading-relaxed">
                🔒 Secure Local Mode: Automated email service is offline. To proceed securely, use this authentication code:
                <div className="mt-2 text-center bg-white/10 px-3 py-2 rounded-xl border border-white/10 select-all font-mono text-lg text-white font-black tracking-[0.2em]">
                  {bypassOtp}
                </div>
              </div>
            )}

            <div className="space-y-6">
              <input 
                type="text" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                placeholder="000000" 
                maxLength={6}
                className="w-full h-[70px] bg-white/[0.02] border border-white/5 rounded-2xl px-6 text-3xl font-black text-center text-white focus:outline-none focus:border-blue-500/50 transition-all tracking-[0.5em]" 
              />
              
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setStep('initial')} className="h-[50px] rounded-xl text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="h-[50px] bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join Workspace'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center relative z-10"
          >
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter mb-4 uppercase">Success!</h1>
            <p className="text-sm text-zinc-400 font-medium">
              You are now a member of the workspace. Redirecting you to the command centre...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
