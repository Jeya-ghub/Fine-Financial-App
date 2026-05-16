import { createClient } from '@/lib/supabase/client'
import { ReportData, ChartDataPoint, CategoryDistribution, BudgetStatus } from '@/types/reports.types'
import { GlobalFilters } from '@/types/filters.types'
import { eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, format, differenceInDays } from 'date-fns'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

export const reportsService = {
  async getReportData(workspaceId: string, filters: GlobalFilters): Promise<ReportData> {
    const supabase = createClient()

    // Ensure dates are objects, not strings from hydration
    const startDate = new Date(filters.dateRange.start)
    const endDate = new Date(filters.dateRange.end)

    // Build optimized query
    let query = supabase
      .from('transactions')
      .select('*, categories(name, type), subcategories(name)')
      .eq('workspace_id', workspaceId)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())

    // Transaction type filter
    if (filters.transactionType !== 'all') {
      query = query.eq('type', filters.transactionType)
    }

    // Category filter
    if (filters.categoryIds.length > 0) {
      query = query.in('category_id', filters.categoryIds)
    }

    // Subcategory filter
    if (filters.subcategoryIds.length > 0) {
      query = query.in('subcategory_id', filters.subcategoryIds)
    }

    // User filter
    if (filters.userIds.length > 0) {
      query = query.in('user_id', filters.userIds)
    }

    // Amount range
    if (filters.amountRange.min !== null) {
      query = query.gte('amount', filters.amountRange.min)
    }
    if (filters.amountRange.max !== null) {
      query = query.lte('amount', filters.amountRange.max)
    }

    // Search
    if (filters.searchQuery.trim()) {
      const q = `%${filters.searchQuery.trim()}%`
      query = query.or(`description.ilike.${q},notes.ilike.${q},id.ilike.${q}`)
    }

    // Sort
    switch (filters.sortBy) {
      case 'Oldest First':    query = query.order('date', { ascending: true }); break
      case 'Highest Amount':  query = query.order('amount', { ascending: false }); break
      case 'Lowest Amount':   query = query.order('amount', { ascending: true }); break
      case 'A-Z':             query = query.order('description', { ascending: true }); break
      case 'Z-A':             query = query.order('description', { ascending: false }); break
      default:                query = query.order('date', { ascending: false })
    }

    const { data: currentTxs, error } = await query
    if (error) throw error

    // Previous period for trend
    const duration = endDate.getTime() - startDate.getTime()
    const prevStart = new Date(startDate.getTime() - duration - 1)
    const prevEnd   = new Date(startDate.getTime() - 1)
    const { data: prevTxs } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('workspace_id', workspaceId)
      .gte('date', prevStart.toISOString())
      .lte('date', prevEnd.toISOString())

    // Budgets
    const { data: budgets } = await supabase
      .from('budgets')
      .select('*, categories(name)')
      .eq('workspace_id', workspaceId)

    const summary    = this.processSummary(currentTxs || [], prevTxs || [])
    const chartData  = this.processChartData(currentTxs || [], startDate, endDate)
    const categories = this.processCategoryDistribution(currentTxs || [])
    const subcategories = this.processSubcategoryDistribution(currentTxs || [])
    const budgetStatus = this.processBudgetStatus(currentTxs || [], budgets || [])

    return { summary, chartData, categories, subcategories, budgets: budgetStatus, transactions: currentTxs || [] }
  },

  processSummary(current: any[], previous: any[]) {
    const curIncome  = current.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
    const curExpense = current.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
    const prevIncome  = previous.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
    const prevExpense = previous.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
    const trend = (cur: number, prev: number) => prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 100)

    return {
      income: curIncome,
      expense: curExpense,
      balance: curIncome - curExpense,
      incomeTrend: trend(curIncome, prevIncome),
      expenseTrend: trend(curExpense, prevExpense)
    }
  },

  processChartData(transactions: any[], start: Date, end: Date): ChartDataPoint[] {
    const dayCount = differenceInDays(end, start)

    // Intelligent tick density: days for <60d, weeks for <180d, months for >180d
    if (dayCount <= 60) {
      const days = eachDayOfInterval({ start, end })
      return days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const dayTxs = transactions.filter(t => t.date?.startsWith(dateStr))
        return {
          date: format(day, 'MMM d'),
          income: dayTxs.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0),
          expense: dayTxs.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
        }
      })
    } else if (dayCount <= 180) {
      const weeks = eachWeekOfInterval({ start, end })
      return weeks.map(week => {
        const weekEnd = new Date(week.getTime() + 6 * 24 * 60 * 60 * 1000)
        const weekTxs = transactions.filter(t => {
          const d = new Date(t.date)
          return d >= week && d <= weekEnd
        })
        return {
          date: format(week, 'MMM d'),
          income: weekTxs.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0),
          expense: weekTxs.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
        }
      })
    } else {
      const months = eachMonthOfInterval({ start, end })
      return months.map(month => {
        const monthStr = format(month, 'yyyy-MM')
        const monthTxs = transactions.filter(t => t.date?.startsWith(monthStr))
        return {
          date: format(month, 'MMM yy'),
          income: monthTxs.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0),
          expense: monthTxs.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
        }
      })
    }
  },

  processCategoryDistribution(transactions: any[]): CategoryDistribution[] {
    const expenses = transactions.filter(t => t.type === 'expense')
    const total = expenses.reduce((a, t) => a + Number(t.amount), 0)
    const palette = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#F43F5E', '#6366F1', '#EC4899']
    const map = new Map<string, number>()

    expenses.forEach(t => {
      const name = t.categories?.name || 'Uncategorized'
      map.set(name, (map.get(name) || 0) + Number(t.amount))
    })

    return Array.from(map.entries())
      .map(([name, amount], i) => ({
        name,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
        color: palette[i % palette.length]
      }))
      .sort((a, b) => b.amount - a.amount)
  },

  processSubcategoryDistribution(transactions: any[]): CategoryDistribution[] {
    const expenses = transactions.filter(t => t.type === 'expense')
    const total = expenses.reduce((a, t) => a + Number(t.amount), 0)
    const palette = ['#06B6D4', '#6366F1', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']
    const map = new Map<string, number>()

    expenses.forEach(t => {
      const name = t.subcategories?.name || 'Other'
      map.set(name, (map.get(name) || 0) + Number(t.amount))
    })

    return Array.from(map.entries())
      .map(([name, amount], i) => ({
        name,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
        color: palette[i % palette.length]
      }))
      .sort((a, b) => b.amount - a.amount)
  },

  processBudgetStatus(transactions: any[], budgets: any[]): BudgetStatus[] {
    return budgets.map(b => {
      const spent = transactions
        .filter(t => t.category_id === b.category_id && t.type === 'expense')
        .reduce((a, t) => a + Number(t.amount), 0)
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

  exportToExcel(data: ReportData, appliedFilters?: string) {
    const rows = data.transactions.map((t: any) => ({
      Date: t.date,
      Description: t.description,
      Category: t.categories?.name,
      Subcategory: t.subcategories?.name,
      Type: t.type,
      Amount: `₹${t.amount}`,
      Notes: t.notes || ''
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')

    if (appliedFilters) {
      const summarySheet = XLSX.utils.aoa_to_sheet([
        ['Applied Filters'],
        [appliedFilters],
        ['Generated at', new Date().toLocaleString()]
      ])
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Filter Summary')
    }

    XLSX.writeFile(workbook, `FineFinance_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
  },

  exportToPDF(data: ReportData, appliedFilters?: string) {
    const doc = new jsPDF() as any
    doc.setFontSize(20)
    doc.text('Fine Finance — Financial Report', 14, 22)
    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)
    if (appliedFilters) doc.text(`Filters: ${appliedFilters}`, 14, 36)

    const tableData = data.transactions.map((t: any) => [
      t.date,
      t.description?.slice(0, 30),
      t.categories?.name,
      t.type,
      `₹${Number(t.amount).toLocaleString('en-IN')}`
    ])

    doc.autoTable({
      startY: appliedFilters ? 44 : 38,
      head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], fontSize: 8 },
      bodyStyles: { fontSize: 8 }
    })

    doc.save(`FineFinance_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
  }
}
