'use client'

import { motion } from 'framer-motion'
import { Transaction } from '@/types/dashboard.types'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { LucideIcon, Wallet, Utensils, Car, Lightbulb, ShoppingBag } from 'lucide-react'

const IconMap: Record<string, LucideIcon> = {
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
      className="p-6 rounded-2xl border border-surface-border bg-surface h-full shadow-premium hover:shadow-elevated transition-all duration-500 group relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-1">Recent Transactions</h3>
          <p className="text-[9px] font-bold text-muted uppercase tracking-[0.1em]">Latest chronological sequence</p>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="px-3 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em]">Date</th>
              <th className="px-3 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em]">Category</th>
              <th className="px-3 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em]">Notes</th>
              <th className="px-3 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em] text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="">
            {transactions.slice(0, 8).map((tx) => {
              const isIncome = tx.type === 'income'
              return (
                <tr key={tx.id} className="hover:bg-white/5 transition-all group/row cursor-default">
                  <td className="px-3 py-2.5 text-[11px] font-bold text-muted uppercase tracking-wider">{tx.date}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-muted font-medium truncate max-w-[200px]">{tx.name}</td>
                  <td className={cn(
                    "px-3 py-2.5 text-sm font-black text-right tracking-tighter",
                    isIncome ? 'text-accent-emerald' : 'text-accent-red'
                  )}>
                    {isIncome ? '+' : '-'}₹{tx.amount.toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Link href="/dashboard/transactions" className="block w-full mt-6">
        <button className="w-full py-3 text-center text-[10px] font-black text-muted hover:text-primary uppercase tracking-[0.3em] transition-all bg-surface-hover/30 rounded-xl hover:bg-surface-hover border border-transparent hover:border-surface-border hover:tracking-[0.4em]">
          Full Transaction History
        </button>
      </Link>
    </motion.div>
  )
}
