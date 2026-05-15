'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { CategorySummary } from '@/types/dashboard.types'

export function CategoryList({ categories }: { categories: CategorySummary[] }) {
  const [salary, setSalary] = useState(15000)
  const [activeIndex, setActiveIndex] = useState(-1)
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6 rounded-2xl border border-surface-border bg-surface flex flex-col min-h-[420px] h-full shadow-premium hover:shadow-elevated transition-all duration-500 group relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent-blue/50 via-accent-emerald/50 to-accent-red/50" />
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-1">Category Split</h3>
          <p className="text-[9px] font-bold text-muted uppercase tracking-[0.1em]">Liquidity distribution</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 bg-surface-hover/50 px-2 py-1 rounded-lg border border-surface-border shadow-inner">
            <span className="text-[8px] font-black text-muted uppercase">Budget Amount:</span>
            <input 
              type="number" 
              value={salary}
              onChange={(e) => setSalary(Number(e.target.value))}
              className="bg-transparent border-none focus:outline-none text-[10px] font-black text-primary w-16 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <span className="text-[7px] font-bold text-muted uppercase tracking-wider opacity-60">Base for % calculations</span>
        </div>
      </div>

      <div className="h-[200px] mb-6 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categories}
              innerRadius={75}
              outerRadius={95}
              paddingAngle={8}
              dataKey="amount"
              stroke="none"
              cornerRadius={10}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              {categories.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  className="transition-all cursor-pointer outline-none"
                  style={{
                    filter: activeIndex === index ? 'brightness(0.7) saturate(1.2)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </Pie>
            <Tooltip 
              offset={20}
              content={({ active, payload }: { active?: boolean; payload?: any }) => {
                if (active && payload && payload.length) {
                  return (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="bg-primary border border-surface-border rounded-lg px-2.5 py-1.5 shadow-elevated backdrop-blur-xl"
                    >
                      <p className="text-[8px] font-black text-background uppercase tracking-[0.2em] mb-0.5 leading-none">{payload[0].name}</p>
                      <p className="text-[14px] font-black text-background tracking-tighter leading-none">₹{payload[0].value?.toLocaleString()}</p>
                    </motion.div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Total</span>
          <span className="text-xl font-black text-primary">Split</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto max-h-[180px] custom-scrollbar pr-3">
        {categories.map((cat) => {
          const salaryPercent = ((cat.amount / salary) * 100).toFixed(1)
          return (
            <div key={cat.id} className="flex items-center justify-between group/item cursor-pointer p-2 rounded-lg hover:bg-surface-hover/50 transition-all border border-transparent hover:border-surface-border">
              <div className="flex items-center gap-4">
                <div 
                  className="w-4 h-4 rounded-md flex items-center justify-center shadow-sm border border-white/10 group-hover/item:scale-110 transition-transform" 
                  style={{ backgroundColor: cat.color }}
                >
                   <div className="w-1.5 h-1.5 bg-black/20 rounded-full" />
                </div>
                <span className="text-[13px] font-bold text-secondary group-hover/item:text-primary transition-colors">
                  {cat.name}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-[13px] font-black text-primary tracking-tight">₹{cat.amount.toLocaleString()}</span>
                <div className="w-12 text-right">
                  <span className="text-[10px] font-black text-muted uppercase opacity-40 group-hover/item:opacity-100 transition-opacity tracking-widest">{salaryPercent}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

    </motion.div>
  )
}
