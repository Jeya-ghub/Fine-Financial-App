import { NextResponse } from 'next/server'
import { DashboardData } from '@/types/dashboard.types'

export async function GET() {
  const data: DashboardData = {
    net: 12400,
    income: 45000,
    expense: 32600,
    trend: 18,
    chartData: [
      { date: 'Apr 1', value: 2100 },
      { date: 'Apr 5', value: 2800 },
      { date: 'Apr 10', value: 3400 },
      { date: 'Apr 15', value: 3100 },
      { date: 'Apr 20', value: 4200 },
      { date: 'Apr 25', value: 5800 },
      { date: 'Apr 30', value: 5200 },
    ],
    categories: [
      { id: '1', name: 'Food & Dining', amount: 8500, percentage: 26, color: '#3B82F6' },
      { id: '2', name: 'Transport', amount: 3200, percentage: 10, color: '#10B981' },
      { id: '3', name: 'Bills & Utilities', amount: 2800, percentage: 9, color: '#F59E0B' },
      { id: '4', name: 'Shopping', amount: 2600, percentage: 8, color: '#8B5CF6' },
      { id: '5', name: 'Entertainment', amount: 1800, percentage: 6, color: '#F43F5E' },
      { id: '6', name: 'Others', amount: 13700, percentage: 41, color: '#64748B' },
    ],
    insights: [
      { 
        id: '1', 
        type: 'warning', 
        text: 'Your food spending increased by 22%', 
        subtext: 'You spent ₹1,550 more than last month.' 
      },
      { 
        id: '2', 
        type: 'positive', 
        text: 'You saved more than last month', 
        subtext: 'Great job! Keep it up.' 
      },
      { 
        id: '3', 
        type: 'info', 
        text: 'Highest expense on April 12', 
        subtext: 'You spent ₹3,240 on that day.' 
      },
    ],
    transactions: [
      { id: '1', name: 'Salary', category: 'Income', amount: 45000, type: 'income', date: 'Apr 25, 2026' },
      { id: '2', name: 'Dinner with team', category: 'Food & Dining', amount: 2400, type: 'expense', date: 'Apr 24, 2026' },
      { id: '3', name: 'Metro Card Recharge', category: 'Transport', amount: 300, type: 'expense', date: 'Apr 24, 2026' },
      { id: '4', name: 'Electricity Bill', category: 'Bills & Utilities', amount: 2800, type: 'expense', date: 'Apr 23, 2026' },
      { id: '5', name: 'Amazon Purchase', category: 'Shopping', amount: 1299, type: 'expense', date: 'Apr 22, 2026' },
    ]
  }

  return NextResponse.json(data)
}
