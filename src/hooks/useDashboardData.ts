'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchDashboardData } from '@/services/dashboard.service'
import { DashboardData } from '@/types/dashboard.types'
import { createClient } from '@/lib/supabase/client'
import { useDashboardContext } from '@/components/providers/DashboardProvider'

export function useDashboardData(initialData: DashboardData | null = null) {
  const { workspaceId, selectedMonth, selectedCategory } = useDashboardContext()
  const [data, setData] = useState<DashboardData | null>(initialData)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [isError, setIsError] = useState(false)

  const loadData = useCallback(async () => {
    if (!workspaceId) return
    try {
      setIsLoading(true)
      setIsError(false)
      const result = await fetchDashboardData(workspaceId, selectedMonth, selectedCategory)
      setData(result)
    } catch (err) {
      console.error(err)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, selectedMonth, selectedCategory])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!workspaceId) return
    const supabase = createClient()
    
    // Subscribe to realtime changes on transactions
    const channel = supabase.channel(`dashboard-${workspaceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `workspace_id=eq.${workspaceId}` },
        () => {
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, loadData])

  return {
    data,
    isLoading,
    isError,
    refresh: loadData
  }
}
