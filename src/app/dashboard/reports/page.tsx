'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useDashboardContext } from '@/components/providers/DashboardProvider'
import { useReports } from '@/hooks/useReports'
import { ReportFilters } from '@/components/reports/ReportFilters'
import { TrendChart } from '@/components/reports/ReportCharts'
import { BudgetProgress } from '@/components/reports/BudgetProgress'
import { CategoryHeatmap } from '@/components/reports/CategoryHeatmap'
import { reportsService } from '@/services/reports.service'
import { Loader2, AlertCircle, PieChart as ChartIcon } from 'lucide-react'

export default function ReportsPage() {
  const { workspaceId } = useDashboardContext()
  const { data, isLoading, isError, filters, setFilters } = useReports(workspaceId)

  const handleExportExcel = () => data && reportsService.exportToExcel(data)
  const handleExportPDF = () => data && reportsService.exportToPDF(data)

  if (isLoading && !data) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-accent-blue/10 rounded-full" />
          <Loader2 className="w-16 h-16 text-accent-blue animate-spin absolute inset-0" />
        </div>
        <h3 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-2">Synthesizing Intelligence</h3>
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Aggregating workspace telemetry...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-[2rem] bg-accent-red/10 flex items-center justify-center text-accent-red mb-6 border border-accent-red/20 shadow-lg">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-2">Analysis Interrupted</h3>
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Unable to synchronize with high-fidelity records</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header & Global Filters */}
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent-blue/10 rounded-2xl border border-accent-blue/20">
            <ChartIcon className="w-6 h-6 text-accent-blue" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tight uppercase">Financial Intelligence</h1>
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mt-1.5">
              Deep-cycle spending analysis & categorical heatmaps
            </p>
          </div>
        </div>

        <ReportFilters 
          filters={filters} 
          setFilters={setFilters}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
        />
      </div>

      {data && (
        <div className="grid grid-cols-1 gap-10">
          {/* Hero Visual: Trend Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="bg-surface border border-surface-border rounded-[2.5rem] p-8 shadow-premium overflow-hidden transition-colors">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-sm font-black text-primary uppercase tracking-[0.3em]">Temporal Trajectory</h3>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mt-1.5">Income vs Outflow Velocity</p>
                </div>
              </div>
              <div className="h-[400px]">
                <TrendChart data={data.chartData} />
              </div>
            </div>
          </motion.div>

          {/* Core Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Category Intensity Heatmap */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-8"
            >
              <CategoryHeatmap data={data.categories} />
            </motion.div>

            {/* Budget Progress Matrix */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-4"
            >
              <BudgetProgress budgets={data.budgets} />
            </motion.div>
          </div>
        </div>
      )}
    </div>
  )
}
