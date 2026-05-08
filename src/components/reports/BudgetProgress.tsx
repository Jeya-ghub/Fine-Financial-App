import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { AlertCircle, TrendingUp } from 'lucide-react'
import { BudgetStatus } from '@/types/reports.types'

interface BudgetProgressProps {
  budgets: BudgetStatus[]
}

export function BudgetProgress({ budgets }: BudgetProgressProps) {
  if (budgets.length === 0) return (
    <Card className="h-full">
      <CardContent className="p-12 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 mb-4">
          <TrendingUp className="w-6 h-6" />
        </div>
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">No budgets defined for this workspace</p>
      </CardContent>
    </Card>
  )

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Budget Tracking</h3>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-0.5">Usage vs limits</p>
          </div>
          <span className="px-2 py-1 rounded-lg bg-white/5 text-[9px] font-black text-white/40 uppercase tracking-widest">Monthly</span>
        </div>

        <div className="space-y-8">
          {budgets.map((budget) => (
            <div key={budget.categoryId} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{budget.categoryName}</span>
                  {budget.isOver && (
                    <div className="flex items-center gap-1 text-rose-500 animate-pulse">
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase">Over Budget</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-white">₹{budget.spent.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-white/20"> / ₹{budget.budget.toLocaleString()}</span>
                </div>
              </div>

              <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${
                    budget.percentage > 100 ? 'bg-rose-500' : budget.percentage > 85 ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                />
              </div>

              <div className="flex justify-between">
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{budget.percentage}% Used</span>
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                  ₹{(budget.budget - budget.spent).toLocaleString()} Left
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
