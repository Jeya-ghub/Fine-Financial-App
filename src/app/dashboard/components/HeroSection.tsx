'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

export function HeroSection({ name, savingAmount, trend }: { name: string; savingAmount: string; trend: number }) {
  const [mounted, setMounted] = React.useState(false)
  
  const [now, setNow] = React.useState(new Date())
  
  React.useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hour = now.getHours()
  let greeting = 'Good Evening'
  if (hour >= 5 && hour < 12) greeting = 'Good Morning'
  else if (hour >= 12 && hour < 17) greeting = 'Good Afternoon'

  const dayStr = now.toLocaleString('en-US', { weekday: 'long' })
  const dateStr = `${now.getDate().toString().padStart(2, '0')}-${now.toLocaleString('en-US', { month: 'long' })}-${now.getFullYear()}`
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })

  return (
    <div className="col-span-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-6 md:px-8 md:py-6 rounded-3xl bg-surface border border-surface-border shadow-premium relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-emerald/5 blur-[100px] rounded-full group-hover:bg-accent-emerald/10 transition-all pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black text-muted uppercase tracking-[0.4em]">Live Intelligence Active</span>
          </div>
          <h1 className="text-3xl font-black text-primary tracking-tighter mb-2 leading-none">
            {mounted ? greeting : 'Welcome'}, <span className="text-primary">{name}</span>
          </h1>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1 relative z-10 text-right">
          <div className="text-xl font-black text-primary tracking-tight leading-none">
            {mounted ? dayStr : '-------'}
          </div>
          <div className="text-xs font-bold text-primary tracking-widest mt-0.5">
            {mounted ? dateStr : '--/--/----'}
          </div>
          <div className="text-[11px] font-bold text-muted uppercase tracking-widest">
            {mounted ? timeStr : '--:--:-- --'}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
