'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, KeyRound, ArrowRight, Loader2, CheckCircle2, User, Lock } from 'lucide-react'
import { sendOtp, verifyOtp, finishOnboarding, signIn } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [step, setStep] = useState<'email' | 'otp' | 'onboarding'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await signIn(email, password)
    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      setLoading(false)
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await sendOtp(email)
    if (res.error) {
      setError(res.error)
    } else {
      setStep('otp')
      setResendCountdown(60)
      const timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    setLoading(false)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await verifyOtp(email, token)
    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        setError(userError.message)
        setLoading(false)
        return
      }

      if (user?.user_metadata?.onboarded) {
        setLoading(false)
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        setStep('onboarding')
        setLoading(false)
      }
    }
  }

  const handleFinishOnboarding = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await finishOnboarding(name, password)
    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      setLoading(false)
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    }
  }

  const handleResend = async () => {
    if (resendCountdown > 0) return
    setLoading(true)
    const res = await sendOtp(email)
    if (res.error) {
      setError(res.error)
    } else {
      setResendCountdown(60)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/[0.03] border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative z-10"
      >
        <AnimatePresence mode="wait">
          {mode === 'signin' ? (
            <motion.div
              key="signin"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                  <Lock className="w-8 h-8 text-emerald-500" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
                <p className="text-zinc-400 mt-2">Sign in to your account</p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email || !password || success}
                  className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : success ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <>Sign In <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </form>

              <div className="text-center pt-4">
                <button 
                  onClick={() => setMode('signup')}
                  className="text-zinc-500 text-sm hover:text-white transition-colors"
                >
                  Don't have an account? <span className="text-emerald-500 font-bold">Sign Up</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <AnimatePresence mode="wait">
                {step === 'email' && (
                  <motion.div
                    key="email-step"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                        <User className="w-8 h-8 text-blue-500" />
                      </div>
                      <h1 className="text-3xl font-bold tracking-tight">Join Us</h1>
                      <p className="text-zinc-400 mt-2">Create your finance tracker account</p>
                    </div>

                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email Address"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Get Verification Code <ArrowRight className="w-5 h-5" /></>}
                      </button>
                    </form>

                    <div className="text-center pt-4">
                      <button 
                        onClick={() => setMode('signin')}
                        className="text-zinc-500 text-sm hover:text-white transition-colors"
                      >
                        Already have an account? <span className="text-blue-500 font-bold">Sign In</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 'otp' && (
                  <motion.div
                    key="otp-step"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                        <KeyRound className="w-8 h-8 text-blue-500" />
                      </div>
                      <h1 className="text-3xl font-bold tracking-tight">Verify</h1>
                      <p className="text-zinc-400 mt-2">Code sent to {email}</p>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="relative">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                          type="text"
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          placeholder="000000"
                          maxLength={6}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-center tracking-[0.5em] font-mono text-xl"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading || token.length < 6 || success}
                        className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : success ? <CheckCircle2 className="w-5 h-5" /> : 'Verify Code'}
                      </button>
                    </form>
                    
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading || resendCountdown > 0}
                      className="w-full text-zinc-400 text-sm hover:text-white transition-colors disabled:opacity-50"
                    >
                      {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
                    </button>
                  </motion.div>
                )}

                {step === 'onboarding' && (
                  <motion.div
                    key="onboarding-step"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                        <User className="w-8 h-8 text-emerald-500" />
                      </div>
                      <h1 className="text-3xl font-bold tracking-tight">Finish Up</h1>
                      <p className="text-zinc-400 mt-2">Almost there! Set your details.</p>
                    </div>

                    <form onSubmit={handleFinishOnboarding} className="space-y-4">
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Full Name"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create Password"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                          required
                          minLength={8}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading || !name || password.length < 8 || success}
                        className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : success ? <CheckCircle2 className="w-5 h-5" /> : 'Complete Setup'}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
          >
            <p className="text-red-400 text-sm text-center font-medium">{error}</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
