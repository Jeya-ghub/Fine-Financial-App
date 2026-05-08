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
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "relative overflow-hidden bento-card p-5 md:p-6 flex flex-col justify-between min-h-[160px]",
        isNet ? "bg-[#0a0a0a] border-white/10" : "bg-[#0a0a0a]",
        className
      )}
    >
      {/* Background Glow for Net Position */}
      {isNet && (
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/[0.02] to-transparent pointer-events-none" />
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
              isIncome ? "bg-emerald-500/10 text-emerald-500" : 
              isNet ? "bg-white/5 text-white" : "bg-red-500/10 text-red-500"
            )}>
              {isIncome ? <ArrowDownRight className="w-4 h-4 rotate-180" /> : 
               isNet ? <TrendingUp className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.25em]">{title}</span>
          </div>

          {isNet && (
            <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-emerald-500">
               <TrendingUp className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className={cn(
            "font-black tracking-tight leading-none",
            isNet ? "text-4xl text-white" : "text-3xl text-white"
          )}>
            ₹{value}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
              trend > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
            )}>
              {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
            </div>
            <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">vs last month</span>
          </div>
        </div>
      </div>

      {/* Sparkline Simulation (Bottom Glow) */}
      {isNet && (
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none">
          <svg className="w-full h-full opacity-30" viewBox="0 0 400 100" preserveAspectRatio="none">
            <path 
              d="M0,80 Q100,20 200,60 T400,10" 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="2" 
              className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            />
            <path 
              d="M0,80 Q100,20 200,60 T400,10 L400,100 L0,100 Z" 
              fill="url(#cardGradient)" 
            />
            <defs>
              <linearGradient id="cardGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}
    </motion.div>
  )
}
