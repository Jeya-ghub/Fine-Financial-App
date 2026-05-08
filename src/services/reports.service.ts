import { createClient } from '@/lib/supabase/client'
import { ReportData, ReportFilters, ChartDataPoint, CategoryDistribution, BudgetStatus } from '@/types/reports.types'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isWithinInterval, subMonths } from 'date-fns'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

export const reportsService = {
  async getReportData(workspaceId: string, filters: ReportFilters): Promise<ReportData> {
    const supabase = createClient()
    
    // 1. Fetch current period transactions
    const { data: currentTxs, error: curError } = await supabase
      .from('transactions')
      .select('*, categories(name, type)')
      .eq('workspace_id', workspaceId)
      .gte('date', filters.startDate.toISOString())
      .lte('date', filters.endDate.toISOString())
    
    if (curError) throw curError

    // 2. Fetch previous period for trend calculation
    const duration = filters.endDate.getTime() - filters.startDate.getTime()
    const prevStartDate = new Date(filters.startDate.getTime() - duration - 1)
    const prevEndDate = new Date(filters.startDate.getTime() - 1)
    
    const { data: prevTxs } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('workspace_id', workspaceId)
      .gte('date', prevStartDate.toISOString())
      .lte('date', prevEndDate.toISOString())

    // 3. Fetch Budgets
    const { data: budgets } = await supabase
      .from('budgets')
      .select('*, categories(name)')
      .eq('workspace_id', workspaceId)

    // 4. Process Summary & Trends
    const summary = this.processSummary(currentTxs || [], prevTxs || [])
    
    // 5. Process Chart Data
    const chartData = this.processChartData(currentTxs || [], filters.startDate, filters.endDate)
    
    // 6. Process Category Distribution
    const categories = this.processCategoryDistribution(currentTxs || [])
    
    // 7. Process Budget Status
    const budgetStatus = this.processBudgetStatus(currentTxs || [], budgets || [])

    return {
      summary,
      chartData,
      categories,
      budgets: budgetStatus,
      transactions: currentTxs || []
    }
  },

  processSummary(current: any[], previous: any[]) {
    const curIncome = current.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0)
    const curExpense = current.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0)
    
    const prevIncome = previous.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0)
    const prevExpense = previous.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0)

    const calcTrend = (cur: number, prev: number) => prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 100)

    return {
      income: curIncome,
      expense: curExpense,
      balance: curIncome - curExpense,
      incomeTrend: calcTrend(curIncome, prevIncome),
      expenseTrend: calcTrend(curExpense, prevExpense)
    }
  },

  processChartData(transactions: any[], start: Date, end: Date): ChartDataPoint[] {
    const days = eachDayOfInterval({ start, end })
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const dayTxs = transactions.filter(t => t.date === dateStr)
      return {
        date: format(day, 'MMM d'),
        income: dayTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0),
        expense: dayTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0)
      }
    })
  },

  processCategoryDistribution(transactions: any[]): CategoryDistribution[] {
    const expenses = transactions.filter(t => t.type === 'expense')
    const total = expenses.reduce((acc, t) => acc + Number(t.amount), 0)
    const map = new Map()
    
    const palette = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#F43F5E', '#6366F1', '#EC4899']

    expenses.forEach(t => {
      const name = t.categories?.name || 'Uncategorized'
      map.set(name, (map.get(name) || 0) + Number(t.amount))
    })

    return Array.from(map.entries()).map(([name, amount], i) => ({
      name,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      color: palette[i % palette.length]
    })).sort((a, b) => b.amount - a.amount)
  },

  processBudgetStatus(transactions: any[], budgets: any[]): BudgetStatus[] {
    return budgets.map(b => {
      const spent = transactions
        .filter(t => t.category_id === b.category_id && t.type === 'expense')
        .reduce((acc, t) => acc + Number(t.amount), 0)
      
      const percentage = Math.round((spent / Number(b.amount)) * 100)
      return {
        categoryId: b.category_id,
        categoryName: b.categories?.name || 'Category',
        spent,
        budget: Number(b.amount),
        percentage,
        isOver: spent > Number(b.amount)
      }
    })
  },

  // Export Utilities
  exportToExcel(data: ReportData) {
    const rows = data.transactions.map(t => ({
      Date: t.date,
      Description: t.description,
      Category: t.categories?.name,
      Type: t.type,
      Amount: t.amount
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')
    XLSX.writeFile(workbook, `Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
  },

  exportToPDF(data: ReportData) {
    const doc = new jsPDF() as any
    doc.setFontSize(20)
    doc.text('Financial Report', 14, 22)
    doc.setFontSize(11)
    doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 30)
    
    const tableData = data.transactions.map(t => [
      t.date,
      t.description,
      t.categories?.name,
      t.type,
      `₹${t.amount}`
    ])

    doc.autoTable({
      startY: 40,
      head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0] }
    })

    doc.save(`Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
  }
}
