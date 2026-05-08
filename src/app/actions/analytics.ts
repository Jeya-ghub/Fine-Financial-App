'use server'

import { createClient } from '@/lib/supabase/server'

export async function getAnalytics(workspaceIds: string[], startDate: string, endDate: string) {
  const supabase = await createClient()

  // 1. Total Income vs Expense
  const { data: totals, error: totalsError } = await supabase
    .from('transactions')
    .select('type, amount')
    .in('workspace_id', workspaceIds)
    .gte('date', startDate)
    .lte('date', endDate)

  if (totalsError) return { error: totalsError.message }

  const income = totals.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
  const expense = totals.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)

  // 2. Category Breakdown
  // We need to join with categories to get the names
  const { data: categoryData, error: catError } = await supabase
    .from('transactions')
    .select(`
      amount,
      type,
      category:categories(id, name)
    `)
    .in('workspace_id', workspaceIds)
    .gte('date', startDate)
    .lte('date', endDate)

  if (catError) return { error: catError.message }

  const breakdown = categoryData.reduce((acc: any, t: any) => {
    const catName = t.category?.name || 'Uncategorized'
    if (!acc[catName]) acc[catName] = { name: catName, value: 0, type: t.type }
    acc[catName].value += Number(t.amount)
    return acc
  }, {})

  // 3. Monthly Trends
  const { data: trends, error: trendsError } = await supabase
    .rpc('get_monthly_trends', { 
      p_workspace_ids: workspaceIds, 
      p_start_date: startDate, 
      p_end_date: endDate 
    })

  // Note: We'll need to define this RPC in SQL for efficiency, or do it in JS
  // For now, let's assume we implement the RPC or do a grouped query.
  
  return {
    data: {
      summary: { income, expense, balance: income - expense },
      categoryBreakdown: Object.values(breakdown),
      trends: trends || [] // Placeholder for now
    }
  }
}
