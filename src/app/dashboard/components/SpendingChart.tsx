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
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
          {payload[0].payload.date}, 2026
        </p>
        <p className="text-xl font-black text-white">
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
      className="bento-card p-5 md:p-6 min-h-[340px] flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-0.5">Spending Overview</h3>
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">Cash flow over time</p>
        </div>
        <div className="flex gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/5">
          {['7D', '1M', '3M', '1Y', 'All'].map(t => (
            <button
              key={t}
              onClick={() => setRange(t)}
              className={`px-3 py-1.5 rounded-lg text-[8px] font-black tracking-widest transition-all ${
                t === range ? 'bg-white/10 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'
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
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.01)" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#27272a', fontSize: 9, fontWeight: 900 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#27272a', fontSize: 9, fontWeight: 900 }} 
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

