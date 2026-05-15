export interface ReportSummary {
  income: number
  expense: number
  balance: number
  incomeTrend: number // % change
  expenseTrend: number // % change
}

export interface ChartDataPoint {
  date: string
  income: number
  expense: number
}

export interface CategoryDistribution {
  name: string
  amount: number
  percentage: number
  color: string
}

export interface BudgetStatus {
  categoryId: string
  categoryName: string
  spent: number
  budget: number
  percentage: number
  isOver: boolean
}

import { Transaction } from './transaction.types'

export interface ReportData {
  summary: ReportSummary
  chartData: ChartDataPoint[]
  categories: CategoryDistribution[]
  budgets: BudgetStatus[]
  transactions: Transaction[]
}

export interface ReportFilters {
  startDate: Date
  endDate: Date
  categories?: string[]
}
