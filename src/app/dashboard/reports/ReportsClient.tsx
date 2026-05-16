'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { FilterBar } from '@/components/shared/FilterBar'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip 
} from 'recharts'
import { useReports } from '@/hooks/useReports'
import { reportsService } from '@/services/reports.service'
import { Skeleton } from '@/components/ui/Skeleton'
import { TrendingUp, TrendingDown, Activity, Download, FileText, ArrowRight, SlidersHorizontal, Search } from 'lucide-react'


// ─── CUSTOM COMPONENTS ──────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface/90 backdrop-blur-xl border border-foreground/10 p-3 rounded-2xl shadow-2xl min-w-[160px]">
        <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-2 border-b border-foreground/10 pb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-4">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: entry.color }}>
                {entry.name}
              </span>
              <span className="text-[11px] font-mono font-black text-primary">
                ₹{entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

const HeatmapBar = ({ item }: { item: any }) => (
  <div className="group relative">
    <div className="flex justify-between items-end mb-1.5">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{item.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono font-black text-primary">₹{item.amount.toLocaleString()}</span>
        <span className="text-[9px] font-bold text-muted w-8 text-right">{item.percentage}%</span>
      </div>
    </div>
    <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden flex">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${item.percentage}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ 
          backgroundColor: item.color,
          boxShadow: `0 0 10px ${item.color}80` 
        }}
      />
    </div>
  </div>
)

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function ReportsClient({ workspaceId }: { workspaceId: string }) {
  const { data, isLoading, isError, filterSummary } = useReports(workspaceId)

  const handleExport = (type: 'pdf' | 'excel') => {
    if (!data) return
    if (type === 'excel') reportsService.exportToExcel(data, filterSummary)
    else reportsService.exportToPDF(data, filterSummary)
  }

  const formatYAxis = (tickItem: number) => {
    if (tickItem === 0) return '₹0'
    if (Math.abs(tickItem) >= 1000) return `₹${tickItem / 1000}K`
    return `₹${tickItem}`
  }

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="h-14 bg-surface rounded-2xl w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
          <div className="lg:col-span-7 h-[400px] bg-surface rounded-3xl" />
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="flex-1 bg-surface rounded-3xl" />
            <div className="flex-1 bg-surface rounded-3xl" />
            <div className="flex-1 bg-surface rounded-3xl" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Activity className="w-12 h-12 text-muted opacity-20" />
        <p className="text-[11px] font-black uppercase tracking-widest text-muted">Failed to load financial data</p>
      </div>
    )
  }

  const { summary, chartData, categories, subcategories, transactions } = data

  const stats = [
    { 
      label: 'Total Inflow', 
      value: `₹${summary.income.toLocaleString('en-IN')}`, 
      change: `${summary.incomeTrend > 0 ? '+' : ''}${summary.incomeTrend}%`, 
      isPositive: summary.incomeTrend >= 0, 
      icon: TrendingUp, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10' 
    },
    { 
      label: 'Total Outflow', 
      value: `₹${summary.expense.toLocaleString('en-IN')}`, 
      change: `${summary.expenseTrend > 0 ? '+' : ''}${summary.expenseTrend}%`, 
      isPositive: summary.expenseTrend <= 0, // Lower expense trend is positive
      icon: TrendingDown, 
      color: 'text-accent-red', 
      bg: 'bg-accent-red/10' 
    },
    { 
      label: 'Net Surplus', 
      value: `₹${summary.balance.toLocaleString('en-IN')}`, 
      change: '', 
      isPositive: summary.balance >= 0, 
      icon: Activity, 
      color: 'text-accent-blue', 
      bg: 'bg-accent-blue/10' 
    }
  ]


  return (
    <div className="space-y-4 pb-12">
      {/* ── GLOBAL FILTER BAR ── */}
      <div className="-mx-4 md:-mx-6 lg:-mx-8 mb-4">
        <FilterBar rightActions={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleExport('excel')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground/5 border border-foreground/5 hover:bg-foreground/10 hover:text-primary rounded-lg text-[9px] font-black uppercase tracking-widest text-muted transition-all"
            >
              <FileText className="w-3.5 h-3.5" /> Excel
            </button>
            <div className="w-[1px] h-4 bg-foreground/10 hidden md:block mx-1" />
            <button 
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground/5 border border-foreground/5 hover:bg-foreground/10 hover:text-primary rounded-lg text-[9px] font-black uppercase tracking-widest text-muted transition-all"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        } />
      </div>

      {/* ── SECTION 1: TEMPORAL TRAJECTORY (7fr) & QUICK ANALYTICS (3fr) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        
        {/* CHART CARD */}
        <div className="lg:col-span-7 bg-surface border border-surface-border rounded-3xl p-5 shadow-premium flex flex-col h-[340px] lg:h-[400px]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Temporal Trajectory</h3>
              <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-0.5">Income vs Expense Velocity</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                <span className="text-[9px] font-black uppercase text-muted">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-accent-red shadow-[0_0_8px_#ef4444]" />
                <span className="text-[9px] font-black uppercase text-muted">Expense</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#888', fontWeight: 800 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#888', fontWeight: 800 }} 
                  tickFormatter={formatYAxis}
                  dx={-10}
                />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  name="Income"
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                  strokeWidth={2} 
                  activeDot={{ r: 4, fill: '#10b981', stroke: '#000', strokeWidth: 2 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  name="Expense"
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorExpense)" 
                  strokeWidth={2} 
                  activeDot={{ r: 4, fill: '#ef4444', stroke: '#000', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* QUICK ANALYTICS PANEL */}
        <div className="lg:col-span-3 flex flex-col gap-4 h-[340px] lg:h-[400px]">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface border border-surface-border p-5 rounded-3xl shadow-premium relative overflow-hidden group flex-1 flex flex-col justify-center"
            >
              <div className="flex justify-between items-start relative z-10 mb-2">
                <p className="text-[9px] font-black text-muted uppercase tracking-widest">{stat.label}</p>
                <div className={cn("p-2 rounded-xl group-hover:scale-110 transition-transform", stat.bg, stat.color)}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-primary tracking-tighter relative z-10">{stat.value}</h3>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── SECTION 2: CATEGORY & SUBCATEGORY HEATMAPS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Category Heatmap */}
        <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-premium">
          <div className="mb-6">
            <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Category Heatmap</h3>
            <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-0.5">Top level distribution</p>
          </div>
          <div className="space-y-4 pr-2">
            {categories.length > 0 ? (
              categories.map(cat => (
                <HeatmapBar key={cat.name} item={cat} />
              ))
            ) : (
              <p className="text-[10px] text-muted py-8 text-center uppercase font-bold tracking-widest">No category data</p>
            )}
          </div>
        </div>

        {/* Subcategory Heatmap */}
        <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-premium">
          <div className="mb-6">
            <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Subcategory Heatmap</h3>
            <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-0.5">Granular depth analysis</p>
          </div>
          <div className="space-y-4 pr-2">
            {subcategories.length > 0 ? (
              subcategories.map(sub => (
                <HeatmapBar key={sub.name} item={sub} />
              ))
            ) : (
              <p className="text-[10px] text-muted py-8 text-center uppercase font-bold tracking-widest">No subcategory data</p>
            )}
          </div>
        </div>

      </div>

      {/* ── SECTION 3: TRANSACTION LEDGER ── */}
      <div className="bg-surface border border-surface-border rounded-3xl shadow-premium overflow-hidden flex flex-col">
        <div className="p-5 border-b border-foreground/5 flex-shrink-0">
          <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Transaction Ledger</h3>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 bg-surface/95 backdrop-blur-sm z-10 shadow-sm">
              <tr className="border-b border-foreground/5">
                <th className="px-5 py-3 text-[9px] font-black text-muted uppercase tracking-widest w-12 text-center">S.No</th>
                <th className="px-5 py-3 text-[9px] font-black text-muted uppercase tracking-widest">Date</th>
                <th className="px-5 py-3 text-[9px] font-black text-muted uppercase tracking-widest">Txn ID</th>
                <th className="px-5 py-3 text-[9px] font-black text-muted uppercase tracking-widest">Type</th>
                <th className="px-5 py-3 text-[9px] font-black text-muted uppercase tracking-widest">Category</th>
                <th className="px-5 py-3 text-[9px] font-black text-muted uppercase tracking-widest">Subcategory</th>
                <th className="px-5 py-3 text-[9px] font-black text-muted uppercase tracking-widest">Notes</th>
                <th className="px-5 py-3 text-[9px] font-black text-muted uppercase tracking-widest text-right">Amount</th>
                <th className="px-5 py-3 text-[9px] font-black text-muted uppercase tracking-widest">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {transactions.length > 0 ? (
                transactions.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-foreground/[0.02] transition-colors group">
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <span className="text-[10px] font-medium text-muted">{idx + 1}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-[10px] font-medium text-primary tracking-widest">
                        {new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-[9px] font-mono font-medium uppercase text-muted">
                        {row.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={cn(
                        "text-[9px] font-medium uppercase tracking-widest",
                        row.type === 'income' ? 'text-emerald-500' : 'text-accent-red'
                      )}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-[9px] font-medium uppercase tracking-widest text-muted">
                        {row.categories?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-[9px] font-medium uppercase tracking-widest text-muted">
                        {row.subcategories?.name || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-[200px] truncate">
                      <span className="text-[10px] font-medium text-muted" title={row.description}>{row.description}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <span className={cn(
                        "text-xs font-mono font-medium",
                        row.type === 'income' ? 'text-emerald-500' : 'text-accent-red'
                      )}>
                        ₹{Number(row.amount).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-[10px] font-medium text-primary">You</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted opacity-50">No transactions found for this period</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
