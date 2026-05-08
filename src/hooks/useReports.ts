'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { reportsService } from '@/services/reports.service'
import { ReportData, ReportFilters } from '@/types/reports.types'
import { startOfMonth, endOfMonth } from 'date-fns'

export function useReports(workspaceId: string) {
  const [data, setData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  })

  const loadData = useCallback(async () => {
    if (!workspaceId) return
    try {
      setIsLoading(true)
      const reportData = await reportsService.getReportData(workspaceId, filters)
      setData(reportData)
    } catch (err) {
      console.error(err)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, filters])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Realtime subscription
  useEffect(() => {
    if (!workspaceId) return
    const supabase = createClient()
    
    const channel = supabase.channel(`reports-${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `workspace_id=eq.${workspaceId}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets', filter: `workspace_id=eq.${workspaceId}` }, () => loadData())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, loadData])

  return {
    data,
    isLoading,
    isError,
    filters,
    setFilters,
    refresh: loadData
  }
}
