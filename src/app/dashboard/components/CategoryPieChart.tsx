'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

type CategoryData = {
  name: string
  value: number
}

type CategoryPieChartProps = {
  data: CategoryData[]
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4']

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#141414] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
        <p className="text-white font-bold mb-1">{payload[0].name}</p>
        <p className="text-emerald-500 font-mono">${Number(payload[0].value).toLocaleString()}</p>
      </div>
    )
  }
  return null
}

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500 italic">
        No expense data for this period.
      </div>
    )
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={5}
            dataKey="value"
            animationBegin={0}
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            content={({ payload }: any) => (
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                {payload.map((entry: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs font-semibold text-zinc-300">{entry.value}</span>
                  </div>
                ))}
              </div>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
