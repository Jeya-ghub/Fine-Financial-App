'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardData } from '@/types/dashboard.types'
import { useDashboardContext } from '@/components/providers/DashboardProvider'
import { useFilters } from '@/components/providers/FilterProvider'
import { format } from 'date-fns'

export function useDashboardData(initialData: DashboardData | null = null) {
  const { workspaceId, selectedCategory } = useDashboardContext()
  const { filters } = useFilters()
  const [data, setData] = useState<DashboardData | null>(initialData)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [isError, setIsError] = useState(false)

  const loadData = useCallback(async () => {
    if (!workspaceId) return
    try {
      setIsLoading(true)
      setIsError(false)

      const supabase = createClient()
      const startDate = filters.dateRange.start.toISOString()
      const endDate   = filters.dateRange.end.toISOString()

      // Build query using global filter dates
      let query = supabase
        .from('transactions')
        .select('id, amount, type, description, date, category_id, categories(name, type)')
        .eq('workspace_id', workspaceId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      // Apply transaction type from global filter
      if (filters.transactionType !== 'all') {
        query = query.eq('type', filters.transactionType)
      }

      // Apply category filter (legacy selectedCategory or global multi-select)
      if (filters.categoryIds.length > 0) {
        query = query.in('category_id', filters.categoryIds)
      } else if (selectedCategory) {
        query = query.eq('category_id', selectedCategory)
      }

      // Apply amount range
      if (filters.amountRange.min !== null) query = query.gte('amount', filters.amountRange.min)
      if (filters.amountRange.max !== null) query = query.lte('amount', filters.amountRange.max)

      // Apply search
      if (filters.searchQuery.trim()) {
        const q = `%${filters.searchQuery.trim()}%`
        query = query.or(`description.ilike.${q},id.ilike.${q}`)
      }

      const { data: rawTransactions, error: txError } = await query
      if (txError) throw txError

      if (!rawTransactions || rawTransactions.length === 0) {
        setData({ net: 0, income: 0, expense: 0, trend: 0, chartData: [], categories: [], insights: [], transactions: [] })
        return
      }

      let net = 0, income = 0, expense = 0
      const transactions = rawTransactions.map(tx => {
        const amount = Number(tx.amount)
        if (tx.type === 'income') { income += amount; net += amount }
        else { expense += amount; net -= amount }
        return {
          id: tx.id,
          name: tx.description || 'Transaction',
          category: (tx.categories as any)?.name || 'Uncategorized',
          amount,
          type: tx.type as 'income' | 'expense',
          date: new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
      })

      const categoriesMap = new Map()
      let totalExpense = 0
      rawTransactions.forEach(tx => {
        if (tx.type === 'expense') {
          const catName = (tx.categories as any)?.name || 'Uncategorized'
          const amount = Number(tx.amount)
          totalExpense += amount
          if (categoriesMap.has(catName)) {
            categoriesMap.get(catName).amount += amount
          } else {
            const palette = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#F43F5E', '#6366F1', '#EC4899']
            categoriesMap.set(catName, { id: tx.category_id || 'unassigned', name: catName, amount, color: palette[categoriesMap.size % palette.length] })
          }
        }
      })

      const categories = Array.from(categoriesMap.values())
        .map(c => ({ ...c, percentage: totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0 }))
        .sort((a, b) => b.amount - a.amount)

      const chartDataMap = new Map()
      rawTransactions.forEach(tx => {
        if (tx.type === 'expense') {
          const day = new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          chartDataMap.set(day, (chartDataMap.get(day) || 0) + Number(tx.amount))
        }
      })

      const chartData = Array.from(chartDataMap.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => new Date(a.date + ' 2000').getTime() - new Date(b.date + ' 2000').getTime())

      setData({
        net, income, expense, trend: 0, chartData, categories,
        insights: [{ id: '1', type: 'info' as const, text: `Total Expenses: ₹${expense.toLocaleString('en-IN')}`, subtext: `Based on ${transactions.length} transactions.` }],
        transactions
      })
    } catch (err) {
      console.error('[useDashboardData]', err)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, filters, selectedCategory])

  useEffect(() => { loadData() }, [loadData])

  // Realtime subscription
  useEffect(() => {
    if (!workspaceId) return
    const supabase = createClient()
    const channel = supabase.channel(`dashboard-${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `workspace_id=eq.${workspaceId}` }, loadData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [workspaceId, loadData])

  return { data, isLoading, isError, refresh: loadData }
}
