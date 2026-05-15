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
  positive: 'bg-accent-emerald/10 text-accent-emerald',
  warning: 'bg-accent-amber/10 text-accent-amber',
  info: 'bg-accent-blue/10 text-accent-blue'
}

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento-card p-6 h-full shadow-premium hover:shadow-elevated"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-xl bg-accent-blue/10 flex items-center justify-center border border-accent-blue/20">
          <Sparkles className="w-4 h-4 text-accent-blue" />
        </div>
        <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.25em]">Smart Insights</h3>
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
              className="flex items-center justify-between p-3 rounded-xl bg-surface border border-surface-border hover:bg-surface-hover hover:border-surface-border-hover transition-all cursor-pointer group shadow-sm hover:shadow-premium"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-md", ColorMap[insight.type])}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-primary tracking-tight mb-1 leading-none">{insight.text}</h4>
                  <p className="text-xs font-bold text-muted tracking-tight leading-none">{insight.subtext}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted group-hover:text-primary transition-all transform group-hover:translate-x-1" />
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
