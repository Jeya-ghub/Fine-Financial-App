import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { ReportSummary } from '@/types/reports.types'

interface SummaryCardsProps {
  summary: ReportSummary
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const metrics = [
    {
      title: 'Total Income',
      value: `₹${summary.income.toLocaleString()}`,
      trend: summary.incomeTrend,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      title: 'Total Expenses',
      value: `₹${summary.expense.toLocaleString()}`,
      trend: summary.expenseTrend,
      icon: TrendingDown,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      reverse: true
    },
    {
      title: 'Net Balance',
      value: `₹${summary.balance.toLocaleString()}`,
      icon: Wallet,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((m, i) => (
        <Card key={i} className="relative overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-2xl ${m.bg} ${m.color} flex items-center justify-center`}>
                <m.icon className="w-5 h-5" />
              </div>
              {m.trend !== undefined && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-[10px] font-black ${
                  (m.reverse ? m.trend <= 0 : m.trend >= 0) ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {m.trend >= 0 ? '+' : ''}{m.trend}%
                  {m.trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{m.title}</p>
              <h3 className="text-2xl font-black text-white tracking-tight">{m.value}</h3>
            </div>
          </CardContent>
          <div className={`absolute bottom-0 left-0 h-1 transition-all duration-500 group-hover:w-full w-0 ${
            m.color.replace('text-', 'bg-')
          } opacity-20`} />
        </Card>
      ))}
    </div>
  )
}
