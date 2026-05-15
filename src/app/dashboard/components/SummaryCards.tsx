'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SummaryCardProps {
  title: string
  value: string
  trend: number
  type?: 'net' | 'income' | 'expense'
  className?: string
}

export function SummaryCard({ title, value, trend, type = 'income', className }: SummaryCardProps) {
  const isNet = type === 'net'
  const isIncome = type === 'income'

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "relative overflow-hidden p-6 flex flex-col items-center justify-center min-h-[140px] shadow-premium hover:shadow-elevated rounded-2xl transition-all duration-500 border border-surface-border bg-gradient-to-br from-surface to-surface/40 group",
        className
      )}
    >
      {/* Decorative Glows - Enhanced */}
      <div className={cn(
        "absolute -top-16 -right-16 w-40 h-40 blur-[60px] rounded-full transition-opacity opacity-30 group-hover:opacity-50",
        isIncome ? "bg-accent-emerald" : isNet ? "bg-accent-blue" : "bg-accent-red"
      )} />
      
      <div className={cn(
        "absolute -bottom-16 -left-16 w-32 h-32 blur-[50px] rounded-full transition-opacity opacity-10 group-hover:opacity-20",
        isIncome ? "bg-accent-emerald" : isNet ? "bg-accent-blue" : "bg-accent-red"
      )} />

      <div className="relative z-10 flex flex-col items-center text-center">
        <span className="text-[10px] font-black text-muted uppercase tracking-[0.4em] mb-3 opacity-80 group-hover:opacity-100 transition-opacity">
          {title}
        </span>
        <h2 className="font-black tracking-tighter leading-none text-4xl text-primary">
          ₹{value}
        </h2>
      </div>
    </motion.div>
  )
}
