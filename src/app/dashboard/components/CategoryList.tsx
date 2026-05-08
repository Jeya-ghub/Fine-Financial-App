'use client'

import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { CategorySummary } from '@/types/dashboard.types'

export function CategoryList({ categories }: { categories: CategorySummary[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bento-card p-5 md:p-6 flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Top Categories</h3>
        <button className="text-[8px] font-black text-zinc-700 hover:text-white uppercase tracking-widest transition-colors">
          Manage
        </button>
      </div>

      <div className="h-[160px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categories}
              innerRadius={55}
              outerRadius={70}
              paddingAngle={8}
              dataKey="amount"
              stroke="none"
              cornerRadius={3}
            >
              {categories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px' }}
              itemStyle={{ color: '#fff', fontSize: '9px', fontWeight: '900' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto max-h-[180px] custom-scrollbar pr-1">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-3 h-3 rounded-sm flex items-center justify-center" 
                style={{ backgroundColor: cat.color }}
              >
                 <div className="w-1 h-1 bg-black/20 rounded-full" />
              </div>
              <span className="text-[11px] font-bold text-zinc-500 group-hover:text-white transition-colors">
                {cat.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-white tracking-tight">₹{cat.amount.toLocaleString()}</span>
              <span className="text-[9px] font-black text-zinc-800 w-8 text-right">{cat.percentage}%</span>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-auto pt-3 text-center text-[9px] font-black text-zinc-800 hover:text-white uppercase tracking-[0.2em] border-t border-white/5 transition-colors">
        View all categories
      </button>
    </motion.div>
  )
}
