'use client'

import { motion } from 'framer-motion'
import { Sparkles, ChevronRight, TrendingDown, Target, Zap } from 'lucide-react'
import { Insight } from '@/types/dashboard.types'
import { cn } from '@/lib/utils'

const IconMap = {
  positive: Target,
  warning: Zap,
  info: Sparkles
}

const ColorMap = {
  positive: 'bg-emerald-500/10 text-emerald-500',
  warning: 'bg-amber-500/10 text-amber-500',
  info: 'bg-blue-500/10 text-blue-500'
}

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento-card p-5 md:p-6 h-full"
    >
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Insights</h3>
      </div>

      <div className="flex flex-col gap-2.5">
        {insights.map((insight, idx) => {
          const Icon = IconMap[insight.type]
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg", ColorMap[insight.type])}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[12px] font-black text-white tracking-tight mb-0.5 leading-none">{insight.text}</h4>
                  <p className="text-[10px] font-bold text-zinc-700 tracking-tight">{insight.subtext}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-white transition-all transform group-hover:translate-x-1" />
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
