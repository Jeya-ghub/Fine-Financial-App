import useSWR from 'swr'
import { DashboardData } from '@/types/dashboard.types'

// ── API UTILITIES ───────────────────────────────────────────────────────────

export const fetcher = (url: string) => fetch(url).then(res => res.json())

// ── CUSTOM HOOKS ────────────────────────────────────────────────────────────

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR<DashboardData>('/api/dashboard', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  })

  return {
    data,
    isLoading,
    isError: error,
    refresh: mutate,
  }
}
