'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CategoryDistribution } from '@/types/reports.types'
import { Info } from 'lucide-react'

interface CategoryHeatmapProps {
  data: CategoryDistribution[]
}

export function CategoryHeatmap({ data }: CategoryHeatmapProps) {
  // Sort by amount High to Low
  const sortedData = [...data].sort((a, b) => b.amount - a.amount)
  const maxAmount = sortedData.length > 0 ? sortedData[0].amount : 0

  return (
    <div className="bg-surface border border-surface-border rounded-[2.5rem] p-8 shadow-premium transition-colors duration-300">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-sm font-black text-primary uppercase tracking-[0.3em]">Category Intensity Heatmap</h3>
          <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mt-1.5">Distribution by spending volume</p>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-black text-muted uppercase tracking-widest bg-surface-hover px-4 py-2 rounded-xl border border-surface-border transition-colors">
          <Info className="w-3 h-3" />
          High to Low Bar Cascade
        </div>
      </div>

      <div className="space-y-6">
        {sortedData.map((item, index) => {
          const intensity = maxAmount > 0 ? item.amount / maxAmount : 0
          
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group flex items-center gap-6"
            >
              {/* Category Name */}
              <div className="w-32 flex-shrink-0">
                <span className="text-[11px] font-black text-primary uppercase tracking-tight truncate block">
                  {item.name}
                </span>
                <span className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-60">
                  RANK #{index + 1}
                </span>
              </div>

              {/* Bar Container */}
              <div className="flex-1 relative h-10 bg-surface-hover/30 rounded-xl border border-surface-border overflow-hidden">
                {/* Intensity Bar */}
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.amount / maxAmount) * 100}%` }}
                  transition={{ duration: 1, ease: "circOut", delay: index * 0.1 }}
                  className="absolute inset-y-0 left-0 transition-colors duration-500 flex items-center justify-end px-4 overflow-hidden"
                  style={{ 
                    backgroundColor: 'var(--accent-blue)',
                    opacity: Math.max(0.15, intensity)
                  }}
                >
                  <span className="text-[10px] font-black text-primary tracking-tight whitespace-nowrap drop-shadow-sm">
                    ₹{item.amount.toLocaleString()}
                  </span>
                </motion.div>
                
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
              </div>

              {/* Percentage (Dimmed) */}
              <div className="w-16 text-right flex-shrink-0">
                <span className="text-[11px] font-black text-muted uppercase tracking-widest tabular-nums">
                  {item.percentage}%
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {sortedData.length === 0 && (
        <div className="h-64 flex flex-col items-center justify-center text-center opacity-40">
          <p className="text-[10px] font-black uppercase tracking-widest italic">No categorical distribution found</p>
        </div>
      )}
    </div>
  )
}
