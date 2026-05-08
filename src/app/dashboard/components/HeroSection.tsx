'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

export function HeroSection({ name, savingAmount, trend }: { name: string; savingAmount: string; trend: number }) {
  const hour = new Date().getHours()
  let greeting = 'Good Evening'
  if (hour >= 5 && hour < 12) greeting = 'Good Morning'
  else if (hour >= 12 && hour < 17) greeting = 'Good Afternoon'

  return (
    <div className="col-span-12 mb-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-black text-primary tracking-tight mb-1">
          {greeting}, {name} 👋
        </h1>
        <div className="flex items-center gap-2">
          <p className="text-secondary text-[11px] font-bold uppercase tracking-wider">
            You saved <span className="text-primary">₹{savingAmount}</span> this month
          </p>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-emerald/10 text-accent-emerald text-[9px] font-black uppercase tracking-[0.15em]">
            <ArrowUpRight className="w-2.5 h-2.5" />
            {trend}% vs last month
          </div>
        </div>
      </motion.div>
    </div>
  )
}
