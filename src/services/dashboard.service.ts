import { createClient } from '@/lib/supabase/server'
import { DashboardData, Insight } from '@/types/dashboard.types'

export async function fetchDashboardData(workspaceId: string, monthLabel: string, categoryId: string | null): Promise<DashboardData> {
  const supabase = await createClient()
  
  // Basic date parsing from 'April 2026'
  const [monthName, yearStr] = monthLabel.split(' ')
  const monthIndex = new Date(Date.parse(monthName + " 1, 2012")).getMonth()
  const year = parseInt(yearStr, 10)
  
  const startDate = new Date(year, monthIndex, 1).toISOString()
  const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59).toISOString()

  // 1. Fetch Transactions - OPTIMIZED: Selective fields
  let query = supabase
    .from('transactions')
    .select('id, amount, type, description, date, category_id, categories(name, type)')
    .eq('workspace_id', workspaceId)
    .gte('date', startDate)
    .lte('date', endDate)

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data: rawTransactions, error: txError } = await query.order('date', { ascending: false })

  if (txError) {
    console.error('Error fetching transactions:', txError)
    throw txError
  }

  // FALLBACK: If no data
  if (!rawTransactions || rawTransactions.length === 0) {
    return {
      net: 0, income: 0, expense: 0, trend: 0,
      chartData: [], categories: [], insights: [], transactions: []
    }
  }

  // 2. Process metrics
  let net = 0
  let income = 0
  let expense = 0
  
  const transactions = (rawTransactions || []).map(tx => {
    const amount = Number(tx.amount)
    if (tx.type === 'income') {
      income += amount
      net += amount
    } else {
      expense += amount
      net -= amount
    }
    return {
      id: tx.id,
      name: tx.description || 'Transaction',
      category: (tx.categories as any)?.name || 'Uncategorized',
      amount: amount,
      type: tx.type as 'income' | 'expense',
      date: new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  })

  // 3. Process Categories for Pie Chart
  const categoriesMap = new Map()
  let totalExpense = 0
  
  ;(rawTransactions || []).forEach(tx => {
    if (tx.type === 'expense') {
      const catName = (tx.categories as any)?.name || 'Uncategorized'
      const amount = Number(tx.amount)
      totalExpense += amount
      if (categoriesMap.has(catName)) {
        categoriesMap.get(catName).amount += amount
      } else {
        const palette = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#F43F5E', '#6366F1', '#EC4899'];
        const color = palette[categoriesMap.size % palette.length];
        
        categoriesMap.set(catName, {
          id: tx.category_id || 'unassigned',
          name: catName,
          amount: amount,
          color: color
        })
      }
    }
  })

  const categories = Array.from(categoriesMap.values()).map(c => ({
    ...c,
    percentage: totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0
  })).sort((a, b) => b.amount - a.amount)

  // 4. Process Chart Data
  const chartDataMap = new Map()
  ;(rawTransactions || []).forEach(tx => {
    if (tx.type === 'expense') {
      const day = new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const amount = Number(tx.amount)
      chartDataMap.set(day, (chartDataMap.get(day) || 0) + amount)
    }
  })

  const chartData = Array.from(chartDataMap.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => new Date(a.date + ' 2000').getTime() - new Date(b.date + ' 2000').getTime())

  return {
    net, income, expense, trend: 0,
    chartData, categories,
    insights: [
      { 
        id: '1', 
        type: 'info' as const, 
        text: `Total Expenses: ₹${expense}`, 
        subtext: `Based on ${transactions.length} transactions.` 
      }
    ],
    transactions
  }
}
