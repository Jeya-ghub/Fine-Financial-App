'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useDashboardContext } from '@/components/providers/DashboardProvider'
import { useReports } from '@/hooks/useReports'
import { ReportFilters } from '@/components/reports/ReportFilters'
import { SummaryCards } from '@/components/reports/SummaryCards'
import { TrendChart, DistributionChart } from '@/components/reports/ReportCharts'
import { BudgetProgress } from '@/components/reports/BudgetProgress'
import { AIInsights } from '@/components/reports/AIInsights'
import { reportsService } from '@/services/reports.service'
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export default function ReportsPage() {
  const { workspaceId } = useDashboardContext()
  const { data, isLoading, isError, filters, setFilters } = useReports(workspaceId)

  const handleExportExcel = () => data && reportsService.exportToExcel(data)
  const handleExportPDF = () => data && reportsService.exportToPDF(data)

  if (isLoading && !data) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Generating financial analytics...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">Failed to load reports</h3>
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Check your connection and try again</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700">
      {/* Header & Global Filters */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Financial Reports</h1>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">
            Deep insights into your workspace performance
          </p>
        </div>

        <ReportFilters 
          filters={filters} 
          setFilters={setFilters}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
        />
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Summary Row */}
          <div className="col-span-1 md:col-span-12">
            <SummaryCards summary={data.summary} />
          </div>

          {/* Main Analytics Row */}
          <div className="col-span-1 md:col-span-8 space-y-6">
            <TrendChart data={data.chartData} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <DistributionChart data={data.categories} />
               <BudgetProgress budgets={data.budgets} />
            </div>
          </div>

          {/* Sidebar Insights */}
          <div className="col-span-1 md:col-span-4 h-full">
            <AIInsights summary={data.summary} />
          </div>

          {/* Detailed Transactions List */}
          <div className="col-span-1 md:col-span-12">
            <Card>
              <CardContent className="p-0">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Transaction Details</h3>
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-0.5">Raw data for active period</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02]">
                        <th className="px-6 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest">Description</th>
                        <th className="px-6 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest">Category</th>
                        <th className="px-6 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4 text-[10px] font-bold text-white/40">{tx.date}</td>
                          <td className="px-6 py-4 text-[11px] font-black text-white">{tx.description}</td>
                          <td className="px-6 py-4">
                            <Badge variant="neutral" className="h-5 text-[8px] font-black uppercase tracking-widest">
                              {tx.categories?.name || 'Uncategorized'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-black ${tx.type === 'income' ? 'text-emerald-500' : 'text-white'}`}>
                              {tx.type === 'income' ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {data.transactions.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-20 text-center text-[10px] font-black text-white/20 uppercase tracking-widest italic">
                            No transactions found for this period
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
