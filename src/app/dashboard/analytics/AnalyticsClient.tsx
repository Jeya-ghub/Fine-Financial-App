'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts'
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, 
  Layers, Filter, ChevronDown, Check, Loader2, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { getAnalytics } from '@/app/actions/analytics'
import { cn } from '@/lib/utils'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

const COLORS = ['#FFFFFF', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface AnalyticsClientProps {
  workspaces: { id: string; name: string }[]
  initialWorkspaceId: string
}

export default function AnalyticsClient({ workspaces, initialWorkspaceId }: AnalyticsClientProps) {
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([initialWorkspaceId])
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showWorkspaceFilter, setShowWorkspaceFilter] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const res = await getAnalytics(selectedWorkspaces, dateRange.start, dateRange.end)
    if (res.data) setData(res.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [selectedWorkspaces, dateRange])

  const toggleWorkspace = (id: string) => {
    setSelectedWorkspaces(prev => 
      prev.includes(id) 
        ? (prev.length > 1 ? prev.filter(w => w !== id) : prev)
        : [...prev, id]
    )
  }

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-800" />
      </div>
    )
  }

  return (
    <div className="flex-1 px-4 md:px-8 py-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Analytics</h1>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-1">Cross-Workspace Insights</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Workspace Filter */}
          <div className="relative">
            <button 
              onClick={() => setShowWorkspaceFilter(!showWorkspaceFilter)}
              className="h-[44px] px-5 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center gap-3 hover:bg-white/5 transition-all"
            >
              <Layers className="w-4 h-4 text-zinc-500" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                {selectedWorkspaces.length} {selectedWorkspaces.length === 1 ? 'Workspace' : 'Workspaces'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />
            </button>

            {showWorkspaceFilter && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-[#0d0d0d] border border-white/5 rounded-[1.75rem] p-4 shadow-2xl z-50 space-y-1">
                {workspaces.map((w: any) => (
                  <button
                    key={w.id}
                    onClick={() => toggleWorkspace(w.id)}
                    className="w-full h-10 flex items-center justify-between px-4 rounded-xl hover:bg-white/5 transition-all group"
                  >
                    <span className="text-[10px] font-black text-white uppercase tracking-widest truncate">{w.name}</span>
                    {selectedWorkspaces.includes(w.id) && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-[44px] px-5 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center gap-3">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Last 6 Months</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Income', value: data?.summary.income, icon: ArrowUpRight, color: 'emerald' },
          { label: 'Total Expense', value: data?.summary.expense, icon: ArrowDownRight, color: 'red' },
          { label: 'Net Balance', value: data?.summary.balance, icon: DollarSign, color: 'white' },
        ].map((card, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[1.75rem] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{card.label}</span>
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center border", 
                card.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                card.color === 'red' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                'bg-white/5 border-white/10 text-white'
              )}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white tracking-tight">
              ${Number(card.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 flex flex-col gap-8 h-[450px]">
          <div>
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Monthly Performance</h3>
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">Income vs Expense Trends</p>
          </div>
          
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trends}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#3f3f46" 
                  fontSize={8} 
                  fontWeight="black" 
                  tickFormatter={(val) => format(new Date(val), 'MMM')}
                />
                <YAxis stroke="#3f3f46" fontSize={8} fontWeight="black" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}
                  labelStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', color: '#fff', letterSpacing: '0.1em' }}
                  itemStyle={{ fontSize: '10px', fontWeight: '700' }}
                />
                <Area type="monotone" dataKey="income" stroke="#FFFFFF" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 flex flex-col gap-8 h-[450px]">
          <div>
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Category Breakdown</h3>
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">Allocation by Category</p>
          </div>

          <div className="flex-1 min-h-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data?.categoryBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}
                  itemStyle={{ fontSize: '10px', fontWeight: '700', color: '#fff' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
