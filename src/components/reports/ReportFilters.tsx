import React from 'react'
import { Calendar, Download, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReportFilters as FilterType } from '@/types/reports.types'
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns'

interface ReportFiltersProps {
  filters: FilterType
  setFilters: (filters: FilterType) => void
  onExportExcel: () => void
  onExportPDF: () => void
}

export function ReportFilters({ filters, setFilters, onExportExcel, onExportPDF }: ReportFiltersProps) {
  const nextMonth = () => {
    const next = addMonths(filters.startDate, 1)
    setFilters({
      ...filters,
      startDate: startOfMonth(next),
      endDate: endOfMonth(next)
    })
  }

  const prevMonth = () => {
    const prev = subMonths(filters.startDate, 1)
    setFilters({
      ...filters,
      startDate: startOfMonth(prev),
      endDate: endOfMonth(prev)
    })
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-3xl backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-2xl border border-white/5">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="w-8 h-8 rounded-xl">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 flex flex-col items-center min-w-[140px]">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Active Period</span>
            <span className="text-xs font-black text-white uppercase tracking-tight">
              {format(filters.startDate, 'MMMM yyyy')}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="w-8 h-8 rounded-xl">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-8 w-px bg-white/5 hidden md:block" />
        
        <div className="hidden md:flex items-center gap-2">
          <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Quick:</span>
          {['This Month', 'Last Month', 'Q1'].map(p => (
            <button 
              key={p}
              className="px-3 py-1.5 rounded-lg text-[9px] font-black text-white/40 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onExportExcel} variant="secondary" className="h-10 text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none">
          <Download className="w-3.5 h-3.5 mr-2" />
          Excel
        </Button>
        <Button onClick={onExportPDF} variant="secondary" className="h-10 text-[10px] bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-none">
          <FileText className="w-3.5 h-3.5 mr-2" />
          PDF Report
        </Button>
      </div>
    </div>
  )
}
