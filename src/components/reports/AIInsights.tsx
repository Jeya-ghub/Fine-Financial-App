import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Sparkles, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react'
import { ReportSummary } from '@/types/reports.types'

interface AIInsightsProps {
  summary: ReportSummary
}

export function AIInsights({ summary }: AIInsightsProps) {
  const getInsights = () => {
    const insights = []
    
    if (summary.expenseTrend > 0) {
      insights.push(`Your spending has increased by ${summary.expenseTrend}% compared to the previous period. Consider reviewing your top categories.`)
    } else if (summary.expenseTrend < 0) {
      insights.push(`Great job! You've reduced your spending by ${Math.abs(summary.expenseTrend)}% compared to last month.`)
    }

    if (summary.balance > 0) {
      insights.push(`You have a positive cash flow of ₹${summary.balance.toLocaleString()}. This is a good time to increase your savings or investments.`)
    } else {
      insights.push(`Your expenses exceeded your income this period. Review your non-essential spending to balance your budget.`)
    }

    return insights
  }

  return (
    <Card className="h-full bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/10">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest">AI Insights</h3>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-0.5">Automated financial analysis</p>
          </div>
        </div>

        <div className="space-y-4">
          {getInsights().map((insight, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-all group">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center text-white/40 group-hover:text-blue-400 transition-colors">
                <Info className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white/60 leading-relaxed group-hover:text-white/80 transition-colors">
                {insight}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Income Change</p>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-black ${summary.incomeTrend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {summary.incomeTrend >= 0 ? '+' : ''}{summary.incomeTrend}%
              </span>
              {summary.incomeTrend >= 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-500" /> : <ArrowDownRight className="w-4 h-4 text-rose-500" />}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Expense Change</p>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-black ${summary.expenseTrend <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {summary.expenseTrend >= 0 ? '+' : ''}{summary.expenseTrend}%
              </span>
              {summary.expenseTrend <= 0 ? <ArrowDownRight className="w-4 h-4 text-emerald-500" /> : <ArrowUpRight className="w-4 h-4 text-rose-500" />}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
