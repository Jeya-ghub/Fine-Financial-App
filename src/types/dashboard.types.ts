export interface DashboardData {
  net: number
  income: number
  expense: number
  trend: number // percentage vs last month
  chartData: ChartPoint[]
  categories: CategorySummary[]
  insights: Insight[]
  transactions: Transaction[]
}

export interface ChartPoint {
  date: string
  value: number
}

export interface CategorySummary {
  id: string
  name: string
  amount: number
  percentage: number
  color: string
}

export interface Insight {
  id: string
  type: 'positive' | 'warning' | 'info'
  text: string
  subtext: string
}

export interface Transaction {
  id: string
  name: string
  category: string
  amount: number
  type: 'income' | 'expense'
  date: string
}
