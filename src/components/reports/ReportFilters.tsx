'use client'

import React from 'react'
import { Calendar, Download, FileText, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReportFilters as FilterType } from '@/types/reports.types'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { cn } from '@/lib/utils'

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

  const setRange = (type: 'this_month' | 'last_month' | 'this_year') => {
    const now = new Date()
    switch (type) {
      case 'this_month':
        setFilters({ ...filters, startDate: startOfMonth(now), endDate: endOfMonth(now) })
        break
      case 'last_month':
        const last = subMonths(now, 1)
        setFilters({ ...filters, startDate: startOfMonth(last), endDate: endOfMonth(last) })
        break
      case 'this_year':
        setFilters({ ...filters, startDate: startOfYear(now), endDate: endOfYear(now) })
        break
    }
  }

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-surface border border-surface-border p-6 rounded-[2rem] transition-colors shadow-premium">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Month Swiper */}
        <div className="flex items-center gap-2 bg-surface-hover p-1.5 rounded-2xl border border-surface-border transition-colors">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="w-10 h-10 rounded-xl hover:bg-background">
            <ChevronLeft className="w-5 h-5 text-primary" />
          </Button>
          <div className="px-6 flex flex-col items-center min-w-[160px]">
            <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-1">Audit Period</span>
            <span className="text-sm font-black text-primary uppercase tracking-tight">
              {format(filters.startDate, 'MMMM yyyy')}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="w-10 h-10 rounded-xl hover:bg-background">
            <ChevronRight className="w-5 h-5 text-primary" />
          </Button>
        </div>

        <div className="h-10 w-px bg-surface-border hidden md:block" />
        
        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mr-2 flex items-center gap-2">
            <Clock className="w-3 h-3" />
            Quick:
          </span>
          {[
            { label: 'This Month', value: 'this_month' },
            { label: 'Last Month', value: 'last_month' },
            { label: 'This Year', value: 'this_year' }
          ].map(p => {
            const isSelected = format(filters.startDate, 'yyyy-MM') === format(
              p.value === 'this_month' ? new Date() : 
              p.value === 'last_month' ? subMonths(new Date(), 1) : 
              new Date(), 
              'yyyy-MM'
            ) && p.value !== 'this_year' || (p.value === 'this_year' && filters.startDate.getMonth() === 0 && filters.endDate.getMonth() === 11)

            return (
              <button 
                key={p.value}
                onClick={() => setRange(p.value as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest border",
                  isSelected 
                    ? "bg-primary text-background border-primary" 
                    : "text-muted border-surface-border hover:border-muted hover:text-primary"
                )}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Export Actions */}
      <div className="flex items-center gap-3">
        <Button 
          onClick={onExportExcel} 
          variant="secondary" 
          className="h-12 px-6 text-[10px] font-black uppercase tracking-[0.2em] bg-accent-emerald/10 text-accent-emerald hover:bg-accent-emerald/20 border-none rounded-2xl"
        >
          <Download className="w-4 h-4 mr-2" />
          Excel Export
        </Button>
        <Button 
          onClick={onExportPDF} 
          variant="secondary" 
          className="h-12 px-8 text-[10px] font-black uppercase tracking-[0.2em] bg-primary text-background hover:opacity-90 border-none rounded-2xl shadow-elevated"
        >
          <FileText className="w-4 h-4 mr-2" />
          Generate Ledger
        </Button>
      </div>
    </div>
  )
}
