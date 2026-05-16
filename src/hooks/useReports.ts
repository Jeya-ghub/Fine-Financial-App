'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { reportsService } from '@/services/reports.service'
import { ReportData } from '@/types/reports.types'
import { useFilters } from '@/components/providers/FilterProvider'

export function useReports(workspaceId: string) {
  const { filters } = useFilters()
  const [data, setData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const loadData = useCallback(async () => {
    if (!workspaceId) return
    try {
      setIsLoading(true)
      setIsError(false)
      const reportData = await reportsService.getReportData(workspaceId, filters)
      setData(reportData)
    } catch (err: any) {
      console.error('useReports error full:', err)
      console.error('useReports error message:', err?.message || err?.toString())
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `workspace_id=eq.${workspaceId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets', filter: `workspace_id=eq.${workspaceId}` }, loadData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [workspaceId, loadData])

  // Build export filter summary
  const filterSummary = useMemo(() => {
    const parts: string[] = []
    if (filters.dateRange.preset) parts.push(`Date: ${filters.dateRange.preset}`)
    if (filters.transactionType !== 'all') parts.push(`Type: ${filters.transactionType}`)
    if (filters.categoryIds.length > 0) parts.push(`${filters.categoryIds.length} categories`)
    if (filters.amountRange.min !== null) parts.push(`Min: ₹${filters.amountRange.min}`)
    if (filters.amountRange.max !== null) parts.push(`Max: ₹${filters.amountRange.max}`)
    if (filters.searchQuery) parts.push(`Search: "${filters.searchQuery}"`)
    return parts.join(' | ')
  }, [filters])

  return {
    data,
    isLoading,
    isError,
    filters,
    filterSummary,
    refresh: loadData
  }
}
