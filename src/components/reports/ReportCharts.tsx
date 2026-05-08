'use client'

import React from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { Card, CardContent } from '@/components/ui/Card'
import { ChartDataPoint, CategoryDistribution } from '@/types/reports.types'

interface TrendChartProps {
  data: ChartDataPoint[]
}

export function TrendChart({ data }: TrendChartProps) {
  return (
    <Card className="h-[300px]">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Cash Flow Trend</h3>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-0.5">Daily income vs expenses</p>
          </div>
        </div>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="date" hide />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#3f3f46', fontSize: 10, fontWeight: 800 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px' }}
                itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
              />
              <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

interface DistributionChartProps {
  data: CategoryDistribution[]
}

export function DistributionChart({ data }: DistributionChartProps) {
  return (
    <Card className="h-[300px]">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="mb-4">
          <h3 className="text-xs font-black text-white uppercase tracking-widest">Spending Distribution</h3>
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-0.5">Expenses by category</p>
        </div>
        <div className="flex-1 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="amount"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px' }}
                itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center justify-center">
             <span className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none">Total</span>
             <span className="text-lg font-black text-white">₹{data.reduce((acc, d) => acc + d.amount, 0).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
