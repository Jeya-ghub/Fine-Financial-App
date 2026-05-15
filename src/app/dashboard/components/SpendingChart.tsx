'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts'
import { ChartPoint } from '@/types/dashboard.types'

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface/80 border border-surface-border rounded-2xl p-4 shadow-elevated backdrop-blur-xl">
        <p className="text-[10px] font-black text-muted uppercase tracking-[0.25em] mb-1.5 text-center">
          {payload[0].payload.date}, 2026
        </p>
        <p className="text-xl font-black text-primary text-center">
          ₹{payload[0].value?.toLocaleString()}
        </p>
      </div>
    )
  }
  return null
}

export function SpendingChart({ data }: { data: ChartPoint[] }) {
  const [range, setRange] = useState('1M')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento-card p-6 min-h-[420px] flex flex-col shadow-premium hover:shadow-elevated"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.25em] mb-1">Spending Dynamics</h3>
          <p className="text-[9px] font-bold text-muted uppercase tracking-[0.15em]">Activity Analysis • {range}</p>
        </div>
        <div className="flex gap-1 bg-surface-hover/50 p-1 rounded-xl border border-surface-border">
          {['1M', '3M', '6M', '1Y'].map(t => (
            <button
              key={t}
              onClick={() => setRange(t)}
              className={`px-3 h-8 rounded-lg text-[10px] font-black tracking-widest transition-all active:scale-90 ${
                t === range 
                  ? 'bg-primary text-background shadow-lg shadow-primary/20' 
                  : 'text-muted hover:text-primary hover:bg-surface'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[220px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 900 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 900 }} 
              tickFormatter={(v) => `₹${v/1000}k`}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#colorValue)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

