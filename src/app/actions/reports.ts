'use server'

import { createClient } from '@/lib/supabase/server'

export async function getReportData(workspaceId: string, dateFrom?: string, dateTo?: string, userId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('transactions')
    .select(`
      *,
      categories (
        id,
        name,
        type
      )
    `)
    .eq('workspace_id', workspaceId)

  if (dateFrom) query = query.gte('date', dateFrom)
  if (dateTo) query = query.lte('date', dateTo)
  if (userId) query = query.eq('user_id', userId)

  const { data: transactions, error } = await query.order('date', { ascending: false })

  if (error) return { error: error.message, data: null }

  // Aggregate by Category for the Pie Chart
  const categoryMap: Record<string, { id: string; name: string; amount: number; type: string; txCount: number }> = {}

  transactions.forEach((t: any) => {
    const cat = t.categories
    if (!cat) return
    
    if (!categoryMap[cat.name]) {
      categoryMap[cat.name] = { id: cat.id, name: cat.name, amount: 0, type: cat.type, txCount: 0 }
    }
    categoryMap[cat.name].amount += Number(t.amount)
    categoryMap[cat.name].txCount += 1
  })

  const aggregatedData = Object.values(categoryMap).sort((a, b) => b.amount - a.amount)

  return { 
    data: {
      transactions,
      aggregatedData,
      summary: {
        totalIncome: aggregatedData.filter(d => d.type === 'income').reduce((acc, d) => acc + d.amount, 0),
        totalExpense: aggregatedData.filter(d => d.type === 'expense').reduce((acc, d) => acc + d.amount, 0)
      }
    } 
  }
}
