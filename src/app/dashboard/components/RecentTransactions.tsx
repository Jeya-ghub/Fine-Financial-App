'use client'

import { motion } from 'framer-motion'
import { Transaction } from '@/types/dashboard.types'
import { cn } from '@/lib/utils'
import { Wallet, Utensils, Car, Lightbulb, ShoppingBag } from 'lucide-react'

const IconMap: Record<string, any> = {
  'Income': Wallet,
  'Food & Dining': Utensils,
  'Transport': Car,
  'Bills & Utilities': Lightbulb,
  'Shopping': ShoppingBag
}

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento-card p-5 md:p-6 h-full"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Recent Transactions</h3>
        <button className="text-[9px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors">
          View All
        </button>
      </div>

      <div className="flex flex-col">
        {transactions.map((tx, idx) => {
          const Icon = IconMap[tx.category] || Wallet
          const isIncome = tx.type === 'income'

          return (
            <div 
              key={tx.id}
              className={cn(
                "flex items-center justify-between py-3.5 group cursor-pointer transition-all border-b border-white/[0.03] last:border-0",
                "hover:bg-white/[0.01] -mx-4 px-4 rounded-xl"
              )}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#111111] border border-white/5 flex items-center justify-center text-zinc-600 group-hover:text-white group-hover:border-white/20 transition-all shadow-inner">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-[13px] font-black text-white tracking-tight leading-none mb-0.5">{tx.name}</h4>
                  <p className="text-[9px] font-black text-zinc-800 uppercase tracking-widest">{tx.category}</p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <div className={cn(
                  "text-[14px] font-black tracking-tighter leading-none mb-0.5",
                  isIncome ? "text-emerald-500" : "text-white"
                )}>
                  {isIncome ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                </div>
                <p className="text-[9px] font-black text-zinc-900 uppercase tracking-widest">{tx.date}</p>
              </div>
            </div>
          )
        })}
      </div>

      <button className="w-full mt-3 py-3 text-center text-[9px] font-black text-zinc-800 hover:text-white uppercase tracking-[0.2em] transition-colors">
        View all transactions
      </button>
    </motion.div>
  )
}
